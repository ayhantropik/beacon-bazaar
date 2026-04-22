import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { EmailService } from '../common/email.service';
import {
  UserEntity,
  StoreEntity,
  ProductEntity,
  OrderEntity,
  StoreReviewEntity,
  NotificationEntity,
  QuestionEntity,
  AnswerEntity,
  AuctionItemEntity,
  AuctionBidEntity,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      StoreEntity,
      ProductEntity,
      OrderEntity,
      StoreReviewEntity,
      NotificationEntity,
      QuestionEntity,
      AnswerEntity,
      AuctionItemEntity,
      AuctionBidEntity,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, EmailService],
  exports: [AdminService],
})
export class AdminModule {}
