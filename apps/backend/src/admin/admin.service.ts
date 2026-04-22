import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { EmailService } from '../common/email.service';
import {
  UserEntity,
  StoreEntity,
  ProductEntity,
  OrderEntity,
  StoreReviewEntity,
  NotificationEntity,
  QuestionEntity,
  AnswerEntity,
  AuctionItemEntity,
  AuctionBidEntity,
} from '../database/entities';

const DEFAULT_CATEGORIES = [
  'Elektronik', 'Kozmetik', 'Moda & Giyim', 'Ayakkabı & Çanta',
  'Ev & Yaşam', 'Spor & Outdoor', 'Kitap & Kırtasiye', 'Oyuncak & Hobi',
  'Anne & Çocuk', 'Süpermarket', 'Saat & Aksesuar', 'Hediyelik',
  'Kadın', 'Erkek',
];

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(StoreEntity) private readonly storeRepo: Repository<StoreEntity>,
    @InjectRepository(ProductEntity) private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(StoreReviewEntity) private readonly reviewRepo: Repository<StoreReviewEntity>,
    @InjectRepository(NotificationEntity) private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(QuestionEntity) private readonly questionRepo: Repository<QuestionEntity>,
    @InjectRepository(AnswerEntity) private readonly answerRepo: Repository<AnswerEntity>,
    @InjectRepository(AuctionItemEntity) private readonly auctionItemRepo: Repository<AuctionItemEntity>,
    @InjectRepository(AuctionBidEntity) private readonly auctionBidRepo: Repository<AuctionBidEntity>,
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS platform_settings (
          key VARCHAR(100) PRIMARY KEY,
          value JSONB NOT NULL,
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `);
      await this.dataSource.query(`
        INSERT INTO platform_settings (key, value)
        VALUES ('categories', $1::jsonb)
        ON CONFLICT (key) DO NOTHING
      `, [JSON.stringify(DEFAULT_CATEGORIES)]);
      console.log('platform_settings table ready');
    } catch (e) {
      console.warn('platform_settings table init skipped:', e.message);
    }

    // Store subscriptions table
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS store_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "storeId" UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          "planType" VARCHAR(30) NOT NULL DEFAULT 'basic',
          "monthlyFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
          "status" VARCHAR(20) NOT NULL DEFAULT 'active',
          "paidUntil" DATE,
          "lastPaymentDate" DATE,
          "lastReminderDate" DATE,
          "suspendedAt" TIMESTAMP,
          "notes" TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW(),
          UNIQUE("storeId")
        )
      `);
      console.log('store_subscriptions table ready');
    } catch (e) {
      console.warn('store_subscriptions table init skipped:', e.message);
    }
  }

  // ─── Dashboard ────────────────────────────────────────────────

  async getDashboardStats() {
    const [usersCount, storesCount, productsCount, ordersCount] = await Promise.all([
      this.userRepo.count(),
      this.storeRepo.count(),
      this.productRepo.count(),
      this.orderRepo.count(),
    ]);

    // Gelir ve detaylı sipariş metrikleri
    const revenueResult = await this.dataSource.query(`
      SELECT
        COALESCE(SUM(total), 0) as "totalRevenue",
        COALESCE(SUM(subtotal), 0) as "totalSubtotal",
        COALESCE(SUM("deliveryFee"), 0) as "totalDeliveryFee",
        COALESCE(SUM(discount), 0) as "totalDiscount",
        COUNT(*) as "paidOrdersCount",
        COALESCE(AVG(total), 0) as "avgOrderValue"
      FROM orders WHERE "paymentStatus" = 'paid'
    `);
    const rev = revenueResult[0] || {};

    // Komisyon hesaplama (%8 platform komisyonu)
    const commissionRate = 0.08;
    const totalCommission = Number(rev.totalSubtotal || 0) * commissionRate;

    // Sipariş durumu dağılımı
    const statusDistribution = await this.dataSource.query(`
      SELECT status, COUNT(*) as count FROM orders GROUP BY status ORDER BY count DESC
    `);

    // Bugünkü siparişler
    const todayStats = await this.dataSource.query(`
      SELECT
        COUNT(*) as "todayOrders",
        COALESCE(SUM(total), 0) as "todayRevenue"
      FROM orders WHERE DATE("createdAt") = CURRENT_DATE
    `);
    const today = todayStats[0] || {};

    // Bu ayki siparişler
    const monthStats = await this.dataSource.query(`
      SELECT
        COUNT(*) as "monthOrders",
        COALESCE(SUM(total), 0) as "monthRevenue"
      FROM orders
      WHERE DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', CURRENT_DATE)
    `);
    const month = monthStats[0] || {};

    // Son 7 gün sipariş trendi
    const orderTrend = await this.orderRepo
      .createQueryBuilder('o')
      .select("DATE(o.\"createdAt\")", 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(o.total), 0)', 'revenue')
      .where('o."createdAt" >= NOW() - INTERVAL \'7 days\'')
      .groupBy("DATE(o.\"createdAt\")")
      .orderBy('date', 'ASC')
      .getRawMany();

    // Son aktiviteler
    const recentOrders = await this.orderRepo.find({
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['user'],
    });

    const recentUsers = await this.userRepo.find({
      order: { createdAt: 'DESC' },
      take: 5,
      select: ['id', 'name', 'surname', 'email', 'role', 'createdAt'],
    });

    const recentStores = await this.storeRepo.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      success: true,
      data: {
        counts: { users: usersCount, stores: storesCount, products: productsCount, orders: ordersCount },
        totalRevenue: Number(rev.totalRevenue || 0),
        totalSubtotal: Number(rev.totalSubtotal || 0),
        totalDeliveryFee: Number(rev.totalDeliveryFee || 0),
        totalDiscount: Number(rev.totalDiscount || 0),
        totalCommission,
        commissionRate,
        paidOrdersCount: Number(rev.paidOrdersCount || 0),
        avgOrderValue: Number(rev.avgOrderValue || 0),
        statusDistribution,
        todayOrders: Number(today.todayOrders || 0),
        todayRevenue: Number(today.todayRevenue || 0),
        monthOrders: Number(month.monthOrders || 0),
        monthRevenue: Number(month.monthRevenue || 0),
        orderTrend,
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          total: o.total,
          status: o.status,
          userName: o.user ? `${(o.user as any).name || ''} ${(o.user as any).surname || ''}`.trim() : 'Bilinmiyor',
          createdAt: o.createdAt,
        })),
        recentUsers,
        recentStores: recentStores.map((s) => ({
          id: s.id,
          name: s.name,
          isVerified: s.isVerified,
          createdAt: s.createdAt,
        })),
      },
    };
  }

  // ─── Users ────────────────────────────────────────────────────

  async getUsers(query: { page?: number; limit?: number; search?: string; role?: string; status?: string }) {
    const { page = 1, limit = 20, search, role, status } = query;
    const qb = this.userRepo.createQueryBuilder('u')
      .select(['u.id', 'u.name', 'u.surname', 'u.email', 'u.phone', 'u.avatar', 'u.role', 'u.isActive', 'u.createdAt']);

    if (search) {
      qb.andWhere('(u.name ILIKE :s OR u.surname ILIKE :s OR u.email ILIKE :s)', { s: `%${search}%` });
    }
    if (role) {
      qb.andWhere('u.role = :role', { role });
    }
    if (status === 'active') qb.andWhere('u."isActive" = true');
    if (status === 'inactive') qb.andWhere('u."isActive" = false');

    qb.orderBy('u."createdAt"', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    // Attach order stats for each user
    let enrichedData = data as any[];
    try {
      if (data.length > 0) {
        const userIds = data.map((u) => u.id);
        const orderStats = await this.dataSource.query(`
          SELECT
            o."userId",
            COUNT(*) as "ordersCount",
            COALESCE(SUM(o.total), 0) as "totalSpent"
          FROM orders o
          WHERE o."userId" = ANY($1)
          GROUP BY o."userId"
        `, [userIds]);

        const statsMap = new Map<string, any>(orderStats.map((s: any) => [s.userId, s]));
        enrichedData = data.map((u: any) => {
          const st = statsMap.get(u.id);
          return {
            ...u,
            ordersCount: st ? parseInt(st.ordersCount) : 0,
            totalSpent: st ? parseFloat(st.totalSpent) : 0,
          };
        });
      }
    } catch (e) {
      console.warn('getUsers order stats error:', e.message);
    }

    return {
      success: true,
      data: enrichedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserDetail(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'name', 'surname', 'email', 'phone', 'avatar', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });
    if (!user) return { success: false, message: 'Kullanıcı bulunamadı' };

    const ordersCount = await this.orderRepo.count({ where: { userId: id } });

    return { success: true, data: { ...user, ordersCount } };
  }

  async updateUserRole(id: string, role: string) {
    await this.userRepo.update(id, { role: role as any });
    return { success: true, message: 'Kullanıcı rolü güncellendi' };
  }

  async updateUserStatus(id: string, isActive: boolean) {
    await this.userRepo.update(id, { isActive });
    return { success: true, message: isActive ? 'Kullanıcı aktifleştirildi' : 'Kullanıcı deaktif edildi' };
  }

  async deleteUser(id: string) {
    await this.userRepo.update(id, { isActive: false });
    return { success: true, message: 'Kullanıcı deaktif edildi' };
  }

  async verifyStoreOwner(token: string) {
    const users = await this.userRepo.find();
    const user = users.find((u: any) => u.preferences?.verificationToken === token);
    if (!user) return { success: false, message: 'Geçersiz veya süresi dolmuş onay bağlantısı' };

    await this.userRepo.update(user.id, {
      isActive: true,
      preferences: { ...(user as any).preferences, verified: true, verificationToken: null } as any,
    });
    return { success: true, message: 'Üyeliğiniz onaylandı! Artık giriş yapabilirsiniz.' };
  }

  async resetUserPassword(id: string, newPassword: string) {
    const bcrypt = await import('bcryptjs');
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(id, { password: hashed });
    return { success: true, message: 'Şifre sıfırlandı' };
  }

  // ─── Stores ───────────────────────────────────────────────────

  async getStores(query: { page?: number; limit?: number; search?: string; isVerified?: string; isActive?: string; subscriptionStatus?: string }) {
    const { page = 1, limit = 20, search, isVerified, isActive, subscriptionStatus } = query;

    // Use raw query to get stores — storeType has select:false in entity
    const params: any[] = [];
    let where = `WHERE (s."storeType" IS NULL OR s."storeType" != 'service')`;
    let paramIdx = 1;

    if (search) {
      where += ` AND (s.name ILIKE $${paramIdx} OR s.description ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (isVerified === 'true') where += ` AND s."isVerified" = true`;
    if (isVerified === 'false') where += ` AND s."isVerified" = false`;
    if (isActive === 'true') where += ` AND s."isActive" = true`;
    if (isActive === 'false') where += ` AND s."isActive" = false`;

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) as total FROM stores s ${where}`, params,
    );
    const total = parseInt(countResult[0]?.total || '0');

    const stores = await this.dataSource.query(`
      SELECT
        s.id, s.name, s.slug, s.description, s.logo, s."storeType",
        s.categories, s.tags, s."ratingAverage", s."ratingCount",
        s."isVerified", s."isActive", s."followersCount", s."productsCount",
        s."createdAt",
        u.id as "ownerId", u.name as "ownerName", u.surname as "ownerSurname", u.email as "ownerEmail"
      FROM stores s
      LEFT JOIN users u ON u.id = s."ownerId"
      ${where}
      ORDER BY s."createdAt" DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `, [...params, limit, (page - 1) * limit]);

    // Reshape to match expected format
    const storeList = stores.map((r: any) => ({
      id: r.id, name: r.name, slug: r.slug, description: r.description,
      logo: r.logo, storeType: r.storeType, categories: r.categories,
      tags: r.tags, ratingAverage: r.ratingAverage, ratingCount: r.ratingCount,
      isVerified: r.isVerified, isActive: r.isActive,
      followersCount: r.followersCount, productsCount: r.productsCount,
      createdAt: r.createdAt,
      owner: r.ownerId ? { id: r.ownerId, name: r.ownerName, surname: r.ownerSurname, email: r.ownerEmail } : null,
    }));

    // Attach subscription info for each store
    let data = storeList as any[];
    try {
      if (storeList.length > 0) {
        const storeIds = storeList.map((s: any) => s.id);
        const subs = await this.dataSource.query(`
          SELECT
            ss."storeId", ss."planType", ss."monthlyFee", ss."status" as "subscriptionStatus",
            ss."paidUntil", ss."lastPaymentDate",
            CASE WHEN ss."paidUntil" < CURRENT_DATE AND ss.status = 'active' THEN true ELSE false END as "isOverdue",
            CASE WHEN ss."paidUntil" IS NOT NULL THEN (ss."paidUntil" - CURRENT_DATE) ELSE null END as "daysRemaining"
          FROM store_subscriptions ss
          WHERE ss."storeId" = ANY($1)
        `, [storeIds]);

        const subMap = new Map(subs.map((s: any) => [s.storeId, s]));
        data = storeList.map((s: any) => ({
          ...s,
          subscription: subMap.get(s.id) || null,
        }));

        // Filter by subscription status if requested
        if (subscriptionStatus === 'active') {
          data = data.filter((s: any) => s.subscription?.subscriptionStatus === 'active' && !s.subscription?.isOverdue);
        } else if (subscriptionStatus === 'overdue') {
          data = data.filter((s: any) => s.subscription?.isOverdue);
        } else if (subscriptionStatus === 'suspended') {
          data = data.filter((s: any) => s.subscription?.subscriptionStatus === 'suspended');
        } else if (subscriptionStatus === 'none') {
          data = data.filter((s: any) => !s.subscription);
        }
      }
    } catch (e) {
      console.warn('getStores subscription join error:', e.message);
    }

    // Attach sales stats (monthly/yearly) for each store
    try {
      if (data.length > 0) {
        const storeIds = data.map((s: any) => s.id);
        // Orders may reference store via items JSONB (items[].storeId) or via a storeId column
        // Try storeId column first, fallback to empty
        let salesStats: any[] = [];
        try {
          // Check if storeId column exists
          const colCheck = await this.dataSource.query(
            `SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'storeId' LIMIT 1`,
          );
          if (colCheck.length > 0) {
            salesStats = await this.dataSource.query(`
              SELECT
                o."storeId",
                COUNT(*) as "totalOrders",
                COALESCE(SUM(o.total), 0) as "totalSales",
                COUNT(*) FILTER (WHERE o."createdAt" >= date_trunc('month', CURRENT_DATE)) as "monthlyOrders",
                COALESCE(SUM(o.total) FILTER (WHERE o."createdAt" >= date_trunc('month', CURRENT_DATE)), 0) as "monthlySales",
                COUNT(*) FILTER (WHERE o."createdAt" >= date_trunc('year', CURRENT_DATE)) as "yearlyOrders",
                COALESCE(SUM(o.total) FILTER (WHERE o."createdAt" >= date_trunc('year', CURRENT_DATE)), 0) as "yearlySales"
              FROM orders o
              WHERE o."storeId" = ANY($1)
              GROUP BY o."storeId"
            `, [storeIds]);
          }
        } catch { /* storeId column doesn't exist yet */ }

        const salesMap = new Map(salesStats.map((s: any) => [s.storeId, s]));
        data = data.map((s: any) => {
          const st = salesMap.get(s.id);
          return {
            ...s,
            sales: st ? {
              totalOrders: parseInt(st.totalOrders),
              totalSales: parseFloat(st.totalSales),
              monthlyOrders: parseInt(st.monthlyOrders),
              monthlySales: parseFloat(st.monthlySales),
              yearlyOrders: parseInt(st.yearlyOrders),
              yearlySales: parseFloat(st.yearlySales),
            } : null,
          };
        });
      }
    } catch (e) {
      console.warn('getStores sales stats error:', e.message);
    }

    return {
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStoreDetail(id: string) {
    const store = await this.storeRepo.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!store) return { success: false, message: 'Mağaza bulunamadı' };

    const productsCount = await this.productRepo.count({ where: { storeId: id } });
    const reviewsCount = await this.reviewRepo.count({ where: { storeId: id } });

    return {
      success: true,
      data: {
        ...store,
        owner: store.owner ? { id: (store.owner as any).id, name: (store.owner as any).name, email: (store.owner as any).email } : null,
        productsCount,
        reviewsCount,
      },
    };
  }

  async updateStoreVerification(id: string, isVerified: boolean) {
    await this.storeRepo.update(id, { isVerified });
    return { success: true, message: isVerified ? 'Mağaza onaylandı' : 'Mağaza onayı kaldırıldı' };
  }

  async updateStoreStatus(id: string, isActive: boolean) {
    await this.storeRepo.update(id, { isActive });
    return { success: true, message: isActive ? 'Mağaza aktifleştirildi' : 'Mağaza deaktif edildi' };
  }

  async createStore(dto: {
    name: string;
    description?: string;
    storeType?: 'shopping' | 'automotive' | 'realestate' | 'food' | 'producer';
    logo?: string;
    coverImage?: string;
    categories?: string[];
    latitude?: number;
    longitude?: number;
    address?: Record<string, unknown>;
    contactInfo?: Record<string, unknown>;
    ownerId?: string;
    ownerEmail?: string;
    ownerPassword?: string;
    isVerified?: boolean;
    isActive?: boolean;
  }) {
    // Slug oluştur
    const slug = dto.name
      .toLowerCase()
      .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ü/g, 'u')
      .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    // Sahip kontrolü — mevcut kullanıcı ara veya yeni oluştur
    let ownerId = dto.ownerId;
    if (!ownerId && dto.ownerEmail) {
      let owner = await this.userRepo.findOne({ where: { email: dto.ownerEmail } });
      if (owner) {
        ownerId = owner.id;
        if (owner.role !== 'store_owner' && owner.role !== 'admin') {
          await this.userRepo.update(owner.id, { role: 'store_owner' });
        }
        // Şifre güncelle
        if (dto.ownerPassword) {
          const bcrypt = await import('bcryptjs');
          const hashed = await bcrypt.hash(dto.ownerPassword, 10);
          await this.userRepo.update(owner.id, { password: hashed });
        }
      } else {
        // Yeni kullanıcı oluştur — onay bekleyecek
        const bcrypt = await import('bcryptjs');
        const password = dto.ownerPassword || 'Beacon' + Math.random().toString(36).slice(2, 8);
        const hashed = await bcrypt.hash(password, 10);
        const verificationToken = randomBytes(32).toString('hex');
        const newUser = this.userRepo.create({
          email: dto.ownerEmail,
          name: dto.name,
          surname: '',
          phone: '',
          password: hashed,
          role: 'store_owner',
          isActive: false, // Onay gelene kadar deaktif
          preferences: { verificationToken, verified: false } as any,
        });
        const saved = await this.userRepo.save(newUser);
        ownerId = saved.id;

        // Onay e-postası gönder
        this.emailService.sendVerificationEmail(dto.ownerEmail, dto.name, verificationToken, 'store');
      }
    }

    // Duplicate slug kontrolü
    let finalSlug = slug;
    let counter = 1;
    while (await this.storeRepo.findOne({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter++}`;
    }

    const store = this.storeRepo.create({
      name: dto.name,
      slug: finalSlug,
      description: dto.description || '',
      storeType: dto.storeType || 'shopping',
      logo: dto.logo,
      coverImage: dto.coverImage,
      categories: dto.categories || [],
      latitude: dto.latitude,
      longitude: dto.longitude,
      address: dto.address as any,
      contactInfo: dto.contactInfo as any,
      ownerId,
      isVerified: dto.isVerified ?? true,
      isActive: dto.isActive ?? true,
      ratingAverage: 0,
      ratingCount: 0,
      followersCount: 0,
      productsCount: 0,
    });

    const saved = await this.storeRepo.save(store);

    // Onay token'ını response'a ekle (admin panelde göstermek için)
    const ownerUser = ownerId ? await this.userRepo.findOne({ where: { id: ownerId } }) : null;
    const verifyToken = (ownerUser as any)?.preferences?.verificationToken || null;
    const verifyUrl = verifyToken ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-store?token=${verifyToken}` : null;

    return { success: true, message: 'Mağaza oluşturuldu', data: saved, verifyUrl };
  }

  // ─── Products ─────────────────────────────────────────────────

  async getProducts(query: { page?: number; limit?: number; search?: string; category?: string; isActive?: string; isFeatured?: string }) {
    const { page = 1, limit = 20, search, category, isActive, isFeatured } = query;

    let where = 'WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (search) {
      where += ` AND (p.name ILIKE $${idx} OR p.description ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (category) {
      where += ` AND p.categories::jsonb @> $${idx}::jsonb`;
      params.push(JSON.stringify([category]));
      idx++;
    }
    if (isActive === 'true') where += ' AND p."isActive" = true';
    if (isActive === 'false') where += ' AND p."isActive" = false';
    if (isFeatured === 'true') where += ' AND p."isFeatured" = true';
    if (isFeatured === 'false') where += ' AND p."isFeatured" = false';

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) as total FROM products p ${where}`, params,
    );
    const total = parseInt(countResult[0]?.total || '0', 10);

    const offset = (page - 1) * limit;
    const data = await this.dataSource.query(`
      SELECT p.id, p.name, p.slug, p.description, p.price, p."salePrice",
             p.thumbnail, p.categories, p.tags, p."stockQuantity",
             p."isActive", p."isFeatured", p."createdAt",
             p."storeId",
             json_build_object('id', s.id, 'name', s.name, 'slug', s.slug) as store
      FROM products p
      LEFT JOIN stores s ON s.id = p."storeId"
      ${where}
      ORDER BY p."createdAt" DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, limit, offset]);

    return {
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getProductDetail(id: string) {
    const product = await this.productRepo.findOne({ where: { id }, relations: ['store'] });
    if (!product) return { success: false, message: 'Ürün bulunamadı' };
    return { success: true, data: product };
  }

  async updateProductStatus(id: string, isActive: boolean) {
    await this.productRepo.update(id, { isActive });
    return { success: true, message: isActive ? 'Ürün aktifleştirildi' : 'Ürün deaktif edildi' };
  }

  async updateProductFeatured(id: string, isFeatured: boolean) {
    await this.productRepo.update(id, { isFeatured });
    return { success: true, message: isFeatured ? 'Ürün öne çıkarıldı' : 'Ürün öne çıkarmadan kaldırıldı' };
  }

  // ─── Orders ───────────────────────────────────────────────────

  async getOrders(query: { page?: number; limit?: number; status?: string; userId?: string; dateFrom?: string; dateTo?: string }) {
    const { page = 1, limit = 20, status, userId, dateFrom, dateTo } = query;

    let where = 'WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (status) { where += ` AND o.status = $${idx++}`; params.push(status); }
    if (userId) { where += ` AND o."userId" = $${idx++}`; params.push(userId); }
    if (dateFrom) { where += ` AND o."createdAt" >= $${idx++}`; params.push(dateFrom); }
    if (dateTo) { where += ` AND o."createdAt" <= $${idx++}`; params.push(dateTo); }

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) as total FROM orders o ${where}`, params,
    );
    const total = parseInt(countResult[0]?.total || '0', 10);

    const offset = (page - 1) * limit;
    const data = await this.dataSource.query(`
      SELECT o.id, o.items, o.status, o."paymentStatus", o."paymentMethod",
             o.subtotal, o.discount, o."deliveryFee", o.total,
             o."couponCode", o.notes, o."trackingNumber",
             o."createdAt", o."updatedAt", o."userId",
             json_build_object('id', u.id, 'name', u.name, 'surname', u.surname, 'email', u.email) as user
      FROM orders o
      LEFT JOIN users u ON u.id = o."userId"
      ${where}
      ORDER BY o."createdAt" DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, limit, offset]);

    return {
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getOrderDetail(id: string) {
    const order = await this.orderRepo.findOne({ where: { id }, relations: ['user'] });
    if (!order) return { success: false, message: 'Sipariş bulunamadı' };
    return { success: true, data: order };
  }

  async updateOrderStatus(id: string, status: string) {
    await this.orderRepo.update(id, { status: status as any });
    return { success: true, message: `Sipariş durumu "${status}" olarak güncellendi` };
  }

  // ─── Auctions ─────────────────────────────────────────────────

  async getAuctions(query: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = query;

    let where = '';
    const params: any[] = [];
    let paramIdx = 1;

    if (status) {
      where += ` AND a.status = $${paramIdx++}`;
      params.push(status);
    }

    const countResult = await this.dataSource.query(`
      SELECT COUNT(*) as total FROM auction_items a WHERE 1=1 ${where}
    `, params);
    const total = parseInt(countResult[0]?.total || '0');

    const data = await this.dataSource.query(`
      SELECT
        a.id, a."productId", a."startingPrice", a."currentHighestBid",
        a."totalBids", a.quantity, a.category, a."auctionDate",
        a."startsAt", a."endsAt", a.status, a."winnerId", a."createdAt",
        json_build_object(
          'id', p.id, 'name', p.name, 'thumbnail', p.thumbnail,
          'price', p.price, 'salePrice', p."salePrice",
          'categories', p.categories
        ) as product
      FROM auction_items a
      LEFT JOIN products p ON p.id = a."productId"
      WHERE 1=1 ${where}
      ORDER BY a."createdAt" DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `, [...params, limit, (page - 1) * limit]);

    return {
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAuctionDetail(id: string) {
    const items = await this.dataSource.query(`
      SELECT
        a.id, a."productId", a."startingPrice", a."currentHighestBid",
        a."totalBids", a.quantity, a.category, a."auctionDate",
        a."startsAt", a."endsAt", a.status, a."winnerId", a."createdAt",
        json_build_object(
          'id', p.id, 'name', p.name, 'thumbnail', p.thumbnail,
          'price', p.price, 'salePrice', p."salePrice"
        ) as product
      FROM auction_items a
      LEFT JOIN products p ON p.id = a."productId"
      WHERE a.id = $1
    `, [id]);

    if (items.length === 0) return { success: false, message: 'Açık artırma bulunamadı' };

    const bids = await this.dataSource.query(`
      SELECT
        b.id, b."bidPrice", b."bidQuantity", b.status, b."createdAt",
        b."userId",
        COALESCE(TRIM(u.name || ' ' || u.surname), 'Anonim') as "userName"
      FROM auction_bids b
      LEFT JOIN users u ON u.id = b."userId"
      WHERE b."auctionItemId" = $1
      ORDER BY b."bidPrice" DESC
      LIMIT 50
    `, [id]);

    return { success: true, data: items[0], bids };
  }

  async updateAuctionStatus(id: string, status: string) {
    await this.auctionItemRepo.update(id, { status: status as 'active' | 'ended' | 'cancelled' });
    return { success: true, message: `Açık artırma durumu "${status}" olarak güncellendi` };
  }

  // ─── Moderation ───────────────────────────────────────────────

  async getReviews(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    try {
      const [data, total] = await this.reviewRepo.findAndCount({
        relations: ['user', 'store'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        success: true,
        data: data.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          userName: r.user ? `${(r.user as any).name || ''} ${(r.user as any).surname || ''}`.trim() : 'Anonim',
          storeName: r.store ? (r.store as any).name : '-',
          createdAt: r.createdAt,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch {
      return { success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
  }

  async deleteReview(id: string) {
    await this.reviewRepo.delete(id);
    return { success: true, message: 'Değerlendirme silindi' };
  }

  async getQuestions(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    try {
      const [data, total] = await this.questionRepo.findAndCount({
        relations: ['user'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        success: true,
        data: data.map((q) => ({
          id: q.id,
          content: q.content,
          listingId: q.listingId,
          listingType: q.listingType,
          isAnswered: q.isAnswered,
          userName: q.user ? `${(q.user as any).name || ''} ${(q.user as any).surname || ''}`.trim() : 'Anonim',
          createdAt: q.createdAt,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch {
      return { success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
  }

  async deleteQuestion(id: string) {
    await this.answerRepo.delete({ questionId: id });
    await this.questionRepo.delete(id);
    return { success: true, message: 'Soru ve cevapları silindi' };
  }

  // ─── Notifications ────────────────────────────────────────────

  async broadcastNotification(dto: { title: string; body: string; type: string }) {
    try {
      const activeUsers = await this.userRepo.find({
        where: { isActive: true },
        select: ['id'],
      });

      const notifications = activeUsers.map((u) =>
        this.notificationRepo.create({
          userId: u.id,
          title: dto.title,
          body: dto.body,
          type: dto.type as any,
        }),
      );

      // Batch insert
      const batchSize = 100;
      for (let i = 0; i < notifications.length; i += batchSize) {
        await this.notificationRepo.save(notifications.slice(i, i + batchSize));
      }

      return { success: true, message: `${activeUsers.length} kullanıcıya bildirim gönderildi` };
    } catch (e) {
      return { success: false, message: 'Bildirim gönderilemedi: ' + (e as Error).message };
    }
  }

  async getNotificationHistory(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    try {
      const [data, total] = await this.notificationRepo.findAndCount({
        where: { type: 'system' as any },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        success: true,
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch {
      return { success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
  }

  // ─── Reports ──────────────────────────────────────────────────

  async getSalesReport(query: { period?: string; dateFrom?: string; dateTo?: string }) {
    const { period = 'daily', dateFrom, dateTo } = query;
    const truncFn = period === 'monthly' ? 'month' : period === 'weekly' ? 'week' : 'day';

    const qb = this.orderRepo.createQueryBuilder('o')
      .select(`DATE_TRUNC('${truncFn}', o."createdAt")`, 'period')
      .addSelect('COUNT(*)', 'orderCount')
      .addSelect('COALESCE(SUM(o.total), 0)', 'revenue')
      .where('o."paymentStatus" = :ps', { ps: 'paid' });

    if (dateFrom) qb.andWhere('o."createdAt" >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('o."createdAt" <= :dateTo', { dateTo });

    const data = await qb.groupBy('period').orderBy('period', 'DESC').limit(30).getRawMany();

    return { success: true, data };
  }

  async getUserGrowthReport(query: { period?: string; dateFrom?: string; dateTo?: string }) {
    const { period = 'daily', dateFrom, dateTo } = query;
    const truncFn = period === 'monthly' ? 'month' : period === 'weekly' ? 'week' : 'day';

    const qb = this.userRepo.createQueryBuilder('u')
      .select(`DATE_TRUNC('${truncFn}', u."createdAt")`, 'period')
      .addSelect('COUNT(*)', 'newUsers')
      .addSelect("COUNT(*) FILTER (WHERE u.role = 'store_owner')", 'newStoreOwners');

    if (dateFrom) qb.andWhere('u."createdAt" >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('u."createdAt" <= :dateTo', { dateTo });

    const data = await qb.groupBy('period').orderBy('period', 'DESC').limit(30).getRawMany();

    return { success: true, data };
  }

  async getStorePerformanceReport(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;

    const data = await this.storeRepo.createQueryBuilder('s')
      .select(['s.id', 's.name', 's."ratingAverage"', 's."ratingCount"', 's."followersCount"', 's."productsCount"', 's."isVerified"'])
      .orderBy('s."ratingAverage"', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany();

    const total = await this.storeRepo.count();

    return {
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async exportData(type: string) {
    let rows: any[] = [];
    let headers: string[] = [];

    switch (type) {
      case 'users': {
        rows = await this.userRepo.find({ select: ['id', 'name', 'surname', 'email', 'role', 'isActive', 'createdAt'] });
        headers = ['ID', 'Ad', 'Soyad', 'Email', 'Rol', 'Aktif', 'Kayıt Tarihi'];
        break;
      }
      case 'orders': {
        rows = await this.orderRepo.find({ take: 1000, order: { createdAt: 'DESC' } });
        headers = ['ID', 'Kullanıcı ID', 'Toplam', 'Durum', 'Ödeme Durumu', 'Tarih'];
        break;
      }
      case 'stores': {
        rows = await this.storeRepo.find({ select: ['id', 'name', 'ratingAverage', 'followersCount', 'productsCount', 'isVerified', 'isActive', 'createdAt'] });
        headers = ['ID', 'İsim', 'Puan', 'Takipçi', 'Ürün Sayısı', 'Onaylı', 'Aktif', 'Tarih'];
        break;
      }
      default:
        return { success: false, message: 'Geçersiz export tipi' };
    }

    // CSV oluştur
    const csvRows = [headers.join(',')];
    for (const row of rows) {
      csvRows.push(Object.values(row).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    }

    return { success: true, csv: csvRows.join('\n'), filename: `${type}_export_${new Date().toISOString().split('T')[0]}.csv` };
  }

  // ─── Settings / Categories ──────────────────────────────────

  async getCategories(): Promise<{ success: boolean; data: string[] }> {
    try {
      const result = await this.dataSource.query(
        `SELECT value FROM platform_settings WHERE key = 'categories'`,
      );
      if (result.length > 0) {
        return { success: true, data: result[0].value };
      }
    } catch (e) {
      console.warn('getCategories error:', e.message);
    }
    return { success: true, data: DEFAULT_CATEGORIES };
  }

  async updateCategories(categories: string[]): Promise<{ success: boolean; data: string[] }> {
    try {
      await this.dataSource.query(
        `INSERT INTO platform_settings (key, value, "updatedAt")
         VALUES ('categories', $1::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, "updatedAt" = NOW()`,
        [JSON.stringify(categories)],
      );
      return { success: true, data: categories };
    } catch (e) {
      console.warn('updateCategories error:', e.message);
      return { success: false, data: categories };
    }
  }

  async getSubcategories(): Promise<{ success: boolean; data: Record<string, { title: string; items: string[] }[]> }> {
    try {
      const result = await this.dataSource.query(
        `SELECT value FROM platform_settings WHERE key = 'subcategories'`,
      );
      if (result.length > 0) {
        return { success: true, data: result[0].value };
      }
    } catch (e) {
      console.warn('getSubcategories error:', e.message);
    }
    return { success: true, data: {} };
  }

  async updateSubcategories(subcategories: Record<string, { title: string; items: string[] }[]>): Promise<{ success: boolean }> {
    try {
      await this.dataSource.query(
        `INSERT INTO platform_settings (key, value, "updatedAt")
         VALUES ('subcategories', $1::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, "updatedAt" = NOW()`,
        [JSON.stringify(subcategories)],
      );
      return { success: true };
    } catch (e) {
      console.warn('updateSubcategories error:', e.message);
      return { success: false };
    }
  }

  async getSettings(): Promise<{ success: boolean; data: Record<string, any> }> {
    try {
      const rows = await this.dataSource.query(`SELECT key, value FROM platform_settings`);
      const settings: Record<string, any> = {};
      for (const row of rows) {
        settings[row.key] = row.value;
      }
      return { success: true, data: settings };
    } catch (e) {
      console.warn('getSettings error:', e.message);
      return { success: true, data: {} };
    }
  }

  async updateSetting(key: string, value: any): Promise<{ success: boolean }> {
    try {
      await this.dataSource.query(
        `INSERT INTO platform_settings (key, value, "updatedAt")
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, "updatedAt" = NOW()`,
        [key, JSON.stringify(value)],
      );
      return { success: true };
    } catch (e) {
      console.warn('updateSetting error:', e.message);
      return { success: false };
    }
  }

  // ─── Subscription / Aidat Management ────────────────────────

  async getSubscriptions(query: {
    page?: number; limit?: number; status?: string; search?: string; overdue?: string; storeType?: string;
  }) {
    const { page = 1, limit = 20, status, search, overdue, storeType } = query;
    try {
      let where = '';
      const params: any[] = [];
      let paramIdx = 1;

      if (status) {
        where += ` AND ss.status = $${paramIdx++}`;
        params.push(status);
      }
      if (search) {
        where += ` AND (s.name ILIKE $${paramIdx} OR u.name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx})`;
        params.push(`%${search}%`);
        paramIdx++;
      }
      if (overdue === 'true') {
        where += ` AND ss."paidUntil" < CURRENT_DATE AND ss.status != 'suspended'`;
      }
      if (storeType === 'service') {
        where += ` AND s."storeType" = 'service'`;
      } else if (storeType === 'store') {
        where += ` AND (s."storeType" IS NULL OR s."storeType" != 'service')`;
      }

      const countResult = await this.dataSource.query(`
        SELECT COUNT(*) as total
        FROM store_subscriptions ss
        JOIN stores s ON s.id = ss."storeId"
        JOIN users u ON u.id = s."ownerId"
        WHERE 1=1 ${where}
      `, params);

      const total = parseInt(countResult[0]?.total || '0');

      const data = await this.dataSource.query(`
        SELECT
          ss.*,
          s.name as "storeName", s.logo as "storeLogo", s."isActive" as "storeIsActive", s."isVerified" as "storeIsVerified",
          s."storeType" as "storeType",
          u.name as "ownerName", u.surname as "ownerSurname", u.email as "ownerEmail", u.id as "ownerId",
          CASE WHEN ss."paidUntil" < CURRENT_DATE AND ss.status = 'active' THEN true ELSE false END as "isOverdue",
          CASE WHEN ss."paidUntil" IS NOT NULL THEN ss."paidUntil" - CURRENT_DATE ELSE 0 END as "daysRemaining"
        FROM store_subscriptions ss
        JOIN stores s ON s.id = ss."storeId"
        JOIN users u ON u.id = s."ownerId"
        WHERE 1=1 ${where}
        ORDER BY s.name ASC
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
      `, [...params, limit, (page - 1) * limit]);

      return {
        success: true,
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (e) {
      console.warn('getSubscriptions error:', e.message);
      return { success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
  }

  async getSubscriptionStats() {
    try {
      const stats = await this.dataSource.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'suspended') as suspended,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
          COUNT(*) FILTER (WHERE "paidUntil" < CURRENT_DATE AND status = 'active') as overdue,
          COALESCE(SUM("monthlyFee") FILTER (WHERE status = 'active'), 0) as "monthlyRevenue",
          COALESCE(SUM("monthlyFee") FILTER (WHERE "paidUntil" < CURRENT_DATE AND status = 'active'), 0) as "overdueAmount"
        FROM store_subscriptions
      `);
      return { success: true, data: stats[0] || {} };
    } catch (e) {
      console.warn('getSubscriptionStats error:', e.message);
      return { success: true, data: {} };
    }
  }

  async ensureSubscription(storeId: string) {
    // Get default fee from settings
    let defaultFee = 0;
    try {
      const res = await this.dataSource.query(
        `SELECT value FROM platform_settings WHERE key = 'subscriptionPlans'`,
      );
      if (res.length > 0) {
        const plans = res[0].value;
        defaultFee = plans?.basic?.monthlyFee || 0;
      }
    } catch { /* ignore */ }

    try {
      await this.dataSource.query(`
        INSERT INTO store_subscriptions ("storeId", "planType", "monthlyFee", "status", "paidUntil")
        VALUES ($1, 'basic', $2, 'active', CURRENT_DATE + INTERVAL '30 days')
        ON CONFLICT ("storeId") DO NOTHING
      `, [storeId, defaultFee]);
      return { success: true };
    } catch (e) {
      console.warn('ensureSubscription error:', e.message);
      return { success: false };
    }
  }

  async updateSubscription(storeId: string, data: {
    planType?: string; monthlyFee?: number; status?: string; paidUntil?: string; notes?: string;
  }) {
    try {
      const sets: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (data.planType !== undefined) { sets.push(`"planType" = $${idx++}`); params.push(data.planType); }
      if (data.monthlyFee !== undefined) { sets.push(`"monthlyFee" = $${idx++}`); params.push(data.monthlyFee); }
      if (data.status !== undefined) {
        sets.push(`"status" = $${idx++}`); params.push(data.status);
        if (data.status === 'suspended') {
          sets.push(`"suspendedAt" = NOW()`);
        } else if (data.status === 'active') {
          sets.push(`"suspendedAt" = NULL`);
        }
      }
      if (data.paidUntil !== undefined) { sets.push(`"paidUntil" = $${idx++}`); params.push(data.paidUntil); }
      if (data.notes !== undefined) { sets.push(`"notes" = $${idx++}`); params.push(data.notes); }

      sets.push(`"updatedAt" = NOW()`);
      params.push(storeId);

      await this.dataSource.query(
        `UPDATE store_subscriptions SET ${sets.join(', ')} WHERE "storeId" = $${idx}`,
        params,
      );

      // If suspended, deactivate the store too
      if (data.status === 'suspended') {
        await this.storeRepo.update(storeId, { isActive: false });
      } else if (data.status === 'active') {
        await this.storeRepo.update(storeId, { isActive: true });
      }

      return { success: true };
    } catch (e) {
      console.warn('updateSubscription error:', e.message);
      return { success: false };
    }
  }

  async recordPayment(storeId: string, months: number = 1) {
    try {
      await this.dataSource.query(`
        UPDATE store_subscriptions SET
          "paidUntil" = GREATEST(COALESCE("paidUntil", CURRENT_DATE), CURRENT_DATE) + ($1 || ' months')::interval,
          "lastPaymentDate" = CURRENT_DATE,
          "status" = 'active',
          "suspendedAt" = NULL,
          "updatedAt" = NOW()
        WHERE "storeId" = $2
      `, [months, storeId]);

      // Reactivate store if it was suspended
      await this.storeRepo.update(storeId, { isActive: true });

      return { success: true };
    } catch (e) {
      console.warn('recordPayment error:', e.message);
      return { success: false };
    }
  }

  async sendReminder(storeId: string) {
    try {
      // Get store owner
      const store = await this.storeRepo.findOne({ where: { id: storeId }, relations: ['owner'] });
      if (!store) return { success: false, message: 'Mağaza bulunamadı' };

      // Create notification
      await this.dataSource.query(`
        INSERT INTO notifications ("userId", type, title, body, data)
        VALUES ($1, 'system', $2, $3, $4)
      `, [
        store.ownerId,
        'Aidat Hatırlatması',
        `Sayın ${store.owner?.name || 'Mağaza Sahibi'}, "${store.name}" mağazanızın aidatı ödenmemiştir. Lütfen en kısa sürede ödemenizi yapınız. Aksi takdirde mağazanız askıya alınabilir.`,
        JSON.stringify({ type: 'subscription_reminder', storeId }),
      ]);

      // Update last reminder date
      await this.dataSource.query(`
        UPDATE store_subscriptions SET "lastReminderDate" = CURRENT_DATE, "updatedAt" = NOW()
        WHERE "storeId" = $1
      `, [storeId]);

      return { success: true, message: 'Hatırlatma gönderildi' };
    } catch (e) {
      console.warn('sendReminder error:', e.message);
      return { success: false, message: 'Hatırlatma gönderilemedi' };
    }
  }

  async suspendOverdue(graceDays: number = 7) {
    try {
      // Find overdue stores past grace period
      const overdue = await this.dataSource.query(`
        SELECT ss."storeId", s.name, s."ownerId"
        FROM store_subscriptions ss
        JOIN stores s ON s.id = ss."storeId"
        WHERE ss."paidUntil" < CURRENT_DATE - ($1 || ' days')::interval
          AND ss.status = 'active'
      `, [graceDays]);

      let suspended = 0;
      for (const row of overdue) {
        await this.dataSource.query(`
          UPDATE store_subscriptions SET status = 'suspended', "suspendedAt" = NOW(), "updatedAt" = NOW()
          WHERE "storeId" = $1
        `, [row.storeId]);
        await this.storeRepo.update(row.storeId, { isActive: false });

        // Send suspension notification
        try {
          await this.dataSource.query(`
            INSERT INTO notifications ("userId", type, title, body, data)
            VALUES ($1, 'system', $2, $3, $4)
          `, [
            row.ownerId,
            'Mağaza Askıya Alındı',
            `"${row.name}" mağazanız ödenmemiş aidat nedeniyle askıya alınmıştır. Ödemenizi yaptıktan sonra mağazanız tekrar aktifleştirilecektir.`,
            JSON.stringify({ type: 'subscription_suspended', storeId: row.storeId }),
          ]);
        } catch { /* notification table might not exist */ }

        suspended++;
      }

      return { success: true, suspended };
    } catch (e) {
      console.warn('suspendOverdue error:', e.message);
      return { success: false, suspended: 0 };
    }
  }

  async initAllSubscriptions() {
    // Create subscription records for stores that don't have one
    try {
      let defaultFee = 0;
      try {
        const res = await this.dataSource.query(
          `SELECT value FROM platform_settings WHERE key = 'subscriptionPlans'`,
        );
        if (res.length > 0) defaultFee = res[0].value?.basic?.monthlyFee || 0;
      } catch { /* ignore */ }

      const result = await this.dataSource.query(`
        INSERT INTO store_subscriptions ("storeId", "planType", "monthlyFee", "status", "paidUntil")
        SELECT s.id, 'basic', $1, 'active', CURRENT_DATE + INTERVAL '30 days'
        FROM stores s
        WHERE NOT EXISTS (SELECT 1 FROM store_subscriptions ss WHERE ss."storeId" = s.id)
      `, [defaultFee]);

      return { success: true, created: result[1] || 0 };
    } catch (e) {
      console.warn('initAllSubscriptions error:', e.message);
      return { success: false, created: 0 };
    }
  }

  // ─── Profesyonel Hizmetler ──────────────────────────────────

  async getServiceProviders(query: {
    page?: number; limit?: number; search?: string; category?: string; isVerified?: string; isActive?: string;
  }) {
    const { page = 1, limit = 20, search, category, isVerified, isActive } = query;

    const params: any[] = [];
    let where = `WHERE s."storeType" = 'service'`;
    let paramIdx = 1;

    if (search) {
      where += ` AND (s.name ILIKE $${paramIdx} OR u.name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (category) {
      where += ` AND s.categories @> $${paramIdx}::jsonb`;
      params.push(JSON.stringify([category]));
      paramIdx++;
    }
    if (isVerified === 'true') where += ` AND s."isVerified" = true`;
    if (isVerified === 'false') where += ` AND s."isVerified" = false`;
    if (isActive === 'true') where += ` AND s."isActive" = true`;
    if (isActive === 'false') where += ` AND s."isActive" = false`;

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) as total FROM stores s LEFT JOIN users u ON u.id = s."ownerId" ${where}`, params,
    );
    const total = parseInt(countResult[0]?.total || '0');

    const rows = await this.dataSource.query(`
      SELECT
        s.id, s.name, s.slug, s.description, s.logo,
        s.categories, s.tags, s."ratingAverage", s."ratingCount",
        s."isVerified", s."isActive", s."followersCount", s."createdAt",
        u.id as "ownerId", u.name as "ownerName", u.surname as "ownerSurname", u.email as "ownerEmail"
      FROM stores s
      LEFT JOIN users u ON u.id = s."ownerId"
      ${where}
      ORDER BY s."createdAt" DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `, [...params, limit, (page - 1) * limit]);

    return {
      success: true,
      data: rows.map((r: any) => ({
        id: r.id, name: r.name, slug: r.slug, description: r.description, logo: r.logo,
        categories: r.categories, tags: r.tags,
        ratingAverage: r.ratingAverage, ratingCount: r.ratingCount,
        isVerified: r.isVerified, isActive: r.isActive,
        followersCount: r.followersCount, createdAt: r.createdAt,
        owner: r.ownerId ? { id: r.ownerId, name: r.ownerName, surname: r.ownerSurname, email: r.ownerEmail } : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getServiceProviderStats() {
    try {
      const stats = await this.dataSource.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE "isActive" = true) as active,
          COUNT(*) FILTER (WHERE "isVerified" = true) as verified,
          COUNT(*) FILTER (WHERE "isVerified" = false) as unverified,
          COALESCE(AVG("ratingAverage") FILTER (WHERE "ratingCount" > 0), 0) as "avgRating"
        FROM stores WHERE "storeType" = 'service'
      `);

      const catResult = await this.dataSource.query(`
        SELECT jsonb_array_elements_text(categories) as category, COUNT(*) as count
        FROM stores WHERE "storeType" = 'service'
        GROUP BY category ORDER BY count DESC LIMIT 10
      `);

      return { success: true, data: { ...(stats[0] || {}), topCategories: catResult } };
    } catch (e) {
      console.warn('getServiceProviderStats error:', e.message);
      return { success: true, data: {} };
    }
  }
}
