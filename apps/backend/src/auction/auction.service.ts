import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { AuctionItemEntity, AuctionBidEntity, ProductEntity, UserEntity } from '../database/entities';

@Injectable()
export class AuctionService implements OnModuleInit {
  constructor(
    @InjectRepository(AuctionItemEntity)
    private readonly auctionItemRepo: Repository<AuctionItemEntity>,
    @InjectRepository(AuctionBidEntity)
    private readonly auctionBidRepo: Repository<AuctionBidEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private tablesReady = false;

  async onModuleInit() {
    try {
      await this.dataSource.query('SELECT 1 FROM auction_items LIMIT 0');
      await this.dataSource.query('SELECT 1 FROM auction_bids LIMIT 0');
      this.tablesReady = true;
      console.log('Auction tables ready');
    } catch (e) {
      console.warn('Auction tables not available:', e.message);
    }

    // Tablo hazırsa bugünkü açık artırmayı oluştur
    if (this.tablesReady) {
      try {
        await this.ensureTodayAuctions();
      } catch (e) {
        console.warn('Auction init error:', e.message);
      }
    }
  }

  /** Bugün için 5 farklı kategoriden 10 ürün seç */
  async ensureTodayAuctions(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const existing = await this.auctionItemRepo.count({
      where: { auctionDate: today },
    });
    if (existing >= 10) return;

    // Dünkü açık artırmaları kapat
    await this.auctionItemRepo
      .createQueryBuilder()
      .update()
      .set({ status: 'ended' })
      .where('status = :status AND "auctionDate" < :today', { status: 'active', today })
      .execute();

    // En az 5 farklı kategoriden ürün seç
    const TARGET_CATEGORIES = [
      'Elektronik', 'Ev & Yaşam', 'Spor & Outdoor', 'Kozmetik', 'Ayakkabı & Çanta',
      'Saat & Aksesuar', 'Anne & Çocuk', 'Süpermarket', 'Kadın', 'Erkek',
    ];

    const selectedProducts: ProductEntity[] = [];
    const usedCategories = new Set<string>();

    // Her kategoriden en az 1 ürün al (ilk 5 kategori)
    for (const cat of TARGET_CATEGORIES) {
      if (selectedProducts.length >= 10) break;

      const product = await this.productRepo
        .createQueryBuilder('p')
        .where('p."isActive" = true')
        .andWhere('p.categories::jsonb ? :cat', { cat })
        .andWhere('p."stockQuantity" > 0')
        .andWhere('p.id NOT IN (:...usedIds)', {
          usedIds: selectedProducts.length > 0
            ? selectedProducts.map(p => p.id)
            : ['00000000-0000-0000-0000-000000000000'],
        })
        .orderBy('RANDOM()')
        .limit(1)
        .getOne();

      if (product) {
        selectedProducts.push(product);
        usedCategories.add(cat);
      }

      if (usedCategories.size >= 5 && selectedProducts.length >= 5) break;
    }

    // Kalan slotları rastgele doldur
    if (selectedProducts.length < 10) {
      const remaining = await this.productRepo
        .createQueryBuilder('p')
        .where('p."isActive" = true')
        .andWhere('p."stockQuantity" > 0')
        .andWhere('p.id NOT IN (:...usedIds)', {
          usedIds: selectedProducts.length > 0
            ? selectedProducts.map(p => p.id)
            : ['00000000-0000-0000-0000-000000000000'],
        })
        .orderBy('RANDOM()')
        .limit(10 - selectedProducts.length)
        .getMany();

      selectedProducts.push(...remaining);
    }

    // Açık artırma öğelerini oluştur
    const startsAt = new Date();
    startsAt.setHours(0, 0, 0, 0);
    const endsAt = new Date(startsAt);
    endsAt.setHours(23, 59, 59, 999);

    for (const product of selectedProducts) {
      const item = this.auctionItemRepo.create({
        productId: product.id,
        startingPrice: Math.round(Number(product.salePrice || product.price) * 0.5),
        quantity: Math.min(product.stockQuantity, Math.floor(Math.random() * 5) + 1),
        category: (product.categories as string[])?.[0] || 'Genel',
        auctionDate: today,
        startsAt,
        endsAt,
        status: 'active',
      });
      await this.auctionItemRepo.save(item);
    }

    console.log(`Today's auction created: ${selectedProducts.length} items from ${usedCategories.size} categories`);
  }

  /** Bugünkü açık artırma listesi */
  async getTodayAuctions() {
    if (!this.tablesReady) {
      return { success: true, data: [], auctionDate: null, endsAt: null };
    }
    const today = new Date().toISOString().split('T')[0];

    let items = await this.auctionItemRepo.find({
      where: { auctionDate: today },
      relations: ['product'],
      order: { category: 'ASC' },
    });

    // Bugün yoksa oluştur ve tekrar al
    if (items.length === 0) {
      await this.ensureTodayAuctions();
      items = await this.auctionItemRepo.find({
        where: { auctionDate: today },
        relations: ['product'],
        order: { category: 'ASC' },
      });
    }

    return {
      success: true,
      data: items,
      auctionDate: today,
      endsAt: items[0]?.endsAt || null,
    };
  }

  /** Tek bir açık artırma ürünü detayı + teklifler */
  async getAuctionItem(id: string) {
    if (!this.tablesReady) throw new NotFoundException('Açık artırma sistemi hazır değil');
    const item = await this.auctionItemRepo.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!item) throw new NotFoundException('Açık artırma ürünü bulunamadı');

    const bids = await this.auctionBidRepo.find({
      where: { auctionItemId: id },
      relations: ['user'],
      order: { bidPrice: 'DESC' },
      take: 20,
    });

    // Kullanıcı bilgilerini gizle (sadece isim göster)
    const safeBids = bids.map(b => ({
      id: b.id,
      bidPrice: b.bidPrice,
      bidQuantity: b.bidQuantity,
      status: b.status,
      userName: b.user ? `${(b.user as any).firstName || 'Kullanıcı'} ${((b.user as any).lastName || '').charAt(0)}.` : 'Anonim',
      createdAt: b.createdAt,
    }));

    return { success: true, data: item, bids: safeBids };
  }

