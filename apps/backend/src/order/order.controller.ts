import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Sipariş oluştur' })
  async create(@Request() req: { user: { id: string } }, @Body() dto: Record<string, unknown>) {
    return this.orderService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Siparişlerimi listele' })
  async getMyOrders(@Request() req: { user: { id: string } }, @Query('page') page = 1) {
    return this.orderService.getByUserId(req.user.id, page);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Sipariş detayı' })
  async getById(@Param('id') id: string) {
    return this.orderService.getById(id);
  }

  @Get(':id/track')
  @ApiOperation({ summary: 'Sipariş takibi' })
  async track(@Param('id') id: string) {
    return this.orderService.track(id);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Sipariş iptal' })
  async cancel(@Param('id') id: string) {
    return this.orderService.cancel(id);
  }
}
