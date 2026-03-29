import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeoResult {
  latitude: number;
  longitude: number;
  address: string;
  displayName: string;
  type: string;
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org';

  constructor(private readonly configService: ConfigService) {}

  async search(query: string): Promise<{ success: boolean; data: GeoResult[] }> {
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }

    try {
      const url = `${this.nominatimUrl}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=tr`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'BeaconBazaar/1.0' },
      });
      const results = await response.json();

      const data: GeoResult[] = results.map((r: Record<string, unknown>) => ({
        latitude: parseFloat(r.lat as string),
        longitude: parseFloat(r.lon as string),
        address: (r.address as Record<string, string>)?.road || '',
        displayName: r.display_name as string,
        type: r.type as string,
      }));

      return { success: true, data };
    } catch (err) {
      this.logger.warn(`Nominatim search failed: ${err}`);
      return { success: true, data: [] };
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<{ success: boolean; data: GeoResult }> {
    try {
      const url = `${this.nominatimUrl}/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'BeaconBazaar/1.0' },
      });
      const result = await response.json();

      return {
        success: true,
        data: {
          latitude,
          longitude,
          address: result.display_name || '',
          displayName: result.display_name || '',
          type: result.type || 'unknown',
        },
      };
    } catch (err) {
      this.logger.warn(`Reverse geocode failed: ${err}`);
      return {
        success: true,
        data: { latitude, longitude, address: '', displayName: '', type: 'unknown' },
      };
    }
  }

  async getRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
  ) {
    const distance = this.haversine(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    // Ortalama yürüme hızı: 5 km/h -> dakika cinsinden süre
    const walkingMinutes = Math.round((distance / 5) * 60);
    const drivingMinutes = Math.round((distance / 40) * 60);

    return {
      success: true,
      data: {
        distance: Math.round(distance * 100) / 100,
        walkingDuration: walkingMinutes,
        drivingDuration: drivingMinutes,
        polyline: [origin, destination],
      },
    };
  }

  async nearby(latitude: number, longitude: number, radiusKm = 5): Promise<{ success: boolean; data: GeoResult[] }> {
    try {
      const viewbox = this.getBoundingBox(latitude, longitude, radiusKm);
      const url = `${this.nominatimUrl}/search?q=shop+OR+store+OR+market&format=json&addressdetails=1&limit=20&viewbox=${viewbox}&bounded=1&countrycodes=tr`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'BeaconBazaar/1.0' },
      });
      const results = await response.json();

      const data: GeoResult[] = results.map((r: Record<string, unknown>) => ({
        latitude: parseFloat(r.lat as string),
        longitude: parseFloat(r.lon as string),
        address: (r.address as Record<string, string>)?.road || '',
        displayName: r.display_name as string,
        type: r.type as string,
      }));

      return { success: true, data };
    } catch (err) {
      this.logger.warn(`Nearby search failed: ${err}`);
      return { success: true, data: [] };
    }
  }

  private getBoundingBox(lat: number, lng: number, radiusKm: number): string {
    const latDelta = radiusKm / 111.32;
    const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
    return `${lng - lngDelta},${lat + latDelta},${lng + lngDelta},${lat - latDelta}`;
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
