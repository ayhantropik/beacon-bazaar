import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RegisterDeviceDto {
  token: string;
  platform: 'ios' | 'android' | 'web';
  device?: Record<string, string>;
}

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('register-device')
  @ApiOperation({ summary: 'Push notification token kaydet' })
  registerDevice(@Req() req: any, @Body() dto: RegisterDeviceDto) {
    return this.notificationService.registerDevice(
      req.user.id || req.user.sub,
      dto.token,
      dto.platform,
      dto.device,
    );
  }

  @Delete('register-device')
  @ApiOperation({ summary: 'Push notification token kaldır' })
  unregisterDevice(@Req() req: any, @Body() dto: { token: string }) {
    return this.notificationService.unregisterDevice(
      req.user.id || req.user.sub,
      dto.token,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Bildirimleri listele' })
  getNotifications(@Req() req: any, @Query('page') page?: number) {
    return this.notificationService.getByUser(req.user.id || req.user.sub, page ? +page : 1);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Okunmamış bildirim sayısı' })
  getUnreadCount(@Req() req: any) {
    return this.notificationService.getUnreadCount(req.user.id || req.user.sub);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Bildirimi okundu olarak işaretle' })
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(req.user.id || req.user.sub, id);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Tüm bildirimleri okundu olarak işaretle' })
  markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user.id || req.user.sub);
  }
}
