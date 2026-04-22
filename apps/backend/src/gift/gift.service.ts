import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftRecipientEntity } from '../database/entities/gift-recipient.entity';
import { GiftHistoryEntity } from '../database/entities/gift-history.entity';

@Injectable()
export class GiftService {
  constructor(
    @InjectRepository(GiftRecipientEntity)
    private recipientRepo: Repository<GiftRecipientEntity>,
    @InjectRepository(GiftHistoryEntity)
    private historyRepo: Repository<GiftHistoryEntity>,
  ) {}

  /* ─── Recipients ─── */

  async getRecipients(userId: string) {
    return this.recipientRepo.find({
      where: { userId, isActive: true },
      order: { updatedAt: 'DESC' },
      relations: ['giftHistory'],
    });
  }

  async getRecipient(userId: string, recipientId: string) {
    const recipient = await this.recipientRepo.findOne({
      where: { id: recipientId, userId },
      relations: ['giftHistory', 'giftHistory.product'],
    });
    if (!recipient) throw new NotFoundException('Kayıtlı kişi bulunamadı');
    return recipient;
  }

  async createRecipient(userId: string, data: Partial<GiftRecipientEntity>) {
    // Check if same name already exists for this user
    const existing = await this.recipientRepo.findOne({
      where: { userId, name: data.name, isActive: true },
    });
    if (existing) {
      // Update existing
      Object.assign(existing, data);
      return this.recipientRepo.save(existing);
    }
    const recipient = this.recipientRepo.create({ ...data, userId });
    return this.recipientRepo.save(recipient);
  }

  async updateRecipient(userId: string, recipientId: string, data: Partial<GiftRecipientEntity>) {
    const recipient = await this.recipientRepo.findOne({
      where: { id: recipientId, userId },
    });
    if (!recipient) throw new NotFoundException('Kayıtlı kişi bulunamadı');
    Object.assign(recipient, data);
    return this.recipientRepo.save(recipient);
  }

  async deleteRecipient(userId: string, recipientId: string) {
    const recipient = await this.recipientRepo.findOne({
      where: { id: recipientId, userId },
    });
    if (!recipient) throw new NotFoundException('Kayıtlı kişi bulunamadı');
    recipient.isActive = false;
    return this.recipientRepo.save(recipient);
  }

  /* ─── Gift History ─── */

  async getHistory(userId: string, recipientId: string) {
    // Verify ownership
    const recipient = await this.recipientRepo.findOne({
      where: { id: recipientId, userId },
    });
    if (!recipient) throw new NotFoundException('Kayıtlı kişi bulunamadı');

    return this.historyRepo.find({
      where: { recipientId },
      relations: ['product'],
      order: { giftDate: 'DESC' },
    });
  }

  async addGiftToHistory(userId: string, recipientId: string, data: {
    productId?: string;
    productName: string;
    productThumbnail?: string;
    price?: number;
    occasion: string;
    giftDate: string;
    reason?: string;
    notes?: string;
  }) {
    // Verify ownership
    const recipient = await this.recipientRepo.findOne({
      where: { id: recipientId, userId },
    });
    if (!recipient) throw new NotFoundException('Kayıtlı kişi bulunamadı');

    const entry = this.historyRepo.create({
      recipientId,
      ...data,
    });
    return this.historyRepo.save(entry);
  }

  async updateGiftHistory(userId: string, historyId: string, data: {
    rating?: number;
    notes?: string;
  }) {
    const entry = await this.historyRepo.findOne({
      where: { id: historyId },
      relations: ['recipient'],
    });
    if (!entry || entry.recipient?.userId !== userId) {
      throw new NotFoundException('Hediye kaydı bulunamadı');
    }
    if (data.rating !== undefined) entry.rating = data.rating;
    if (data.notes !== undefined) entry.notes = data.notes;
    return this.historyRepo.save(entry);
  }

  async deleteGiftHistory(userId: string, historyId: string) {
    const entry = await this.historyRepo.findOne({
      where: { id: historyId },
      relations: ['recipient'],
    });
    if (!entry || entry.recipient?.userId !== userId) {
      throw new NotFoundException('Hediye kaydı bulunamadı');
    }
    return this.historyRepo.remove(entry);
  }
}
