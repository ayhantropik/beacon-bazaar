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

@Entity('device_tokens')
export class DeviceTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  // ExpoPushToken[xxxxx] formatında
  @Index({ unique: true })
  @Column()
  token: string;

  @Column({ type: 'varchar', length: 16, default: 'ios' })
  platform: 'ios' | 'android' | 'web';

  @Column({ type: 'jsonb', nullable: true })
  device: Record<string, string> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
