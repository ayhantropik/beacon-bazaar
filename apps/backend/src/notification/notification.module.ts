import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { UserEntity } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
