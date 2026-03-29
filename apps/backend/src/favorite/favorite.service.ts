import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteEntity } from '../database/entities';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepo: Repository<FavoriteEntity>,
  ) {}

  async toggle(userId: string, productId: string) {
    const existing = await this.favoriteRepo.findOne({ where: { userId, productId } });
    if (existing) {
      await this.favoriteRepo.remove(existing);
      return { success: true, data: { isFavorite: false }, message: 'Favorilerden çıkarıldı' };
    }
    const favorite = this.favoriteRepo.create({ userId, productId });
    await this.favoriteRepo.save(favorite);
    return { success: true, data: { isFavorite: true }, message: 'Favorilere eklendi' };
  }

  async getByUser(userId: string, page: number, limit: number) {
    const [data, total] = await this.favoriteRepo.findAndCount({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      success: true,
      data: data.map((f) => f.product),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async check(userId: string, productIds: string[]) {
    if (!productIds.length) return { success: true, data: {} };
    const favorites = await this.favoriteRepo
      .createQueryBuilder('fav')
      .where('fav.userId = :userId', { userId })
      .andWhere('fav.productId IN (:...productIds)', { productIds })
      .getMany();
    const map: Record<string, boolean> = {};
    productIds.forEach((id) => (map[id] = false));
    favorites.forEach((f) => (map[f.productId] = true));
    return { success: true, data: map };
  }
}
