import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionController } from './auction.controller';
import { AuctionService } from './auction.service';
import { AuctionItemEntity, AuctionBidEntity, ProductEntity } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([AuctionItemEntity, AuctionBidEntity, ProductEntity])],
  controllers: [AuctionController],
  providers: [AuctionService],
  exports: [AuctionService],
})
export class AuctionModule {}
