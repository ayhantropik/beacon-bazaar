import { DataSource } from 'typeorm';

const ds = new DataSource({
  type: 'postgres',
  url: 'postgresql://beacon_app.twdwhkcyxvehgzmuvkfq:BeaconBazaar2026@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
  extra: { prepared: false },
  entities: [],
});

ds.initialize()
  .then(async () => {
    console.log('Connected!');

    const userId = '819643fd-92e6-4919-82d1-5c897807f3a2';
    const storeId = '56826337-71e3-4192-9772-96f8f4b729f2';
    const productId = '8ed7b9eb-0492-4495-a78a-68f620b0b4bd';

    // Create delivered order
    await ds.query(`
      INSERT INTO orders (
        "userId", items, "shippingAddress", "billingAddress",
        "paymentMethod", "paymentStatus", status,
        subtotal, discount, "deliveryFee", total
      ) VALUES (
        $1,
        $2::jsonb,
        '{"city":"İstanbul","district":"Moda","street":"Test Sk. 1"}'::jsonb,
        '{"city":"İstanbul","district":"Moda","street":"Test Sk. 1"}'::jsonb,
        'credit_card', 'paid', 'delivered',
        362.00, 0, 0, 362.00
      )
    `, [
      userId,
      JSON.stringify([{ productId, name: 'Protein Bar Karisik 12li', price: 362, quantity: 1, storeId }]),
    ]);

    console.log('Test order created for testreviewer@test.com (delivered, Lezzet Dünyası Moda)');

    // Verify
    const orders = await ds.query(
      `SELECT id, status, items FROM orders WHERE "userId" = $1 AND status = 'delivered' LIMIT 3`,
      [userId],
    );
    console.log('Delivered orders:', orders.length);

    await ds.destroy();
    process.exit(0);
  })
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  });
