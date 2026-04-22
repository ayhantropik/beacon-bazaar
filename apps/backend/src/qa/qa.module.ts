import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';
import { QuestionEntity, AnswerEntity } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionEntity, AnswerEntity])],
  controllers: [QaController],
  providers: [QaService],
  exports: [QaService],
})
export class QaModule {}
