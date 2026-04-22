import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { StoreEntity, ProductEntity, StoreFollowEntity, StoreReviewEntity, UserEntity } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([StoreEntity, ProductEntity, StoreFollowEntity, StoreReviewEntity, UserEntity])],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
