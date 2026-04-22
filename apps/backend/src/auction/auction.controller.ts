import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuctionService } from './auction.service';
import { PlaceBidDto } from './dto/place-bid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('auction')
@Controller('auction')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Get('today')
  @ApiOperation({ summary: 'Bugünkü açık artırma listesi' })
  async getTodayAuctions() {
    return this.auctionService.getTodayAuctions();
  }

  @Get('past')
  @ApiOperation({ summary: 'Geçmiş açık artırmalar' })
  async getPastAuctions(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.auctionService.getPastAuctions(page, limit);
  }

  @Get('my-bids')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcının teklifleri' })
  async getMyBids(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.auctionService.getMyBids(req.user.id, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Açık artırma ürün detayı ve teklifler' })
  async getAuctionItem(@Param('id') id: string) {
    return this.auctionService.getAuctionItem(id);
  }

  @Post('bid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Teklif ver' })
  async placeBid(@Req() req: any, @Body() dto: PlaceBidDto) {
    return this.auctionService.placeBid(req.user.id, dto);
  }
}
