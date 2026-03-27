declare namespace google.maps {
  class Map {
    constructor(element: HTMLElement, options?: MapOptions);
    setZoom(zoom: number): void;
    getZoom(): number | undefined;
    setCenter(center: LatLngLiteral): void;
    getCenter(): LatLng | undefined;
    panTo(latLng: LatLngLiteral): void;
    addListener(event: string, handler: () => void): void;
    setMapTypeId(mapTypeId: string): void;
  }

  class Marker {
    constructor(options?: MarkerOptions);
    setMap(map: Map | null): void;
    addListener(event: string, handler: () => void): void;
  }

  class LatLng {
    lat(): number;
    lng(): number;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface MapOptions {
    center?: LatLngLiteral;
    zoom?: number;
    styles?: MapTypeStyle[];
    mapTypeId?: string;
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    fullscreenControl?: boolean;
    streetViewControl?: boolean;
  }

  interface MarkerOptions {
    position?: LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: string | Symbol;
    zIndex?: number;
  }

  interface Symbol {
    path: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWeight?: number;
    scale?: number;
  }

  interface MapTypeStyle {
    featureType?: string;
    elementType?: string;
    stylers: Record<string, unknown>[];
  }

  const SymbolPath: {
    CIRCLE: number;
    FORWARD_CLOSED_ARROW: number;
    FORWARD_OPEN_ARROW: number;
    BACKWARD_CLOSED_ARROW: number;
    BACKWARD_OPEN_ARROW: number;
  };
}
