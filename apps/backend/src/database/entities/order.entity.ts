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

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'jsonb' })
  items: Record<string, unknown>[];

  @Column({ type: 'jsonb' })
  shippingAddress: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  billingAddress: Record<string, unknown>;

  @Column({ type: 'enum', enum: ['credit_card', 'debit_card', 'bank_transfer', 'cash_on_delivery'] })
  paymentMethod: string;

  @Column({ type: 'enum', enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' })
  paymentStatus: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  })
  @Index()
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ nullable: true })
  couponCode: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  trackingNumber: string;

  @Column({ nullable: true })
  estimatedDelivery: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
