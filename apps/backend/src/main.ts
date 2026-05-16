import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  // CORS — "*" literal'ini wildcard yorumla; aksi halde virgülle ayrılmış liste
  const corsEnv = process.env.CORS_ORIGINS?.trim();
  const corsOrigin =
    !corsEnv || corsEnv === '*'
      ? true
      : corsEnv.split(',').map((s) => s.trim()).filter(Boolean);
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('VeniVidiCoop API')
    .setDescription('Konum bazlı e-ticaret platformu API dokümantasyonu')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Kimlik doğrulama')
    .addTag('users', 'Kullanıcı işlemleri')
    .addTag('products', 'Ürün işlemleri')
    .addTag('stores', 'Mağaza işlemleri')
    .addTag('orders', 'Sipariş işlemleri')
    .addTag('locations', 'Konum işlemleri')
    .addTag('beacons', 'Beacon işlemleri')
    .addTag('appointments', 'Randevu işlemleri')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`VeniVidiCoop API running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
