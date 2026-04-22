import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionEntity, AnswerEntity } from '../database/entities';
import { AskQuestionDto } from './dto/ask-question.dto';

@Injectable()
export class QaService {
  constructor(
    @InjectRepository(QuestionEntity)
    private readonly questionRepo: Repository<QuestionEntity>,
    @InjectRepository(AnswerEntity)
    private readonly answerRepo: Repository<AnswerEntity>,
  ) {}

  async askQuestion(userId: string, dto: AskQuestionDto) {
    const entity = this.questionRepo.create({
      userId,
      listingId: dto.listingId,
      listingType: dto.listingType,
      listingTitle: dto.listingTitle || undefined,
      sellerUserId: dto.sellerUserId,
      content: dto.content,
    });
    const question = await this.questionRepo.save(entity);
    return { success: true, data: question, message: 'Soru gönderildi' };
  }

  async answerQuestion(userId: string, questionId: string, content: string) {
    const question = await this.questionRepo.findOne({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Soru bulunamadı');
    if (question.sellerUserId !== userId) throw new ForbiddenException('Bu soruyu sadece satıcı cevaplayabilir');
    if (question.isAnswered) throw new BadRequestException('Bu soru zaten cevaplanmış');

    const answer = await this.answerRepo.save({
      questionId,
      userId,
      content,
    });

    await this.questionRepo.update(questionId, { isAnswered: true });

    return { success: true, data: answer, message: 'Cevap gönderildi' };
  }

  async getMyQuestions(userId: string, page: number, limit: number) {
    const [data, total] = await this.questionRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Cevapları da getir
    const questionIds = data.map((q) => q.id);
    const answers = questionIds.length
      ? await this.answerRepo.find({ where: questionIds.map((id) => ({ questionId: id })), relations: ['user'] })
      : [];

    const answerMap = new Map(answers.map((a) => [a.questionId, a]));

    const questions = data.map((q) => ({
      ...q,
      answer: answerMap.get(q.id) ? {
        id: answerMap.get(q.id)!.id,
        content: answerMap.get(q.id)!.content,
        createdAt: answerMap.get(q.id)!.createdAt,
        user: { id: answerMap.get(q.id)!.user.id, name: answerMap.get(q.id)!.user.name },
      } : null,
    }));

    return { success: true, data: questions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getQuestionsForSeller(userId: string, page: number, limit: number) {
    const [data, total] = await this.questionRepo.findAndCount({
      where: { sellerUserId: userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const questionIds = data.map((q) => q.id);
    const answers = questionIds.length
      ? await this.answerRepo.find({ where: questionIds.map((id) => ({ questionId: id })) })
      : [];
    const answerMap = new Map(answers.map((a) => [a.questionId, a]));

    const questions = data.map((q) => ({
      id: q.id,
      content: q.content,
      listingId: q.listingId,
      listingType: q.listingType,
      listingTitle: q.listingTitle,
      isAnswered: q.isAnswered,
      createdAt: q.createdAt,
      user: { id: q.user.id, name: q.user.name, surname: q.user.surname },
      answer: answerMap.get(q.id) ? { id: answerMap.get(q.id)!.id, content: answerMap.get(q.id)!.content, createdAt: answerMap.get(q.id)!.createdAt } : null,
    }));

    return { success: true, data: questions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getListingQuestions(listingId: string, page: number, limit: number) {
    const [data, total] = await this.questionRepo.findAndCount({
      where: { listingId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const questionIds = data.map((q) => q.id);
    const answers = questionIds.length
      ? await this.answerRepo.find({ where: questionIds.map((id) => ({ questionId: id })), relations: ['user'] })
      : [];
    const answerMap = new Map(answers.map((a) => [a.questionId, a]));

    const questions = data.map((q) => ({
      id: q.id,
      content: q.content,
      isAnswered: q.isAnswered,
      createdAt: q.createdAt,
      user: { id: q.user.id, name: q.user.name },
      answer: answerMap.get(q.id) ? {
        id: answerMap.get(q.id)!.id,
        content: answerMap.get(q.id)!.content,
        createdAt: answerMap.get(q.id)!.createdAt,
        user: { id: answerMap.get(q.id)!.user.id, name: answerMap.get(q.id)!.user.name },
      } : null,
    }));

    return { success: true, data: questions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
