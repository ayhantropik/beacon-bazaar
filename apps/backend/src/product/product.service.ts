import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductEntity } from '../database/entities';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService implements OnModuleInit {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS price_alerts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL,
          "productId" UUID NOT NULL,
          "targetPrice" DECIMAL(10,2) NOT NULL,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          UNIQUE("userId", "productId")
        )
      `);
      console.log('price_alerts table ready');
    } catch (e) {
      console.warn('price_alerts table init skipped:', e.message);
    }

    // pg_trgm uzantısını etkinleştir (fuzzy arama için)
    try {
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
      console.log('pg_trgm extension ready');
    } catch (e) {
      console.warn('pg_trgm extension unavailable:', e.message);
    }
  }

  /** Türkçe karakterleri ASCII karşılıklarına dönüştür */
  private normalizeTurkish(text: string): string {
    return text
      .replace(/[çÇ]/g, (c) => c === 'ç' ? 'c' : 'C')
      .replace(/[ğĞ]/g, (c) => c === 'ğ' ? 'g' : 'G')
      .replace(/[ıİ]/g, (c) => c === 'ı' ? 'i' : 'I')
      .replace(/[öÖ]/g, (c) => c === 'ö' ? 'o' : 'O')
      .replace(/[şŞ]/g, (c) => c === 'ş' ? 's' : 'S')
      .replace(/[üÜ]/g, (c) => c === 'ü' ? 'u' : 'U');
  }

  /** Sorgu kelimelerini parçalara ayırır ve her bir kelime için olası varyasyonlar üretir */
  private generateSearchVariations(query: string): string[] {
    const original = query.trim();
    const normalized = this.normalizeTurkish(original);
    const variations = [original];
    if (normalized !== original) variations.push(normalized);

    // Türkçe → ASCII ve ASCII → Türkçe varyasyonları
    const trMap: Record<string, string> = { 'c': 'ç', 'g': 'ğ', 'i': 'ı', 'o': 'ö', 's': 'ş', 'u': 'ü' };
    // ASCII versiyondaki her harfi Türkçe karşılığıyla değiştirerek varyasyon üret
    const lower = normalized.toLowerCase();
    for (const [ascii, tr] of Object.entries(trMap)) {
      if (lower.includes(ascii)) {
        variations.push(lower.replace(new RegExp(ascii, 'g'), tr));
      }
    }
    return [...new Set(variations)];
  }

  async search(params: {
    query?: string;
    categories?: string[];
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page: number;
    limit: number;
    includeStore?: boolean;
  }) {
    const result = await this._executeSearch(params);

    // Sonuç bulunamazsa fuzzy arama dene
    if (result.pagination.total === 0 && params.query) {
      const fuzzyResult = await this._fuzzySearch(params);
      if (fuzzyResult.pagination.total > 0) {
        return { ...fuzzyResult, fuzzyMatch: true, originalQuery: params.query };
      }
    }

    return result;
  }

  private async _executeSearch(params: {
    query?: string;
    categories?: string[];
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page: number;
    limit: number;
    includeStore?: boolean;
  }) {
    const qb = this.productRepo.createQueryBuilder('product').where('product.isActive = true');

    if (params.includeStore) {
      qb.leftJoinAndSelect('product.store', 'store');
    }

    if (params.query) {
      const variations = this.generateSearchVariations(params.query);
      const conditions = variations.map((_, i) => `(product.name ILIKE :q${i} OR product.description ILIKE :q${i})`).join(' OR ');
      const queryParams: Record<string, string> = {};
      variations.forEach((v, i) => { queryParams[`q${i}`] = `%${v}%`; });
      qb.andWhere(`(${conditions})`, queryParams);
    }
    if (params.categories?.length) {
      qb.andWhere('product.categories::jsonb ?| ARRAY[:...cats]', { cats: params.categories });
    }
    if (params.minPrice) qb.andWhere('product.price >= :minPrice', { minPrice: params.minPrice });
    if (params.maxPrice) qb.andWhere('product.price <= :maxPrice', { maxPrice: params.maxPrice });

    switch (params.sortBy) {
      case 'price_asc': qb.orderBy('product.price', 'ASC'); break;
      case 'price_desc': qb.orderBy('product.price', 'DESC'); break;
      case 'rating': qb.orderBy('product.ratingAverage', 'DESC'); break;
      case 'newest': qb.orderBy('product.createdAt', 'DESC'); break;
      case 'discount':
        qb.andWhere('product.salePrice IS NOT NULL AND product.salePrice < product.price');
        qb.orderBy('(product.price - product.salePrice) / product.price', 'DESC');
        break;
      case 'popular':
      case 'best_seller':
        qb.orderBy('product.ratingCount', 'DESC');
        break;
      default: qb.orderBy('product.createdAt', 'DESC');
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getMany();

    return {
      success: true,
      data,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  /** pg_trgm veya kelime bazlı fuzzy arama */
  private async _fuzzySearch(params: {
    query?: string;
    categories?: string[];
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page: number;
    limit: number;
    includeStore?: boolean;
  }) {
    const query = params.query || '';
    const normalized = this.normalizeTurkish(query).toLowerCase();

    // 1) pg_trgm ile similarity arama dene
    try {
      await this.dataSource.query(`SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'`);

      let sql = `
        SELECT p.*, similarity(lower(p.name), $1) as sim
        FROM products p
        WHERE p."isActive" = true
          AND similarity(lower(p.name), $1) > 0.1
      `;
      const sqlParams: any[] = [normalized];
      let paramIdx = 2;

      if (params.categories?.length) {
        sql += ` AND p.categories::jsonb ?| ARRAY[${params.categories.map(() => `$${paramIdx++}`).join(',')}]`;
        sqlParams.push(...params.categories);
      }
      if (params.minPrice) { sql += ` AND p.price >= $${paramIdx++}`; sqlParams.push(params.minPrice); }
      if (params.maxPrice) { sql += ` AND p.price <= $${paramIdx++}`; sqlParams.push(params.maxPrice); }

      sql += ` ORDER BY sim DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      sqlParams.push(params.limit, (params.page - 1) * params.limit);

      const data = await this.dataSource.query(sql, sqlParams);

      // Count
      let countSql = `SELECT count(*) as cnt FROM products p WHERE p."isActive" = true AND similarity(lower(p.name), $1) > 0.1`;
      const countParams: any[] = [normalized];
      let cIdx = 2;
      if (params.categories?.length) {
        countSql += ` AND p.categories::jsonb ?| ARRAY[${params.categories.map(() => `$${cIdx++}`).join(',')}]`;
        countParams.push(...params.categories);
      }

      const countResult = await this.dataSource.query(countSql, countParams);
      const total = parseInt(countResult[0]?.cnt || '0', 10);

      return {
        success: true,
        data,
        pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) },
      };
    } catch {
      // pg_trgm yok — kelime bazlı fallback
    }

    // 2) Kelime bazlı fallback: her kelimeyi ayrı ayrı ara
    const words = normalized.split(/\s+/).filter(w => w.length >= 2);
    if (words.length === 0) {
      return { success: true, data: [], pagination: { page: params.page, limit: params.limit, total: 0, totalPages: 0 } };
    }

    const qb = this.productRepo.createQueryBuilder('product').where('product.isActive = true');
    if (params.includeStore) qb.leftJoinAndSelect('product.store', 'store');

    // Her kelimenin en az birinin eşleşmesi yeterli
    const wordConditions = words.map((_, i) => `(product.name ILIKE :fw${i} OR product.description ILIKE :fw${i})`).join(' OR ');
    const wordParams: Record<string, string> = {};
    words.forEach((w, i) => { wordParams[`fw${i}`] = `%${w}%`; });
    qb.andWhere(`(${wordConditions})`, wordParams);

    if (params.categories?.length) {
      qb.andWhere('product.categories::jsonb ?| ARRAY[:...cats]', { cats: params.categories });
    }

    qb.orderBy('product.ratingAverage', 'DESC');

    const total = await qb.getCount();
    const data = await qb
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getMany();

    return {
      success: true,
      data,
      pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) },
    };
  }

  async getById(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const where = isUuid ? { id } : { slug: id };
    const product = await this.productRepo.findOne({ where, relations: ['store'] });
    if (!product) throw new NotFoundException('Ürün bulunamadı');
    return { success: true, data: product };
  }

  async getFeatured() {
    const data = await this.productRepo.find({
      where: { isFeatured: true, isActive: true },
      take: 20,
      order: { ratingAverage: 'DESC' },
    });
    return { success: true, data };
  }

  async getCategories() {
    // Read managed categories from platform_settings (set by admin panel)
    let managedCategories: string[] | null = null;
    try {
      const settingsResult = await this.dataSource.query(
        `SELECT value FROM platform_settings WHERE key = 'categories'`,
      );
      if (settingsResult.length > 0) {
        managedCategories = settingsResult[0].value;
      }
    } catch {
      // Table might not exist yet — fall through to defaults
    }

    const TARGET_CATEGORIES = managedCategories || [
      'Kadın', 'Erkek', 'Anne & Çocuk', 'Ev & Yaşam', 'Süpermarket',
      'Kozmetik', 'Ayakkabı & Çanta', 'Elektronik', 'Saat & Aksesuar', 'Spor & Outdoor',
    ];

    // Return all managed categories (even if no products yet) + any extra DB-only categories
    const result = await this.productRepo
      .createQueryBuilder('product')
      .select('DISTINCT jsonb_array_elements_text(product.categories)', 'category')
      .getRawMany();
    const dbCategories = result.map((r: { category: string }) => r.category.replace(/\s+/g, ' ').trim());
    const extra = dbCategories.filter(c => c && !TARGET_CATEGORIES.includes(c));
    return { success: true, data: [...TARGET_CATEGORIES, ...extra] };
  }

  async create(dto: CreateProductDto) {
    if (!dto.slug) {
      dto.slug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9ğüşıöç\s-]/g, '')
        .replace(/[ğ]/g, 'g').replace(/[ü]/g, 'u').replace(/[ş]/g, 's')
        .replace(/[ı]/g, 'i').replace(/[ö]/g, 'o').replace(/[ç]/g, 'c')
        .replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 50)
        + '-' + Date.now().toString(36);
    }
    const product = this.productRepo.create(dto);
    const saved = await this.productRepo.save(product);
    return { success: true, data: saved };
  }

  async update(id: string, dto: Partial<CreateProductDto>) {
    // Fiyat değişikliğini kaydet
    if (dto.price !== undefined || dto.salePrice !== undefined) {
      try {
        const current = await this.productRepo.findOne({ where: { id } });
        if (current) {
          const oldPrice = Number(current.price);
          const oldSalePrice = current.salePrice ? Number(current.salePrice) : null;
          const newPrice = dto.price !== undefined ? Number(dto.price) : oldPrice;
          const newSalePrice = dto.salePrice !== undefined ? (dto.salePrice ? Number(dto.salePrice) : null) : oldSalePrice;

          if (newPrice !== oldPrice || newSalePrice !== oldSalePrice) {
            await this.dataSource.query(`
              INSERT INTO price_history ("productId", price, "salePrice")
              VALUES ($1, $2, $3)
            `, [id, newPrice, newSalePrice]);
          }
        }
      } catch (e) {
        console.warn('Price history log failed:', e.message);
      }
    }

    await this.productRepo.update(id, dto);
    return this.getById(id);
  }

  async getPriceHistory(productId: string) {
    try {
      const history = await this.dataSource.query(`
        SELECT id, price, "salePrice", "createdAt"
        FROM price_history
        WHERE "productId" = $1
        ORDER BY "createdAt" ASC
      `, [productId]);

      // Mevcut fiyatı da ekle
      const product = await this.productRepo.findOne({ where: { id: productId } });
      if (product) {
        history.push({
          id: 'current',
          price: product.price,
          salePrice: product.salePrice,
          createdAt: product.updatedAt,
        });
      }

      return { success: true, data: history };
    } catch {
      // Tablo yoksa sadece mevcut fiyatı döndür
      const product = await this.productRepo.findOne({ where: { id: productId } });
      return {
        success: true,
        data: product ? [{
          id: 'current',
          price: product.price,
          salePrice: product.salePrice,
          createdAt: product.updatedAt,
        }] : [],
      };
    }
  }

  async delete(id: string) {
    await this.productRepo.update(id, { isActive: false });
    return { success: true, message: 'Ürün silindi' };
  }

  private async ensureTable() {
    try {
      await this.dataSource.query('SELECT 1 FROM price_alerts LIMIT 0');
      return true;
    } catch {
      try {
        await this.dataSource.query(`
          CREATE TABLE IF NOT EXISTS price_alerts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "userId" UUID NOT NULL,
            "productId" UUID NOT NULL,
            "targetPrice" DECIMAL(10,2) NOT NULL,
            "isActive" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            UNIQUE("userId", "productId")
          )
        `);
        return true;
      } catch (e) {
        console.warn('price_alerts table unavailable:', e.message);
        return false;
      }
    }
  }

  async createPriceAlert(userId: string, productId: string, targetPrice: number) {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    if (!(await this.ensureTable())) {
      return { success: true, message: 'Fiyat alarmı oluşturuldu (local)' };
    }

    const existing = await this.dataSource.query(
      `SELECT * FROM price_alerts WHERE "userId" = $1 AND "productId" = $2`,
      [userId, productId],
    );
    if (existing.length > 0) {
      await this.dataSource.query(
        `UPDATE price_alerts SET "targetPrice" = $1, "isActive" = true WHERE "userId" = $2 AND "productId" = $3`,
        [targetPrice, userId, productId],
      );
      return { success: true, message: 'Fiyat alarmı güncellendi' };
    }

    await this.dataSource.query(
      `INSERT INTO price_alerts ("userId", "productId", "targetPrice") VALUES ($1, $2, $3)`,
      [userId, productId, targetPrice],
    );
    return { success: true, message: 'Fiyat alarmı oluşturuldu' };
  }

  async removePriceAlert(userId: string, productId: string) {
    if (!(await this.ensureTable())) {
      return { success: true, message: 'Fiyat alarmı kaldırıldı' };
    }
    await this.dataSource.query(
      `DELETE FROM price_alerts WHERE "userId" = $1 AND "productId" = $2`,
      [userId, productId],
    );
    return { success: true, message: 'Fiyat alarmı kaldırıldı' };
  }

  async getUserPriceAlerts(userId: string) {
    if (!(await this.ensureTable())) {
      return { success: true, data: [] };
    }
    const alerts = await this.dataSource.query(
      `SELECT pa.*, p.name, p.slug, p.price, p."salePrice" FROM price_alerts pa
       JOIN products p ON p.id = pa."productId"
       WHERE pa."userId" = $1 AND pa."isActive" = true ORDER BY pa."createdAt" DESC`,
      [userId],
    );
    return { success: true, data: alerts };
  }

  async checkPriceAlert(userId: string, productId: string) {
    if (!(await this.ensureTable())) {
      return { success: true, data: { hasAlert: false, targetPrice: null } };
    }
    const result = await this.dataSource.query(
      `SELECT * FROM price_alerts WHERE "userId" = $1 AND "productId" = $2 AND "isActive" = true`,
      [userId, productId],
    );
    const alert = result[0];
    return { success: true, data: { hasAlert: !!alert, targetPrice: alert?.targetPrice || null } };
  }

  async getGiftSuggestions(params: {
    age?: number;
    gender?: string;
    interests?: string[];
    occasion?: string;
    budget?: { min: number; max: number };
    relationship?: string;
    latitude?: number;
    longitude?: number;
  }) {
    const gender = params.gender?.toLowerCase();
    const age = params.age;

    // Yaş grubu belirleme
    let ageGroup = 'adult';
    if (age) {
      if (age <= 3) ageGroup = 'baby';
      else if (age <= 6) ageGroup = 'preschool';
      else if (age <= 12) ageGroup = 'child';
      else if (age <= 17) ageGroup = 'teen';
      else if (age < 30) ageGroup = 'young_adult';
      else if (age < 60) ageGroup = 'adult';
      else ageGroup = 'senior';
    }

    // Veritabanındaki GERÇEK kategori isimleri:
    // Elektronik, Kozmetik, Moda & Giyim, Giyim, Ayakkabı & Çanta,
    // Ev & Yaşam, Ev & Mobilya, Spor & Outdoor, Kitap & Kırtasiye,
    // Oyuncak & Hobi, Anne & Çocuk, Süpermarket, Saat & Aksesuar,
    // Hediyelik, Eğitici, Fitness, Outdoor

    // Yaş grubuna göre İZİN VERİLEN kategoriler (whitelist — DB'deki gerçek isimler)
    const allowedByAge: Record<string, string[]> = {
      'baby': ['Oyuncak & Hobi', 'Anne & Çocuk', 'Giyim', 'Eğitici', 'Hediyelik'],
      'preschool': ['Oyuncak & Hobi', 'Anne & Çocuk', 'Giyim', 'Kitap & Kırtasiye', 'Eğitici', 'Hediyelik'],
      'child': ['Oyuncak & Hobi', 'Anne & Çocuk', 'Giyim', 'Kitap & Kırtasiye', 'Spor & Outdoor', 'Eğitici', 'Hediyelik'],
      'teen': ['Elektronik', 'Giyim', 'Moda & Giyim', 'Oyuncak & Hobi', 'Saat & Aksesuar', 'Kitap & Kırtasiye', 'Spor & Outdoor', 'Hediyelik', 'Fitness'],
      'young_adult': ['Elektronik', 'Giyim', 'Moda & Giyim', 'Kozmetik', 'Saat & Aksesuar', 'Kitap & Kırtasiye', 'Spor & Outdoor', 'Ev & Yaşam', 'Süpermarket', 'Hediyelik', 'Ayakkabı & Çanta', 'Fitness'],
      'adult': ['Elektronik', 'Giyim', 'Moda & Giyim', 'Ev & Yaşam', 'Ev & Mobilya', 'Saat & Aksesuar', 'Süpermarket', 'Kozmetik', 'Kitap & Kırtasiye', 'Spor & Outdoor', 'Hediyelik', 'Ayakkabı & Çanta', 'Fitness'],
      'senior': ['Süpermarket', 'Kitap & Kırtasiye', 'Ev & Yaşam', 'Ev & Mobilya', 'Kozmetik', 'Saat & Aksesuar', 'Giyim', 'Hediyelik'],
    };

    // İlgi alanlarından kategori eşleştirme (yaşa duyarlı, DB'deki gerçek isimler)
    const interestToCats = (interest: string, ag: string): string[] => {
      const i = interest.toLowerCase();
      const isSmallChild = ['baby', 'preschool', 'child'].includes(ag);
      const map: Record<string, string[]> = {
        'teknoloji': isSmallChild ? ['Oyuncak & Hobi', 'Eğitici'] : ['Elektronik'],
        'müzik': isSmallChild ? ['Oyuncak & Hobi', 'Eğitici'] : ['Elektronik', 'Hediyelik'],
        'spor': isSmallChild ? ['Oyuncak & Hobi', 'Spor & Outdoor'] : ['Spor & Outdoor', 'Fitness'],
        'moda & giyim': ['Giyim', 'Moda & Giyim', 'Saat & Aksesuar', 'Ayakkabı & Çanta'],
        'moda': ['Giyim', 'Moda & Giyim', 'Saat & Aksesuar'],
        'güzellik & bakım': isSmallChild ? ['Anne & Çocuk'] : ['Kozmetik'],
        'güzellik': isSmallChild ? ['Anne & Çocuk'] : ['Kozmetik'],
        'yemek & mutfak': isSmallChild ? ['Oyuncak & Hobi'] : ['Süpermarket', 'Ev & Yaşam'],
        'yemek': isSmallChild ? ['Oyuncak & Hobi'] : ['Süpermarket', 'Ev & Yaşam'],
        'okuma': isSmallChild ? ['Kitap & Kırtasiye', 'Eğitici'] : ['Kitap & Kırtasiye'],
        'ev & dekorasyon': isSmallChild ? ['Oyuncak & Hobi'] : ['Ev & Yaşam', 'Ev & Mobilya'],
        'ev': isSmallChild ? ['Oyuncak & Hobi'] : ['Ev & Yaşam', 'Ev & Mobilya'],
        'oyun': isSmallChild ? ['Oyuncak & Hobi', 'Eğitici'] : ['Oyuncak & Hobi', 'Elektronik'],
        'sanat': isSmallChild ? ['Oyuncak & Hobi', 'Kitap & Kırtasiye'] : ['Kitap & Kırtasiye', 'Hediyelik'],
        'koleksiyon': isSmallChild ? ['Oyuncak & Hobi'] : ['Oyuncak & Hobi', 'Hediyelik'],
        'el işi & diy': isSmallChild ? ['Oyuncak & Hobi', 'Eğitici'] : ['Kitap & Kırtasiye', 'Ev & Yaşam'],
        'dans': isSmallChild ? ['Oyuncak & Hobi', 'Giyim'] : ['Giyim', 'Spor & Outdoor'],
        'fotoğrafçılık': isSmallChild ? ['Oyuncak & Hobi'] : ['Elektronik'],
        'seyahat': isSmallChild ? ['Oyuncak & Hobi', 'Kitap & Kırtasiye'] : ['Saat & Aksesuar', 'Outdoor'],
        'doğa & bahçe': isSmallChild ? ['Oyuncak & Hobi'] : ['Ev & Yaşam', 'Outdoor', 'Spor & Outdoor'],
      };
      return map[i] || [];
    };

    const occasionMap: Record<string, string[]> = {
      'doğum günü': ['Hediyelik', 'Saat & Aksesuar', 'Giyim', 'Oyuncak & Hobi'],
      'yeni yıl': ['Süpermarket', 'Hediyelik', 'Saat & Aksesuar', 'Oyuncak & Hobi', 'Ev & Yaşam'],
      'yılbaşı': ['Süpermarket', 'Hediyelik', 'Saat & Aksesuar', 'Oyuncak & Hobi', 'Ev & Yaşam'],
      'yıldönümü': ['Saat & Aksesuar', 'Kozmetik', 'Giyim', 'Hediyelik'],
      'sevgililer günü': ['Kozmetik', 'Saat & Aksesuar', 'Hediyelik', 'Süpermarket'],
      'anneler günü': ['Kozmetik', 'Saat & Aksesuar', 'Ev & Yaşam', 'Hediyelik'],
      'babalar günü': ['Elektronik', 'Spor & Outdoor', 'Saat & Aksesuar', 'Hediyelik'],
      'mezuniyet': ['Elektronik', 'Kitap & Kırtasiye', 'Saat & Aksesuar', 'Hediyelik'],
      'düğün': ['Ev & Yaşam', 'Ev & Mobilya', 'Saat & Aksesuar', 'Hediyelik'],
      'düğün / nişan': ['Ev & Yaşam', 'Ev & Mobilya', 'Saat & Aksesuar', 'Hediyelik'],
      'bebek': ['Oyuncak & Hobi', 'Anne & Çocuk', 'Giyim'],
      'bayram': ['Süpermarket', 'Hediyelik', 'Saat & Aksesuar', 'Giyim', 'Oyuncak & Hobi'],
      'teşekkür': ['Süpermarket', 'Hediyelik', 'Kozmetik'],
      'ev hediyesi': ['Ev & Yaşam', 'Ev & Mobilya', 'Hediyelik'],
      'terfi / iş başarısı': ['Saat & Aksesuar', 'Elektronik', 'Hediyelik'],
      'özel bir neden yok': ['Hediyelik', 'Saat & Aksesuar', 'Giyim', 'Kozmetik'],
      'veda / ayrılık': ['Hediyelik', 'Saat & Aksesuar', 'Kitap & Kırtasiye'],
    };

    // İzin verilen kategoriler listesi
    const allowed = new Set<string>(allowedByAge[ageGroup] || allowedByAge['adult']);

    // İlgi alanlarından kategori topla
    const relevantCategories = new Set<string>();
    if (params.interests?.length) {
      for (const interest of params.interests) {
        const cats = interestToCats(interest, ageGroup);
        cats.forEach(c => { if (allowed.has(c)) relevantCategories.add(c); });
      }
    }

    // Vesile'den kategori topla
    if (params.occasion) {
      const cats = occasionMap[params.occasion.toLowerCase()];
      if (cats) cats.forEach(c => { if (allowed.has(c)) relevantCategories.add(c); });
    }

    // Yaş grubu varsayılan kategorileri ekle
    allowedByAge[ageGroup]?.forEach(c => relevantCategories.add(c));

    // Cinsiyet bazlı ayarlamalar (izin verilen içinde)
    if (gender === 'female' && allowed.has('Kozmetik')) relevantCategories.add('Kozmetik');
    if (gender === 'male' && allowed.has('Spor & Outdoor')) relevantCategories.add('Spor & Outdoor');

    // Boş kalmaması için fallback
    if (relevantCategories.size === 0) {
      allowed.forEach(c => relevantCategories.add(c));
    }

    const cats = Array.from(relevantCategories);

    // Yaş ve cinsiyete uygunsuz ürün anahtar kelimeleri
    const excludeKeywords: string[] = [];

    // Küçük çocuklar için geniş yasaklı liste
    if (age && age <= 6) {
      excludeKeywords.push(
        'arduino', 'raspberry', 'programlama', 'kodlama',
        'bluetooth', 'radyo', 'retro', 'vintage',
        'traş', 'tıraş', 'shaver', 'razor',
        'kozmetik', 'makyaj', 'parfüm', 'deodorant',
        'gua sha', 'roller', 'serum', 'krem', 'peeling', 'cilt bakım',
        'kahve', 'çay seti', 'espresso', 'french press',
        'bıçak', 'kesici', 'maket',
        'alkol', 'şarap', 'bira', 'viski', 'rakı', 'votka',
        'sigara', 'puro', 'nargile',
        'iç çamaşır', 'sütyen', 'bikini',
        'diet', 'zayıflama', 'protein tozu',
        'mum seti', 'aromaterapi', 'tütsü', 'buhurdanlık',
        'lego architecture', 'lego technic', '1000 parça', '500 parça',
        'profesyonel', 'ofis', 'iş', 'laptop', 'tablet',
        'kırtasiye seti', 'okul başlangıç',
        'cüzdan', 'kravat', 'kol düğmesi',
        'deluxe', 'premium',
      );
    } else if (age && age <= 12) {
      excludeKeywords.push(
        'traş', 'tıraş', 'shaver', 'razor',
        'kozmetik', 'makyaj', 'parfüm', 'deodorant',
        'gua sha', 'roller', 'serum', 'peeling', 'cilt bakım',
        'kahve makinesi', 'espresso',
        'bıçak seti', 'av bıçağı',
        'alkol', 'şarap', 'bira', 'viski', 'rakı', 'votka',
        'sigara', 'puro', 'nargile',
        'iç çamaşır', 'sütyen', 'bikini',
        'diet', 'zayıflama', 'protein tozu',
      );
    } else if (age && age < 18) {
      excludeKeywords.push(
        'traş', 'tıraş', 'shaver', 'razor',
        'alkol', 'şarap', 'bira', 'viski', 'rakı', 'votka',
        'sigara', 'puro', 'nargile', 'elektronik sigara',
        'bıçak seti', 'av bıçağı',
      );
    }

    // Cinsiyet filtreleri
    if (gender === 'female') {
      excludeKeywords.push('traş makinesi', 'sakal', 'bıyık', 'erkek parfüm', 'aftershave', 'beard');
    } else if (gender === 'male') {
      excludeKeywords.push('ruj', 'fondöten', 'rimel', 'oje', 'kadın parfüm', 'sütyen', 'bikini', 'tampon', 'ped');
    }

    // Build query
    const qb = this.productRepo.createQueryBuilder('product')
      .leftJoinAndSelect('product.store', 'store')
      .where('product.isActive = true')
      .andWhere('product.categories::jsonb ?| ARRAY[:...cats]', { cats });

    // Budget filter
    if (params.budget?.min) {
      qb.andWhere('product.price >= :minPrice', { minPrice: params.budget.min });
    }
    if (params.budget?.max) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: params.budget.max });
    }

    // SQL seviyesinde uygunsuz ürünleri filtrele
    const uniqueKeywords = [...new Set(excludeKeywords)];
    uniqueKeywords.forEach((kw, i) => {
      const paramName = `exkw_${i}`;
      qb.andWhere(`LOWER(product.name) NOT LIKE :${paramName}`, { [paramName]: `%${kw.toLowerCase()}%` });
    });

    // Order by rating and featured
    qb.orderBy('product.isFeatured', 'DESC')
      .addOrderBy('product.ratingAverage', 'DESC');

    let products = await qb.take(80).getMany();

    // İkinci katman: ürün adı + açıklamasında uygunsuz anahtar kelime kontrolü
    if (uniqueKeywords.length > 0) {
      const kwLower = uniqueKeywords.map(k => k.toLowerCase());
      products = products.filter((p) => {
        const text = `${p.name} ${p.description || ''}`.toLowerCase();
        return !kwLower.some(kw => text.includes(kw));
      });
    }

    // Üçüncü katman: Yaşa uygun fiyat aralığı kontrolü (çok pahalı ürünleri çocuklara önerme)
    if (age && age <= 6) {
      const maxReasonable = params.budget?.max ? Math.min(params.budget.max, 2000) : 2000;
      products = products.filter(p => Number(p.salePrice || p.price) <= maxReasonable);
    } else if (age && age <= 12) {
      const maxReasonable = params.budget?.max ? Math.min(params.budget.max, 5000) : 5000;
      products = products.filter(p => Number(p.salePrice || p.price) <= maxReasonable);
    }

    // Shuffle for variety
    products.sort(() => Math.random() - 0.5);
    products.splice(20);

    // If user provided location, find nearest stores for each product
    let nearbyStores: any[] = [];
    if (params.latitude && params.longitude) {
      try {
        nearbyStores = await this.dataSource.query(`
          SELECT s.id, s.name, s.slug, s.latitude, s.longitude, s.address, s.categories,
            ST_Distance(s.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
          FROM stores s
          WHERE s."isActive" = true
            AND s.categories::jsonb ?| ARRAY[${cats.map((_, i) => `$${i + 3}`).join(',')}]
          ORDER BY distance ASC
          LIMIT 10
        `, [params.longitude, params.latitude, ...cats]);
      } catch {
        // PostGIS not available, skip distance calculation
      }
    }

    // Group products by category for better presentation
    const grouped: Record<string, any[]> = {};
    for (const product of products) {
      const mainCat = (product.categories as string[])?.[0] || 'Diğer';
      if (!grouped[mainCat]) grouped[mainCat] = [];
      grouped[mainCat].push(product);
    }

    return {
      success: true,
      data: {
        suggestions: products,
        grouped,
        nearbyStores,
        criteria: {
          ageGroup,
          categories: cats,
          occasion: params.occasion,
          budget: params.budget,
        },
      },
    };
  }
}
