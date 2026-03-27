import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LocationService } from './location.service';

@ApiTags('locations')
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('search')
  @ApiOperation({ summary: 'Konum ara' })
  async search(@Query('query') query: string) {
    return this.locationService.search(query);
  }

  @Get('reverse')
  @ApiOperation({ summary: 'Koordinattan adres bul' })
  async reverseGeocode(@Query('latitude') lat: number, @Query('longitude') lng: number) {
    return this.locationService.reverseGeocode(lat, lng);
  }

  @Post('route')
  @ApiOperation({ summary: 'Rota hesapla' })
  async getRoute(@Body() dto: { origin: { latitude: number; longitude: number }; destination: { latitude: number; longitude: number } }) {
    return this.locationService.getRoute(dto.origin, dto.destination);
  }
}
