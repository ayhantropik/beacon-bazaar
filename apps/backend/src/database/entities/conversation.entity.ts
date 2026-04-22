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

@Entity('conversations')
export class ConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  listingId: string;

  @Column({ default: 'product' })
  listingType: 'oto' | 'emlak' | 'product';

  @Column()
  @Index()
  buyerUserId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'buyerUserId' })
  buyer: UserEntity;

  @Column()
  @Index()
  sellerUserId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'sellerUserId' })
  seller: UserEntity;

  @Column({ nullable: true })
  listingTitle: string;

  @Column({ type: 'int', default: 0 })
  unreadBuyerCount: number;

  @Column({ type: 'int', default: 0 })
  unreadSellerCount: number;

  @Column({ nullable: true })
  lastMessage: string;

  @UpdateDateColumn()
  lastMessageAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
