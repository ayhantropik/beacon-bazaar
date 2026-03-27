import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        const databaseUrl = configService.get<string>('DATABASE_URL');

        const baseConfig = {
          type: 'postgres' as const,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: !isProduction,
          logging: !isProduction,
        };

        // Supabase veya DATABASE_URL varsa connection string kullan
        if (databaseUrl) {
          return {
            ...baseConfig,
            url: databaseUrl,
            ssl: { rejectUnauthorized: false },
          };
        }

        // Fallback: ayrı ayrı DB parametreleri (local development)
        return {
          ...baseConfig,
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          database: configService.get('DB_NAME', 'beacon_bazaar'),
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
    HealthModule,
  ],
})
export class AppModule {}
