import { Platform, PermissionsAndroid } from 'react-native';
import type { GeoPoint } from '@beacon-bazaar/shared';

type LocationCallback = (location: GeoPoint) => void;

class LocationService {
  private watchId: number | null = null;
  private listeners: LocationCallback[] = [];

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Konum İzni',
            message: 'Yakınındaki mağazaları gösterebilmek için konum iznine ihtiyacımız var.',
            buttonPositive: 'İzin Ver',
            buttonNegative: 'İptal',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch {
        return false;
      }
    }
    // iOS: Permissions handled by Info.plist + react-native-geolocation-service
    return true;
  }

  async getCurrentLocation(): Promise<GeoPoint> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return { latitude: 41.0082, longitude: 28.9784 }; // Default Istanbul
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Fallback to Istanbul on error
          resolve({ latitude: 41.0082, longitude: 28.9784 });
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    });
  }

  startWatching(callback: LocationCallback): void {
    this.listeners.push(callback);
    if (this.watchId !== null) return;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const loc: GeoPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        this.listeners.forEach((cb) => cb(loc));
      },
      (error) => console.warn('Location watch error:', error.message),
      { enableHighAccuracy: true, distanceFilter: 10 },
    );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.listeners = [];
  }

  calculateDistance(from: GeoPoint, to: GeoPoint): number {
    const R = 6371;
    const dLat = this.toRad(to.latitude - from.latitude);
    const dLon = this.toRad(to.longitude - from.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.latitude)) *
        Math.cos(this.toRad(to.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  isWithinRadius(from: GeoPoint, to: GeoPoint, radiusKm: number): boolean {
    return this.calculateDistance(from, to) <= radiusKm;
  }
}

export const locationService = new LocationService();
