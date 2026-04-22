# Beacon Bazaar - Konum Bazli E-Ticaret Platformu

## Proje Yapisi

Yarn workspaces ile monorepo. 3 ana uygulama + 1 shared paket:

```
apps/web/        - React 18 + Vite + TypeScript (port 3000)
apps/mobile/     - React Native 0.73 + TypeScript
apps/backend/    - NestJS 10 + TypeScript + PostgreSQL (port 4000)
packages/shared/ - Ortak tipler ve sabitler (@beacon-bazaar/shared)
```

## Gelistirme Komutlari

```bash
yarn install                                      # Bagimliliklari yukle
yarn dev:web                                      # Web frontend (localhost:3000)
yarn dev:backend                                  # Backend API (localhost:4000)
docker-compose -f docker-compose.dev.yml up -d    # Redis & Elasticsearch
```

Backend dogrudan calistirmak icin:
```bash
cd apps/backend && node_modules/.bin/nest start --watch
```

Web dogrudan calistirmak icin:
```bash
cd apps/web && node_modules/.bin/vite
```

## Veritabani

- **PostgreSQL**: Supabase uzerinde. `DATABASE_URL` env degiskeni ile baglanir.
- **Redis**: Cache ve kuyruk yonetimi (Bull). Docker ile calisir.
- **Elasticsearch**: Urun/magaza arama indeksleme. Docker ile calisir.
- **pg_trgm**: Fuzzy arama icin PostgreSQL uzantisi (otomatik etkinlestirilir).

Entity'ler: `apps/backend/src/database/entities/` altinda. Yeni entity eklendiginde `index.ts`'ye export edilmeli ve `app.module.ts`'deki TypeOrmModule entities dizisine eklenmeli.

**NOT**: Supabase'deki `beacon_app` kullanicisi `ALTER TABLE` ve `CREATE TABLE` yetkilerine sahip degil. Yeni tablo/kolon eklemek icin Supabase SQL Editor kullanilmali.

## API Docs

Backend calisirken: http://localhost:4000/api/docs (Swagger)

---

## Mimari Kurallar

### Genel

- **Dil**: Tum kod Ingilizce, UI metinleri Turkce
- **TypeScript**: Strict mode, `noImplicitAny`, `strictNullChecks` aktif
- **Import**: Path alias kullan, relative import yerine
- **Shared types**: Ortak tipler `@beacon-bazaar/shared` paketinden import edilmeli
- **.env dosyalari**: Git'e ASLA commit edilmemeli. `.env.example` sablonlari kullanilmali

### Frontend (apps/web/)

#### Atomic Design Hiyerarsisi
```
atoms/       -> Temel UI elemanlari (Button, Input, Badge, Icon, Spinner, Typography)
molecules/   -> Basit bilesim (SearchBar, ProductCard, StoreCard, Rating, NavItem)
organisms/   -> Karmasik yapilar (Header, Footer, CategoryBar, FilterPanel, UserPanel, FloatingCart)
templates/   -> Sayfa iskeletleri (MainTemplate, AuthTemplate, MapTemplate)
pages/       -> Tam sayfalar (HomePage, LoginPage, MapPage, vb.)
```

#### Feature-First Yapi
Her ozellik kendi klasorunde, alt yapisi standart:
```
features/{feature-name}/
  components/   -> Ozellige ozel bilesenler
  hooks/        -> Ozellige ozel hook'lar
  services/     -> Ozellige ozel API cagrilari
  store/        -> Ozellige ozel Redux slice'lari
```

Mevcut feature'lar: `appointment`, `auth`, `cart`, `map`, `product`, `search`, `shop`, `user`

#### State Yonetimi (Redux Toolkit)
- Slice'lar: `apps/web/src/store/slices/` altinda
- Mevcut slice'lar: `authSlice`, `cartSlice`, `favoriteSlice`, `mapSlice`, `productSlice`, `storeSlice`, `uiSlice`
- Hook'lar: `useAppDispatch`, `useAppSelector` (`store/hooks.ts`)

