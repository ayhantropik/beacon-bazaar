import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../database/entities';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  async search(params: {
    query?: string;
    categories?: string[];
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page: number;
    limit: number;
  }) {
    const qb = this.productRepo.createQueryBuilder('product').where('product.isActive = true');

    if (params.query) {
      qb.andWhere('(product.name ILIKE :q OR product.description ILIKE :q)', {
        q: `%${params.query}%`,
      });
    }
    if (params.minPrice) qb.andWhere('product.price >= :minPrice', { minPrice: params.minPrice });
    if (params.maxPrice) qb.andWhere('product.price <= :maxPrice', { maxPrice: params.maxPrice });

    switch (params.sortBy) {
      case 'price_asc': qb.orderBy('product.price', 'ASC'); break;
      case 'price_desc': qb.orderBy('product.price', 'DESC'); break;
      case 'rating': qb.orderBy('product.ratingAverage', 'DESC'); break;
      case 'newest': qb.orderBy('product.createdAt', 'DESC'); break;
      default: qb.orderBy('product.createdAt', 'DESC');
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getMany();

    return {
      success: true,
      data,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  async getById(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const where = isUuid ? { id } : { slug: id };
    const product = await this.productRepo.findOne({ where, relations: ['store'] });
    if (!product) throw new NotFoundException('Ürün bulunamadı');
    return { success: true, data: product };
  }

  async getFeatured() {
    const data = await this.productRepo.find({
      where: { isFeatured: true, isActive: true },
      take: 20,
      order: { ratingAverage: 'DESC' },
    });
    return { success: true, data };
  }

  async getCategories() {
    const result = await this.productRepo
      .createQueryBuilder('product')
      .select('DISTINCT jsonb_array_elements_text(product.categories)', 'category')
      .getRawMany();
    return { success: true, data: result.map((r: { category: string }) => r.category) };
  }

  async create(dto: CreateProductDto) {
    const product = this.productRepo.create(dto);
    const saved = await this.productRepo.save(product);
    return { success: true, data: saved };
  }

  async update(id: string, dto: Partial<CreateProductDto>) {
    await this.productRepo.update(id, dto);
    return this.getById(id);
  }

  async delete(id: string) {
    await this.productRepo.update(id, { isActive: false });
    return { success: true, message: 'Ürün silindi' };
  }
}
