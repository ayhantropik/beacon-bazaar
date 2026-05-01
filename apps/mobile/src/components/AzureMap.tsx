import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { env } from '../config/env';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  color?: string; // 'primary' | 'accent' | hex
}

export type MapStyleId =
  | 'road'
  | 'satellite'
  | 'satellite_road_labels'
  | 'grayscale_dark'
  | 'grayscale_light'
  | 'night'
  | 'road_shaded_relief';

interface AzureMapProps {
  center: { latitude: number; longitude: number };
  zoom?: number;
  userLocation?: { latitude: number; longitude: number } | null;
  markers: MapMarker[];
  mapStyle?: MapStyleId;
  onMarkerPress?: (id: string) => void;
}

const PRIMARY = '#1a6b52';
const ACCENT = '#2563eb';

function buildHtml(key: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css" />
<script src="https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.js"></script>
<style>
  html,body,#map{margin:0;padding:0;width:100%;height:100%;}
  .pin{
    width:38px;height:48px;
    cursor:pointer;
    pointer-events:auto;
    filter: drop-shadow(0 3px 4px rgba(0,0,0,0.28));
    transition: transform 0.18s ease;
  }
  .pin:hover{ transform: translateY(-3px) scale(1.05); }
  .pin svg{display:block;}
  .user{
    width:18px;height:18px;border-radius:50%;
    background:#2563eb;
    border:3px solid #fff;
    box-shadow:0 0 0 4px rgba(37,99,235,0.25);
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  let map;
  let markerObjs = [];
  let userMarker = null;

  function postRN(payload){
    if(window.ReactNativeWebView){
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  }

  function init(){
    map = new atlas.Map('map', {
      center: [28.9784, 41.0082],
      zoom: 12,
      style: 'road',
      language: 'tr-TR',
      authOptions: {
        authType: 'subscriptionKey',
        subscriptionKey: '${key}'
      }
    });
    map.events.add('ready', () => {
      postRN({ type: 'ready' });
    });
  }

  function clearMarkers(){
    markerObjs.forEach(m => map.markers.remove(m));
    markerObjs = [];
  }

  function pinSVG(color){
    // Açık-renkli pin: dış halka beyaz, iç dolgu pastel renk, merkez beyaz daire + renk noktası
    return '<svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">' +
      '<defs>' +
        '<linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">' +
          '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.95"/>' +
          '<stop offset="100%" stop-color="' + color + '" stop-opacity="1"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<path d="M19 2C9.6 2 2 9.6 2 19c0 13 17 27 17 27s17-14 17-27C36 9.6 28.4 2 19 2z" ' +
        'fill="url(#g)" stroke="#ffffff" stroke-width="3"/>' +
      '<circle cx="19" cy="18" r="8" fill="#ffffff"/>' +
      '<circle cx="19" cy="18" r="4.5" fill="' + color + '"/>' +
      '</svg>';
  }

  function setMarkers(items){
    if(!map) return;
    clearMarkers();
    items.forEach(it => {
      const color = it.color || '#1a6b52';
      const el = document.createElement('div');
      el.className = 'pin';
      el.innerHTML = pinSVG(color);
      el.title = it.title;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        postRN({ type: 'markerClick', id: it.id });
      });
      const m = new atlas.HtmlMarker({
        htmlContent: el,
        position: [it.longitude, it.latitude],
        anchor: 'bottom'
      });
      map.markers.add(m);
      markerObjs.push(m);
    });
  }

  function setUser(coord){
    if(!map) return;
    if(userMarker){ map.markers.remove(userMarker); userMarker = null; }
    if(!coord) return;
    const el = document.createElement('div');
    el.className = 'user';
    userMarker = new atlas.HtmlMarker({
      htmlContent: el,
      position: [coord.longitude, coord.latitude],
      anchor: 'center'
    });
    map.markers.add(userMarker);
  }

  function setView(coord, zoom){
    if(!map) return;
    map.setCamera({
      center: [coord.longitude, coord.latitude],
      zoom: zoom || 13,
      type: 'ease',
      duration: 500
    });
  }

  function setStyle(styleId){
    if(!map) return;
    map.setStyle({ style: styleId });
  }

  document.addEventListener('message', (e) => handle(e.data));
  window.addEventListener('message', (e) => handle(e.data));

  function handle(raw){
    try {
      const msg = JSON.parse(raw);
      if(msg.type === 'markers') setMarkers(msg.items || []);
      else if(msg.type === 'user') setUser(msg.coord);
      else if(msg.type === 'view') setView(msg.coord, msg.zoom);
      else if(msg.type === 'style') setStyle(msg.style);
    } catch(_){}
  }

  init();
</script>
</body>
</html>`;
}

export default function AzureMap({
  center,
  zoom = 13,
  userLocation,
  markers,
  mapStyle = 'road',
  onMarkerPress,
}: AzureMapProps) {
  const webRef = useRef<WebView>(null);
  const html = useMemo(() => buildHtml(env.azureMapsKey), []);
  const ready = useRef(false);

  const send = (payload: any) => {
    webRef.current?.postMessage(JSON.stringify(payload));
  };

  const sendAll = () => {
    send({ type: 'style', style: mapStyle });
    send({ type: 'view', coord: center, zoom });
    send({ type: 'user', coord: userLocation || null });
    send({ type: 'markers', items: markers });
  };

  useEffect(() => {
    if (ready.current) send({ type: 'style', style: mapStyle });
  }, [mapStyle]);

  useEffect(() => {
    if (ready.current) sendAll();
  }, [center.latitude, center.longitude, zoom]);

  useEffect(() => {
    if (ready.current) send({ type: 'user', coord: userLocation || null });
  }, [userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    if (ready.current) send({ type: 'markers', items: markers });
  }, [markers]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.type === 'ready') {
        ready.current = true;
        sendAll();
      } else if (data.type === 'markerClick' && onMarkerPress) {
        onMarkerPress(data.id);
      }
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://atlas.microsoft.com' }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        style={styles.web}
        scalesPageToFit={false}
        bounces={false}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  web: { flex: 1, backgroundColor: '#e5e7eb' },
});

export { PRIMARY, ACCENT };
