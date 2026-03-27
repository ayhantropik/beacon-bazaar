import type { GeoPoint } from './user.types';

export interface BeaconSettings {
  txPower: number;
  advertisingInterval: number;
  maxRange: number;
}

export interface Beacon {
  id: string;
  uuid: string;
  major: number;
  minor: number;
  storeId: string;
  name: string;
  location: GeoPoint;
  floor?: number;
  zone?: string;
  batteryLevel?: number;
  lastSeen?: string;
  status: 'active' | 'inactive' | 'maintenance';
  settings: BeaconSettings;
  createdAt: string;
  updatedAt: string;
}

export interface BeaconDetection {
  beaconId: string;
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  distance: number;
  proximity: 'immediate' | 'near' | 'far' | 'unknown';
  timestamp: string;
}
