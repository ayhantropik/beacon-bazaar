import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('venues')
export class VenueEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  address: string;

  @Column()
  city: string;

  @Column({ type: 'float' })
  latitude: number;

  @Column({ type: 'float' })
  longitude: number;

  @Column({ nullable: true })
  imageUrl: string;

  // Kat bilgileri JSONB olarak — her kat: { level, name, geojson, stores[] }
  @Column({ type: 'jsonb', default: '[]' })
  floors: VenueFloor[];

  // Beacon cihazları JSONB olarak
  @Column({ type: 'jsonb', default: '[]' })
  beacons: VenueBeacon[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Types
export interface VenueFloor {
  level: number;
  name: string;
  // GeoJSON FeatureCollection — mağaza sınırları polygon olarak
  geojson: any;
  stores: VenueStore[];
}

export interface VenueStore {
  id: string;
  name: string;
  type: string; // giyim, elektronik, market, restoran, kafe, sinema, etc.
  // Mağaza sınırı GeoJSON Polygon koordinatları (venue merkezine göre ofset)
  polygon: number[][];
  // Merkez noktası
  centerLat: number;
  centerLng: number;
  // İlişkili mağaza ID (stores tablosundan)
  storeId?: string;
  floor: number;
  color?: string;
}

export interface VenueBeacon {
  id: string;
  uuid: string;
  major: number;
  minor: number;
  // Beacon konumu
  latitude: number;
  longitude: number;
  floor: number;
  // Sinyal gücü kalibrasyonu
  txPower: number;
  // İlişkili mağaza
  storeId?: string;
  storeName?: string;
}
