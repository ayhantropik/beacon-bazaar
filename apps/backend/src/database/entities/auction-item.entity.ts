import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProductEntity } from './product.entity';

@Entity('auction_items')
export class AuctionItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  productId: string;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'productId' })
  product: ProductEntity;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  startingPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  currentHighestBid: number;

  @Column({ default: 0 })
  totalBids: number;

  @Column()
  quantity: number;

  @Column()
  category: string;

  @Column({ type: 'date' })
  @Index()
  auctionDate: string;

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp' })
  endsAt: Date;

  @Column({ default: 'active' })
  status: 'active' | 'ended' | 'cancelled';

  @Column({ nullable: true })
  winnerId: string;

  @CreateDateColumn()
  createdAt: Date;
}
