import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../database/entities';

interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  tokens: string[];
}

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
  ) {}

  async sendPush(notification: PushNotification): Promise<{ sent: number; failed: number }> {
    // In production: Firebase Admin SDK
    // admin.messaging().sendEachForMulticast({ tokens, notification: { title, body }, data })
    this.logger.log(`Push notification: "${notification.title}" -> ${notification.tokens.length} devices`);
    return { sent: notification.tokens.length, failed: 0 };
  }

  async sendToUser(payload: NotificationPayload): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: payload.userId } });
    if (!user) {
      this.logger.warn(`User ${payload.userId} not found for notification`);
      return;
    }

    // In production: get user's FCM tokens from a device_tokens table
    this.logger.log(`Notification [${payload.type}] to ${user.email}: ${payload.title}`);

    // Store in-app notification for the user
    // In production: save to notifications table and emit via WebSocket/SSE
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
