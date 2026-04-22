import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AuctionItemEntity } from './auction-item.entity';
import { UserEntity } from './user.entity';

@Entity('auction_bids')
export class AuctionBidEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  auctionItemId: string;

  @ManyToOne(() => AuctionItemEntity)
  @JoinColumn({ name: 'auctionItemId' })
  auctionItem: AuctionItemEntity;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  bidPrice: number;

  @Column()
  bidQuantity: number;

  @Column({ default: 'active' })
  status: 'active' | 'won' | 'outbid' | 'cancelled';

  @CreateDateColumn()
  createdAt: Date;
}
