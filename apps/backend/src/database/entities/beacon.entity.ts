import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StoreEntity } from './store.entity';

@Entity('beacons')
export class BeaconEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  uuid: string;

  @Column()
  major: number;

  @Column()
  minor: number;

  @Column()
  storeId: string;

  @ManyToOne(() => StoreEntity)
  @JoinColumn({ name: 'storeId' })
  store: StoreEntity;

  @Column()
  name: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ nullable: true })
  floor: number;

  @Column({ nullable: true })
  zone: string;

  @Column({ nullable: true })
  batteryLevel: number;

  @Column({ nullable: true })
  lastSeen: Date;

  @Column({ type: 'enum', enum: ['active', 'inactive', 'maintenance'], default: 'active' })
  status: string;

  @Column({ type: 'jsonb', default: { txPower: -59, advertisingInterval: 1000, maxRange: 10 } })
  settings: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
