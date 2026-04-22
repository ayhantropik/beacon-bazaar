import { Controller, Get, Post, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QaService } from './qa.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AskQuestionDto } from './dto/ask-question.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';

@ApiTags('qa')
@Controller('qa')
export class QaController {
  constructor(private readonly service: QaService) {}

  @Post('questions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soru sor' })
  async askQuestion(@Body() dto: AskQuestionDto, @Req() req: any) {
    return this.service.askQuestion(req.user.id, dto);
  }

  @Get('questions/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sorduklarım' })
  async getMyQuestions(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.service.getMyQuestions(req.user.id, page, limit);
  }

  @Get('questions/seller')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bana sorulan sorular' })
  async getSellerQuestions(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.service.getQuestionsForSeller(req.user.id, page, limit);
  }

  @Post('questions/:id/answer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soruyu cevapla' })
  async answerQuestion(@Param('id') id: string, @Body() dto: AnswerQuestionDto, @Req() req: any) {
    return this.service.answerQuestion(req.user.id, id, dto.content);
  }

  @Get('listings/:listingId/questions')
  @ApiOperation({ summary: 'İlan soruları (public)' })
  async getListingQuestions(@Param('listingId') listingId: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.service.getListingQuestions(listingId, page, limit);
  }
}
