import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('stores')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

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
  ) {
    return this.storeService.getNearby(latitude, longitude, radius);
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
  @ApiOperation({ summary: 'Mağazayı takip et' })
  async follow(@Param('id') id: string) {
    return this.storeService.follow(id);
  }
}
