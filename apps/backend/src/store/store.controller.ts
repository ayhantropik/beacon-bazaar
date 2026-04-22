import { Controller, Get, Post, Put, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateStoreDto } from './dto/create-store.dto';

@ApiTags('stores')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // ─── Store Owner Endpoints (before :id routes) ───────────────

  @Get('my-store')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kendi mağazamı getir' })
  async getMyStore(@Req() req: any) {
    return this.storeService.getMyStore(req.user.id);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mağaza oluştur' })
  async createStore(@Body() dto: CreateStoreDto, @Req() req: any) {
    return this.storeService.createStore(req.user.id, dto);
  }

  @Put('my-store')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mağazamı güncelle' })
  async updateMyStore(@Body() dto: Partial<CreateStoreDto>, @Req() req: any) {
    return this.storeService.updateMyStore(req.user.id, dto);
  }

  @Get('my-follows')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Takip ettiğim mağazalar' })
  async getFollowedStores(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.storeService.getFollowedStores(req.user.id, page, limit);
  }

  @Get('my-store/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mağazamın ürünlerini getir' })
  async getMyProducts(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.storeService.getMyProducts(req.user.id, page, limit);
  }

  @Get('my-store/dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dashboard istatistikleri' })
  async getDashboardStats(@Req() req: any) {
    return this.storeService.getDashboardStats(req.user.id);
  }

  // ─── Public Endpoints ─────────────────────────────────────────

  @Get('search')
  @ApiOperation({ summary: 'Mağaza ara' })
  async search(
    @Query('q') query?: string,
    @Query('categories') categories?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.storeService.search({ query, categories: categories?.split(','), sortBy, page, limit });
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Yakındaki mağazaları getir' })
  async getNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius = 5,
    @Query('storeIds') storeIds?: string,
  ) {
    return this.storeService.getNearby(latitude, longitude, radius, storeIds?.split(','));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mağaza detayı' })
  async getById(@Param('id') id: string) {
    return this.storeService.getById(id);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Mağaza ürünlerini getir' })
  async getProducts(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.storeService.getProducts(id, page, limit);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mağazayı takip et / takipten çık (toggle)' })
  async toggleFollow(@Param('id') id: string, @Req() req: any) {
    return this.storeService.toggleFollow(req.user.id, id);
  }

  @Get(':id/follow/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Takip durumunu kontrol et' })
  async checkFollow(@Param('id') id: string, @Req() req: any) {
    return this.storeService.checkFollow(req.user.id, id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Mağaza değerlendirmelerini getir' })
  async getReviews(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 10) {
    return this.storeService.getReviews(id, page, limit);
  }

  @Get(':id/reviews/can-review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcı bu mağazayı değerlendirebilir mi?' })
  async canReview(@Param('id') id: string, @Req() req: any) {
    return this.storeService.canReview(req.user.id, id);
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mağazaya değerlendirme yaz (6 kriter)' })
  async createReview(@Param('id') id: string, @Body() dto: CreateReviewDto, @Req() req: any) {
    return this.storeService.createReview(req.user.id, id, dto);
  }

  @Delete(':id/reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Değerlendirmeyi sil' })
  async deleteReview(@Param('id') id: string, @Param('reviewId') reviewId: string, @Req() req: any) {
    return this.storeService.deleteReview(req.user.id, id, reviewId);
  }
}
