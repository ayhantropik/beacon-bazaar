import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BeaconController } from './beacon.controller';
import { BeaconService } from './beacon.service';
import { BeaconEntity } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([BeaconEntity])],
  controllers: [BeaconController],
  providers: [BeaconService],
  exports: [BeaconService],
})
export class BeaconModule {}
