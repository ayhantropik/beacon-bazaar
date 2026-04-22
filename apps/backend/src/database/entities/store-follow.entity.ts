import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { StoreEntity } from './store.entity';

@Entity('store_follows')
@Unique(['userId', 'storeId'])
export class StoreFollowEntity {
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

  @CreateDateColumn()
  createdAt: Date;
}
