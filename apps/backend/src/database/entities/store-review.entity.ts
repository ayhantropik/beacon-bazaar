import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { StoreEntity } from './store.entity';

@Entity('store_reviews')
@Unique(['userId', 'storeId'])
export class StoreReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  @Index()
  storeId: string;

  @ManyToOne(() => StoreEntity)
  @JoinColumn({ name: 'storeId' })
  store: StoreEntity;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'int', default: 0 })
  descriptionAccuracy: number;

  @Column({ type: 'int', default: 0 })
  returnEase: number;

  @Column({ type: 'int', default: 0 })
  imageMatch: number;

  @Column({ type: 'int', default: 0 })
  deliveryConsistency: number;

  @Column({ type: 'int', default: 0 })
  qaSpeed: number;

  @Column({ type: 'int', default: 0 })
  problemResolution: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ nullable: true })
  orderId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
