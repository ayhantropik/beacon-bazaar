import { Controller, Get, Put, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

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
