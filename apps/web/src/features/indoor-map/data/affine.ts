/**
 * ─── Affine Transform ────────────────────────────────────────
 *
 * 3 anchor noktası kullanarak görsel (piksel) koordinatlarını
 * harita (geo) koordinatlarına dönüştürür.
 *
 * MATEMATİK:
 *   Affine dönüşüm 6 bilinmeyenli bir denklem sistemidir:
 *
 *     lon = a * x + b * y + c
 *     lat = d * x + e * y + f
 *
 *   3 nokta = 6 denklem → 6 bilinmeyen çözülebilir.
 *
 *   Bu, görseldeki herhangi bir (x,y) piksel koordinatını
 *   haritadaki (lon,lat) koordinatına dönüştürmeye yarar.
 *
 *   Döndürme, ölçekleme ve öteleme içerir.
 *   Perspektif düzeltme İÇERMEZ (bunun için 4 nokta + homography gerekir).
 *
 * KULLANIM:
 *   // 1. Anchor verisiyle transform hesapla
 *   const transform = computeAffine(anchorData);
 *
 *   // 2. Herhangi bir piksel koordinatını geo'ya çevir
 *   const [lon, lat] = imageToGeo(transform, 350, 420);
 */

// ─── Tipler ───

/** Anchor noktası verisi — AnchorTool'dan çıkan JSON */
export interface AnchorData {
  image: [number, number][];  // [[x1,y1], [x2,y2], [x3,y3]]
  geo: [number, number][];    // [[lon1,lat1], [lon2,lat2], [lon3,lat3]]
}

/** Hesaplanmış affine transform katsayıları */
export interface AffineTransform {
  a: number; b: number; c: number;  // lon = a*x + b*y + c
  d: number; e: number; f: number;  // lat = d*x + e*y + f
}

// ─── Hesaplama ───

/**
 * 3 anchor noktasından affine transform katsayılarını hesaplar.
 *
 * @param data  AnchorTool'dan çıkan { image, geo } verisi
 * @returns     6 katsayı: a, b, c, d, e, f
 *
 * @example
 * const data = {
 *   image: [[100, 50], [500, 50], [100, 600]],
 *   geo: [[28.990, 41.064], [28.994, 41.064], [28.990, 41.061]]
 * };
 * const t = computeAffine(data);
 */
export function computeAffine(data: AnchorData): AffineTransform {
  // Kısaltmalar
  const [[x1, y1], [x2, y2], [x3, y3]] = data.image;
  const [[lon1, lat1], [lon2, lat2], [lon3, lat3]] = data.geo;

  /**
   * Denklem sistemi:
   *   lon1 = a*x1 + b*y1 + c
   *   lon2 = a*x2 + b*y2 + c
   *   lon3 = a*x3 + b*y3 + c
   *
   * Matris formu: A * [a, b, c]^T = [lon1, lon2, lon3]^T
   *
   *   | x1  y1  1 |   | a |   | lon1 |
   *   | x2  y2  1 | * | b | = | lon2 |
   *   | x3  y3  1 |   | c |   | lon3 |
   *
   * Cramer kuralı veya Gauss eliminasyonu ile çözülür.
   * Burada doğrudan Cramer kuralı kullanıyoruz.
   */

  // Determinant hesapla
  //   | x1  y1  1 |
  //   | x2  y2  1 |
  //   | x3  y3  1 |
  const det = x1 * (y2 - y3) - y1 * (x2 - x3) + (x2 * y3 - x3 * y2);

  if (Math.abs(det) < 1e-10) {
    throw new Error('Anchor noktaları aynı doğru üzerinde — 3 farklı nokta seçin');
  }

  // Longitude katsayıları (a, b, c)
  //   a = | lon1  y1  1 |
  //       | lon2  y2  1 | / det
  //       | lon3  y3  1 |
  const a = (lon1 * (y2 - y3) - y1 * (lon2 - lon3) + (lon2 * y3 - lon3 * y2)) / det;
  const b = (x1 * (lon2 - lon3) - lon1 * (x2 - x3) + (x2 * lon3 - x3 * lon2)) / det;
  const c = (x1 * (y2 * lon3 - y3 * lon2) - y1 * (x2 * lon3 - x3 * lon2) + lon1 * (x2 * y3 - x3 * y2)) / det;

  // Latitude katsayıları (d, e, f)
  const d = (lat1 * (y2 - y3) - y1 * (lat2 - lat3) + (lat2 * y3 - lat3 * y2)) / det;
  const e = (x1 * (lat2 - lat3) - lat1 * (x2 - x3) + (x2 * lat3 - x3 * lat2)) / det;
  const f = (x1 * (y2 * lat3 - y3 * lat2) - y1 * (x2 * lat3 - x3 * lat2) + lat1 * (x2 * y3 - x3 * y2)) / det;

  return { a, b, c, d, e, f };
}

