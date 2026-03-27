import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../database/entities';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
  ) {}

  async create(userId: string, dto: Record<string, unknown>) {
    const order = this.orderRepo.create({ ...dto, userId });
    const saved = await this.orderRepo.save(order);
    return { success: true, data: saved };
  }

  async getByUserId(userId: string, page: number) {
    const limit = 20;
    const [data, total] = await this.orderRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    return { success: true, data: order };
  }

  async track(id: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    return { success: true, data: { status: order.status, trackingNumber: order.trackingNumber } };
  }

  async cancel(id: string) {
    await this.orderRepo.update(id, { status: 'cancelled' });
    return { success: true, message: 'Sipariş iptal edildi' };
  }
}
