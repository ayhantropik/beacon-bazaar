import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { GiftAIService, GiftAIRequest } from './gift-ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly giftAIService: GiftAIService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Ürün ara' })
  async search(
    @Query('q') query?: string,
    @Query('categories') categories?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('sortBy') sortBy?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('includeStore') includeStore?: string,
  ) {
    return this.productService.search({
      query,
      categories: categories?.split(','),
      minPrice,
      maxPrice,
      sortBy,
      page,
      limit,
      includeStore: includeStore === 'true',
    });
  }

  @Post('gift-suggestions')
  @ApiOperation({ summary: 'Hediye önerileri al' })
  async getGiftSuggestions(@Body() body: {
    age?: number;
    gender?: string;
    interests?: string[];
    occasion?: string;
    budget?: { min: number; max: number };
    relationship?: string;
    latitude?: number;
    longitude?: number;
  }) {
    return this.productService.getGiftSuggestions(body);
  }

  @Post('gift-ai/chat')
  @ApiOperation({ summary: 'AI hediye danışmanı ile sohbet' })
  async giftAIChat(@Body() body: GiftAIRequest) {
    return this.giftAIService.chat(body);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Öne çıkan ürünleri getir' })
  async getFeatured() {
    return this.productService.getFeatured();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Kategorileri getir' })
  async getCategories() {
    return this.productService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ürün detayını getir' })
  async getById(@Param('id') id: string) {
    return this.productService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ürün oluştur' })
  async create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ürün güncelle' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateProductDto>) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ürün sil' })
  async delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }

  @Get(':id/price-history')
  @ApiOperation({ summary: 'Ürün fiyat geçmişi' })
  async getPriceHistory(@Param('id') id: string) {
    return this.productService.getPriceHistory(id);
  }

  @Post(':id/price-alert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fiyat düşünce haber ver' })
  async createPriceAlert(@Param('id') id: string, @Body() body: { targetPrice: number }, @Req() req: any) {
    return this.productService.createPriceAlert(req.user.id, id, body.targetPrice);
  }

  @Delete(':id/price-alert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fiyat alarmını kaldır' })
  async removePriceAlert(@Param('id') id: string, @Req() req: any) {
    return this.productService.removePriceAlert(req.user.id, id);
  }

  @Get(':id/price-alert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fiyat alarmı durumunu kontrol et' })
  async checkPriceAlert(@Param('id') id: string, @Req() req: any) {
    return this.productService.checkPriceAlert(req.user.id, id);
  }
}
