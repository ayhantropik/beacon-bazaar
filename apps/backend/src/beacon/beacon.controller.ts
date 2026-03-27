import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BeaconService } from './beacon.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('beacons')
@Controller('beacons')
export class BeaconController {
  constructor(private readonly beaconService: BeaconService) {}

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Mağazanın beacon\'larını getir' })
  async getByStore(@Param('storeId') storeId: string) {
    return this.beaconService.getByStore(storeId);
  }

  @Get(':uuid/:major/:minor')
  @ApiOperation({ summary: 'Beacon bilgisini getir (UUID/Major/Minor)' })
  async getByIdentifier(
    @Param('uuid') uuid: string,
    @Param('major') major: number,
    @Param('minor') minor: number,
  ) {
    return this.beaconService.getByIdentifier(uuid, major, minor);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Beacon kaydet' })
  async register(@Body() dto: Record<string, unknown>) {
    return this.beaconService.register(dto);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Beacon durumunu güncelle' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.beaconService.updateStatus(id, status);
  }

  @Post('interaction')
  @ApiOperation({ summary: 'Beacon etkileşimi kaydet' })
  async logInteraction(@Body() dto: { beaconId: string; userId?: string; rssi: number; distance: number }) {
    return this.beaconService.logInteraction(dto);
  }
}
