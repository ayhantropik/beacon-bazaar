import { Injectable } from '@nestjs/common';

@Injectable()
export class LocationService {
  async search(query: string) {
    // Google Maps Geocoding API or OpenStreetMap Nominatim
    return { success: true, data: [] };
  }

  async reverseGeocode(latitude: number, longitude: number) {
    // Reverse geocoding via Google Maps API
    return {
      success: true,
      data: { latitude, longitude, address: '', type: 'unknown' as const },
    };
  }

  async getRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
  ) {
    // Google Maps Directions API
    const distance = this.haversine(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    return {
      success: true,
      data: { distance, duration: Math.round(distance * 3), polyline: [origin, destination] },
    };
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
