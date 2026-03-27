import type { ApiResponse, GeoPoint } from '@beacon-bazaar/shared';
import apiClient from './client';

interface LocationSearchResult {
  id: string;
  name: string;
  address: string;
  location: GeoPoint;
  type: 'city' | 'district' | 'neighborhood' | 'street';
}

interface RouteResult {
  distance: number; // km
  duration: number; // minutes
  polyline: GeoPoint[];
}

export const locationService = {
  search: (query: string) =>
    apiClient
      .get<ApiResponse<LocationSearchResult[]>>('/locations/search', { params: { query } })
      .then((res) => res.data),

  reverseGeocode: (latitude: number, longitude: number) =>
    apiClient
      .get<ApiResponse<LocationSearchResult>>('/locations/reverse', {
        params: { latitude, longitude },
      })
      .then((res) => res.data),

  getRoute: (origin: GeoPoint, destination: GeoPoint) =>
    apiClient
      .post<ApiResponse<RouteResult>>('/locations/route', { origin, destination })
      .then((res) => res.data),

  getNearbyPlaces: (latitude: number, longitude: number, radius?: number) =>
    apiClient
      .get<ApiResponse<LocationSearchResult[]>>('/locations/nearby', {
        params: { latitude, longitude, radius },
      })
      .then((res) => res.data),
};
