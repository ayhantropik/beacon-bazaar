import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GiftRecipientEntity } from './gift-recipient.entity';
import { ProductEntity } from './product.entity';

@Entity('gift_history')
export class GiftHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Hediye alan kişi */
  @Column()
  recipientId: string;

  @ManyToOne(() => GiftRecipientEntity, r => r.giftHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient: GiftRecipientEntity;

  /** Hangi ürün alındı (opsiyonel — ürün silinmiş olabilir) */
  @Column({ nullable: true })
  productId: string;

  @ManyToOne(() => ProductEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'productId' })
  product: ProductEntity;

  /** Ürün adı (product silinse bile kayıt kalsın) */
  @Column()
  productName: string;

  /** Ürün görseli snapshot */
  @Column({ nullable: true })
  productThumbnail: string;

  /** Ödenen fiyat */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  /** Hediyenin vesilesi: doğum günü, yıl dönümü vs. */
  @Column()
  occasion: string;

  /** Hediyenin verildiği / verileceği tarih */
  @Column({ type: 'date' })
  giftDate: string;

  /** Neden bu hediye alındı — kullanıcının notu */
  @Column({ type: 'text', nullable: true })
  reason: string;

  /** Beğenildi mi? (sonradan feedback) */
  @Column({ type: 'smallint', nullable: true })
  rating: number;

  /** Ek notlar */
  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
