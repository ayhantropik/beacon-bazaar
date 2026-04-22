import { Controller, Get, Post, Put, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessageController {
  constructor(private readonly service: MessageService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Konuşmalarımı listele' })
  async getConversations(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.service.getConversations(req.user.id, page, limit);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Konuşma mesajlarını getir' })
  async getMessages(@Param('id') id: string, @Req() req: any, @Query('page') page = 1, @Query('limit') limit = 50) {
    return this.service.getMessages(req.user.id, id, page, limit);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Yeni konuşma başlat' })
  async startConversation(@Body() dto: CreateConversationDto, @Req() req: any) {
    return this.service.startConversation(req.user.id, dto);
  }

  @Post('conversations/:id')
  @ApiOperation({ summary: 'Mesaj gönder' })
  async sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto, @Req() req: any) {
    return this.service.sendMessage(req.user.id, id, dto.content);
  }

  @Put('conversations/:id/read')
  @ApiOperation({ summary: 'Okundu olarak işaretle' })
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.service.markAsRead(req.user.id, id);
  }
}
