/**
 * Sanal müşteri seed script
 * - 10 müşteri hesabı oluşturur
 * - Her müşteri farklı mağazalardan ürün sepete ekler
 * - Sipariş oluşturur
 * - Mağaza değerlendirmesi bırakır
 * - Mağaza takip eder
 *
 * Kullanım: REFRESH_TOKEN="..." npx tsx src/seed-customers.ts
 */

const API = 'http://localhost:4000/api/v1';

const CUSTOMERS = [
  { name: 'Zeynep', surname: 'Yılmaz', email: 'zeynep.yilmaz@test.com', password: 'Test1234' },
  { name: 'Mehmet', surname: 'Kaya', email: 'mehmet.kaya@test.com', password: 'Test1234' },
  { name: 'Ayşe', surname: 'Demir', email: 'ayse.demir@test.com', password: 'Test1234' },
  { name: 'Burak', surname: 'Çelik', email: 'burak.celik@test.com', password: 'Test1234' },
  { name: 'Elif', surname: 'Şahin', email: 'elif.sahin@test.com', password: 'Test1234' },
  { name: 'Emre', surname: 'Yıldız', email: 'emre.yildiz@test.com', password: 'Test1234' },
  { name: 'Selin', surname: 'Arslan', email: 'selin.arslan@test.com', password: 'Test1234' },
  { name: 'Oğuz', surname: 'Özkan', email: 'oguz.ozkan@test.com', password: 'Test1234' },
  { name: 'Deniz', surname: 'Koç', email: 'deniz.koc@test.com', password: 'Test1234' },
  { name: 'Ceren', surname: 'Aydın', email: 'ceren.aydin@test.com', password: 'Test1234' },
];

const REVIEW_COMMENTS = [
  'Çok kaliteli ürünler, hızlı teslimat. Kesinlikle tavsiye ederim!',
  'Ürün tam beklediğim gibiydi, mağaza çok ilgili.',
  'Fiyat/performans açısından harika bir mağaza.',
  'İkinci alışverişim, yine memnun kaldım. Teşekkürler!',
  'Paketleme çok özenli, ürün sağlam geldi.',
  'Müşteri hizmetleri çok yardımcı oldu, sorunsuz alışveriş.',
  'Hızlı kargo, kaliteli ürün. 5 yıldızı hak ediyor.',
  'Ürün çeşitliliği harika, fiyatlar uygun.',
  'Arkadaşıma da önerdim, o da memnun kaldı.',
  'Profesyonel bir mağaza, güvenle alışveriş yapabilirsiniz.',
  'Beklentimin üzerinde bir ürün geldi, çok mutluyum.',
  'Fiyatı biraz yüksek ama kalitesi buna değer.',
  'Kargo biraz geç geldi ama ürün mükemmel.',
  null, // No comment, just rating
  null,
  'Güzel ürünler, tekrar alışveriş yaparım.',
  'Hediye olarak aldım, çok beğenildi.',
  null,
  'Açıklama ile birebir aynı ürün geldi, teşekkürler.',
  'Bu mağazadan 3. alışverişim, hiç sorun yaşamadım.',
];

function randomPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomRating(): number {
  // Weighted towards 4-5 stars
  const weights = [1, 2, 5, 25, 67]; // 1-5 star weights
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return i + 1;
  }
  return 5;
}

async function registerOrLogin(customer: typeof CUSTOMERS[0]): Promise<{ token: string; userId: string } | null> {
  // Try register
  const regRes = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...customer, role: 'customer' }),
  });

  if (regRes.ok) {
    const data = await regRes.json();
    const d = data.data || data;
    return {
      token: d.tokens?.accessToken || d.accessToken || '',
      userId: d.user?.id || '',
    };
  }

  // Already exists, try login
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: customer.email, password: customer.password }),
  });

  if (loginRes.ok) {
    const data = await loginRes.json();
    const d = data.data || data;
    return {
      token: d.tokens?.accessToken || d.accessToken || '',
      userId: d.user?.id || '',
    };
  }

  return null;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  categories: string[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
}

