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

@Entity('saved_searches')
export class SavedSearchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  name: string;

  @Column({ default: 'oto' })
  context: 'oto' | 'emlak';

  @Column({ type: 'jsonb', default: {} })
  filters: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
