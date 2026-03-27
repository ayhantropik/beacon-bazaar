import type { GeoPoint, Address } from './user.types';

export interface ContactInfo {
  phone: string;
  email?: string;
  website?: string;
  whatsapp?: string;
  instagram?: string;
}

export interface OpeningHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  open: string;
  close: string;
  isClosed: boolean;
}

export interface StoreRating {
  average: number;
  count: number;
}

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  coverImage: string;
  images: string[];
  location: GeoPoint;
  address: Address;
  contactInfo: ContactInfo;
  categories: string[];
  tags: string[];
  openingHours: OpeningHours[];
  beaconId?: string;
  rating: StoreRating;
  isVerified: boolean;
  isActive: boolean;
  followersCount: number;
  productsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSearchParams {
  query?: string;
  categories?: string[];
  location?: GeoPoint;
  radius?: number;
  sortBy?: 'distance' | 'rating' | 'name' | 'newest';
  page?: number;
  limit?: number;
}
