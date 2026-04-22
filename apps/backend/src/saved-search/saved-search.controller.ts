import { Controller, Get, Post, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SavedSearchService } from './saved-search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';

@ApiTags('saved-searches')
@Controller('saved-searches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SavedSearchController {
  constructor(private readonly service: SavedSearchService) {}

  @Post()
  @ApiOperation({ summary: 'Aramayı kaydet' })
  async create(@Body() dto: CreateSavedSearchDto, @Req() req: any) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Kayıtlı aramalarım' })
  async getAll(@Req() req: any, @Query('context') context?: string) {
    return this.service.getByUser(req.user.id, context);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Kayıtlı aramayı sil' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.service.delete(req.user.id, id);
  }
}
