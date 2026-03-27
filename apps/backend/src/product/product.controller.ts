import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

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
  ) {
    return this.productService.search({
      query,
      categories: categories?.split(','),
      minPrice,
      maxPrice,
      sortBy,
      page,
      limit,
    });
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
}