async function main() {
  console.log('🛒 Sanal müşteri ortamı oluşturuluyor...\n');

  // Fetch stores
  const storesRes = await fetch(`${API}/stores/search?limit=100`);
  const storesData = await storesRes.json();
  const allStores: Store[] = (storesData.data || storesData || []);
  console.log(`📍 ${allStores.length} mağaza mevcut.\n`);

  let totalOrders = 0;
  let totalReviews = 0;
  let totalFollows = 0;

  for (const customer of CUSTOMERS) {
    console.log(`\n👤 ${customer.name} ${customer.surname} (${customer.email})`);

    // Register or login
    const auth = await registerOrLogin(customer);
    if (!auth?.token) {
      console.log('  ❌ Giriş yapılamadı, atlanıyor...');
      continue;
    }
    console.log(`  ✅ Hesap hazır (${auth.userId.substring(0, 8)}...)`);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`,
    };

    // Pick 3-6 random stores for this customer to interact with
    const selectedStores = randomPick(allStores, 3 + Math.floor(Math.random() * 4));

    for (const store of selectedStores) {
      // 1. Fetch products from this store
      let products: Product[] = [];
      try {
        const prodRes = await fetch(`${API}/stores/${store.id}/products`);
        const prodData = await prodRes.json();
        products = prodData.data || prodData || [];
      } catch { continue; }

      if (products.length === 0) continue;

      // 2. Create an order with 1-3 products
      const orderProducts = randomPick(products, 1 + Math.floor(Math.random() * 3));
      const orderItems = orderProducts.map(p => ({
        productId: p.id,
        quantity: 1 + Math.floor(Math.random() * 2),
        price: p.salePrice || p.price,
      }));

      try {
        const orderRes = await fetch(`${API}/orders`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            storeId: store.id,
            items: orderItems,
            shippingAddress: {
              street: 'Test Mahallesi, Test Sokak No:' + Math.floor(Math.random() * 50),
              district: ['Kadıköy', 'Beşiktaş', 'Şişli', 'Üsküdar', 'Bakırköy'][Math.floor(Math.random() * 5)],
              city: 'İstanbul',
              country: 'Türkiye',
              zipCode: '34' + String(Math.floor(Math.random() * 900) + 100),
            },
            paymentMethod: 'credit_card',
          }),
        });

        if (orderRes.ok) {
          totalOrders++;
          process.stdout.write('🛍️');
        }
      } catch { /* order endpoint may not be ready */ }

      // 3. Follow the store (70% chance)
      if (Math.random() < 0.7) {
        try {
          const followRes = await fetch(`${API}/stores/${store.id}/follow`, {
            method: 'POST',
            headers,
          });
          if (followRes.ok) {
            totalFollows++;
            process.stdout.write('❤️');
          }
        } catch { /* follow endpoint may not exist */ }
      }

      // 4. Leave a review (60% chance)
      if (Math.random() < 0.6) {
        const rating = randomRating();
        const comment = REVIEW_COMMENTS[Math.floor(Math.random() * REVIEW_COMMENTS.length)];

        try {
          const reviewRes = await fetch(`${API}/stores/${store.id}/reviews`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              rating,
              comment: comment || undefined,
            }),
          });
          if (reviewRes.ok) {
            totalReviews++;
            process.stdout.write('⭐');
          }
        } catch { /* review endpoint may not exist */ }
      }
    }
  }

  console.log(`\n\n${'═'.repeat(50)}`);
  console.log('✅ Sanal müşteri ortamı oluşturuldu!');
  console.log(`${'═'.repeat(50)}`);
  console.log(`   👤 Müşteri hesapları: ${CUSTOMERS.length}`);
  console.log(`   🛍️  Siparişler: ${totalOrders}`);
  console.log(`   ❤️  Mağaza takipleri: ${totalFollows}`);
  console.log(`   ⭐ Değerlendirmeler: ${totalReviews}`);
  console.log(`${'═'.repeat(50)}`);
}

main().catch(console.error);
