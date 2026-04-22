import { Injectable, NotFoundException, BadRequestException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StoreEntity, ProductEntity, StoreFollowEntity, StoreReviewEntity, UserEntity } from '../database/entities';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateStoreDto } from './dto/create-store.dto';

@Injectable()
export class StoreService implements OnModuleInit {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepo: Repository<StoreEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(StoreFollowEntity)
    private readonly followRepo: Repository<StoreFollowEntity>,
    @InjectRepository(StoreReviewEntity)
    private readonly reviewRepo: Repository<StoreReviewEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private tablesReady = false;

  async onModuleInit() {
    let reviewsOk = false;
    let followsOk = false;

    // Try CREATE TABLE first (may fail on Supabase due to DDL permissions)
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS store_reviews (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL,
          "storeId" UUID NOT NULL,
          rating INTEGER NOT NULL DEFAULT 0,
          "descriptionAccuracy" INTEGER NOT NULL DEFAULT 0,
          "returnEase" INTEGER NOT NULL DEFAULT 0,
          "imageMatch" INTEGER NOT NULL DEFAULT 0,
          "deliveryConsistency" INTEGER NOT NULL DEFAULT 0,
          "qaSpeed" INTEGER NOT NULL DEFAULT 0,
          "problemResolution" INTEGER NOT NULL DEFAULT 0,
          comment TEXT,
          "orderId" UUID,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW(),
          UNIQUE("userId", "storeId")
        )
      `);
      reviewsOk = true;
    } catch {
      try { await this.dataSource.query('SELECT 1 FROM store_reviews LIMIT 0'); reviewsOk = true; } catch { /* */ }
    }

    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS store_follows (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL,
          "storeId" UUID NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          UNIQUE("userId", "storeId")
        )
      `);
      followsOk = true;
    } catch {
      try { await this.dataSource.query('SELECT 1 FROM store_follows LIMIT 0'); followsOk = true; } catch { /* */ }
    }

    this.tablesReady = reviewsOk && followsOk;
    if (reviewsOk && !followsOk) {
      // store_follows missing — still allow reviews to work
      this.tablesReady = true;
      console.log('store_reviews ready, store_follows missing (follow features limited)');
    } else if (this.tablesReady) {
      console.log('store_reviews & store_follows tables ready');
    } else {
      console.warn('Store tables unavailable — reviews:', reviewsOk, 'follows:', followsOk);
    }
  }

  async search(params: {
    query?: string;
    categories?: string[];
    sortBy?: string;
    page: number;
    limit: number;
  }) {
    const qb = this.storeRepo.createQueryBuilder('store').where('store.isActive = true');

    if (params.query) {
      qb.andWhere('(store.name ILIKE :q OR store.description ILIKE :q)', {
        q: `%${params.query}%`,
      });
    }

    switch (params.sortBy) {
      case 'rating': qb.orderBy('store.ratingAverage', 'DESC'); break;
      case 'name': qb.orderBy('store.name', 'ASC'); break;
      case 'newest': qb.orderBy('store.createdAt', 'DESC'); break;
      default: qb.orderBy('store.createdAt', 'DESC');
    }

    const total = await qb.getCount();
    const data = await qb.skip((params.page - 1) * params.limit).take(params.limit).getMany();

    return {
      success: true,
      data,
      pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) },
    };
  }

  async getNearby(latitude: number, longitude: number, radiusKm: number, storeIds?: string[]) {
    const qb = this.storeRepo
      .createQueryBuilder('store')
      .where('store.isActive = true');

    if (storeIds?.length) {
      qb.andWhere('store.id IN (:...storeIds)', { storeIds });
    }

    qb.andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(store.latitude)) * cos(radians(store.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(store.latitude)))) <= :radius`,
        { lat: latitude, lng: longitude, radius: radiusKm },
      )
      .orderBy(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(store.latitude)) * cos(radians(store.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(store.latitude))))`,
        'ASC',
      )
      .setParameters({ lat: latitude, lng: longitude })
      .take(50);

    const data = await qb.getMany();
    return { success: true, data };
  }

  async getById(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const where = isUuid ? { id } : { slug: id };
    const store = await this.storeRepo.findOne({ where });
    if (!store) throw new NotFoundException('Mağaza bulunamadı');
    return { success: true, data: store };
  }

  async getProducts(storeId: string, page: number, limit: number) {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .where('product.storeId = :storeId', { storeId })
      .andWhere('product.isActive = true')
      .orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const total = await qb.getCount();
    const data = await qb.getMany();

    return { success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ─── Follow / Unfollow (Toggle) ───────────────────────────────

  async toggleFollow(userId: string, storeId: string) {
    if (!this.tablesReady) return { success: true, followed: true, message: 'Mağaza takip edildi' };
    const existing = await this.followRepo.findOne({ where: { userId, storeId } });

    if (existing) {
      await this.followRepo.remove(existing);
      await this.storeRepo.decrement({ id: storeId }, 'followersCount', 1);
      return { success: true, followed: false, message: 'Takipten çıkıldı' };
    }

    await this.followRepo.save({ userId, storeId });
    await this.storeRepo.increment({ id: storeId }, 'followersCount', 1);
    return { success: true, followed: true, message: 'Mağaza takip edildi' };
  }

  async checkFollow(userId: string, storeId: string) {
    if (!this.tablesReady) return { success: true, followed: false };
    const exists = await this.followRepo.findOne({ where: { userId, storeId } });
    return { success: true, followed: !!exists };
  }

  async getFollowedStores(userId: string, page: number, limit: number) {
    if (!this.tablesReady) return { success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    const [follows, total] = await this.followRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const storeIds = follows.map((f) => f.storeId);
    const stores = storeIds.length
      ? await this.storeRepo.findByIds(storeIds)
      : [];

    return { success: true, data: stores, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ─── Reviews ──────────────────────────────────────────────────

  async getReviews(storeId: string, page: number, limit: number) {
    if (!this.tablesReady) {
      return { success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    try {
      const countRes = await this.dataSource.query(
        `SELECT COUNT(*) as total FROM store_reviews WHERE "storeId" = $1`, [storeId],
      );
      const total = parseInt(countRes[0]?.total || '0');

      const data = await this.dataSource.query(`
        SELECT r.id, r.rating, r."descriptionAccuracy", r."returnEase", r."imageMatch",
               r."deliveryConsistency", r."qaSpeed", r."problemResolution",
               r.comment, r."orderId", r."createdAt",
               json_build_object('id', u.id, 'name', u.name, 'surname', u.surname, 'avatar', u.avatar) as "user"
        FROM store_reviews r
        LEFT JOIN users u ON u.id = r."userId"
        WHERE r."storeId" = $1
        ORDER BY r."createdAt" DESC
        LIMIT $2 OFFSET $3
      `, [storeId, limit, (page - 1) * limit]);

      return { success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    } catch (e) {
      console.warn('getReviews error:', e.message);
      return { success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
  }

  async canReview(userId: string, storeId: string) {
    try {
      // Kullanıcının bu mağazadan teslim edilmiş siparişi var mı?
      const orders = await this.dataSource.query(`
        SELECT id FROM orders
        WHERE "userId" = $1 AND status = 'delivered'
        AND items::text LIKE '%' || $2 || '%'
        LIMIT 1
      `, [userId, storeId]);
      const hasDelivered = orders.length > 0;
      const existing = await this.dataSource.query(
        `SELECT id FROM store_reviews WHERE "userId" = $1 AND "storeId" = $2 LIMIT 1`,
        [userId, storeId],
      );
      return { success: true, data: { canReview: hasDelivered && existing.length === 0, hasDeliveredOrder: hasDelivered, alreadyReviewed: existing.length > 0 } };
    } catch {
      return { success: true, data: { canReview: false, hasDeliveredOrder: false, alreadyReviewed: false } };
    }
  }

  async createReview(userId: string, storeId: string, dto: CreateReviewDto) {
    if (!this.tablesReady) return { success: true, data: null, message: 'Değerlendirme sistemi henüz hazır değil' };

    // Teslim edilmiş sipariş kontrolü
    try {
      const orders = await this.dataSource.query(`
        SELECT id FROM orders
        WHERE "userId" = $1 AND status = 'delivered'
        AND items::text LIKE '%' || $2 || '%'
        LIMIT 1
      `, [userId, storeId]);
      if (orders.length === 0) {
        throw new BadRequestException('Değerlendirme yapabilmek için bu mağazadan teslim edilmiş bir siparişiniz olmalıdır');
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      // orders tablosu yoksa devam et
    }

    const existing = await this.dataSource.query(
      `SELECT id FROM store_reviews WHERE "userId" = $1 AND "storeId" = $2 LIMIT 1`,
      [userId, storeId],
    );
    if (existing.length > 0) throw new BadRequestException('Bu mağazaya zaten değerlendirme yaptınız');

    const avgRating = Math.round(
      (dto.descriptionAccuracy + dto.returnEase + dto.imageMatch +
       dto.deliveryConsistency + dto.qaSpeed + dto.problemResolution) / 6,
    );

    try {
      await this.dataSource.query(`
        INSERT INTO store_reviews (
          "userId", "storeId", rating,
          "descriptionAccuracy", "returnEase", "imageMatch",
          "deliveryConsistency", "qaSpeed", "problemResolution",
          comment, "orderId"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        userId, storeId, avgRating,
        dto.descriptionAccuracy, dto.returnEase, dto.imageMatch,
        dto.deliveryConsistency, dto.qaSpeed, dto.problemResolution,
        dto.comment || null, dto.orderId || null,
      ]);
    } catch (e) {
      if (e.code === '23505') throw new BadRequestException('Bu mağazaya zaten değerlendirme yaptınız');
      throw e;
    }

    await this.recalculateRating(storeId);
    return { success: true, message: 'Değerlendirme eklendi' };
  }

  async deleteReview(userId: string, storeId: string, reviewId: string) {
    if (!this.tablesReady) return { success: true, message: 'Değerlendirme silindi' };

    const reviews = await this.dataSource.query(
      `SELECT id, "userId" FROM store_reviews WHERE id = $1 AND "storeId" = $2 LIMIT 1`,
      [reviewId, storeId],
    );
    if (reviews.length === 0) throw new NotFoundException('Değerlendirme bulunamadı');
    if (reviews[0].userId !== userId) throw new BadRequestException('Bu değerlendirmeyi silemezsiniz');

    await this.dataSource.query(`DELETE FROM store_reviews WHERE id = $1`, [reviewId]);
    await this.recalculateRating(storeId);

    return { success: true, message: 'Değerlendirme silindi' };
  }

  private async recalculateRating(storeId: string) {
    if (!this.tablesReady) return;
    try {
      const result = await this.dataSource.query(`
        SELECT AVG(rating) as avg, COUNT(id) as count
        FROM store_reviews WHERE "storeId" = $1
      `, [storeId]);

      await this.storeRepo.update(storeId, {
        ratingAverage: parseFloat(result[0]?.avg) || 0,
        ratingCount: parseInt(result[0]?.count, 10) || 0,
      });
    } catch (e) {
      console.warn('recalculateRating error:', e.message);
    }
  }

  // ─── Store Owner Operations ───────────────────────────────────

  async createStore(ownerId: string, dto: CreateStoreDto) {
    const user = await this.userRepo.findOne({ where: { id: ownerId } });
    if (!user || user.role !== 'store_owner') {
      throw new ForbiddenException('Mağaza oluşturmak için kurumsal hesap gereklidir');
    }

    const existing = await this.storeRepo.findOne({ where: { ownerId } });
    if (existing) throw new BadRequestException('Zaten bir mağazanız var');

    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöç\s-]/g, '')
      .replace(/[ğ]/g, 'g').replace(/[ü]/g, 'u').replace(/[ş]/g, 's')
      .replace(/[ı]/g, 'i').replace(/[ö]/g, 'o').replace(/[ç]/g, 'c')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50)
      + '-' + Date.now().toString(36);

    const store = this.storeRepo.create({
      ownerId,
      name: dto.name,
      slug,
      description: dto.description,
      storeType: dto.storeType || 'shopping',
      logo: dto.logo,
      coverImage: dto.coverImage,
      categories: dto.categories || [],
      latitude: dto.latitude,
      longitude: dto.longitude,
      address: dto.address || {},
      contactInfo: dto.contactInfo || {},
      openingHours: dto.openingHours || [],
      isActive: true,
    });

    const saved = await this.storeRepo.save(store);

    // Otomatik abonelik kaydı oluştur
    try {
      let defaultFee = 0;
      try {
        const feeRes = await this.dataSource.query(
          `SELECT value FROM platform_settings WHERE key = 'subscriptionPlans'`,
        );
        if (feeRes.length > 0) defaultFee = feeRes[0].value?.basic?.monthlyFee || 0;
      } catch { /* ignore */ }

      await this.dataSource.query(`
        INSERT INTO store_subscriptions ("storeId", "planType", "monthlyFee", "status", "paidUntil")
        VALUES ($1, 'basic', $2, 'active', CURRENT_DATE + INTERVAL '30 days')
        ON CONFLICT ("storeId") DO NOTHING
      `, [saved.id, defaultFee]);
    } catch (e) {
      console.warn('Auto subscription creation failed:', e.message);
    }

    return { success: true, data: saved, message: 'Mağaza oluşturuldu' };
  }

  async getMyStore(ownerId: string) {
    const store = await this.storeRepo.findOne({ where: { ownerId } });
    if (!store) return { success: true, data: null };
    return { success: true, data: store };
  }

  async updateMyStore(ownerId: string, dto: Partial<CreateStoreDto>) {
    const store = await this.storeRepo.findOne({ where: { ownerId } });
    if (!store) throw new NotFoundException('Mağazanız bulunamadı');

    Object.assign(store, dto);
    const saved = await this.storeRepo.save(store);
    return { success: true, data: saved, message: 'Mağaza güncellendi' };
  }

  async getMyProducts(ownerId: string, page: number, limit: number) {
    const store = await this.storeRepo.findOne({ where: { ownerId } });
    if (!store) throw new NotFoundException('Mağazanız bulunamadı');

    const [data, total] = await this.productRepo.findAndCount({
      where: { storeId: store.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getDashboardStats(ownerId: string) {
    const store = await this.storeRepo.findOne({ where: { ownerId } });
    if (!store) return { success: true, data: null };

    const productsCount = await this.productRepo.count({ where: { storeId: store.id } });
    const followersCount = store.followersCount;
    const reviewsCount = store.ratingCount;
    const ratingAverage = store.ratingAverage;

    return {
      success: true,
      data: {
        store,
        stats: { productsCount, followersCount, reviewsCount, ratingAverage },
      },
    };
  }
}
