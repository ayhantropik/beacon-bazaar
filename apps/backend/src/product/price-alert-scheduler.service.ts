import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class PriceAlertSchedulerService {
  private readonly logger = new Logger(PriceAlertSchedulerService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  // Her 30 dakikada bir fiyat alarmlarını kontrol et
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkPriceAlerts() {
    this.logger.log('Fiyat alarmları kontrol ediliyor...');

    try {
      // Aktif alarmları, ürün fiyatı hedef fiyatın altına düşmüş olanları bul
      const triggered = await this.dataSource.query(`
        SELECT pa.id, pa."userId", pa."productId", pa."targetPrice",
               p.name as "productName", p.slug as "productSlug",
               p.price as "currentPrice", p."salePrice",
               p.thumbnail
        FROM price_alerts pa
        JOIN products p ON p.id = pa."productId"
        WHERE pa."isActive" = true
        AND (
          (p."salePrice" IS NOT NULL AND p."salePrice" > 0 AND p."salePrice" <= pa."targetPrice")
          OR
          (p."salePrice" IS NULL AND p.price <= pa."targetPrice")
          OR
          (p."salePrice" = 0 AND p.price <= pa."targetPrice")
        )
      `);

      if (triggered.length === 0) {
        this.logger.log('Tetiklenen fiyat alarmı yok.');
        return;
      }

      this.logger.log(`${triggered.length} fiyat alarmı tetiklendi!`);

      for (const alert of triggered) {
        const effectivePrice = alert.salePrice && Number(alert.salePrice) > 0
          ? Number(alert.salePrice)
          : Number(alert.currentPrice);

        // Kullanıcıya bildirim gönder
        await this.notificationService.sendToUser({
          userId: alert.userId,
          type: 'promotion',
          title: 'Fiyat Düştü!',
          body: `${alert.productName} ürünü ${effectivePrice.toLocaleString('tr-TR')} ₺ fiyatına düştü! Hedef fiyatınız: ${Number(alert.targetPrice).toLocaleString('tr-TR')} ₺`,
          data: {
            productId: alert.productId,
            productSlug: alert.productSlug,
            currentPrice: String(effectivePrice),
            targetPrice: String(alert.targetPrice),
          },
        });

        // Alarmı pasif yap (tek seferlik bildirim)
        await this.dataSource.query(
          `UPDATE price_alerts SET "isActive" = false WHERE id = $1`,
          [alert.id],
        );
      }

      this.logger.log(`${triggered.length} fiyat alarmı bildirimi gönderildi.`);
    } catch (err) {
      this.logger.error('Fiyat alarmı kontrol hatası:', err);
    }
  }
}
