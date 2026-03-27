export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  street: string;
  buildingNo: string;
  apartmentNo?: string;
  postalCode: string;
  isDefault: boolean;
  location?: GeoPoint;
}

export interface UserPreferences {
  language: string;
  currency: string;
  notificationsEnabled: boolean;
  locationTrackingEnabled: boolean;
  darkMode: boolean;
  searchRadius: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  preferences: UserPreferences;
  role: 'customer' | 'store_owner' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  surname: string;
  phone?: string;
}
