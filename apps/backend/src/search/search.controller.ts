import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Genel arama (ürün + mağaza)' })
  async search(
    @Query('q') query: string,
    @Query('type') type?: 'product' | 'store' | 'all',
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('radius') radius?: number,
  ) {
    return this.searchService.search({ query, type: type || 'all', latitude, longitude, radius });
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Arama önerileri' })
  async suggest(@Query('q') query: string) {
    return this.searchService.suggest(query);
  }
}
