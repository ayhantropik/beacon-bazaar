import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../database/entities';
import { ProductEntity } from '../database/entities';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepo: Repository<StoreEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  async search(params: {
    query?: string;
    categories?: string[];
    sortBy?: string;
    page: number;
    limit: number;
  }) {
    const qb = this.storeRepo.createQueryBuilder('store').where('store.isActive = true');

    if (params.query) {
      qb.andWhere('(store.name ILIKE :q OR store.description ILIKE :q)', {
        q: `%${params.query}%`,
      });
    }

    switch (params.sortBy) {
      case 'rating': qb.orderBy('store.ratingAverage', 'DESC'); break;
      case 'name': qb.orderBy('store.name', 'ASC'); break;
      case 'newest': qb.orderBy('store.createdAt', 'DESC'); break;
      default: qb.orderBy('store.createdAt', 'DESC');
    }

    const total = await qb.getCount();
    const data = await qb.skip((params.page - 1) * params.limit).take(params.limit).getMany();

    return {
      success: true,
      data,
      pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) },
    };
  }

  async getNearby(latitude: number, longitude: number, radiusKm: number) {
    const data = await this.storeRepo
      .createQueryBuilder('store')
      .where('store.isActive = true')
      .andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(store.latitude)) * cos(radians(store.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(store.latitude)))) <= :radius`,
        { lat: latitude, lng: longitude, radius: radiusKm },
      )
      .orderBy(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(store.latitude)) * cos(radians(store.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(store.latitude))))`,
        'ASC',
      )
      .setParameters({ lat: latitude, lng: longitude })
      .take(50)
      .getMany();

    return { success: true, data };
  }

  async getById(id: string) {
    // Try by UUID first, then by slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const where = isUuid ? { id } : { slug: id };
    const store = await this.storeRepo.findOne({ where });
    if (!store) throw new NotFoundException('Mağaza bulunamadı');
    return { success: true, data: store };
  }

  async getProducts(storeId: string, page: number, limit: number) {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .where('product.storeId = :storeId', { storeId })
      .andWhere('product.isActive = true')
      .orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const total = await qb.getCount();
    const data = await qb.getMany();

    return { success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async follow(storeId: string) {
    await this.storeRepo.increment({ id: storeId }, 'followersCount', 1);
    return { success: true, message: 'Mağaza takip edildi' };
  }
}
