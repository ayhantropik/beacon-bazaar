import { DataSource } from 'typeorm';
import { PriceAlertEntity } from './database/entities/price-alert.entity';

const ds = new DataSource({
  type: 'postgres',
  url: 'postgresql://beacon_app.twdwhkcyxvehgzmuvkfq:BeaconBazaar2026@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
  extra: { prepared: false },
  entities: [PriceAlertEntity],
  synchronize: true,
});

ds.initialize()
  .then(async () => {
    console.log('Sync done! Table created.');
    const r = await ds.query('SELECT COUNT(*) FROM price_alerts');
    console.log('Access OK:', r);
    await ds.destroy();
    process.exit(0);
  })
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  });
