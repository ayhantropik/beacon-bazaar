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
import { ProductEntity } from './product.entity';

@Entity('favorites')
@Unique(['userId', 'productId'])
export class FavoriteEntity {
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
  productId: string;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'productId' })
  product: ProductEntity;

  @CreateDateColumn()
  createdAt: Date;
}
