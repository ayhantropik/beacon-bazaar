import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedSearchEntity } from '../database/entities';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';

@Injectable()
export class SavedSearchService {
  constructor(
    @InjectRepository(SavedSearchEntity)
    private readonly repo: Repository<SavedSearchEntity>,
  ) {}

  async create(userId: string, dto: CreateSavedSearchDto) {
    const saved = await this.repo.save({
      userId,
      name: dto.name,
      context: dto.context,
      filters: dto.filters,
    });
    return { success: true, data: saved, message: 'Arama kaydedildi' };
  }

  async getByUser(userId: string, context?: string) {
    const where: any = { userId };
    if (context) where.context = context;
    const data = await this.repo.find({ where, order: { createdAt: 'DESC' }, take: 20 });
    return { success: true, data };
  }

  async delete(userId: string, id: string) {
    const item = await this.repo.findOne({ where: { id, userId } });
    if (!item) throw new NotFoundException('Kayıtlı arama bulunamadı');
    await this.repo.remove(item);
    return { success: true, message: 'Arama silindi' };
  }
}
