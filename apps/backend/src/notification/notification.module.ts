import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { UserEntity, NotificationEntity, DeviceTokenEntity } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, NotificationEntity, DeviceTokenEntity])],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
