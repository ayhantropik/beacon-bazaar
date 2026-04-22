import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testConnection() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL tanımlı değil. .env dosyasını kontrol edin.');
    process.exit(1);
  }

  console.log('Supabase bağlantısı test ediliyor...');
  console.log('Host:', databaseUrl.replace(/\/\/.*:.*@/, '//***:***@'));

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Bağlantı başarılı!');

    const versionResult = await client.query('SELECT version()');
    console.log('PostgreSQL:', versionResult.rows[0].version.split(',')[0]);

    // PostGIS kontrolü
    try {
      const postgisResult = await client.query('SELECT PostGIS_Version()');
      console.log('PostGIS:', postgisResult.rows[0].postgis_version);
    } catch {
      console.log('PostGIS: yüklü değil (opsiyonel)');
    }

    // Mevcut tabloları listele
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      console.log('\nMevcut tablolar:');
      tablesResult.rows.forEach((r) => console.log('  -', r.table_name));
    } else {
      console.log('\nHenüz tablo yok. Backend başlatıldığında otomatik oluşturulacak.');
    }

    console.log('\nSupabase bağlantısı hazır!');
  } catch (error) {
    console.error('Bağlantı hatası:', (error as Error).message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();