  /** Teklif ver */
  async placeBid(userId: string, dto: { auctionItemId: string; bidPrice: number; bidQuantity: number }) {
    if (!this.tablesReady) throw new BadRequestException('Açık artırma sistemi hazır değil');
    const item = await this.auctionItemRepo.findOne({ where: { id: dto.auctionItemId } });
    if (!item) throw new NotFoundException('Açık artırma ürünü bulunamadı');
    if (item.status !== 'active') throw new BadRequestException('Bu açık artırma sona ermiş');
    if (new Date() > new Date(item.endsAt)) throw new BadRequestException('Bu açık artırma süresi dolmuş');

    if (dto.bidPrice <= Number(item.startingPrice) * 0.9) {
      throw new BadRequestException('Teklif başlangıç fiyatının altında olamaz');
    }
    if (dto.bidQuantity > item.quantity) {
      throw new BadRequestException(`Maksimum ${item.quantity} adet teklif edilebilir`);
    }

    // Önceki teklifleri outbid yap
    await this.auctionBidRepo
      .createQueryBuilder()
      .update()
      .set({ status: 'outbid' })
      .where('"auctionItemId" = :itemId AND "userId" = :userId AND status = :status', {
        itemId: dto.auctionItemId,
        userId,
        status: 'active',
      })
      .execute();

    const bid = this.auctionBidRepo.create({
      auctionItemId: dto.auctionItemId,
      userId,
      bidPrice: dto.bidPrice,
      bidQuantity: dto.bidQuantity,
      status: 'active',
    });
    const saved = await this.auctionBidRepo.save(bid);

    // Auction item güncelle
    if (!item.currentHighestBid || dto.bidPrice > Number(item.currentHighestBid)) {
      item.currentHighestBid = dto.bidPrice;
    }
    item.totalBids = (item.totalBids || 0) + 1;
    await this.auctionItemRepo.save(item);

    return { success: true, data: saved, message: 'Teklifiniz başarıyla gönderildi' };
  }

  /** Kullanıcının açık artırma teklifleri */
  async getMyBids(userId: string, page = 1, limit = 20) {
    if (!this.tablesReady) {
      return { success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
    const [bids, total] = await this.auctionBidRepo.findAndCount({
      where: { userId },
      relations: ['auctionItem', 'auctionItem.product'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      data: bids,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Geçmiş açık artırmalar */
  async getPastAuctions(page = 1, limit = 10) {
    if (!this.tablesReady) {
      return { success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    const [items, total] = await this.auctionItemRepo.findAndCount({
      where: { status: 'ended' },
      relations: ['product'],
      order: { auctionDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
