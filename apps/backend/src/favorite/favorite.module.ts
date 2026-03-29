import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteController } from './favorite.controller';
import { FavoriteService } from './favorite.service';
import { FavoriteEntity } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteEntity])],
  controllers: [FavoriteController],
  providers: [FavoriteService],
  exports: [FavoriteService],
})
export class FavoriteModule {}
