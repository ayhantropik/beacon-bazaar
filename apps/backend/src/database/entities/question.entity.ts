import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('questions')
export class QuestionEntity {
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
  listingId: string;

  @Column({ default: 'oto' })
  listingType: 'oto' | 'emlak';

  @Column({ nullable: true })
  listingTitle: string;

  @Column()
  @Index()
  sellerUserId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isAnswered: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
