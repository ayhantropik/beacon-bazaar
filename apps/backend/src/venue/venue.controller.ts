import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VenueService } from './venue.service';
import { CreateVenueDto, UpdateVenueDto, AddBeaconDto } from './dto/create-venue.dto';

@ApiTags('Venues')
@Controller('venues')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm aktif venue\'ları listele' })
  findAll() {
    return this.venueService.findAll();
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Yakındaki venue\'ları getir' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lng', type: Number })
  @ApiQuery({ name: 'radius', type: Number, required: false, description: 'Kilometre cinsinden yarıçap (varsayılan: 10)' })
  findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.venueService.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : 10,
    );
  }

  @Get('seed')
  @ApiOperation({ summary: 'Demo venue verilerini oluştur (development)' })
  seed() {
    return this.venueService.seed();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Venue detayı (ID veya slug ile)' })
  findById(@Param('id') id: string) {
    return this.venueService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Yeni venue oluştur' })
  create(@Body() dto: CreateVenueDto) {
    return this.venueService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Venue güncelle' })
  update(@Param('id') id: string, @Body() dto: UpdateVenueDto) {
    return this.venueService.update(id, dto);
  }

  @Post(':id/beacons')
  @ApiOperation({ summary: 'Venue\'ya beacon ekle' })
  addBeacon(@Param('id') id: string, @Body() dto: AddBeaconDto) {
    return this.venueService.addBeacon(id, dto);
  }
}