#### API Servisleri
- Tumu `apps/web/src/services/api/` altinda
- Axios client: `client.ts` (base URL, interceptor'lar)
- Her modul icin ayri servis dosyasi: `auth.service.ts`, `product.service.ts`, `store.service.ts`, vb.

#### Path Alias'lari
```
@/           -> src/
@components  -> src/components
@features    -> src/features
@hooks       -> src/hooks
@services    -> src/services
@store       -> src/store
@utils       -> src/utils
@config      -> src/config
```

#### UI Framework
- **MUI (Material-UI) v5**: Birincil UI kutuphanesi
- **Tailwind CSS**: Yardimci stiller icin
- **Framer Motion**: Animasyonlar
- **GSAP**: Karmasik animasyonlar (HomePage fire efekti vb.)
- **Leaflet / Azure Maps**: Harita bilesenleri

### Backend (apps/backend/)

#### Modul Yapisi (NestJS)
Her modul standart NestJS yapisi izler:
```
{module-name}/
  {module-name}.controller.ts   -> Route handler'lari
  {module-name}.service.ts      -> Is mantigi
  {module-name}.module.ts       -> Modul tanimlamasi
  dto/                          -> Data Transfer Object'leri (class-validator ile)
```

#### Mevcut Moduller (17 adet)
| Modul | Aciklama |
|-------|----------|
| `auth` | JWT authentication, Passport stratejileri, role guard |
| `user` | Kullanici yonetimi, profil |
| `product` | Urun CRUD, arama (fuzzy + Turkce normalizasyon), fiyat alarmi, hediye onerileri |
| `store` | Magaza yonetimi, yakinlik aramasi, takip, inceleme |
| `order` | Siparis yonetimi |
| `payment` | Odeme isleme |
| `search` | Elasticsearch entegrasyonu |
| `location` | Konum servisleri, geocoding |
| `beacon` | BLE beacon fonksiyonlari |
| `notification` | Bildirim sistemi |
| `appointment` | Randevu yonetimi |
| `favorite` | Favori/istek listesi |
| `gift` | Hediye onerileri |
| `health` | Saglik kontrolu |
| `message` | Mesajlasma (konusma + mesaj) |
| `qa` | Soru-Cevap sistemi |
| `saved-search` | Kayitli aramalar |

#### Path Alias'lari (Backend)
```
@common/*    -> src/common/*
@config/*    -> src/config/*
@database/*  -> src/database/*
```

#### Entity Kurallari
- Tum entity'ler `src/database/entities/` altinda
- Her entity `index.ts`'den export edilmeli
- JSONB kolonlari esnek veri icin kullanilir (categories, tags, filters, address, vb.)
- `select: false`: Veritabaninda karsiligi olmayan veya gizlenmesi gereken kolonlar icin
- Spatial index: Konum bazli sorgular icin `geography` tipi ve `@Index({ spatial: true })`

#### Seed Script'leri
- `src/seed-*.ts` ve `src/create-*.ts` dosyalari development icin
- tsconfig.json'da `exclude` ile build'den dislanir
- Dogrudan `ts-node` ile calistirilir

### Mobil (apps/mobile/)

#### Navigasyon
```
RootNavigator -> AuthNavigator (Login, Register)
             -> MainTabNavigator (Home, Map, Search, Cart, Profile)
             -> ProductDetail, StoreDetail (stack)
```

#### Ozel Servisler
- `BeaconService`: BLE beacon tarama ve yakinlik algilama
- `LocationService`: GPS konum takibi

### Shared Paket (packages/shared/)

```
types/       -> API, beacon, store, product, order, appointment, user tipleri
constants/   -> API_VERSION, PAGE_SIZE, SEARCH_RADIUS, CURRENCY, ORDER_STATUS sabitleri
validators/  -> (bos - gelecek kullanim)
```

---

## Dosya Adlandirma Kurallari

| Tur | Format | Ornek |
|-----|--------|-------|
| Component | PascalCase | `SearchBar.tsx`, `ProductCard.tsx` |
| Page | PascalCase + Page | `HomePage.tsx`, `LoginPage.tsx` |
| Service | kebab-case + .service | `product.service.ts`, `auth.service.ts` |
| Entity | kebab-case + .entity | `store.entity.ts`, `price-alert.entity.ts` |
| Slice | camelCase + Slice | `authSlice.ts`, `cartSlice.ts` |
| Hook | camelCase (use prefix) | `useGeolocation.ts`, `useDebounce.ts` |
| DTO | kebab-case + .dto | `create-product.dto.ts`, `login.dto.ts` |
| Module | kebab-case + .module | `product.module.ts` |
| Guard | kebab-case + .guard | `jwt-auth.guard.ts`, `roles.guard.ts` |
| Config | kebab-case + .config | `database.config.ts`, `jwt.config.ts` |

## Yeni Modul Ekleme Kontrol Listesi

### Backend
1. `src/{modul}/` klasoru olustur (controller, service, module, dto/)
2. Entity: `src/database/entities/{modul}.entity.ts`
3. Entity'yi `src/database/entities/index.ts`'ye export et
4. Modulu `src/app.module.ts`'deki imports dizisine ekle
5. Entity'yi `app.module.ts`'deki TypeOrmModule.forRoot entities dizisine ekle
6. Supabase SQL Editor'de tabloyu olustur (CREATE TABLE)

### Frontend
1. API servisi: `src/services/api/{modul}.service.ts`
2. Gerekirse Redux slice: `src/store/slices/{modul}Slice.ts`
3. Bilesenler: Atomic Design hiyerarsisine uygun yere koy
4. Feature-specific ise: `src/features/{modul}/` altina organize et
5. Route: `src/config/routes.tsx`'e ekle

## Docker

```bash
# Development (Redis + Elasticsearch)
docker-compose -f docker-compose.dev.yml up -d

# Production (tum servisler)
docker-compose up -d
```

## CI/CD

GitHub Actions: `.github/workflows/ci.yml`
- Push/PR to main/develop tetikler
- Web: lint + vitest + build
- Backend: lint + jest (Postgres 16 service) + build
- Node 20, frozen yarn lockfile

## Test

```bash
# Backend
cd apps/backend && yarn test          # Jest unit testleri
cd apps/backend && yarn test:e2e      # E2E testleri

# Web
cd apps/web && yarn test              # Vitest
```
