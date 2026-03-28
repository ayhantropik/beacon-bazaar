import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { ProductEntity, StoreEntity } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity, StoreEntity])],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
