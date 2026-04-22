import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../database/entities';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: string, dto: Record<string, unknown>) {
    const payload: Record<string, unknown> = { ...dto, userId };
    // billingAddress yoksa shippingAddress'i kullan
    if (!payload.billingAddress && payload.shippingAddress) {
      payload.billingAddress = payload.shippingAddress;
    }
    const order = this.orderRepo.create(payload);
    const saved = await this.orderRepo.save(order);

    // Bildirim gönder
    this.notificationService.sendOrderUpdate(userId, saved.id, 'pending').catch(() => {});

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
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    await this.orderRepo.update(id, { status: 'cancelled' });

    this.notificationService.sendOrderUpdate(order.userId, id, 'cancelled').catch(() => {});

    return { success: true, message: 'Sipariş iptal edildi' };
  }

  async updateStatus(id: string, status: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    await this.orderRepo.update(id, { status });
    this.notificationService.sendOrderUpdate(order.userId, id, status).catch(() => {});
    return { success: true, message: `Sipariş durumu güncellendi: ${status}` };
  }

  async getByStoreOwnerId(ownerId: string, opts: { page: number; limit: number; status?: string }) {
    // Mağaza sahibinin store'larını bul
    try {
      const stores = await this.orderRepo.manager.query(
        'SELECT id FROM stores WHERE "ownerId" = $1',
        [ownerId],
      );
      if (stores.length === 0) return { success: true, data: [], total: 0 };

      const storeIds = stores.map((s: any) => s.id);
      let query = this.orderRepo.createQueryBuilder('order')
        .where('order.items::text LIKE ANY(ARRAY[:...storePatterns])', {
          storePatterns: storeIds.map((id: string) => `%${id}%`),
        })
        .orderBy('order.createdAt', 'DESC');

      if (opts.status) {
        query = query.andWhere('order.status = :status', { status: opts.status });
      }

      const total = await query.getCount();
      const data = await query
        .skip((opts.page - 1) * opts.limit)
        .take(opts.limit)
        .getMany();

      return {
        success: true,
        data,
        total,
        pagination: { page: opts.page, limit: opts.limit, total, totalPages: Math.ceil(total / opts.limit) },
      };
    } catch {
      return { success: true, data: [], total: 0 };
    }
  }

  async getStoreOrderStats(ownerId: string) {
    try {
      const stores = await this.orderRepo.manager.query(
        'SELECT id FROM stores WHERE "ownerId" = $1',
        [ownerId],
      );
      if (stores.length === 0) return { success: true, data: { totalOrders: 0, pendingOrders: 0, totalRevenue: 0 } };

      const storeIds = stores.map((s: any) => s.id);
      const allOrders = await this.orderRepo.createQueryBuilder('order')
        .where('order.items::text LIKE ANY(ARRAY[:...patterns])', {
          patterns: storeIds.map((id: string) => `%${id}%`),
        })
        .getMany();

      const totalOrders = allOrders.length;
      const pendingOrders = allOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
      const totalRevenue = allOrders
        .filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
        .reduce((sum, o) => sum + Number(o.total || 0), 0);

      return { success: true, data: { totalOrders, pendingOrders, totalRevenue } };
    } catch {
      return { success: true, data: { totalOrders: 0, pendingOrders: 0, totalRevenue: 0 } };
    }
  }
}
