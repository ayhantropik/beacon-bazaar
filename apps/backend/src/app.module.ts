import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { StoreModule } from './store/store.module';
import { OrderModule } from './order/order.module';
import { LocationModule } from './location/location.module';
import { BeaconModule } from './beacon/beacon.module';
import { SearchModule } from './search/search.module';
import { NotificationModule } from './notification/notification.module';
import { AppointmentModule } from './appointment/appointment.module';
import { PaymentModule } from './payment/payment.module';
import { FavoriteModule } from './favorite/favorite.module';
import { HealthModule } from './health/health.module';
import { GiftModule } from './gift/gift.module';
import { SavedSearchModule } from './saved-search/saved-search.module';
import { MessageModule } from './message/message.module';
import { QaModule } from './qa/qa.module';
import { AuctionModule } from './auction/auction.module';
import { AdminModule } from './admin/admin.module';
import { VenueModule } from './venue/venue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        const databaseUrl = configService.get<string>('DATABASE_URL');

        const baseConfig = {
          type: 'postgres' as const,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: false,
          logging: !isProduction,
        };

        // Supabase veya DATABASE_URL varsa connection string kullan
        if (databaseUrl) {
          const isPooler = databaseUrl.includes('pooler.supabase.com');
          return {
            ...baseConfig,
            url: databaseUrl,
            ssl: { rejectUnauthorized: false },
            retryAttempts: 5,
            retryDelay: 3000,
            ...(isPooler ? { extra: { prepared: false } } : {}),
          };
        }

        // Fallback: ayrı ayrı DB parametreleri (local development)
        return {
          ...baseConfig,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'beacon_bazaar'),
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    ProductModule,
    StoreModule,
    OrderModule,
    LocationModule,
    BeaconModule,
    SearchModule,
    NotificationModule,
    AppointmentModule,
    PaymentModule,
    FavoriteModule,
    HealthModule,
    GiftModule,
    SavedSearchModule,
    MessageModule,
    QaModule,
    AuctionModule,
    AdminModule,
    VenueModule,
  ],
})
export class AppModule {}
