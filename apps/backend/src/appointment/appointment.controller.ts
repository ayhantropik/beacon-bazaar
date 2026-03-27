import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('slots')
  @ApiOperation({ summary: 'Müsait zaman dilimlerini getir' })
  async getSlots(@Query('storeId') storeId: string, @Query('date') date: string) {
    return this.appointmentService.getAvailableSlots(storeId, date);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Randevu oluştur' })
  async create(@Request() req: { user: { id: string } }, @Body() dto: Record<string, unknown>) {
    return this.appointmentService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Randevularımı listele' })
  async getMyAppointments(@Request() req: { user: { id: string } }, @Query('page') page = 1) {
    return this.appointmentService.getByUserId(req.user.id, page);
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Randevu iptal' })
  async cancel(@Param('id') id: string) {
    return this.appointmentService.cancel(id);
  }
}
