import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { GiftAIService } from './gift-ai.service';
import { PriceAlertSchedulerService } from './price-alert-scheduler.service';
import { ProductEntity } from '../database/entities';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity]),
    NotificationModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, GiftAIService, PriceAlertSchedulerService],
  exports: [ProductService, GiftAIService],
})
export class ProductModule {}
