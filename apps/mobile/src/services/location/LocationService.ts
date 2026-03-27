import type { GeoPoint } from '@beacon-bazaar/shared';

type LocationCallback = (location: GeoPoint) => void;

class LocationService {
  private watchId: number | null = null;
  private listeners: LocationCallback[] = [];

  async requestPermissions(): Promise<boolean> {
    // Platform-specific permissions
    // iOS: requestWhenInUseAuthorization / requestAlwaysAuthorization
    // Android: ACCESS_FINE_LOCATION / ACCESS_BACKGROUND_LOCATION
    return true;
  }

  async getCurrentLocation(): Promise<GeoPoint> {
    return new Promise((resolve, reject) => {
      // Geolocation.getCurrentPosition implementation
      // Using react-native-geolocation-service:
      // Geolocation.getCurrentPosition(
      //   (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      //   (error) => reject(error),
      //   { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      // );
      resolve({ latitude: 41.0082, longitude: 28.9784 }); // Default Istanbul
    });
  }

  startWatching(callback: LocationCallback): void {
    this.listeners.push(callback);
    // Geolocation.watchPosition(
    //   (position) => { ... },
    //   (error) => console.error(error),
    //   { enableHighAccuracy: true, distanceFilter: 10, interval: 5000 }
    // );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      // Geolocation.clearWatch(this.watchId);
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
