import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initialize')
  @ApiOperation({ summary: 'Ödeme başlat' })
  async initialize(@Body() dto: { orderId: string; paymentMethod: string }) {
    return this.paymentService.initialize(dto.orderId, dto.paymentMethod);
  }

  @Post('callback')
  @ApiOperation({ summary: 'Ödeme callback' })
  async callback(@Body() dto: Record<string, unknown>) {
    return this.paymentService.handleCallback(dto);
  }
}
