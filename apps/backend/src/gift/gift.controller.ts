import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GiftService } from './gift.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('gift')
@Controller('gift')
export class GiftController {
  constructor(private readonly giftService: GiftService) {}

  /* ─── Recipients (kişiler) ─── */

  @Get('recipients')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kayıtlı hediye kişilerini listele' })
  async getRecipients(@Req() req: any) {
    return this.giftService.getRecipients(req.user.id);
  }

  @Get('recipients/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hediye kişisi detayı (geçmişiyle birlikte)' })
  async getRecipient(@Req() req: any, @Param('id') id: string) {
    return this.giftService.getRecipient(req.user.id, id);
  }

  @Post('recipients')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni hediye kişisi kaydet' })
  async createRecipient(@Req() req: any, @Body() body: {
    name: string;
    birthDate?: string;
    birthTime?: string;
    zodiacSign?: string;
    ascendantSign?: string;
    gender?: string;
    education?: string;
    hobbies?: string[];
    relationship?: string;
    aiProfile?: Record<string, unknown>;
  }) {
    return this.giftService.createRecipient(req.user.id, body);
  }

  @Put('recipients/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hediye kişisi güncelle' })
  async updateRecipient(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.giftService.updateRecipient(req.user.id, id, body);
  }

  @Delete('recipients/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hediye kişisi sil' })
  async deleteRecipient(@Req() req: any, @Param('id') id: string) {
    return this.giftService.deleteRecipient(req.user.id, id);
  }

  /* ─── Gift History (hediye geçmişi) ─── */

  @Get('recipients/:id/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kişinin hediye geçmişini listele' })
  async getHistory(@Req() req: any, @Param('id') recipientId: string) {
    return this.giftService.getHistory(req.user.id, recipientId);
  }

  @Post('recipients/:id/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hediye geçmişine yeni kayıt ekle' })
  async addGiftToHistory(@Req() req: any, @Param('id') recipientId: string, @Body() body: {
    productId?: string;
    productName: string;
    productThumbnail?: string;
    price?: number;
    occasion: string;
    giftDate: string;
    reason?: string;
    notes?: string;
  }) {
    return this.giftService.addGiftToHistory(req.user.id, recipientId, body);
  }

  @Put('history/:historyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hediye kaydını güncelle (beğeni, not)' })
  async updateGiftHistory(@Req() req: any, @Param('historyId') historyId: string, @Body() body: {
    rating?: number;
    notes?: string;
  }) {
    return this.giftService.updateGiftHistory(req.user.id, historyId, body);
  }

  @Delete('history/:historyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hediye kaydını sil' })
  async deleteGiftHistory(@Req() req: any, @Param('historyId') historyId: string) {
    return this.giftService.deleteGiftHistory(req.user.id, historyId);
  }
}
