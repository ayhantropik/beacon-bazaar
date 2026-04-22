import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VenueEntity, VenueFloor, VenueStore, VenueBeacon } from '@database/entities/venue.entity';
import { CreateVenueDto, UpdateVenueDto, AddBeaconDto } from './dto/create-venue.dto';

@Injectable()
export class VenueService {
  constructor(
    @InjectRepository(VenueEntity)
    private readonly venueRepo: Repository<VenueEntity>,
  ) {}

  async findAll(): Promise<VenueEntity[]> {
    return this.venueRepo.find({ where: { isActive: true } });
  }

  async findById(idOrSlug: string): Promise<VenueEntity> {
    // UUID formatını kontrol et
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const venue = await this.venueRepo.findOne({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
    });

    if (!venue) {
      throw new NotFoundException(`Venue bulunamadı: ${idOrSlug}`);
    }

    return venue;
  }

  async findNearby(lat: number, lng: number, radiusKm: number): Promise<(VenueEntity & { distance: number })[]> {
    // Haversine formülü ile yakındaki venue'ları bul
    const venues = await this.venueRepo.find({ where: { isActive: true } });

    const results = venues
      .map((venue) => {
        const distance = this.haversineDistance(lat, lng, venue.latitude, venue.longitude);
        return { ...venue, distance: Math.round(distance * 100) / 100 };
      })
      .filter((v) => v.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return results;
  }

  async create(dto: CreateVenueDto): Promise<VenueEntity> {
    const venue = this.venueRepo.create({
      ...dto,
      slug: dto.slug || this.slugify(dto.name),
    });
    return this.venueRepo.save(venue);
  }

  async update(id: string, dto: UpdateVenueDto): Promise<VenueEntity> {
    const venue = await this.findById(id);
    Object.assign(venue, dto);
    return this.venueRepo.save(venue);
  }

  async addBeacon(venueId: string, beacon: AddBeaconDto): Promise<VenueEntity> {
    const venue = await this.findById(venueId);
    const beacons = venue.beacons || [];
    beacons.push(beacon as VenueBeacon);
    venue.beacons = beacons;
    return this.venueRepo.save(venue);
  }

  // ─── Seed Demo Data ─────────────────────────────────────────────

  async seed(): Promise<{ message: string; count: number }> {
    // Mevcut verileri temizle
    await this.venueRepo.manager.query('DELETE FROM venues');

    // DB'deki mağazaları çek — AVM mağazalarıyla eşleştirmek için
    let dbStores: any[] = [];
    try {
      dbStores = await this.venueRepo.manager.query('SELECT id, name FROM stores LIMIT 500');
    } catch { /* stores tablosu yoksa devam */ }

    const findStoreId = (name: string): string | undefined => {
      const lower = name.toLowerCase();
      const match = dbStores.find((s: any) => s.name.toLowerCase().includes(lower) || lower.includes(s.name.toLowerCase()));
      return match?.id;
    };

    const venues = [
      this.createForumIstanbul(findStoreId),
      this.createCevahir(findStoreId),
      this.createIstinyePark(findStoreId),
    ];

    await this.venueRepo.save(venues);
    return { message: 'Demo venue verileri oluşturuldu', count: venues.length };
  }

  // ─── Forum Istanbul ─────────────────────────────────────────────
  // Gerçek konum: 41.0397, 28.8895 (Bayrampaşa, Kocatepe Mah.)

  private createForumIstanbul(findStoreId: (name: string) => string | undefined): VenueEntity {
    const centerLat = 41.0397;
    const centerLng = 28.8895;

    const groundFloorStores = this.buildStores(centerLat, centerLng, 0, [
      { name: 'Zara', type: 'giyim', color: '#1a1a1a', row: 0, col: 0 },
      { name: 'H&M', type: 'giyim', color: '#cc0000', row: 0, col: 1 },
      { name: 'Mango', type: 'giyim', color: '#f5a623', row: 0, col: 2 },
      { name: 'LC Waikiki', type: 'giyim', color: '#e91e63', row: 0, col: 3 },
      { name: 'Migros', type: 'market', color: '#ff6600', row: 1, col: 0 },
      { name: 'Starbucks', type: 'kafe', color: '#00704a', row: 1, col: 1 },
      { name: 'Burger King', type: 'restoran', color: '#ff8c00', row: 1, col: 2 },
      { name: 'Eczane', type: 'saglik', color: '#4caf50', row: 1, col: 3 },
    ], findStoreId);

    const firstFloorStores = this.buildStores(centerLat, centerLng, 1, [
      { name: 'Apple Store', type: 'elektronik', color: '#a2aaad', row: 0, col: 0 },
      { name: 'Samsung', type: 'elektronik', color: '#1428a0', row: 0, col: 1 },
      { name: 'MediaMarkt', type: 'elektronik', color: '#df0000', row: 0, col: 2 },
      { name: 'Nike', type: 'giyim', color: '#111111', row: 0, col: 3 },
      { name: 'Adidas', type: 'giyim', color: '#000000', row: 1, col: 0 },
      { name: 'Sephora', type: 'kozmetik', color: '#000000', row: 1, col: 1 },
      { name: 'Watsons', type: 'kozmetik', color: '#00a19a', row: 1, col: 2 },
      { name: 'Kitapyurdu', type: 'kitap', color: '#2196f3', row: 1, col: 3 },
    ], findStoreId);

    const secondFloorStores = this.buildStores(centerLat, centerLng, 2, [
      { name: 'Cinemaximum', type: 'sinema', color: '#9c27b0', row: 0, col: 0, wide: true },
      { name: 'Bowling', type: 'eglence', color: '#ff5722', row: 0, col: 2 },
      { name: 'Oyun Alanı', type: 'eglence', color: '#ffc107', row: 0, col: 3 },
      { name: 'Food Court A', type: 'restoran', color: '#795548', row: 1, col: 0 },
      { name: 'Food Court B', type: 'restoran', color: '#8d6e63', row: 1, col: 1 },
      { name: 'Food Court C', type: 'restoran', color: '#a1887f', row: 1, col: 2 },
      { name: 'Food Court D', type: 'restoran', color: '#bcaaa4', row: 1, col: 3 },
    ], findStoreId);

    const floors: VenueFloor[] = [
      this.buildFloor(0, 'Zemin Kat', groundFloorStores),
      this.buildFloor(1, '1. Kat', firstFloorStores),
      this.buildFloor(2, '2. Kat', secondFloorStores),
    ];

    const beacons = this.buildBeacons(centerLat, centerLng, 'FORUM', groundFloorStores, firstFloorStores);

    const venue = new VenueEntity();
    venue.name = 'Forum İstanbul';
    venue.slug = 'forum-istanbul';
    venue.description = 'İstanbul Bayrampaşa\'da bulunan büyük alışveriş ve eğlence merkezi';
    venue.address = 'Kocatepe, Paşa Cd., 34045 Bayrampaşa/İstanbul';
    venue.city = 'İstanbul';
    venue.latitude = centerLat;
    venue.longitude = centerLng;
    venue.imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Forum_Istanbul.jpg/1280px-Forum_Istanbul.jpg';
    venue.floors = floors;
    venue.beacons = beacons;
    venue.isActive = true;
    return venue;
  }

  // ─── Cevahir AVM ────────────────────────────────────────────────
  // Gerçek konum: 41.0636, 28.9897 (Şişli, Mecidiyeköy)

  private createCevahir(findStoreId: (name: string) => string | undefined): VenueEntity {
    const centerLat = 41.0636;
    const centerLng = 28.9897;

    const groundFloorStores = this.buildStores(centerLat, centerLng, 0, [
      { name: 'Beymen', type: 'giyim', color: '#000000', row: 0, col: 0 },
      { name: 'Vakko', type: 'giyim', color: '#1a1a2e', row: 0, col: 1 },
      { name: 'Koton', type: 'giyim', color: '#e74c3c', row: 0, col: 2 },
      { name: 'DeFacto', type: 'giyim', color: '#3498db', row: 0, col: 3 },
      { name: 'Gratis', type: 'kozmetik', color: '#e91e63', row: 1, col: 0 },
      { name: 'Kahve Dünyası', type: 'kafe', color: '#4e342e', row: 1, col: 1 },
      { name: 'Pizza Hut', type: 'restoran', color: '#d32f2f', row: 1, col: 2 },
      { name: 'A101', type: 'market', color: '#1565c0', row: 1, col: 3 },
    ], findStoreId);

    const firstFloorStores = this.buildStores(centerLat, centerLng, 1, [
      { name: 'Teknosa', type: 'elektronik', color: '#ff6f00', row: 0, col: 0 },
      { name: 'Vatan Bilgisayar', type: 'elektronik', color: '#0d47a1', row: 0, col: 1 },
      { name: 'Puma', type: 'giyim', color: '#000000', row: 0, col: 2 },
      { name: 'New Balance', type: 'giyim', color: '#c62828', row: 0, col: 3 },
      { name: 'Pandora', type: 'aksesuar', color: '#f8bbd0', row: 1, col: 0 },
      { name: 'Atasun Optik', type: 'saglik', color: '#1b5e20', row: 1, col: 1 },
      { name: 'D&R', type: 'kitap', color: '#6a1b9a', row: 1, col: 2 },
      { name: 'Mavi', type: 'giyim', color: '#1976d2', row: 1, col: 3 },
    ], findStoreId);

    const secondFloorStores = this.buildStores(centerLat, centerLng, 2, [
      { name: 'Mars Cinema', type: 'sinema', color: '#880e4f', row: 0, col: 0, wide: true },
      { name: 'Funlab', type: 'eglence', color: '#ff9800', row: 0, col: 2 },
      { name: 'Buz Pisti', type: 'eglence', color: '#00bcd4', row: 0, col: 3 },
      { name: 'KFC', type: 'restoran', color: '#b71c1c', row: 1, col: 0 },
      { name: 'McDonald\'s', type: 'restoran', color: '#ffc107', row: 1, col: 1 },
      { name: 'Sbarro', type: 'restoran', color: '#2e7d32', row: 1, col: 2 },
      { name: 'Popeyes', type: 'restoran', color: '#e65100', row: 1, col: 3 },
    ], findStoreId);

    const floors: VenueFloor[] = [
      this.buildFloor(0, 'Zemin Kat', groundFloorStores),
      this.buildFloor(1, '1. Kat', firstFloorStores),
      this.buildFloor(2, '2. Kat', secondFloorStores),
    ];

    const beacons = this.buildBeacons(centerLat, centerLng, 'CEVAHIR', groundFloorStores, firstFloorStores);

    const venue = new VenueEntity();
    venue.name = 'Cevahir AVM';
    venue.slug = 'cevahir-avm';
    venue.description = 'Şişli\'de bulunan Avrupa\'nın en büyük alışveriş merkezlerinden biri';
    venue.address = 'Mecidiyeköy, Büyükdere Cd. No:22, 34387 Şişli/İstanbul';
    venue.city = 'İstanbul';
    venue.latitude = centerLat;
    venue.longitude = centerLng;
    venue.imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Cevahir_Shopping_Mall.jpg/1280px-Cevahir_Shopping_Mall.jpg';
    venue.floors = floors;
    venue.beacons = beacons;
    venue.isActive = true;
    return venue;
  }

  // ─── İstinye Park ───────────────────────────────────────────────
  // Gerçek konum: 41.1147, 29.0590 (Sarıyer, İstinye)

  private createIstinyePark(findStoreId: (name: string) => string | undefined): VenueEntity {
    const centerLat = 41.1147;
    const centerLng = 29.0590;

    const groundFloorStores = this.buildStores(centerLat, centerLng, 0, [
      { name: 'Louis Vuitton', type: 'giyim', color: '#3d2b1f', row: 0, col: 0 },
      { name: 'Gucci', type: 'giyim', color: '#006633', row: 0, col: 1 },
      { name: 'Prada', type: 'giyim', color: '#000000', row: 0, col: 2 },
      { name: 'Burberry', type: 'giyim', color: '#b8860b', row: 0, col: 3 },
      { name: 'Dior', type: 'kozmetik', color: '#c0c0c0', row: 1, col: 0 },
      { name: 'Nespresso', type: 'kafe', color: '#5d4037', row: 1, col: 1 },
      { name: 'Nusr-Et', type: 'restoran', color: '#b71c1c', row: 1, col: 2 },
      { name: 'Macrocenter', type: 'market', color: '#388e3c', row: 1, col: 3 },
    ], findStoreId);

    const firstFloorStores = this.buildStores(centerLat, centerLng, 1, [
      { name: 'Apple Store', type: 'elektronik', color: '#a2aaad', row: 0, col: 0 },
      { name: 'Dyson', type: 'elektronik', color: '#6c757d', row: 0, col: 1 },
      { name: 'Tommy Hilfiger', type: 'giyim', color: '#003366', row: 0, col: 2 },
      { name: 'Calvin Klein', type: 'giyim', color: '#000000', row: 0, col: 3 },
      { name: 'Tiffany & Co', type: 'aksesuar', color: '#81d8d0', row: 1, col: 0 },
      { name: 'Cartier', type: 'aksesuar', color: '#9b1b30', row: 1, col: 1 },
      { name: 'MAC', type: 'kozmetik', color: '#000000', row: 1, col: 2 },
      { name: 'Jo Malone', type: 'kozmetik', color: '#f5f5dc', row: 1, col: 3 },
    ], findStoreId);

    const secondFloorStores = this.buildStores(centerLat, centerLng, 2, [
      { name: 'Cinemaximum', type: 'sinema', color: '#9c27b0', row: 0, col: 0, wide: true },
      { name: 'Trampolin Park', type: 'eglence', color: '#ff5722', row: 0, col: 2 },
      { name: 'Çocuk Dünyası', type: 'eglence', color: '#ffc107', row: 0, col: 3 },
      { name: 'Zuma', type: 'restoran', color: '#212121', row: 1, col: 0 },
      { name: 'Wagamama', type: 'restoran', color: '#b71c1c', row: 1, col: 1 },
      { name: 'Eataly', type: 'restoran', color: '#1b5e20', row: 1, col: 2 },
      { name: 'The House Cafe', type: 'kafe', color: '#795548', row: 1, col: 3 },
    ], findStoreId);

    const floors: VenueFloor[] = [
      this.buildFloor(0, 'Zemin Kat', groundFloorStores),
      this.buildFloor(1, '1. Kat', firstFloorStores),
      this.buildFloor(2, '2. Kat', secondFloorStores),
    ];

    const beacons = this.buildBeacons(centerLat, centerLng, 'ISTINYE', groundFloorStores, firstFloorStores);

    const venue = new VenueEntity();
    venue.name = 'İstinye Park';
    venue.slug = 'istinye-park';
    venue.description = 'Sarıyer\'de bulunan lüks alışveriş merkezi';
    venue.address = 'İstinye Bayırı Cd. No:73, 34460 Sarıyer/İstanbul';
    venue.city = 'İstanbul';
    venue.latitude = centerLat;
    venue.longitude = centerLng;
    venue.imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Istinye_Park.jpg/1280px-Istinye_Park.jpg';
    venue.floors = floors;
    venue.beacons = beacons;
    venue.isActive = true;
    return venue;
  }

  // ─── Helper: Store Grid Builder ─────────────────────────────────

  private buildStores(
    centerLat: number,
    centerLng: number,
    floor: number,
    defs: { name: string; type: string; color: string; row: number; col: number; wide?: boolean }[],
    findStoreId?: (name: string) => string | undefined,
  ): VenueStore[] {
    // Her mağaza ~20m x 15m boyutunda bir dikdörtgen
    // 1 derece lat ~111km, 1 derece lng ~85km (41. enlemde)
    const storeWidthDeg = 0.00025;  // ~20m
    const storeHeightDeg = 0.00015; // ~15m
    const gapDeg = 0.00005;         // ~4m ara

    // Grid sol-üst köşe (venue merkezinden ofset)
    const gridOriginLat = centerLat + 0.00035;
    const gridOriginLng = centerLng - 0.00055;

    return defs.map((def, idx) => {
      const effectiveWidth = def.wide ? storeWidthDeg * 2 + gapDeg : storeWidthDeg;

      const minLng = gridOriginLng + def.col * (storeWidthDeg + gapDeg);
      const maxLng = minLng + effectiveWidth;
      const maxLat = gridOriginLat - def.row * (storeHeightDeg + gapDeg);
      const minLat = maxLat - storeHeightDeg;

      const storeCenterLat = (minLat + maxLat) / 2;
      const storeCenterLng = (minLng + maxLng) / 2;

      // GeoJSON Polygon koordinatları (kapalı ring: 5 nokta)
      const polygon: number[][] = [
        [minLng, maxLat],  // sol-üst
        [maxLng, maxLat],  // sağ-üst
        [maxLng, minLat],  // sağ-alt
        [minLng, minLat],  // sol-alt
        [minLng, maxLat],  // kapalı ring
      ];

      return {
        id: `store-${floor}-${idx}`,
        name: def.name,
        type: def.type,
        polygon,
        centerLat: storeCenterLat,
        centerLng: storeCenterLng,
        storeId: findStoreId?.(def.name),
        floor,
        color: def.color,
      };
    });
  }

  // ─── Helper: Floor Builder ──────────────────────────────────────

  private buildFloor(level: number, name: string, stores: VenueStore[]): VenueFloor {
    // GeoJSON FeatureCollection oluştur
    const features = stores.map((store) => ({
      type: 'Feature' as const,
      properties: {
        id: store.id,
        name: store.name,
        type: store.type,
        floor: store.floor,
        color: store.color,
        storeId: store.storeId,
        centerLat: store.centerLat,
        centerLng: store.centerLng,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [store.polygon],
      },
    }));

    const geojson = {
      type: 'FeatureCollection' as const,
      features,
    };

    return { level, name, geojson, stores };
  }

  // ─── Helper: Beacon Builder ─────────────────────────────────────

  private buildBeacons(
    centerLat: number,
    centerLng: number,
    venuePrefix: string,
    floor0Stores: VenueStore[],
    floor1Stores: VenueStore[],
  ): VenueBeacon[] {
    const beacons: VenueBeacon[] = [];
    const uuid = `B9407F30-F5F8-466E-AFF9-25556B57FE6D`;

    // Her kattaki her mağazanın merkezine bir beacon koy
    const allStores = [...floor0Stores, ...floor1Stores];

    allStores.forEach((store, idx) => {
      beacons.push({
        id: `${venuePrefix}-BCN-${String(idx + 1).padStart(3, '0')}`,
        uuid,
        major: store.floor + 1,
        minor: idx + 1,
        latitude: store.centerLat,
        longitude: store.centerLng,
        floor: store.floor,
        txPower: -59,
        storeId: store.storeId,
        storeName: store.name,
      });
    });

    // Koridor beacon'ları (her katta 2 adet)
    for (let floor = 0; floor <= 1; floor++) {
      beacons.push({
        id: `${venuePrefix}-BCN-HALL-${floor}-A`,
        uuid,
        major: floor + 1,
        minor: 100 + floor * 10 + 1,
        latitude: centerLat + 0.00015,
        longitude: centerLng - 0.00020,
        floor,
        txPower: -65,
      });
      beacons.push({
        id: `${venuePrefix}-BCN-HALL-${floor}-B`,
        uuid,
        major: floor + 1,
        minor: 100 + floor * 10 + 2,
        latitude: centerLat - 0.00015,
        longitude: centerLng + 0.00020,
        floor,
        txPower: -65,
      });
    }

    return beacons;
  }

  // ─── Helper: Haversine Distance ─────────────────────────────────

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // ─── Helper: Slugify ────────────────────────────────────────────

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/İ/g, 'i')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
