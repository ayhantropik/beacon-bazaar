import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../database/entities';

interface PaymentResult {
  paymentId: string;
  orderId: string;
  status: 'pending' | 'paid' | 'failed';
  checkoutUrl?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
  ) {}

  async initialize(orderId: string, paymentMethod: string): Promise<{ success: boolean; data: PaymentResult }> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new BadRequestException('Sipariş bulunamadı');

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    this.logger.log(`Payment initialized: ${paymentId} for order ${orderId}, method: ${paymentMethod}`);

    // In production: call iyzico/PayTR/Stripe API
    // const iyzico = await iyzicoClient.create({ orderId, amount: order.total, ... })

    if (paymentMethod === 'cash_on_delivery') {
      // Kapıda ödeme - doğrudan onayla
      await this.orderRepo.update(orderId, { status: 'confirmed', paymentStatus: 'pending' });
      return {
        success: true,
        data: { paymentId, orderId, status: 'pending' },
      };
    }

    if (paymentMethod === 'bank_transfer') {
      // Havale - beklemeye al
      await this.orderRepo.update(orderId, { paymentStatus: 'pending' });
      return {
        success: true,
        data: { paymentId, orderId, status: 'pending' },
      };
    }

    // Kredi/banka kartı - ödeme sayfasına yönlendir
    // In production: checkoutUrl from payment gateway
    await this.orderRepo.update(orderId, { paymentStatus: 'pending' });
    return {
      success: true,
      data: {
        paymentId,
        orderId,
        status: 'pending',
        checkoutUrl: `/payment/3d-secure/${paymentId}`,
      },
    };
  }

  async handleCallback(data: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
    const { orderId, status } = data as { orderId?: string; status?: string };

    if (!orderId) throw new BadRequestException('orderId gerekli');

    this.logger.log(`Payment callback: order=${orderId}, status=${status}`);

    // In production: verify payment signature from gateway
    // const isValid = iyzicoClient.verifySignature(data)

    if (status === 'success') {
      await this.orderRepo.update(orderId, {
        paymentStatus: 'paid',
        status: 'confirmed',
      });
      return { success: true, message: 'Ödeme onaylandı' };
    }

    await this.orderRepo.update(orderId, { paymentStatus: 'failed' });
    return { success: false, message: 'Ödeme başarısız' };
  }

  async refund(orderId: string): Promise<{ success: boolean; message: string }> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new BadRequestException('Sipariş bulunamadı');

    this.logger.log(`Refund initiated for order ${orderId}`);

    // In production: call payment gateway refund API
    await this.orderRepo.update(orderId, { paymentStatus: 'refunded', status: 'refunded' });
    return { success: true, message: 'İade işlemi başlatıldı' };
  }
}
