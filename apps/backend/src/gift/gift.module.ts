import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftController } from './gift.controller';
import { GiftService } from './gift.service';
import { GiftRecipientEntity } from '../database/entities/gift-recipient.entity';
import { GiftHistoryEntity } from '../database/entities/gift-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GiftRecipientEntity, GiftHistoryEntity])],
  controllers: [GiftController],
  providers: [GiftService],
  exports: [GiftService],
})
export class GiftModule {}
