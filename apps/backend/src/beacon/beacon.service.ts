import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeaconEntity } from '../database/entities';

@Injectable()
export class BeaconService {
  constructor(
    @InjectRepository(BeaconEntity)
    private readonly beaconRepo: Repository<BeaconEntity>,
  ) {}

  async getByStore(storeId: string) {
    const data = await this.beaconRepo.find({ where: { storeId, status: 'active' } });
    return { success: true, data };
  }

  async getByIdentifier(uuid: string, major: number, minor: number) {
    const beacon = await this.beaconRepo.findOne({
      where: { uuid, major, minor },
      relations: ['store'],
    });
    if (!beacon) throw new NotFoundException('Beacon bulunamadı');
    return { success: true, data: beacon };
  }

  async register(dto: Record<string, unknown>) {
    const beacon = this.beaconRepo.create(dto);
    const saved = await this.beaconRepo.save(beacon);
    return { success: true, data: saved };
  }

  async updateStatus(id: string, status: string) {
    await this.beaconRepo.update(id, { status });
    return { success: true, message: 'Beacon durumu güncellendi' };
  }

  async logInteraction(dto: { beaconId: string; userId?: string; rssi: number; distance: number }) {
    // In production: save to analytics database (e.g., ClickHouse, BigQuery)
    await this.beaconRepo.update(dto.beaconId, { lastSeen: new Date() });
    return { success: true, message: 'Etkileşim kaydedildi' };
  }
}