// ─── Dönüştürme ───

/**
 * Görsel piksel koordinatını harita geo koordinatına dönüştürür.
 *
 * @param t     computeAffine() ile hesaplanmış transform
 * @param x     Piksel X koordinatı
 * @param y     Piksel Y koordinatı
 * @returns     [longitude, latitude]
 *
 * @example
 * const t = computeAffine(anchorData);
 * const [lon, lat] = imageToGeo(t, 350, 420);
 * // → [28.992, 41.062]
 */
export function imageToGeo(t: AffineTransform, x: number, y: number): [number, number] {
  const lon = t.a * x + t.b * y + t.c;
  const lat = t.d * x + t.e * y + t.f;
  return [lon, lat];
}

/**
 * Harita geo koordinatını görsel piksel koordinatına dönüştürür (ters yön).
 *
 * @param t     computeAffine() ile hesaplanmış transform
 * @param lon   Longitude
 * @param lat   Latitude
 * @returns     [x, y] piksel
 */
export function geoToImage(t: AffineTransform, lon: number, lat: number): [number, number] {
  // Ters affine: 2x2 matris inversiyonu
  //   | a  b |^-1     1     |  e  -b |
  //   | d  e |    = ------ * | -d   a |
  //                 ae - bd
  const det2 = t.a * t.e - t.b * t.d;
  if (Math.abs(det2) < 1e-15) throw new Error('Transform terslenemez');

  const x = (t.e * (lon - t.c) - t.b * (lat - t.f)) / det2;
  const y = (t.a * (lat - t.f) - t.d * (lon - t.c)) / det2;
  return [Math.round(x), Math.round(y)];
}

// ─── Yardımcı: Mağaza grid'ini dönüştür ───

/**
 * Bir mağaza listesini görsel koordinatlarından geo koordinatlarına dönüştürür.
 *
 * @param transform  computeAffine() ile hesaplanmış transform
 * @param stores     Görsel üzerindeki mağaza verileri [{name, imageX, imageY}]
 * @returns          Geo koordinatlı mağaza poligonları
 *
 * @example
 * const stores = [
 *   { name: 'Zara', imageX: 150, imageY: 200 },
 *   { name: 'H&M', imageX: 350, imageY: 200 },
 * ];
 * const geoStores = transformStores(t, stores, 40, 30);
 */
export function transformStores(
  transform: AffineTransform,
  stores: { name: string; imageX: number; imageY: number; type?: string; color?: string }[],
  storeWidth = 40,   // piksel cinsinden mağaza genişliği
  storeHeight = 30,  // piksel cinsinden mağaza yüksekliği
) {
  return stores.map(store => {
    // Mağazanın 4 köşesini dönüştür
    const halfW = storeWidth / 2;
    const halfH = storeHeight / 2;
    const corners: [number, number][] = [
      imageToGeo(transform, store.imageX - halfW, store.imageY - halfH), // sol-üst
      imageToGeo(transform, store.imageX + halfW, store.imageY - halfH), // sağ-üst
      imageToGeo(transform, store.imageX + halfW, store.imageY + halfH), // sağ-alt
      imageToGeo(transform, store.imageX - halfW, store.imageY + halfH), // sol-alt
    ];
    // Kapalı ring
    corners.push(corners[0]);

    return {
      name: store.name,
      type: store.type || 'default',
      color: store.color || '#3b82f6',
      coordinates: corners,
    };
  });
}
