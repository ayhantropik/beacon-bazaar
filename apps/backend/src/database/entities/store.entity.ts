import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('stores')
export class StoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'ownerId' })
  owner: UserEntity;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'shopping', nullable: true, select: false })
  storeType: 'shopping' | 'automotive' | 'realestate' | 'service' | 'food' | 'producer';

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ type: 'jsonb', default: [] })
  images: string[];

  @Index({ spatial: true })
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  location: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ type: 'jsonb', default: {} })
  address: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  contactInfo: Record<string, unknown>;

  @Column({ type: 'jsonb', default: [] })
  categories: string[];

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({ type: 'jsonb', default: [] })
  openingHours: Record<string, unknown>[];

  @Column({ nullable: true })
  beaconId: string;

  @Column({ type: 'float', default: 0 })
  ratingAverage: number;

  @Column({ default: 0 })
  ratingCount: number;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  followersCount: number;

  @Column({ default: 0 })
  productsCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
