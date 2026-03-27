# Beacon Bazaar - Konum Bazli E-Ticaret Platformu

## Proje Yapisi

Yarn workspaces ile monorepo. 3 ana uygulama + 1 shared paket:

```
apps/web/       - React 18 + Vite + TypeScript (port 3000)
apps/mobile/    - React Native + TypeScript
apps/backend/   - NestJS + TypeScript + PostgreSQL (port 4000)
packages/shared/ - Ortak tipler ve sabitler
```

## Gelistirme Komutlari

```bash
yarn install                # Bagimliliklari yukle
yarn dev:web               # Web frontend basalt (localhost:3000)
yarn dev:backend           # Backend basalt (localhost:4000)
docker-compose -f docker-compose.dev.yml up -d  # Redis & Elasticsearch baslat
# Supabase: DATABASE_URL'i .env dosyasina ekle
```

## Mimari Kurallar

- **Atomic Design**: atoms > molecules > organisms > templates > pages
- **Feature-first**: Her ozellik kendi klasorunde (components, hooks, services, store)
- **Shared types**: Tipler `@beacon-bazaar/shared` paketinden import edilmeli
- **API servisleri**: `apps/web/src/services/api/` altinda, axios client ile
- **Redux**: Her slice `apps/web/src/store/slices/` altinda
- **Path alias**: `@components`, `@features`, `@hooks`, `@services`, `@store`, `@utils`, `@config`

## Backend Modulleri

auth, user, product, store, order, payment, search, location, beacon, notification, appointment, health

## Veritabani

Supabase (PostgreSQL) + Redis + Elasticsearch. Entity'ler `apps/backend/src/database/entities/` altinda.
`DATABASE_URL` env degiskeni ile Supabase'e baglanir. Local development icin ayri DB parametreleri de desteklenir.

## API Docs

Backend calisirken: http://localhost:4000/api/docs (Swagger)
