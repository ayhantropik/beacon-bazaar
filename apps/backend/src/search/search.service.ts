import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity, StoreEntity } from '../database/entities';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepo: Repository<StoreEntity>,
  ) {}

  async search(params: {
    query: string;
    type: 'product' | 'store' | 'all';
    latitude?: number;
    longitude?: number;
    radius?: number;
  }) {
    const { query, type } = params;
    const results: { products: ProductEntity[]; stores: StoreEntity[] } = { products: [], stores: [] };

    if (type === 'product' || type === 'all') {
      const qb = this.productRepo
        .createQueryBuilder('product')
        .where('product.isActive = true');
      if (query) {
        qb.andWhere('(product.name ILIKE :q OR product.description ILIKE :q)', { q: `%${query}%` });
      }
      results.products = await qb.orderBy('product.ratingAverage', 'DESC').take(20).getMany();
    }

    if (type === 'store' || type === 'all') {
      const qb = this.storeRepo
        .createQueryBuilder('store')
        .where('store.isActive = true');
      if (query) {
        qb.andWhere('(store.name ILIKE :q OR store.description ILIKE :q)', { q: `%${query}%` });
      }
      results.stores = await qb.orderBy('store.ratingAverage', 'DESC').take(10).getMany();
    }

    return { success: true, data: results };
  }

  async suggest(query: string) {
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }

    const products = await this.productRepo
      .createQueryBuilder('product')
      .select(['product.name', 'product.slug'])
      .where('product.isActive = true')
      .andWhere('product.name ILIKE :q', { q: `%${query}%` })
      .take(5)
      .getMany();

    const stores = await this.storeRepo
      .createQueryBuilder('store')
      .select(['store.name', 'store.slug'])
      .where('store.isActive = true')
      .andWhere('store.name ILIKE :q', { q: `%${query}%` })
      .take(3)
      .getMany();

    const suggestions = [
      ...products.map((p) => ({ type: 'product' as const, name: p.name, slug: p.slug })),
      ...stores.map((s) => ({ type: 'store' as const, name: s.name, slug: s.slug })),
    ];

    return { success: true, data: suggestions };
  }
}
