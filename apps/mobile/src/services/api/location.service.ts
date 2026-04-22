import apiClient from './client';

interface LocationSearchResult {
  latitude: number;
  longitude: number;
  displayName: string;
  address: string;
  type: string;
  city?: string;
  district?: string;
  neighbourhood?: string;
  street?: string;
  postalCode?: string;
  raw?: Record<string, string>;
}

interface RouteResult {
  distance: number;
  walkingDuration: number;
  drivingDuration: number;
  polyline: { latitude: number; longitude: number }[];
}

export const locationService = {
  search: (query: string) =>
    apiClient
      .get<{ success: boolean; data: LocationSearchResult[] }>('/locations/search', {
        params: { query },
      })
      .then((res) => res.data),

  reverseGeocode: (latitude: number, longitude: number) =>
    apiClient
      .get<{ success: boolean; data: LocationSearchResult }>('/locations/reverse', {
        params: { latitude, longitude },
      })
      .then((res) => res.data),

  getRoute: (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
  ) =>
    apiClient
      .post<{ success: boolean; data: RouteResult }>('/locations/route', {
        origin,
        destination,
      })
      .then((res) => res.data),

  getNearbyPlaces: (latitude: number, longitude: number, radius?: number) =>
    apiClient
      .get<{ success: boolean; data: LocationSearchResult[] }>('/locations/nearby', {
        params: { latitude, longitude, radius },
      })
      .then((res) => res.data),
};
