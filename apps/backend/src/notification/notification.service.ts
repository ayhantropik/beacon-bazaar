import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, NotificationEntity } from '../database/entities';

interface NotificationPayload {
  userId: string;
  type: 'order_update' | 'beacon_proximity' | 'promotion' | 'system';
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  async sendToUser(payload: NotificationPayload): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: payload.userId } });
    if (!user) {
      this.logger.warn(`User ${payload.userId} not found for notification`);
      return;
    }

    // Save in-app notification
    const notification = this.notificationRepo.create({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    });
    await this.notificationRepo.save(notification);

    this.logger.log(`Notification [${payload.type}] to ${user.email}: ${payload.title}`);
  }

  async getByUser(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    await this.notificationRepo.update({ id: notificationId, userId }, { isRead: true });
    return { success: true, message: 'Bildirim okundu olarak işaretlendi' };
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
    return { success: true, message: 'Tüm bildirimler okundu' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepo.count({ where: { userId, isRead: false } });
    return { success: true, data: { count } };
  }

  async sendBeaconNotification(userId: string, storeId: string, beaconId: string): Promise<void> {
    await this.sendToUser({
      userId,
      type: 'beacon_proximity',
      title: 'Yakındaki Mağaza',
      body: 'Bir mağazanın yakınındasınız! Özel fırsatları keşfedin.',
      data: { storeId, beaconId },
    });
  }

  async sendOrderUpdate(userId: string, orderId: string, status: string): Promise<void> {
    const statusMessages: Record<string, string> = {
      pending: 'Siparişiniz alındı',
      confirmed: 'Siparişiniz onaylandı',
      preparing: 'Siparişiniz hazırlanıyor',
      shipped: 'Siparişiniz kargoya verildi',
      delivered: 'Siparişiniz teslim edildi',
      cancelled: 'Siparişiniz iptal edildi',
    };

    await this.sendToUser({
      userId,
      type: 'order_update',
      title: 'Sipariş Güncellemesi',
      body: statusMessages[status] || `Sipariş durumu: ${status}`,
      data: { orderId, status },
    });
  }

  async sendPromotion(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    await this.sendToUser({ userId, type: 'promotion', title, body, data });
  }
}
