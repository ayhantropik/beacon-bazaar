import * as ExpoLocation from 'expo-location';
import type { GeoPoint } from '@beacon-bazaar/shared';

type LocationCallback = (location: GeoPoint) => void;

class LocationService {
  private subscription: ExpoLocation.LocationSubscription | null = null;
  private listeners: LocationCallback[] = [];

  async requestPermissions(): Promise<boolean> {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  async getCurrentLocation(): Promise<GeoPoint> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return { latitude: 41.0082, longitude: 28.9784 }; // Default Istanbul
    }

    try {
      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch {
      return { latitude: 41.0082, longitude: 28.9784 };
    }
  }

  async startWatching(callback: LocationCallback): Promise<void> {
    this.listeners.push(callback);
    if (this.subscription) return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    this.subscription = await ExpoLocation.watchPositionAsync(
      { accuracy: ExpoLocation.Accuracy.High, distanceInterval: 10 },
      (location) => {
        const loc: GeoPoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        this.listeners.forEach((cb) => cb(loc));
      },
    );
  }

  stopWatching(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
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
