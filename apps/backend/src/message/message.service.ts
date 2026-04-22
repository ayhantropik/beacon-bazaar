import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity, MessageEntity } from '../database/entities';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly convRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly msgRepo: Repository<MessageEntity>,
  ) {}

  async getConversations(userId: string, page: number, limit: number) {
    const [data, total] = await this.convRepo.findAndCount({
      where: [{ buyerUserId: userId }, { sellerUserId: userId }],
      relations: ['buyer', 'seller'],
      order: { lastMessageAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const conversations = data.map((c) => ({
      id: c.id,
      listingId: c.listingId,
      listingType: c.listingType,
      listingTitle: c.listingTitle,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      unreadCount: c.buyerUserId === userId ? c.unreadBuyerCount : c.unreadSellerCount,
      otherUser: c.buyerUserId === userId
        ? { id: c.seller.id, name: c.seller.name, surname: c.seller.surname, avatar: c.seller.avatar }
        : { id: c.buyer.id, name: c.buyer.name, surname: c.buyer.surname, avatar: c.buyer.avatar },
      createdAt: c.createdAt,
    }));

    return { success: true, data: conversations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getMessages(userId: string, conversationId: string, page: number, limit: number) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Konuşma bulunamadı');
    if (conv.buyerUserId !== userId && conv.sellerUserId !== userId) {
      throw new ForbiddenException('Bu konuşmaya erişiminiz yok');
    }

    const [data, total] = await this.msgRepo.findAndCount({
      where: { conversationId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const messages = data.map((m) => ({
      id: m.id,
      content: m.content,
      isRead: m.isRead,
      isMine: m.senderUserId === userId,
      sender: { id: m.sender.id, name: m.sender.name, avatar: m.sender.avatar },
      createdAt: m.createdAt,
    }));

    return { success: true, data: messages, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async startConversation(userId: string, dto: CreateConversationDto) {
    // Aynı listing için mevcut konuşma var mı kontrol et
    if (dto.listingId) {
      const existing = await this.convRepo.findOne({
        where: { buyerUserId: userId, sellerUserId: dto.sellerUserId, listingId: dto.listingId },
      });
      if (existing) {
        // Mevcut konuşmaya mesaj ekle
        return this.sendMessage(userId, existing.id, dto.message);
      }
    }

    const convEntity = this.convRepo.create({
      buyerUserId: userId,
      sellerUserId: dto.sellerUserId,
      listingId: dto.listingId || undefined,
      listingType: dto.listingType || 'product',
      listingTitle: dto.listingTitle || undefined,
      lastMessage: dto.message,
      unreadSellerCount: 1,
    });
    const conv = await this.convRepo.save(convEntity);

    const msgEntity = this.msgRepo.create({
      conversationId: conv.id,
      senderUserId: userId,
      content: dto.message,
    });
    await this.msgRepo.save(msgEntity);

    return { success: true, data: conv, message: 'Konuşma başlatıldı' };
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Konuşma bulunamadı');
    if (conv.buyerUserId !== userId && conv.sellerUserId !== userId) {
      throw new ForbiddenException('Bu konuşmaya erişiminiz yok');
    }

    const msg = await this.msgRepo.save({
      conversationId,
      senderUserId: userId,
      content,
    });

    // Update conversation
    const isBuyer = conv.buyerUserId === userId;
    await this.convRepo.update(conversationId, {
      lastMessage: content,
      lastMessageAt: new Date(),
      ...(isBuyer ? { unreadSellerCount: () => '"unreadSellerCount" + 1' } : { unreadBuyerCount: () => '"unreadBuyerCount" + 1' }),
    } as any);

    return { success: true, data: msg, message: 'Mesaj gönderildi' };
  }

  async markAsRead(userId: string, conversationId: string) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Konuşma bulunamadı');

    const isBuyer = conv.buyerUserId === userId;
    await this.convRepo.update(conversationId, isBuyer ? { unreadBuyerCount: 0 } : { unreadSellerCount: 0 });
    await this.msgRepo
      .createQueryBuilder()
      .update()
      .set({ isRead: true })
      .where('conversationId = :conversationId AND senderUserId != :userId', { conversationId, userId })
      .execute();

    return { success: true, message: 'Okundu olarak işaretlendi' };
  }
}
