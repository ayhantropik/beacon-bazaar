import { Controller, Post, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FavoriteService } from './favorite.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post(':productId/toggle')
  @ApiOperation({ summary: 'Favorilere ekle/çıkar' })
  async toggle(
    @Request() req: { user: { id: string } },
    @Param('productId') productId: string,
  ) {
    return this.favoriteService.toggle(req.user.id, productId);
  }

  @Get()
  @ApiOperation({ summary: 'Favorilerimi listele' })
  async getMyFavorites(
    @Request() req: { user: { id: string } },
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.favoriteService.getByUser(req.user.id, page, limit);
  }

  @Get('check')
  @ApiOperation({ summary: 'Ürünlerin favori durumunu kontrol et' })
  async check(
    @Request() req: { user: { id: string } },
    @Query('ids') ids: string,
  ) {
    const productIds = ids ? ids.split(',') : [];
    return this.favoriteService.check(req.user.id, productIds);
  }
}
