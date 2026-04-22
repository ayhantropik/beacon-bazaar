import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('gift_recipients')
export class GiftRecipientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Hediye alan kişiyi kaydeden kullanıcı */
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  /** Hediye alınacak kişinin adı */
  @Column()
  name: string;

  @Column({ nullable: true })
  birthDate: string;

  @Column({ nullable: true })
  birthTime: string;

  @Column({ nullable: true })
  zodiacSign: string;

  @Column({ nullable: true })
  ascendantSign: string;

  /** male | female | other */
  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  education: string;

  /** İlgi alanları / hobiler */
  @Column({ type: 'jsonb', default: [] })
  hobbies: string[];

  /** Yakınlık: anne, baba, arkadaş, partner vs. */
  @Column({ nullable: true })
  relationship: string;

  /** AI analiz notları, OCEAN skorları vs. */
  @Column({ type: 'jsonb', default: {} })
  aiProfile: Record<string, unknown>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /** Bu kişiye alınan hediyeler */
  @OneToMany('GiftHistoryEntity', 'recipient')
  giftHistory: any[];
}
