import apiClient from './client';

export interface VenueStore {
  id: string;
  name: string;
  type: string;
  polygon: number[][];
  centerLat: number;
  centerLng: number;
  storeId?: string;
  floor: number;
}

export interface VenueFloor {
  level: number;
  name: string;
  geojson: any;
  stores: VenueStore[];
}

export interface VenueBeacon {
  id: string;
  uuid: string;
  major: number;
  minor: number;
  latitude: number;
  longitude: number;
  floor: number;
  txPower: number;
  storeId?: string;
  storeName?: string;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  floors: VenueFloor[];
  beacons: VenueBeacon[];
  isActive: boolean;
  createdAt: string;
}

const venueService = {
  getAll: () => apiClient.get('/venues').then(r => r.data?.data || r.data || []),
  getById: (id: string) => apiClient.get(`/venues/${id}`).then(r => r.data?.data || r.data),
  getNearby: (lat: number, lng: number, radius = 50) =>
    apiClient.get(`/venues/nearby?lat=${lat}&lng=${lng}&radius=${radius}`).then(r => r.data?.data || r.data || []),
  seed: () => apiClient.get('/venues/seed').then(r => r.data),
};

export default venueService;
