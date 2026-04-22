import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductEntity } from '../database/entities/product.entity';
import Anthropic from '@anthropic-ai/sdk';

export interface GiftConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GiftFormData {
  name: string;
  age: number;
  birthDate?: string;
  birthTime?: string;
  zodiacSign?: string;
  ascendantSign?: string;
  gender: string;
  education?: string;
  hobbies?: string[];
  occasion: string;
  giftDate?: string;
  relationship: string;
  budget?: { min: number; max: number };
  /** Daha önce bu kişiye alınan hediyeler */
  pastGifts?: Array<{
    productName: string;
    occasion: string;
    giftDate: string;
    reason?: string;
    rating?: number;
  }>;
  /** Hızlı mod — kayıtlı kişi için soru sormadan doğrudan öneri */
  quickMode?: boolean;
  /** Daha önceki AI sohbetinin özeti (hızlı mod) */
  lastConversation?: string;
  /** AI'ın önceki analiz notları */
  aiInsights?: string;
}

export interface GiftAIRequest {
  messages: GiftConversationMessage[];
  context?: {
    recipientName?: string;
    age?: number;
    gender?: string;
    relationship?: string;
    interests?: string[];
    occasion?: string;
    budget?: { min: number; max: number };
    latitude?: number;
    longitude?: number;
  };
  formData?: GiftFormData;
}

export interface GiftAIResponse {
  message: string;
  products?: any[];
  nearbyStores?: any[];
  followUpQuestions?: string[];
  analysisComplete?: boolean;
  analysis?: {
    giftType?: string;
    reasoning?: string;
    personality?: string;
    emotionalNeed?: string;
    categories?: string[];
    tags?: string[];
    excludeTags?: string[];
    priceRange?: { min: number; max: number };
    ocean?: OceanScores;
    giftDateInsight?: string;
  };
}

/** Big Five (OCEAN) personality scores — 0 to 1 */
interface OceanScores {
  openness: number;       // yaratıcılık, merak, yeni deneyim
  conscientiousness: number; // düzen, planlılık, pratiklik
  extraversion: number;   // sosyallik, enerji, dışadönüklük
  agreeableness: number;  // uyumluluk, duygusallık, fedakarlık
  neuroticism: number;    // hassasiyet, güvenli seçim eğilimi
}

/** User profile vector for scoring */
interface UserVector {
  techAffinity: number;
  emotionalPreference: number;
  noveltySeeking: number;
  practicality: number;
  socialOrientation: number;
  aestheticSensitivity: number;
  outdoorActive: number;
  creativeExpression: number;
}

const SYSTEM_PROMPT = `Sen "VeniVidiCoop" e-ticaret platformunun yapay zeka hediye danışmanısın. Adın "Hediye Asistanı".

DÖRT FARKLI PERSPEKTİFLE DÜŞÜN:

🧒 GELİŞİM PSİKOLOJİSİ (Piaget + Erikson):
Her yaş için bilişsel ve psikososyal gelişim evresini MUTLAKA dikkate al:
- 0-2 yaş (Duyusal-Motor + Güven): Duyularla öğreniyor, nesne sürekliliği gelişiyor. "Dünya güvenli mi?" sorusunu yanıtlıyor. → Duyusal oyuncaklar, tutarlı geri bildirimli ürünler, güvenlik nesneleri (peluş, yumuşak kitap, müzik kutusu). ASLA sembolik oyun gerektiren, ekranlı veya küçük parçalı ürün.
- 2-3 yaş (Sembolik düşünce başlangıcı + Özerklik): "Ben yapabilirim!" dönemi. Bağımsızlık istiyor, dil patlıyor. → Seçim yapabilecekleri oyuncaklar, sürme arabalar, basit rol yapma setleri, iri parçalı bloklar, parmak boya.
- 3-6 yaş (İşlem öncesi + İnisiyatif): Hayal gücü zirvede, animizm var (cansızlar "canlı"), benmerkezci. → Kostümler, rol yapma setleri, sanat malzemeleri (ürün değil süreç), açık uçlu yapı oyuncakları, keşif kitleri. Rekabetçi oyunlar UYGUN DEĞİL.
- 6-11 yaş (Somut işlemler + Yeterlilik): Mantıksal düşünme, sınıflama, ustalık arayışı. "Başarabilir miyim?" → Kuralı olan kutu oyunları, bilim kitleri, koleksiyon başlatıcılar, spor ekipmanı, kodlama oyuncakları, beceri kitleri (origami, maket, örgü).
- 12-18 yaş (Soyut işlemler + Kimlik): Soyut düşünme, hipotetik akıl yürütme, "Ben kimim?" → Kimlik keşfi araçları: deneyim hediyeleri, yaratıcı üretim araçları (kamera, müzik prodüksiyon), hediye kartları (seçim özgürlüğü), kişisel alan/oda dekor.
- 18-40 yaş (Yakınlık): "Sevebilir miyim?" → Paylaşılabilir deneyimler, ev kurma, kariyer araçları.
- 40-65 yaş (Üretkenlik): "İz bırakabilir miyim?" → Miras, hobi ustalığı, nesiller arası bağ.
- 65+ yaş (Bütünlük): "Hayatım anlamlı mıydı?" → Anı, konfor, bağlantı teknolojisi, onurlu yaşam araçları.

🧠 PSİKOLOG (Big Five + Duygusal İhtiyaç): Her cevaptan kişilik profili çıkar. "Sürpriz seviyor" → merak güdüsü yüksek. "Pratik olsun" → güvenlik ihtiyacı. "Farklı olsun" → bireysellik arayışı.

🔮 ASTROLOG: İki katmanlı analiz yap:
A) KİŞİ BURÇ ANALİZİ: Element grubu (ateş/toprak/hava/su) ve modalite (kardinal/sabit/değişken) → hediye tipine bağla. Örn: Su+sabit (Akrep) → derin anlamlı hediyeler. Ateş+kardinal (Koç) → aksiyon/deneyim hediyeleri.
B) HEDİYE TARİHİ ANALİZİ: Tarih varsa astrolojik enerjiyi değerlendir. Venüs retrosu → duygusal > lüks. Ay Boğa'da → konfor öne çıksın. "giftDateInsight" alanında belirt.

📊 PAZARLAMA UZMANI (2025-2026 Trendleri + Türkiye Pazarı):
Gerçek tüketim verileri:
- 0-2 yaş trendler: Montessori ahşap oyuncaklar (Türkiye'de güçlü büyüme), sensory oyuncaklar, Lovevery tarzı yaş eşli kutular, kontrast kartlar, siyah-beyaz mobiller.
- 3-5 yaş trendler: Manyetik yapı blokları (Magna-Tiles), Play-Doh/kinetik kum, Squishmallows peluş, Gabby's Dollhouse, LEGO Duplo, müzikli/interaktif robotlar.
- 6-9 yaş trendler: National Geographic bilim kitleri, LEGO temalı setler (Minecraft/Star Wars), Osmo eğitici set, kristal yetiştirme, slime yapım kitleri, Mini Brands koleksiyon.
- 10-14 yaş trendler: Snap Circuits robotik, Pop Mart/Labubu blind box koleksiyon, gelişmiş LEGO Technic, kodlama robotları, DIY bileklik/takı kitleri, TikTok viral oyuncaklar.
- 15-19 yaş trendler: Deneyim hediyeleri, profesyonel yaratıcı araçlar, blind box koleksiyon, nostalji 2000'ler (Bratz, Polly Pocket), gaming aksesuarları.
- Yetişkin trendler: "Kidult" segmenti (yetişkin LEGO, puzzle), akıllı ev gadget'ları, wellness/self-care, deneyim hediyeleri.
- Türkiye özel: Bayram hediyeleri (Ramazan/Kurban), sünnet hediyeleri (5-10 yaş erkek, altın+oyuncak), okul başlangıcı (Eylül), LGS/YKS dönemleri. LC Waikiki, ebebek, Toyzz Shop popüler. Kişi başı oyuncak harcaması düşük ($20-25) → bütçe dostu öneriler kritik.

KRİTİK KURALLAR:

1. **ASLA VARSAYMA**: Cihaz sahipliğini, hobisini, ilgi alanını BİLMEDEN önerme. ÖNCE SOR, sonra öner.

2. **GELİŞİM EVRESİ UYUMU (Piaget + Erikson):**
   - 0-6 ay: SADECE duyusal — kontrast kartlar, çıngıraklar, kumaş kitaplar, güvenlik peluşu. Hiçbir şey sembolik olmamalı.
   - 6-12 ay: Nesne sürekliliği — peek-a-boo oyuncaklar, istifleme kapları, neden-sonuç oyuncaklar, aktivite küpleri.
   - 1-2 yaş: Özerklik — sürme arabalar, şekil yerleştirme, itme-çekme oyuncaklar, iri parçalı bloklar, parmak boya, çocuk boyu araçlar.
   - 2-3 yaş: Sembolik patlama — Play-Doh, küçük mutfak/doktor seti, denge bisikleti, üç tekerlekli scooter, manyetik yazı tahtası.
   - 3-6 yaş: Hayal gücü zirvesi — kostümler, açık uçlu sanat, Duplo→LEGO geçişi, dış mekan keşif kiti, kooperatif oyunlar. Rekabetçi oyun YASAK.
   - 6-11 yaş: Ustalık — kutu oyunları (satranç, Monopoly Jr), bilim kitleri, STEM robotik, koleksiyon (kart, taş, pul), spor ekipmanı, enstrüman+ders.
   - 12+ yaş: Kimlik — deneyim hediyeleri, kişisel ifade araçları, hediye kartı (seçim özgürlüğü), yaratıcı üretim (kamera, müzik ekipmanı).
   **ASLA bir evrenin üstünü veya altını önerme.** 2 yaşındaki çocuğa Bluetooth hoparlör, mum seti, retro radyo, puzzle 1000 parça UYGUN DEĞİL.

3. **"SÜRPRİZ" = YARATICI**: "bunu nereden buldun!" dedirtecek ürünler. Sıradan (kulaklık, cüzdan, kupa) sürpriz DEĞİL. Kişiselleştirilmiş, tematik, viral/trend ürünler sürprizdir.

4. **CEVAPLARI DERİNLEMESİNE ANALİZ ET**: Her cevabı Piaget evresiyle çapraz analiz yap. "Blokları devirmeyi seviyor" (1 yaş) → neden-sonuç keşfi, sensorimotor → istifleme-devirme oyuncakları, ses çıkaran bloklar.

5. **KONUŞMA BAĞLAMINI UNUTMA**: Tüm cevapları birlikte değerlendir, tek bir cevaba saplanma.

6. **SOSYOEKONOMİK DUYARLILIK**: Türkiye'de kişi başı oyuncak harcaması düşük. Bütçeye uygun alternatifler de öner. Yerel üreticiler (Montessori ahşap oyuncak) genellikle ithal markalardan uygun fiyatlı.

KONUŞMA AKIŞI:
- İlk mesajda: Profili kısaca özetle, gelişim evresi bağlamını ekle, TEK BİR soru sor
- Sonraki mesajlarda: Cevabı gelişim psikolojisi açısından analiz et + bir çıkarım + TEK BİR yeni soru
- Her mesajda SADECE BİR soru
- 5-7 soru-cevap sonrası: Sentezleyerek hediye listesi sun (bebek/küçük çocuk için 6-7 soru, ergen/yetişkin için 5 soru yeterli)

SORU STRATEJİSİ (her soru bir amaca hizmet etmeli):
1. Gelişim düzeyi: Motor/bilişsel/sosyal gelişim nerede? (Piaget evresi doğrulama)
2. Duyusal/oyun tercihi: Hangi tür oyun/aktivite tercih ediyor? (doğrudan ürün eşleştirme)
3. Günlük yaşam: Ne yaparak vakit geçirir? (kullanım bağlamı)
4. Sahip oldukları: Cihaz, oyuncak, ekipman var mı? (varsayım kırıcı)
5. Duygusal tercih: Sürpriz mi, ihtiyaç mı, anı mı? (Erikson evresi → duygusal ihtiyaç)
6. Önceki hediyeler: En çok neyi beğendi/beğenmedi? (doğrulama ve tekrar önleme)
7. Sosyoekonomik ipucu: Bütçe beklentisi, marka tercihi (fiyat segmenti)

YETERLİ BİLGİ TOPLANDIĞINDA:
Cevabının sonuna şu JSON'u ekle. TAGS kısmı çok kritik — konuşmadan çıkardığın GERÇEK ilgi alanlarını yaz, varsayım yapma:

\`\`\`json:gift_analysis
{
  "analysisComplete": true,
  "giftType": "sürpriz|ihtiyaç|ilgi_alanı|kalıcı_anı|prestij|trend",
  "reasoning": "Psikolog + astrolog + pazarlamacı perspektifinden neden bu öneriler",
  "personality": "introvert|extrovert|ambivert",
  "emotionalNeed": "keşif|güvenlik|bağlantı|bireysellik|eğlence",
  "ocean": {
    "openness": 0.8,
    "conscientiousness": 0.3,
    "extraversion": 0.6,
    "agreeableness": 0.7,
    "neuroticism": 0.2
  },
  "giftDateInsight": "Hediye günü Venüs Boğa'da — kalite, estetik ve dokunsal hediyeler ekstra etkili olacak (veya null eğer etki nötr)",
  "categories": ["Kozmetik", "Ev & Yaşam"],
  "tags": ["led ışık", "oda dekoru", "kişisel bakım", "yaratıcı"],
  "excludeTags": ["bilgisayar", "erkek", "ofis"],
  "priceRange": {"min": 100, "max": 1500},
  "searchTerms": ["led projektör", "makyaj seti", "günlük defter"]
}
\`\`\`

"ocean" skorları çok önemli: Konuşmadan çıkardığın Big Five kişilik puanlarını 0-1 arası ver. Bu skorlar ürün eşleştirme algoritmasında kullanılacak.
"excludeTags" çok önemli: Konuşmada kişinin sahip olmadığı veya ilgilenmediği anlaşılan şeylerin tag'lerini buraya yaz.
"giftDateInsight": Hediye tarihi varsa astrolojik yorumu yaz. Günün enerjisi nötrse null yaz.

Kullanılabilir kategoriler: Kadın, Erkek, Anne & Çocuk, Ev & Yaşam, Süpermarket, Kozmetik, Ayakkabı & Çanta, Elektronik, Saat & Aksesuar, Spor & Outdoor, Hediyelik, Kitap & Kırtasiye, Oyuncak & Hobi

TAKİP SORUSU formatı (her mesajın sonunda):
- Soru?

ÇOK ÖNEMLİ:
- Türkçe konuş, samimi ol
- Her mesajda SADECE 1 soru, birden fazla "- " satırı OLMASIN
- Cevapları psikolog gibi analiz et — boş "anlıyorum" deme
- Demografiye uygun düşün: 13 yaşında kıza ofis malzemesi, 60 yaşında adama fidget spinner önerme
- Kişinin sahip olmadığı cihazlara aksesuar önerme
- Daha önce alınan hediyeler listesi verilmişse, aynı ürünleri veya çok benzer ürünleri TEKRAR önerme
- Beğenilmeyen hediyelerden ders çıkar (aynı kategoriden kaçın), beğenilen hediyelerden ipucu al`;

@Injectable()
export class GiftAIService {
  private readonly logger = new Logger(GiftAIService.name);
  private anthropic: Anthropic | null = null;

  constructor(
    private configService: ConfigService,
    @InjectRepository(ProductEntity)
    private productRepo: Repository<ProductEntity>,
    private dataSource: DataSource,
  ) {
    const apiKey = this.configService.get('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
      this.logger.log('Anthropic Claude AI initialized');
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not set — gift AI will use fallback mode');
    }
  }

  async chat(request: GiftAIRequest): Promise<GiftAIResponse> {
    const { messages, context, formData } = request;

    // QUICK MODE — kayıtlı kişi: AI'ı bypass et, doğrudan ürün eşleştir
    if (formData?.quickMode) {
      return this.quickRecommend(context, formData);
    }

    // Build profile summary for the AI
    let profileNote = '';
    if (formData) {
      const parts: string[] = [];
      parts.push(`[KAYIT FORMU BİLGİLERİ]`);
      parts.push(`Ad: ${formData.name}`);
      parts.push(`Yaş: ${formData.age}`);
      if (formData.birthDate) parts.push(`Doğum Tarihi: ${formData.birthDate}`);
      if (formData.birthTime) parts.push(`Doğum Saati: ${formData.birthTime}`);
      if (formData.zodiacSign) parts.push(`Burcu: ${formData.zodiacSign}`);
      if (formData.ascendantSign) parts.push(`Yükselen Burcu: ${formData.ascendantSign}`);
      const genderLabel = formData.gender === 'male' ? 'Erkek' : formData.gender === 'female' ? 'Kadın' : 'Belirtilmemiş';
      parts.push(`Cinsiyet: ${genderLabel}`);
      parts.push(`Yakınlık: ${formData.relationship}`);
      if (formData.education) parts.push(`Eğitim: ${formData.education}`);
      if (formData.hobbies?.length) parts.push(`Hobileri: ${formData.hobbies.join(', ')}`);
      parts.push(`Hediye Vesilesi: ${formData.occasion}`);
      if (formData.giftDate) {
        parts.push(`Hediye Tarihi: ${formData.giftDate}`);
        const dateInsight = this.getGiftDateAstrology(formData.giftDate);
        if (dateInsight) parts.push(`[ASTROLOJİK NOT - HEDİYE GÜNÜ]: ${dateInsight}`);
      }
      if (formData.budget) parts.push(`Bütçe: ${formData.budget.min}-${formData.budget.max} TL`);

      // Past gifts — so AI doesn't recommend something already given
      if (formData.pastGifts?.length) {
        parts.push(`\n[DAHA ÖNCE ALINAN HEDİYELER — bunları tekrar ÖNERME]`);
        for (const pg of formData.pastGifts) {
          let line = `• ${pg.productName} — ${pg.occasion} (${pg.giftDate})`;
          if (pg.reason) line += ` — Sebep: ${pg.reason}`;
          if (pg.rating !== undefined && pg.rating !== null) {
            line += pg.rating >= 4 ? ' ✓ Beğenildi' : pg.rating <= 2 ? ' ✗ Beğenilmedi' : '';
          }
          parts.push(line);
        }
      }

      // Last conversation context — returning user, fast mode
      if (formData.lastConversation) {
        parts.push(`\n[ÖNCEKİ AI SOHBET GEÇMİŞİ — bu kişiyi zaten analiz ettin, tekrar soru sormana gerek yok]`);
        parts.push(formData.lastConversation);
      }
      if (formData.aiInsights) {
        parts.push(`\n[ÖNCEKİ AI ANALİZ NOTLARIN]`);
        parts.push(formData.aiInsights);
      }

      profileNote = `\n\n${parts.join('\n')}`;
    } else if (context) {
      const parts: string[] = [];
      if (context.recipientName) parts.push(`Kişi: ${context.recipientName}`);
      if (context.age) parts.push(`Yaş: ${context.age}`);
      if (context.gender) parts.push(`Cinsiyet: ${context.gender === 'male' ? 'Erkek' : context.gender === 'female' ? 'Kadın' : context.gender}`);
      if (context.relationship) parts.push(`Yakınlık: ${context.relationship}`);
      if (context.interests?.length) parts.push(`İlgi alanları: ${context.interests.join(', ')}`);
      if (context.occasion) parts.push(`Vesile: ${context.occasion}`);
      if (context.budget) parts.push(`Bütçe: ${context.budget.min}-${context.budget.max} TL`);
      if (parts.length > 0) {
        profileNote = `\n\n[Kullanıcının önceden girdiği bilgiler: ${parts.join(' | ')}]`;
      }
    }

    // If no API key, use fallback
    if (!this.anthropic) {
      return this.fallbackChat(messages, context, formData);
    }

    try {
      const apiMessages = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Inject profile into the first user message
      if (profileNote && apiMessages.length > 0 && apiMessages[0].role === 'user') {
        apiMessages[0] = {
          ...apiMessages[0],
          content: apiMessages[0].content + profileNote,
        };
      }

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: apiMessages,
      });

      const aiText = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('');

      // Parse analysis JSON if present
      const analysisMatch = aiText.match(/```json:gift_analysis\s*\n([\s\S]*?)\n```/);
      let analysis: GiftAIResponse['analysis'] | undefined;
      let analysisComplete = false;
      let cleanMessage = aiText;

      if (analysisMatch) {
        try {
          const parsed = JSON.parse(analysisMatch[1]);
          analysis = {
            giftType: parsed.giftType,
            reasoning: parsed.reasoning,
            personality: parsed.personality,
            emotionalNeed: parsed.emotionalNeed,
            categories: parsed.categories,
            tags: [...(parsed.tags || []), ...(parsed.searchTerms || [])],
            excludeTags: parsed.excludeTags || [],
            priceRange: parsed.priceRange,
            ocean: parsed.ocean || undefined,
            giftDateInsight: parsed.giftDateInsight || undefined,
          };
          analysisComplete = parsed.analysisComplete === true;
          cleanMessage = aiText.replace(/```json:gift_analysis[\s\S]*?```/, '').trim();
        } catch {
          this.logger.warn('Failed to parse gift analysis JSON');
        }
      }

      // Extract follow-up questions
      const followUpQuestions = this.extractFollowUpQuestions(cleanMessage);

      // If analysis is complete, fetch matching products with distance
      let products: any[] = [];
      let nearbyStores: any[] = [];

      if (analysisComplete && analysis) {
        const result = await this.fetchMatchingProducts(analysis, context, formData);
        products = result.products;
        nearbyStores = result.nearbyStores;
      }

      return {
        message: cleanMessage,
        products: products.length > 0 ? products : undefined,
        nearbyStores: nearbyStores.length > 0 ? nearbyStores : undefined,
        followUpQuestions,
        analysisComplete,
        analysis,
      };
    } catch (error) {
      this.logger.error('Claude API error:', error);
      return this.fallbackChat(messages, context, formData);
    }
  }

  private extractFollowUpQuestions(text: string): string[] {
    const lines = text.split('\n');
    const questions: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') && trimmed.endsWith('?')) {
        questions.push(trimmed.slice(2));
      }
    }
    return questions.slice(0, 1);
  }

  /** Quick mode — form verilerinden doğrudan analiz oluştur, AI'ı bypass et */
  private async quickRecommend(
    context?: GiftAIRequest['context'],
    formData?: GiftFormData,
  ): Promise<GiftAIResponse> {
    const name = formData?.name || context?.recipientName || 'bu kişi';
    const age = formData?.age || context?.age;
    const gender = formData?.gender || context?.gender;
    const occasion = formData?.occasion || context?.occasion || 'özel gün';
    const zodiac = formData?.zodiacSign;
    const hobbies = formData?.hobbies || context?.interests || [];

    // Build tags from hobbies
    const hobbyTags = hobbies.map(h => h.toLowerCase());

    // Occasion-based tags
    const occasionTags: string[] = [];
    const occasionLower = occasion.toLowerCase();
    if (occasionLower.includes('doğum günü')) occasionTags.push('doğum günü', 'parti', 'kutlama');
    if (occasionLower.includes('yılbaşı') || occasionLower.includes('noel')) occasionTags.push('yılbaşı', 'noel', 'kış');
    if (occasionLower.includes('sevgililer')) occasionTags.push('romantik', 'aşk', 'sevgili');
    if (occasionLower.includes('anneler')) occasionTags.push('anne', 'kadın', 'bakım');
    if (occasionLower.includes('babalar')) occasionTags.push('baba', 'erkek');
    if (occasionLower.includes('mezuniyet')) occasionTags.push('mezuniyet', 'başarı', 'kariyer');
    if (occasionLower.includes('düğün') || occasionLower.includes('evlilik')) occasionTags.push('düğün', 'ev', 'çift');
    if (occasionLower.includes('bebek') || occasionLower.includes('doğum')) occasionTags.push('bebek', 'anne', 'çocuk');

    const allTags = [...hobbyTags, ...occasionTags];
    const categories = this.getSmartCategories(age, gender, { giftType: 'ilgi_alanı', emotionalNeed: 'keşif' });

    // Gift date astrology
    const giftDate = formData?.giftDate;
    const giftDateInsight = giftDate ? this.getGiftDateAstrology(giftDate) : undefined;
    const giftDateTags = giftDate ? this.getGiftDateTags(giftDate) : [];
    const zodiacTags = zodiac ? this.getZodiacGiftTags(zodiac) : [];

    const analysis: GiftAIResponse['analysis'] = {
      giftType: 'ilgi_alanı',
      reasoning: `${name} için ${occasion} hediyesi — profil bilgileri ve bütçeye göre`,
      personality: 'ambivert',
      emotionalNeed: 'keşif',
      categories,
      tags: [...allTags, ...zodiacTags, ...giftDateTags],
      excludeTags: [],
      priceRange: formData?.budget || context?.budget,
      giftDateInsight: giftDateInsight || undefined,
    };

    const result = await this.fetchMatchingProducts(analysis, context, formData);

    const genderText = gender === 'male' ? 'erkek' : gender === 'female' ? 'kadın' : '';
    let message = `${name} için hızlı öneri hazırladım!\n\n`;
    message += `**Profil:** ${age || ''} yaşında${genderText ? ` ${genderText}` : ''}`;
    if (zodiac) message += ` · ${zodiac}`;
    if (hobbies.length) message += ` · ${hobbies.join(', ')}`;
    message += `\n**Vesile:** ${occasion}`;
    if (formData?.budget) message += `\n**Bütçe:** ${formData.budget.min.toLocaleString('tr-TR')} – ${formData.budget.max.toLocaleString('tr-TR')} ₺`;
    if (giftDateInsight) message += `\n**📅 Hediye Günü:** ${giftDateInsight}`;
    message += `\n\nİşte ${name} için önerilerim:`;

    return {
      message,
      products: result.products,
      nearbyStores: result.nearbyStores,
      analysisComplete: true,
      analysis,
    };
  }

  private async fetchMatchingProducts(
    analysis: GiftAIResponse['analysis'],
    context?: GiftAIRequest['context'],
    formData?: GiftFormData,
  ): Promise<{ products: any[]; nearbyStores: any[] }> {
    if (!analysis) return { products: [], nearbyStores: [] };

    const qb = this.productRepo.createQueryBuilder('product')
      .leftJoinAndSelect('product.store', 'store')
      .where('product.isActive = true');

    // Filter by categories
    if (analysis.categories?.length) {
      qb.andWhere('product.categories::jsonb ?| ARRAY[:...cats]', { cats: analysis.categories });
    }

    // GENDER EXCLUSION — exclude products tagged for the opposite gender
    const recipientGender = formData?.gender || context?.gender;
    if (recipientGender === 'female') {
      // Exclude products explicitly tagged as male/erkek (but allow unisex)
      qb.andWhere("NOT (product.tags::text ILIKE '%\"erkek\"%' AND NOT product.tags::text ILIKE '%\"kadın\"%' AND NOT product.tags::text ILIKE '%\"kız\"%' AND NOT product.tags::text ILIKE '%\"unisex\"%')");
      // Exclude products in "Erkek" category only (not if also in Kadın)
      qb.andWhere("NOT (product.categories::text ILIKE '%Erkek%' AND NOT product.categories::text ILIKE '%Kadın%')");
    } else if (recipientGender === 'male') {
      qb.andWhere("NOT (product.tags::text ILIKE '%\"kadın\"%' AND NOT product.tags::text ILIKE '%\"erkek\"%' AND NOT product.tags::text ILIKE '%\"unisex\"%')");
      qb.andWhere("NOT (product.categories::text ILIKE '%Kadın%' AND NOT product.categories::text ILIKE '%Erkek%')");
    }

    // AGE-APPROPRIATE filtering — strict age-based product selection
    const recipientAge = formData?.age || context?.age;

    // For babies and toddlers (0-5): REQUIRE child-appropriate products
    if (recipientAge !== undefined && recipientAge <= 5) {
      const babyChildTerms = [
        'bebek', 'çocuk', 'oyuncak', 'peluş', 'eğitici', 'puzzle', 'yapboz',
        'lego', 'blok', 'boyama', 'boya', 'hamur', 'aktivite', 'duyusal',
        'sensory', 'montessori', 'ahşap', 'küp', 'çıngırak', 'yürüteç',
        'kitap', 'masal', 'müzik', 'enstrüman', 'top', 'kum', 'su oyunu',
        'bisiklet', 'scooter', 'kaydırak', 'salıncak', 'çadır', 'oyun',
        'anne', 'çocuk', 'baby', 'kids', 'toddler', 'infant',
      ];
      const babyConditions = babyChildTerms.map((term, i) => {
        const paramKey = `baby_${i}`;
        return `(LOWER(product.name) LIKE :${paramKey} OR product.tags::text ILIKE :${paramKey} OR LOWER(product.description) LIKE :${paramKey})`;
      });
      const babyParams: Record<string, string> = {};
      babyChildTerms.forEach((term, i) => {
        babyParams[`baby_${i}`] = `%${term}%`;
      });
      qb.andWhere(`(${babyConditions.join(' OR ')})`, babyParams);

      // Hard exclude adult/teen items
      const hardExclude = [
        'bluetooth', 'radyo', 'mum', 'mumluk', 'parfüm', 'kahve', 'espresso',
        'vintage', 'plak', 'whisky', 'şarap', 'bira', 'viski', 'cüzdan',
        'takım elbise', 'blazer', 'kravat', 'kol düğmesi', 'deri', 'sigara',
        'çakmak', 'bıçak', 'gaming', 'mekanik klavye', 'mouse', 'kulaklık',
        'laptop', 'tablet', 'akıllı saat', 'drone', 'kamera', 'projeksiyon',
        'ring light', 'makyaj', 'kozmetik', 'skincare', 'fondöten',
      ];
      for (const item of hardExclude) {
        qb.andWhere(`LOWER(product.name) NOT LIKE '%${item}%'`);
      }

      // Also filter by age-appropriate categories
      qb.andWhere(`(product.categories::text ILIKE '%Oyuncak%' OR product.categories::text ILIKE '%Çocuk%' OR product.categories::text ILIKE '%Anne%' OR product.categories::text ILIKE '%Bebek%' OR product.categories::text ILIKE '%Eğitici%' OR product.categories::text ILIKE '%Kitap%' OR product.categories::text ILIKE '%Hobi%')`);
    }
    // For children (6-9): moderate filtering
    else if (recipientAge && recipientAge < 10) {
      const teenAdultItems = [
        'mekanik klavye', 'mouse', 'mousepad', 'gaming headset', 'kulaklık',
        'bluetooth', 'radyo', 'mum', 'mumluk', 'parfüm', 'kahve', 'espresso',
        'vintage', 'plak', 'whisky', 'şarap', 'bira', 'viski', 'cüzdan',
        'takım elbise', 'blazer', 'kravat', 'kol düğmesi', 'deri', 'sigara',
        'çakmak', 'bıçak', 'makyaj', 'skincare', 'fondöten',
      ];
      for (const item of teenAdultItems) {
        qb.andWhere(`LOWER(product.name) NOT LIKE '%${item}%'`);
      }
      qb.andWhere("product.tags::text NOT ILIKE '%\"yetişkin\"%'");
      qb.andWhere("product.tags::text NOT ILIKE '%\"ofis\"%'");
    }
    // For teens (10-15): exclude adult items
    else if (recipientAge && recipientAge < 16) {
      const adultItems = [
        'takım elbise', 'deri ceket', 'blazer', 'parfüm', 'whisky', 'şarap',
        'bıçak seti', 'kahve makinesi', 'espresso', 'cüzdan', 'evrak çantası',
        'kravat', 'kol düğmesi', 'sigara', 'çakmak', 'viski', 'bira',
      ];
      for (const item of adultItems) {
        qb.andWhere(`LOWER(product.name) NOT LIKE '%${item}%'`);
      }
      qb.andWhere("product.tags::text NOT ILIKE '%\"yetişkin\"%'");
      qb.andWhere("product.tags::text NOT ILIKE '%\"ofis\"%'");
    }

    // EXCLUDE tags — products that should NOT appear based on conversation
    if (analysis.excludeTags?.length) {
      for (let i = 0; i < analysis.excludeTags.length; i++) {
        const paramKey = `excl_${i}`;
        qb.andWhere(`LOWER(product.name) NOT LIKE :${paramKey} AND product.tags::text NOT ILIKE :${paramKey}`, {
          [paramKey]: `%${analysis.excludeTags[i].toLowerCase()}%`,
        });
      }
    }

    // Filter by tags (analysis-derived) — use OR matching for inclusivity
    if (analysis.tags?.length) {
      const tagConditions = analysis.tags.map((tag, i) => {
        const paramKey = `tag_${i}`;
        return `(product.tags::text ILIKE :${paramKey} OR LOWER(product.name) LIKE :${paramKey} OR LOWER(product.description) LIKE :${paramKey})`;
      });
      const tagParams: Record<string, string> = {};
      analysis.tags.forEach((tag, i) => {
        tagParams[`tag_${i}`] = `%${tag.toLowerCase()}%`;
      });
      qb.andWhere(`(${tagConditions.join(' OR ')})`, tagParams);
    }

    // Price range
    if (analysis.priceRange) {
      if (analysis.priceRange.min > 0) {
        qb.andWhere('COALESCE(product.salePrice, product.price) >= :minP', { minP: analysis.priceRange.min });
      }
      if (analysis.priceRange.max > 0) {
        qb.andWhere('COALESCE(product.salePrice, product.price) <= :maxP', { maxP: analysis.priceRange.max });
      }
    } else if (context?.budget) {
      if (context.budget.min > 0) qb.andWhere('COALESCE(product.salePrice, product.price) >= :minP', { minP: context.budget.min });
      if (context.budget.max > 0) qb.andWhere('COALESCE(product.salePrice, product.price) <= :maxP', { maxP: context.budget.max });
    }

    qb.orderBy('product.isFeatured', 'DESC')
      .addOrderBy('product.ratingAverage', 'DESC')
      .take(60);

    let products = await qb.getMany();

    // HYBRID SCORING — rank products by weighted relevance
    const userVector = this.buildUserVector(analysis);
    const scoredProducts = products.map(p => {
      const score = this.scoreProduct(p, analysis, userVector);
      return { product: p, score };
    });
    scoredProducts.sort((a, b) => b.score - a.score);

    // Take top 16, with slight randomization within score tiers for diversity
    const topProducts = scoredProducts.slice(0, 20);
    // Shuffle within similar score ranges (±0.05) for variety
    for (let i = 0; i < topProducts.length - 1; i++) {
      const j = i + 1;
      if (j < topProducts.length && Math.abs(topProducts[i].score - topProducts[j].score) < 0.05) {
        if (Math.random() > 0.5) {
          [topProducts[i], topProducts[j]] = [topProducts[j], topProducts[i]];
        }
      }
    }
    products = topProducts.slice(0, 16).map(sp => sp.product);

    // Serialize with store location data + match reasoning for explainability
    const serialized = products.map((p, idx) => ({
      ...p,
      storeLatitude: p.store?.latitude || null,
      storeLongitude: p.store?.longitude || null,
      matchScore: scoredProducts[idx]?.score || 0,
    }));

    // Nearby stores
    let nearbyStores: any[] = [];
    if (context?.latitude && context?.longitude && analysis.categories?.length) {
      try {
        nearbyStores = await this.dataSource.query(`
          SELECT s.id, s.name, s.slug, s.latitude, s.longitude, s.categories,
            ST_Distance(s.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
          FROM stores s
          WHERE s."isActive" = true
            AND s.categories::jsonb ?| ARRAY[${analysis.categories.map((_, i) => `$${i + 3}`).join(',')}]
          ORDER BY distance ASC LIMIT 6
        `, [context.longitude, context.latitude, ...analysis.categories]);
      } catch { /* PostGIS unavailable */ }
    }

    return { products: serialized, nearbyStores };
  }

  /** Fallback when no API key — one question at a time with analysis */
  private async fallbackChat(
    messages: GiftConversationMessage[],
    context?: GiftAIRequest['context'],
    formData?: GiftFormData,
  ): Promise<GiftAIResponse> {
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const userMsgCount = messages.filter(m => m.role === 'user').length;
    const name = formData?.name || context?.recipientName || 'bu kişi';
    const age = formData?.age || context?.age;
    const gender = formData?.gender;
    const hobbies = formData?.hobbies || context?.interests || [];
    const relationship = formData?.relationship || context?.relationship || '';
    const occasion = formData?.occasion || context?.occasion || '';
    const zodiac = formData?.zodiacSign;
    const ascendant = formData?.ascendantSign;
    const genderText = gender === 'male' ? 'erkek' : gender === 'female' ? 'kadın' : '';

    const questionSequence = this.buildQuestionSequence(formData);

    // Quick mode — skip all questions and go directly to product recommendations
    const isQuickMode = !!(formData?.quickMode || formData?.lastConversation || formData?.aiInsights);
    if (isQuickMode) {
      return this.fallbackQuickRecommend(messages, context, formData, name, age, gender, hobbies, occasion, zodiac, genderText);
    }

    // First message — profile summary with zodiac + first question
    if (userMsgCount <= 1) {
      let msg = `Merhaba! ${name} için mükemmel hediyeyi bulmak üzere yanınızdayım.\n\n`;
      msg += `Profiline baktığımda ${age} yaşında`;
      if (genderText) msg += ` bir ${genderText}`;
      if (relationship) msg += `, sizin ${relationship.toLowerCase()}nız`;
      msg += `. `;

      // Zodiac only makes sense for older kids/adults — skip for toddlers
      if (zodiac && age && age >= 5) {
        const zodiacInsight = this.getZodiacInsight(zodiac);
        msg += `${zodiac} burcu olması ${zodiacInsight} `;
        if (ascendant) {
          const ascInsight = this.getAscendantInsight(ascendant);
          msg += `Yükselen burcu ${ascendant} — ${ascInsight} `;
        }
      }

      // Age-appropriate context
      if (age && age <= 2) {
        msg += `Bu yaşta gelişim çok hızlı — duyusal, motor beceri ve keşif odaklı hediyeler en değerli olur. `;
      } else if (age && age <= 5) {
        msg += `Bu yaş hayal gücü ve oyunla öğrenme dönemi — eğlenceli ve gelişimsel hediyeler ideal. `;
      }

      if (hobbies.length) {
        msg += `${hobbies.join(', ')} gibi alanlarla ilgilenmesi bana ilk ipuçlarını veriyor. `;
      }
      if (occasion) msg += `${occasion} için özel bir hediye arıyorsunuz, çok güzel!\n\n`;
      msg += `${name}'${this.getSuffix(name, 'i')} daha iyi tanıyabilmem için başlayalım:\n\n`;
      msg += `- ${questionSequence[0]}`;

      return { message: msg, followUpQuestions: [questionSequence[0]] };
    }

    const questionIdx = userMsgCount - 1;

    // Minimum question thresholds by age — Piaget: younger children need more observation data
    const minQuestions = (age !== undefined && age <= 1) ? 5 : (age && age <= 3) ? 5 : (age && age <= 6) ? 5 : (age && age <= 9) ? 5 : 4;
    const shouldSuggest = (questionIdx >= questionSequence.length && questionIdx >= minQuestions)
      || ((lastMsg.includes('öner') || lastMsg.includes('yeter')
      || lastMsg.includes('tamam') || lastMsg.includes('göster')) && questionIdx >= minQuestions);

    if (!shouldSuggest && questionIdx < questionSequence.length) {
      const insight = this.generateInsight(lastMsg, name, age, gender, hobbies, questionIdx);
      const nextQuestion = questionSequence[questionIdx];
      return {
        message: `${insight}\n\n- ${nextQuestion}`,
        followUpQuestions: [nextQuestion],
      };
    }

    // Enough info — build smart analysis from ALL conversation answers
    const conversationProfile = this.buildConversationProfile(messages, formData);
    const cats = conversationProfile.categories.length > 0
      ? conversationProfile.categories
      : this.getSmartCategories(age, gender, conversationProfile);

    const zodiacTags = zodiac ? this.getZodiacGiftTags(zodiac) : [];
    const ocean = conversationProfile.ocean;

    // Gift date astrology
    const giftDate = formData?.giftDate;
    const giftDateInsight = giftDate ? this.getGiftDateAstrology(giftDate) : undefined;
    const giftDateTags = giftDate ? this.getGiftDateTags(giftDate) : [];

    const analysis: GiftAIResponse['analysis'] = {
      giftType: conversationProfile.giftType,
      reasoning: `${name} için ${occasion || 'özel gün'} hediyesi — psikolojik profil, burç analizi ve trend analizine göre seçildi`,
      personality: conversationProfile.personality,
      emotionalNeed: conversationProfile.emotionalNeed,
      categories: cats,
      tags: [...conversationProfile.tags, ...zodiacTags, ...giftDateTags],
      excludeTags: conversationProfile.excludeTags,
      priceRange: formData?.budget || context?.budget,
      ocean,
      giftDateInsight: giftDateInsight || undefined,
    };

    const result = await this.fetchMatchingProducts(analysis, context, formData);

    let message = `Tüm cevaplarınızı bir psikolog, astrolog ve pazarlama uzmanı gözüyle analiz ettim!\n\n`;

    // OCEAN personality summary
    message += `**🧠 Kişilik Analizi (Big Five):** ${name} `;
    const oceanTraits: string[] = [];
    if (ocean.openness > 0.6) oceanTraits.push('yaratıcı ve meraklı');
    if (ocean.conscientiousness > 0.6) oceanTraits.push('düzenli ve pratik');
    if (ocean.extraversion > 0.6) oceanTraits.push('sosyal ve enerjik');
    else if (ocean.extraversion < 0.4) oceanTraits.push('içe dönük ve sakin');
    if (ocean.agreeableness > 0.6) oceanTraits.push('duygusal ve uyumlu');
    if (ocean.neuroticism > 0.6) oceanTraits.push('hassas ve detaycı');
    message += oceanTraits.length > 0
      ? `${oceanTraits.join(', ')} bir kişiliğe sahip.`
      : `dengeli bir kişilik profiline sahip.`;

    if (zodiac) {
      const zodiacGiftAdvice = this.getZodiacGiftAdvice(zodiac);
      message += `\n\n**🔮 Burç Analizi:** ${zodiac} burcu olarak ${zodiacGiftAdvice} `;
      if (ascendant) {
        message += `Yükselen ${ascendant} etkisiyle dış dünyaya farklı bir enerji yansıtıyor.`;
      }
    }

    // Gift date astrology
    if (giftDateInsight) {
      message += `\n\n**📅 Hediye Günü Enerjisi:** ${giftDateInsight}`;
    }

    // Gift type reasoning with explainability
    message += `\n\n**📊 Hediye Stratejisi:** `;
    if (conversationProfile.giftType === 'sürpriz') {
      message += `Sürpriz hediye tercih ettiğiniz için, beklenmedik ve "bunu nereden buldun!" dedirtecek yaratıcı öneriler hazırladım.`;
    } else if (conversationProfile.giftType === 'kalıcı_anı') {
      message += `Duygusal ve kalıcı hediyeler tercih ettiğiniz için, anlam yüklü öneriler seçtim.`;
    } else if (conversationProfile.giftType === 'trend') {
      message += `Trend ve popüler ürünlere ilgi duyduğu için, yaş grubunda en çok aranan ürünleri seçtim.`;
    } else if (conversationProfile.giftType === 'ihtiyaç') {
      message += `Pratik hediye tercihinize göre, günlük hayatında gerçekten işine yarayacak ürünler seçtim.`;
    } else {
      message += `Profil analizine göre en uygun hediye önerilerimi hazırladım.`;
    }

    // Explainability — why these products
    message += `\n\n**💡 Neden Bu Öneriler:**`;
    if (ocean.openness > 0.6) message += `\n• Yaratıcılığı yüksek → sıra dışı, keşif odaklı ürünler öne çıkarıldı`;
    if (ocean.extraversion > 0.6) message += `\n• Sosyal kişiliği → paylaşılabilir, deneyim bazlı hediyeler tercih edildi`;
    if (ocean.extraversion < 0.4) message += `\n• İçe dönük yapısı → kişisel alan ve bireysel deneyim ürünleri seçildi`;
    if (ocean.conscientiousness > 0.6) message += `\n• Pratik kişiliği → fonksiyonel ve kaliteli ürünler ağırlıklandırıldı`;
    if (ocean.agreeableness > 0.6) message += `\n• Duygusal yapısı → anlam taşıyan, kişisel dokunuş içeren hediyeler ön plana alındı`;

    message += `\n\nİşte ${name} için özenle seçtiğim hediyeler:`;

    return {
      message,
      products: result.products,
      nearbyStores: result.nearbyStores,
      analysisComplete: true,
      analysis,
      followUpQuestions: ['Farklı kategorilerde öneriler göster'],
    };
  }

  /** Quick mode fallback — skip questions, go directly to recommendations */
  private async fallbackQuickRecommend(
    messages: GiftConversationMessage[],
    context?: GiftAIRequest['context'],
    formData?: GiftFormData,
    name?: string,
    age?: number,
    gender?: string,
    hobbies?: string[],
    occasion?: string,
    zodiac?: string,
    genderText?: string,
  ): Promise<GiftAIResponse> {
    const _name = name || formData?.name || 'bu kişi';
    const _occasion = occasion || formData?.occasion || 'özel gün';

    // Build analysis from saved profile data (no questions needed)
    const conversationProfile = this.buildConversationProfile(messages, formData);
    const cats = conversationProfile.categories.length > 0
      ? conversationProfile.categories
      : this.getSmartCategories(age, gender, conversationProfile);

    const zodiacTags = zodiac ? this.getZodiacGiftTags(zodiac) : [];
    const giftDate = formData?.giftDate;
    const giftDateInsight = giftDate ? this.getGiftDateAstrology(giftDate) : undefined;
    const giftDateTags = giftDate ? this.getGiftDateTags(giftDate) : [];

    const analysis: GiftAIResponse['analysis'] = {
      giftType: conversationProfile.giftType,
      reasoning: `${_name} için ${_occasion} hediyesi — önceki analiz ve yeni bütçe/vesileye göre seçildi`,
      personality: conversationProfile.personality,
      emotionalNeed: conversationProfile.emotionalNeed,
      categories: cats,
      tags: [...conversationProfile.tags, ...zodiacTags, ...giftDateTags],
      excludeTags: conversationProfile.excludeTags,
      priceRange: formData?.budget || context?.budget,
      ocean: conversationProfile.ocean,
      giftDateInsight: giftDateInsight || undefined,
    };

    const result = await this.fetchMatchingProducts(analysis, context, formData);

    let message = `${_name} için daha önce detaylı bir analiz yapmıştım, şimdi yeni bütçe ve vesileye göre önerilerimi güncelliyorum!\n\n`;
    message += `**🎯 Yeni Hediye Vesilesi:** ${_occasion}\n`;
    if (formData?.budget) {
      message += `**💰 Bütçe:** ${formData.budget.min} - ${formData.budget.max} TL\n`;
    }
    if (zodiac) {
      message += `**🔮 ${zodiac}** burcu özelliklerini ve önceki sohbetimizi göz önünde bulundurdum.\n`;
    }
    message += `\nİşte ${_name} için özenle seçtiğim hediyeler:`;

    return {
      message,
      products: result.products,
      nearbyStores: result.nearbyStores,
      analysisComplete: true,
      analysis,
      followUpQuestions: ['Farklı kategorilerde öneriler göster'],
    };
  }

  /** Analyze ALL conversation messages to build a rich profile */
  private buildConversationProfile(messages: GiftConversationMessage[], formData?: GiftFormData) {
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
    const allText = userMessages.join(' ');
    const age = formData?.age || 25;
    const gender = formData?.gender || '';

    // Detect personality traits
    let personality: 'introvert' | 'extrovert' | 'ambivert' = 'ambivert';
    const introvertSignals = ['ev', 'oda', 'yalnız', 'sakin', 'sessiz', 'kitap', 'okuma', 'çizim', 'puzzle'];
    const extrovertSignals = ['arkadaş', 'parti', 'dışarı', 'sosyal', 'gez', 'eğlen', 'dans', 'konser', 'etkinlik'];
    const introScore = introvertSignals.filter(s => allText.includes(s)).length;
    const extroScore = extrovertSignals.filter(s => allText.includes(s)).length;
    if (introScore > extroScore + 1) personality = 'introvert';
    else if (extroScore > introScore + 1) personality = 'extrovert';

    // Detect emotional need / gift type
    let giftType = 'ilgi_alanı';
    let emotionalNeed = 'eğlence';
    if (allText.includes('sürpriz') || allText.includes('şaşırt') || allText.includes('beklenmedik')) {
      giftType = 'sürpriz';
      emotionalNeed = 'keşif';
    } else if (allText.includes('anı') || allText.includes('hatıra') || allText.includes('duygu') || allText.includes('özel')) {
      giftType = 'kalıcı_anı';
      emotionalNeed = 'bağlantı';
    } else if (allText.includes('pratik') || allText.includes('ihtiyaç') || allText.includes('kullan')) {
      giftType = 'ihtiyaç';
      emotionalNeed = 'güvenlik';
    } else if (allText.includes('trend') || allText.includes('popüler') || allText.includes('herkes')) {
      giftType = 'trend';
      emotionalNeed = 'bireysellik';
    } else if (allText.includes('farklı') || allText.includes('benzersiz') || allText.includes('özel')) {
      giftType = 'ilgi_alanı';
      emotionalNeed = 'bireysellik';
    }

    // Smart tag extraction — demographic + conversation-aware
    const tags = new Set<string>();
    const excludeTags = new Set<string>();
    const categories = new Set<string>();

    // Detect what they DO have / DO like
    const likeMap: Record<string, { tags: string[]; cats: string[] }> = {
      'tiktok|instagram|sosyal medya|video': { tags: ['ring light', 'tripod', 'telefon aksesuarı', 'led'], cats: ['Elektronik', 'Hediyelik'] },
      'makyaj|kozmetik|bakım|cilt|güzellik': { tags: ['makyaj', 'cilt bakım', 'kozmetik', 'güzellik'], cats: ['Kozmetik'] },
      'müzik|şarkı|enstrüman|gitar|piyano': { tags: ['müzik', 'kulaklık', 'hoparlör', 'enstrüman'], cats: ['Elektronik', 'Ev & Yaşam'] },
      'kitap|oku|roman|hikaye|edebiyat': { tags: ['kitap', 'okuma', 'journal', 'defter'], cats: ['Kitap & Kırtasiye'] },
      'spor|futbol|basketbol|yüz|koş|dans|yoga': { tags: ['spor', 'fitness', 'outdoor'], cats: ['Spor & Outdoor'] },
      'oyun|game|konsol|playstation|xbox': { tags: ['oyun', 'gaming', 'konsol'], cats: ['Elektronik'] },
      'çizim|resim|sanat|boya|el işi': { tags: ['sanat', 'çizim', 'boya', 'diy', 'el yapımı'], cats: ['Oyuncak & Hobi', 'Hediyelik'] },
      'moda|giyim|kıyafet|stil|şık|giyinme': { tags: ['moda', 'giyim', 'aksesuar', 'şık'], cats: ['Kadın', 'Erkek', 'Ayakkabı & Çanta'] },
      'fotoğraf|kamera|polaroid': { tags: ['kamera', 'polaroid', 'fotoğraf'], cats: ['Elektronik'] },
      'dekor|oda|süsle|led|ışık': { tags: ['dekor', 'led', 'oda dekoru', 'ışık'], cats: ['Ev & Yaşam'] },
      'yemek|mutfak|aşçı|pasta|kurabiye': { tags: ['mutfak', 'yemek', 'gurme'], cats: ['Ev & Yaşam', 'Süpermarket'] },
      'seyahat|gez|tatil|kamp': { tags: ['seyahat', 'outdoor', 'kamp'], cats: ['Spor & Outdoor'] },
      'takı|kolye|bileklik|küpe|yüzük': { tags: ['takı', 'kolye', 'bileklik', 'aksesuar'], cats: ['Saat & Aksesuar'] },
      'parfüm|koku': { tags: ['parfüm', 'koku'], cats: ['Kozmetik'] },
    };

    for (const [pattern, mapping] of Object.entries(likeMap)) {
      const regex = new RegExp(pattern);
      if (regex.test(allText)) {
        mapping.tags.forEach(t => tags.add(t));
        mapping.cats.forEach(c => categories.add(c));
      }
    }

    // Detect what they DON'T have — exclude peripherals if no device mentioned
    const hasComputer = allText.includes('bilgisayar') || allText.includes('laptop') || allText.includes('pc');
    if (!hasComputer) {
      excludeTags.add('klavye');
      excludeTags.add('mouse');
      excludeTags.add('mousepad');
      excludeTags.add('monitör');
    }

    // Baby/toddler specific conversation signals
    const babyLikeMap: Record<string, { tags: string[]; cats: string[] }> = {
      'yürü|emekl|motor|hareket': { tags: ['yürüteç', 'itme oyuncak', 'aktivite'], cats: ['Anne & Çocuk', 'Oyuncak & Hobi'] },
      'ses|müzik|şarkı|melodi': { tags: ['müzikli oyuncak', 'sesli', 'enstrüman'], cats: ['Oyuncak & Hobi'] },
      'renk|boya|kalem|çiz': { tags: ['boya', 'kalem', 'sanat', 'yaratıcı'], cats: ['Oyuncak & Hobi', 'Kitap & Kırtasiye'] },
      'lego|blok|yapı|inşa|puzzle': { tags: ['lego', 'blok', 'puzzle', 'yapılandırma'], cats: ['Oyuncak & Hobi'] },
      'karakter|çizgi film|kahraman|prenses|dinozor': { tags: ['karakter', 'lisanslı', 'çizgi film'], cats: ['Oyuncak & Hobi'] },
      'eğitici|gelişim|öğren': { tags: ['eğitici', 'gelişimsel', 'STEM'], cats: ['Oyuncak & Hobi', 'Kitap & Kırtasiye'] },
      'park|dışarı|bahçe|koş': { tags: ['outdoor', 'aktif', 'bahçe oyuncağı'], cats: ['Oyuncak & Hobi', 'Spor & Outdoor'] },
      'hikaye|kitap|oku': { tags: ['kitap', 'hikaye', 'interaktif kitap'], cats: ['Kitap & Kırtasiye'] },
      'deney|bilim|uzay|robot': { tags: ['bilim kiti', 'deney', 'STEM', 'robot'], cats: ['Oyuncak & Hobi'] },
      'hamur|yapıştır|el işi|kum': { tags: ['hamur', 'el işi', 'kinetik kum', 'yaratıcı'], cats: ['Oyuncak & Hobi'] },
    };

    if (age <= 9) {
      for (const [pattern, mapping] of Object.entries(babyLikeMap)) {
        const regex = new RegExp(pattern);
        if (regex.test(allText)) {
          mapping.tags.forEach(t => tags.add(t));
          mapping.cats.forEach(c => categories.add(c));
        }
      }
    }

    // ALWAYS add Piaget/Erikson developmental tags based on age
    if (age <= 1) {
      // Sensorimotor + Trust → sensory, cause-effect, comfort objects
      ['duyusal', 'sensory', 'çıngırak', 'kumaş kitap', 'aktivite', 'peluş', 'müzikli', 'bebek', 'montessori'].forEach(t => tags.add(t));
      categories.add('Anne & Çocuk');
      categories.add('Oyuncak & Hobi');
    } else if (age <= 3) {
      // Late sensorimotor → preoperational + Autonomy → ride-ons, shape sorters, early symbolic
      ['blok', 'şekil', 'istifleme', 'yürüteç', 'sürme', 'parmak boya', 'hamur', 'ahşap', 'montessori', 'çocuk', 'bebek', 'eğitici'].forEach(t => tags.add(t));
      categories.add('Anne & Çocuk');
      categories.add('Oyuncak & Hobi');
      categories.add('Eğitici');
    } else if (age <= 6) {
      // Preoperational + Initiative → costumes, open-ended art, symbolic play sets
      ['hayal', 'kostüm', 'rol yapma', 'sanat', 'boya', 'lego', 'duplo', 'çizgi film', 'eğitici', 'yaratıcı', 'çocuk', 'oyuncak'].forEach(t => tags.add(t));
      categories.add('Oyuncak & Hobi');
      categories.add('Eğitici');
    } else if (age <= 11) {
      // Concrete operational + Industry → mastery kits, board games, collections, STEM
      ['bilim', 'deney', 'STEM', 'lego', 'puzzle', 'koleksiyon', 'kutu oyunu', 'satranç', 'spor', 'kodlama', 'robot', 'çocuk', 'eğitici'].forEach(t => tags.add(t));
      categories.add('Oyuncak & Hobi');
      categories.add('Eğitici');
    } else if (age <= 18) {
      // Formal operational + Identity → experiences, self-expression, creative tools
      ['deneyim', 'kimlik', 'kişisel', 'yaratıcı', 'trend', 'blind box', 'koleksiyon'].forEach(t => tags.add(t));
    } else if (age <= 40) {
      // Intimacy → shared experiences, home, career
      ['deneyim', 'ev', 'kariyer', 'paylaşım', 'kalite'].forEach(t => tags.add(t));
    } else if (age <= 65) {
      // Generativity → legacy, mentorship, hobbies
      ['hobi', 'kalite', 'premium', 'deneyim', 'miras', 'bahçe', 'wellness'].forEach(t => tags.add(t));
    } else {
      // Integrity → comfort, memory, connection
      ['konfor', 'anı', 'hatıra', 'bağlantı', 'sağlık', 'pratik'].forEach(t => tags.add(t));
    }

    // If "surprise" is requested, add creative/unexpected tags based on trends
    if (giftType === 'sürpriz') {
      tags.add('sürpriz');
      tags.add('yaratıcı');
      tags.add('hediyelik');
      // Add age-appropriate surprise items informed by 2025-2026 market trends
      if (age <= 2) {
        ['duyusal oyuncak', 'yumuşak', 'sesli kitap', 'aktivite küpü', 'montessori', 'gökkuşağı'].forEach(t => tags.add(t));
        categories.add('Anne & Çocuk');
        categories.add('Oyuncak & Hobi');
      } else if (age <= 5) {
        ['sihirli', 'interaktif', 'animasyonlu', 'oyun çadırı', 'manyetik blok', 'squishmallow', 'kinetik kum'].forEach(t => tags.add(t));
        categories.add('Oyuncak & Hobi');
      } else if (age <= 9) {
        ['bilim kiti', 'sihirbazlık', 'deney', 'kristal yetiştirme', 'kazı seti', 'slime', 'Mini Brands', 'kodlama'].forEach(t => tags.add(t));
        categories.add('Oyuncak & Hobi');
      } else if (age <= 14) {
        ['blind box', 'Pop Mart', 'Labubu', 'snap circuits', 'slime', 'DIY bileklik', 'koleksiyon'].forEach(t => tags.add(t));
        categories.add('Oyuncak & Hobi');
        if (gender === 'female') categories.add('Hediyelik');
        if (gender === 'male') categories.add('Elektronik');
      } else if (age < 18 && gender === 'female') {
        ['led projektör', 'polaroid', 'skincare', 'diy', 'journal', 'nostalji', 'blind box'].forEach(t => tags.add(t));
        categories.add('Hediyelik');
        categories.add('Kozmetik');
      } else if (age < 18 && gender === 'male') {
        ['drone', 'bilim kiti', 'deney', 'lego technic', 'aksiyon', 'gaming', 'blind box'].forEach(t => tags.add(t));
        categories.add('Oyuncak & Hobi');
        categories.add('Elektronik');
      } else if (gender === 'female') {
        ['deneyim', 'kişiselleştirilmiş', 'el yapımı', 'tasarım', 'aromaterapi', 'wellness'].forEach(t => tags.add(t));
        categories.add('Hediyelik');
        categories.add('Kozmetik');
        categories.add('Saat & Aksesuar');
      } else {
        ['gadget', 'kişiselleştirilmiş', 'deneyim', 'farklı', 'akıllı ev'].forEach(t => tags.add(t));
        categories.add('Hediyelik');
        categories.add('Elektronik');
      }
    }

    // Default demographic tags if nothing specific detected
    if (tags.size === 0) {
      this.getDefaultDemographicTags(age, gender).forEach(t => tags.add(t));
    }
    if (categories.size === 0) {
      this.getSmartCategories(age, gender, { personality, emotionalNeed, giftType }).forEach(c => categories.add(c));
    }

    // OCEAN Big Five scoring from conversation
    const ocean = this.inferOceanScores(allText, age, gender, personality);

    return {
      personality,
      emotionalNeed,
      giftType,
      tags: [...tags],
      excludeTags: [...excludeTags],
      categories: [...categories],
      ocean,
    };
  }

  /** Infer Big Five (OCEAN) personality scores from conversation text */
  private inferOceanScores(text: string, age: number, gender: string, personality: string): OceanScores {
    let openness = 0.5;
    let conscientiousness = 0.5;
    let extraversion = 0.5;
    let agreeableness = 0.5;
    let neuroticism = 0.3;

    // Openness — creativity, curiosity, novelty seeking
    const opennessUp = ['farklı', 'benzersiz', 'yaratıcı', 'sanat', 'müzik', 'keşif', 'deney', 'yeni', 'merak', 'sürpriz', 'macera', 'seyahat'];
    const opennessDown = ['klasik', 'geleneksel', 'alışılmış', 'normal', 'standart', 'bilinen'];
    openness += opennessUp.filter(w => text.includes(w)).length * 0.08;
    openness -= opennessDown.filter(w => text.includes(w)).length * 0.08;

    // Conscientiousness — order, planning, practicality
    const consUp = ['pratik', 'düzenli', 'planlı', 'organize', 'ihtiyaç', 'kullanışlı', 'kaliteli', 'dayanıklı'];
    const consDown = ['dağınık', 'spontan', 'rahat', 'umursamaz'];
    conscientiousness += consUp.filter(w => text.includes(w)).length * 0.08;
    conscientiousness -= consDown.filter(w => text.includes(w)).length * 0.08;

    // Extraversion
    if (personality === 'extrovert') extraversion = 0.8;
    else if (personality === 'introvert') extraversion = 0.2;
    const extroUp = ['arkadaş', 'parti', 'sosyal', 'eğlen', 'konser', 'dışarı', 'takıl', 'buluş'];
    const extroDown = ['yalnız', 'sakin', 'sessiz', 'oda', 'ev'];
    extraversion += extroUp.filter(w => text.includes(w)).length * 0.06;
    extraversion -= extroDown.filter(w => text.includes(w)).length * 0.06;

    // Agreeableness — emotional, empathetic
    const agreeUp = ['duygu', 'anı', 'hatıra', 'özel', 'sevgi', 'kalp', 'hediye', 'mutlu', 'kişisel'];
    const agreeDown = ['güçlü', 'bağımsız', 'rekabet', 'kazanmak'];
    agreeableness += agreeUp.filter(w => text.includes(w)).length * 0.07;
    agreeableness -= agreeDown.filter(w => text.includes(w)).length * 0.07;

    // Neuroticism — sensitivity, safe choices
    const neuroUp = ['güvenli', 'emin', 'risk', 'endişe', 'dikkatli', 'hassas'];
    neuroticism += neuroUp.filter(w => text.includes(w)).length * 0.08;

    // Clamp all values to 0-1
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    return {
      openness: clamp(openness),
      conscientiousness: clamp(conscientiousness),
      extraversion: clamp(extraversion),
      agreeableness: clamp(agreeableness),
      neuroticism: clamp(neuroticism),
    };
  }

  /** Get demographic-appropriate default tags */
  private getDefaultDemographicTags(age?: number, gender?: string): string[] {
    if (!age) return ['hediyelik', 'trend'];

    if (age < 10) return ['oyuncak', 'eğitici', 'çocuk', 'eğlenceli'];
    if (age < 15 && gender === 'female') return ['led', 'dekor', 'sticker', 'journal', 'polaroid', 'lip gloss', 'bileklik', 'kız'];
    if (age < 15 && gender === 'male') return ['drone', 'bilim', 'lego', 'spor', 'macera', 'erkek çocuk'];
    if (age < 15) return ['hediyelik', 'eğlenceli', 'yaratıcı', 'trend'];
    if (age < 20 && gender === 'female') return ['kozmetik', 'moda', 'aksesuar', 'led', 'dekor', 'genç kız'];
    if (age < 20 && gender === 'male') return ['spor', 'teknoloji', 'outdoor', 'genç erkek'];
    if (age < 20) return ['trend', 'genç', 'hediyelik'];
    if (age < 30 && gender === 'female') return ['kozmetik', 'takı', 'tasarım', 'parfüm', 'kadın'];
    if (age < 30 && gender === 'male') return ['teknoloji', 'saat', 'cüzdan', 'erkek'];
    if (age < 50 && gender === 'female') return ['ev', 'kozmetik', 'takı', 'kitap', 'kadın'];
    if (age < 50 && gender === 'male') return ['teknoloji', 'deri', 'saat', 'erkek'];
    if (gender === 'female') return ['ev', 'sağlık', 'kitap', 'hediyelik', 'kadın'];
    if (gender === 'male') return ['klasik', 'kitap', 'saat', 'hediyelik', 'erkek'];
    return ['hediyelik', 'trend', 'yaratıcı'];
  }

  /** Build a personalized question sequence based on profile — truly adaptive to age/gender/context */
  private buildQuestionSequence(formData?: GiftFormData): string[] {
    const age = formData?.age || 25;
    const gender = formData?.gender || '';
    const hobbies = formData?.hobbies || [];
    const relationship = formData?.relationship || '';
    const occasion = formData?.occasion || '';

    const questions: string[] = [];

    /* ═══ BEBEK 0-6 AY (Piaget: Erken duyusal-motor / Erikson: Güven) ═══ */
    if (age === 0) {
      questions.push('Kaç aylık? Başını tutuyor mu, ellerini kavrama refleksi gelişti mi?');
      questions.push('Hangi duyusal uyaranlara daha çok tepki veriyor? Sesler mi, renkler mi, dokunma mı? Kontrast desenlere bakıyor mu?');
      questions.push('Tummy time (karnı üstü zaman) yapıyor mu? Bu sürede nelerden hoşlanıyor?');
      questions.push('Bir güvenlik nesnesi (peluş, battaniye, emzik) var mı? Uyku rutini nasıl?');
      questions.push('Ebeveyn olarak hediyenin gelişimsel mi olmasını istersiniz, yoksa günlük bakımı kolaylaştıran pratik bir ürün mü?');
      questions.push('Bütçe olarak ne kadar harcamayı düşünüyorsunuz? Yerli/ahşap ürünler mi, marka ürünler mi tercih edersiniz?');
      return questions;
    }

    /* ═══ BEBEK 6-12 AY (Piaget: Nesne sürekliliği / Erikson: Güven pekişme) ═══ */
    if (age <= 1) {
      questions.push('Oturma, emekleme, tutunarak kalkma — motor gelişimde hangi aşamada? Aktif mi, sakin mi?');
      questions.push('Peek-a-boo (ce-ee) oynuyor mu? Saklanan nesneleri arıyor mu? Bu çok önemli bir gelişim göstergesi.');
      questions.push('Hangi tür oyuncakları keşfetmeyi seviyor — sesli mi, ışıklı mı, sıkılabilir mi, yoksa ağza götürülebilir mi?');
      questions.push('Banyo zamanını seviyor mu? Su ile oynamak ilgisini çeker mi?');
      questions.push('Müziğe tepkisi nasıl? Ritme ayak vuruyor mu, şarkı söylemeye çalışıyor mu?');
      questions.push('Bir güvenlik nesnesi (peluş, battaniye) var mı? Uyku rutininde yardımcı olan bir şey?');
      questions.push('Bu hediyenin eğitici/gelişimsel mi olmasını istersiniz, yoksa eğlenceli bir oyuncak mı olsun?');
      return questions;
    }

    /* ═══ TODDLER 1-2 YAŞ (Piaget: Geç duyusal-motor → erken sembolik / Erikson: Özerklik) ═══ */
    if (age <= 2) {
      questions.push('Yürüyor mu, koşuyor mu? Motor becerileri nasıl — merdiven çıkıyor mu, top atıyor mu, kalem tutabiliyor mu?');
      questions.push('Bağımsız olmayı seviyor mu? "Ben yapacağım!" diyor mu? Kendi başına yemeye, giyinmeye çalışıyor mu?');
      questions.push('Hangi tür oyuncaklara ilgi gösteriyor? Blokları istifleyip devirme, kapları açıp kapama, şekil yerleştirme gibi?');
      questions.push('Su ile oynamayı, kumda kazı yapmayı, parmak boyayla boyamayı sever mi? Dışarıda mı yoksa evde mi daha mutlu?');
      questions.push('Renkler, hayvanlar, araçlar, bebekler — hangilerine daha çok ilgi gösteriyor? Neyi görünce heyecanlanıyor?');
      questions.push('Müzik dinlemeyi, kitap sayfalarını çevirmeyi, dans etmeyi sever mi?');
      questions.push('Uyku düzeni nasıl? Yatmadan önce bir rutini var mı — ninni, peluş, gece lambası gibi?');
      questions.push('Bu hediyenin gelişimsel mi olmasını istersiniz, yoksa tamamen eğlence odaklı mı? Bütçe aralığınız nedir?');
      return questions;
    }

    /* ═══ 2-3 YAŞ (Piaget: Sembolik düşünce patlaması / Erikson: Özerklik zirvesi) ═══ */
    if (age <= 3) {
      questions.push('Konuşma gelişimi nasıl? Cümleler kuruyor mu, yoksa tek kelimeler mi kullanıyor? Hayal arkadaşı var mı?');
      questions.push('"Ben yapacağım!" diye ısrar eder mi? Kendi seçimlerini yapmak ister mi — kıyafet seçme, tabağını taşıma gibi?');
      questions.push('En çok ne tür oyunlar oynuyor? Mutfak seti, doktor çantası gibi rol yapma mı, yoksa bloklar, hamur gibi inşa mı?');
      questions.push('Dışarıda oynamayı sever mi? Scooter, denge bisikleti, kum havuzu, park — en çok ne ilgisini çeker?');
      questions.push('Renkler, sayılar, harfler, hayvanlar — öğrenmeye meraklı mı? Hangi konuda soruları bitmiyor?');
      questions.push('Kardeşleri veya akranlarıyla nasıl oynar? Paylaşmayı sever mi, tek başına mı tercih eder?');
      questions.push('Eğitici mi eğlenceli mi olsun? Yerel ahşap oyuncak mı, marka ürün mü tercih edersiniz?');
      return questions;
    }

    /* ═══ 3-6 YAŞ (Piaget: İşlem öncesi zirve / Erikson: İnisiyatif) ═══ */
    if (age <= 5) {
      questions.push('Hayal dünyası nasıl? Hikayeler uyduruyor mu, oyuncaklarla senaryolar kuruyor mu? Favori karakteri/çizgi filmi var mı?');
      questions.push('Kendi başına projeler başlatır mı? "Ben şunu yapmak istiyorum!" der mi? Yoksa yönlendirme mi bekler?');
      questions.push('Boyama, hamur, lego, yapıştırma gibi yaratıcı işler mi, yoksa koşma, dans, park gibi fiziksel aktiviteler mi daha çok çeker?');
      questions.push('Dış mekanda ne yapmayı seviyor? Böcek avlamak, bitki yetiştirmek, top oynamak, bisiklet sürmek?');
      questions.push('Arkadaşlarıyla nasıl oynar? Lider mi olur, uyum mu sağlar? Sıra beklemeyi, kuralları anlar mı?');
      questions.push('Müziğe, sayılara, harflere, doğa olaylarına özel bir merakı var mı? Neyi gördüğünde gözleri parlıyor?');
      questions.push('Daha önce en çok hangi hediyeyi sevmişti? Ne tür şeyler onu en mutlu eder?');
      questions.push('Bu hediyenin eğitici mi eğlenceli mi olmasını istersiniz? Bütçe tercihiniz var mı?');
      return questions;
    }

    /* ═══ OKUL ÇAĞI 6-9 YAŞ (Piaget: Somut işlemler / Erikson: Yeterlilik) ═══ */
    if (age <= 9) {
      questions.push('Okulda en çok hangi dersleri seviyor? Fen, matematik, müzik, resim, beden eğitimi? Neden o dersler ilgisini çekiyor?');
      questions.push('Bir şeyi "başarma" hissi onu mutlu eder mi? Puzzle tamamlamak, bir model yapmak, bir beceri öğrenmek gibi?');
      questions.push('Boş zamanlarında ne yapar? Lego, çizim, kitap, bilim deneyi, dışarıda oynamak?');
      if (gender === 'female') {
        questions.push('Slime, DIY bileklik, günlük, boncuk dizme, origami gibi yaratıcı işlere ilgisi var mı? Koleksiyon yapıyor mu?');
      } else if (gender === 'male') {
        questions.push('Dinozorlar, uzay, robotlar, süper kahramanlar, arabalar — en çok hangi temalara ilgi duyuyor? Koleksiyon yapıyor mu?');
      } else {
        questions.push('Bilim, sanat, doğa, hayvanlar, uzay — en çok hangi konulara meraklı? Koleksiyon yapıyor mu?');
      }
      questions.push('Arkadaşlarıyla birlikte ne yapmayı seviyor? Kutu oyunları, dış mekan oyunları, birlikte proje mi?');
      questions.push('Tablet ya da bilgisayar kullanıyor mu? Ekran alışkanlığı nasıl — ekransız alternatif mi arıyorsunuz?');
      questions.push('Daha önce en çok beğendiği hediye ne olmuştu? Neden onu bu kadar sevdi?');
      questions.push('Hediyenin STEM/eğitici mi, eğlence mi, spor mu odaklı olmasını istersiniz?');
      return questions;
    }

    /* ═══ ERGEN 10-14 YAŞ (Piaget: Somut→Soyut geçiş / Erikson: Yeterlilik→Kimlik) ═══ */
    if (age <= 14) {
      if (gender === 'female') {
        questions.push('Arkadaşlarıyla birlikte ne yapmaktan hoşlanıyor? Video çekme, el işi, dış mekan aktiviteleri, alışveriş?');
        questions.push('Odasını süslemeyi, günlük yazmayı sever mi? Koleksiyon yapıyor mu — sticker, blind box, kart? Slime veya DIY projeleri?');
      } else if (gender === 'male') {
        questions.push('Boş zamanlarında en çok ne yapıyor? Oyun, spor, bir şeyler kurcalama/inşa etme, doğa keşfi?');
        questions.push('Bilgisayarı veya tableti var mı? Kodlama, robotik, deney kitleri gibi STEM konularına ilgisi var mı?');
      } else {
        questions.push('Boş zamanlarını nasıl geçiriyor? Arkadaşlarıyla ne yapıyorlar?');
        questions.push('Teknoloji/kodlama mı, yaratıcı el işi mi, spor mu — en çok hangisine yatkın?');
      }
      questions.push('Koleksiyon yapıyor mu? Pop Mart/blind box, kart koleksiyonu, figür gibi şeyler ilgisini çeker mi?');
      questions.push('Akranları arasında nelere ilgi duyuluyor? TikTok trendleri, belirli markalar, oyunlar?');
      questions.push('Daha önce en çok hangi hediyeyi beğenmişti? Ne tür şeyler onu heyecanlandırır?');
      questions.push('Bu hediyenin eğlenceli bir sürpriz mi olmasını istersiniz, yoksa gerçekten ihtiyacı olan bir şey mi?');
      return questions;
    }

    /* ═══ GENÇ 15-19 YAŞ (Piaget: Soyut işlemler / Erikson: Kimlik arayışı) ═══ */
    if (age <= 19) {
      questions.push('Kendini nasıl tanımlar — trend takipçisi mi, herkesin almayacağı özel/niş ürünleri mi arar, yoksa pratik odaklı mı?');
      if (gender === 'female') {
        questions.push('Self-care, moda, oda dekorasyonu — bunlardan hangisi ilgisini çeker? Tarzı nasıl — minimalist mi, renkli mi, vintage mı?');
      } else if (gender === 'male') {
        questions.push('Spor, teknoloji, müzik, sanat — boş zamanlarını en çok nasıl geçirir? Tutkuyla bağlandığı bir hobi var mı?');
      } else {
        questions.push('Boş zamanlarında en çok ne yapmayı sever? Tutkuyla bağlandığı bir alan var mı?');
      }
      questions.push('Bilgisayarı, tableti, kendi telefonu, konsolu var mı? Hangi cihazları aktif kullanıyor?');
      questions.push('Deneyim hediyesi mi (konser, workshop, seyahat), fiziksel ürün mü, hediye kartı mı daha çok sevindirir?');
      questions.push('Blind box/koleksiyon, nostalji ürünleri (2000ler), viral TikTok ürünleri — bunlardan ilgisini çeken var mı?');
      questions.push('Daha önce en çok beğendiği hediye ne olmuştu? Neden onu sevmişti?');
      return questions;
    }

    /* ═══ GENÇ YETİŞKİN 20-29 YAŞ (Erikson: Yakınlık — hayat kurma) ═══ */
    if (age <= 29) {
      questions.push('Popüler markaları mı tercih eder, yoksa niş/butik ürünlere mi yönelir? Alışveriş alışkanlığı nasıl?');
      if (gender === 'female') {
        questions.push('Skincare, moda, wellness — hangileri ilgisini çeker? Tarzı nasıl — şık mı, rahat ve doğal mı, sportif mi?');
      } else if (gender === 'male') {
        questions.push('Evde mi yoksa dışarıda mı vakit geçirmeyi sever? Mutfak, spor, teknoloji, seyahat — hangisi ön planda?');
      } else {
        questions.push('Tipik bir hafta sonunu nasıl geçirir? Ev mi, dışarı mı, yeni yerler keşfetme mi?');
      }

      if (hobbies.includes('Teknoloji') || hobbies.includes('Oyun')) {
        questions.push('Hangi cihazlara sahip? Bilgisayar, konsol, tablet, akıllı ev cihazları — hangileri var?');
      } else {
        questions.push('Daha önce en çok beğendiği hediye ne olmuştu? Hangi tür hediyeler onu mutlu etti?');
      }

      if (relationship === 'Eş / Partner' || relationship === 'Erkek Arkadaş' || relationship === 'Kız Arkadaş') {
        questions.push('Birlikte yapmayı sevdiğiniz bir aktivite var mı? Bu hediyeyle paylaşılabilir bir deneyim mi istiyorsunuz?');
      } else {
        questions.push('Ev/oda dekorasyonu, mutfak, kişisel bakım — yaşam alanıyla ilgili ihtiyacı var mı?');
      }

      questions.push('Pratik ve günlük kullanacağı bir hediye mi, yoksa duygusal değeri olan kalıcı bir anı mı tercih edersiniz?');
      return questions;
    }

    /* ═══ ORTA YAŞ 30-49 (Erikson: Üretkenlik — iz bırakma) ═══ */
    if (age <= 49) {
      questions.push('Kalite mi, fiyat mı, yoksa anlam mı? Hediye seçerken sizin için en önemli kriter hangisi?');

      if (relationship === 'Eş / Partner' || relationship === 'Erkek Arkadaş' || relationship === 'Kız Arkadaş') {
        questions.push('Birlikte yapmaktan en çok zevk aldığınız aktivite ne? Bu hediyeyle bir deneyim mi paylaşmak istersiniz?');
      } else {
        questions.push('Evde mi yoksa dışarıda mı vakit geçirmeyi tercih eder? Tutkuyla bağlandığı bir hobi var mı?');
      }

      questions.push('Günlük hayatını kolaylaştıracak akıllı ev/mutfak cihazları, yoksa ruhunu besleyecek bir hobi/deneyim hediyesi mi daha uygun?');
      questions.push('Wellness/spa deneyimi, premium hobi ekipmanı, seyahat, koleksiyon — hangisi daha çok sevindirir?');
      questions.push('Daha önce en çok beğendiği hediye ne olmuştu? Ne tür hediyelerden hoşlanır?');
      questions.push('Son olarak, hediyenin amacı ne olsun — "vay canına!" dedirtmek mi, günlük rahatlık mı, yoksa anlamlı bir jest mi?');
      return questions;
    }

    /* ═══ 50-65 YAŞ (Erikson: Üretkenlik zirvesi — miras, mentor) ═══ */
    if (age <= 65) {
      questions.push('Sağlık ve konfor mu ön planda, yoksa hâlâ aktif bir yaşam mı sürüyor? Düzenli bir hobisi var mı?');
      if (relationship === 'Anne' || relationship === 'Baba') {
        questions.push('Evde en çok ne yapmaktan hoşlanır? Bahçe, mutfak, okuma, el işi, TV dizileri?');
        questions.push('Torunlarıyla vakit geçirmekten hoşlanır mı? Birlikte yapabilecekleri bir hediye düşünülsün mü?');
      } else {
        questions.push('Boş zamanlarını nasıl geçirir? Hobileri, sosyal aktiviteleri neler?');
        questions.push('Emeklilik planları/hayalleri var mı? Seyahat, hobi kursu, bahçecilik gibi?');
      }
      questions.push('Kaliteli bir hobi ekipmanı, konfor artıran bir ürün, yoksa duygusal bir anı hediyesi mi daha uygun?');
      questions.push('Daha önce en çok hangi hediyeyi beğenmişti? Ne tür şeyler onu mutlu eder?');
      questions.push('Hediyenin pratik mi anlamlı mı olmasını istersiniz?');
      return questions;
    }

    /* ═══ 65+ YAŞ (Erikson: Bütünlük — hayat anlam gözden geçirme) ═══ */
    questions.push('Sağlık durumu nasıl? Hareket kısıtlılığı, görme/duyma gibi dikkat edilmesi gereken bir durum var mı?');
    if (relationship === 'Anne' || relationship === 'Baba' || relationship === 'Büyükanne' || relationship === 'Büyükbaba') {
      questions.push('Evde en çok ne yapmaktan hoşlanır? Bahçe, mutfak, okuma, TV, el işi?');
      questions.push('Torunlarıyla, aileyle vakit geçirmek en büyük mutluluğu mu? Birlikte bir şey yapabilecekleri bir hediye düşünelim mi?');
    } else {
      questions.push('Boş zamanlarını nasıl geçirir? Aktif mi, daha çok evde mi vakit geçiriyor?');
      questions.push('Sosyal çevresi aktif mi? Arkadaşlarıyla ne tür aktiviteler yapıyor?');
    }
    questions.push('Teknoloji kullanıyor mu? Akıllı telefon, tablet — yoksa daha basit çözümler mi tercih ediyor?');
    questions.push('Hayatını kolaylaştıracak pratik bir ürün mü, yoksa hatıra/anı değeri taşıyan duygusal bir hediye mi daha uygun?');
    questions.push('Daha önce en çok hangi hediyeyi beğenmişti?');

    return questions;
  }

  /** Generate psychological insight from answer */
  private generateInsight(answer: string, name: string, age?: number, gender?: string, hobbies?: string[], questionIdx = 0): string {
    const lower = answer.toLowerCase();

    // Deep theme detection with psychological interpretation
    const analyses: string[] = [];

    // Baby 0-6 months (Piaget: early sensorimotor / Erikson: trust)
    if (age !== undefined && age === 0) {
      if (lower.includes('baş') || lower.includes('kavra') || lower.includes('tut')) {
        analyses.push(`Piaget'nin duyusal-motor evresinin ilk adımları! Kavrama refleksi gelişiyorsa, elinde tutabileceği hafif çıngıraklar ve dokulu oyuncaklar mükemmel olur. "Dünya güvenli" mesajı veren, tutarlı geri bildirimli ürünler seçeceğim.`);
      }
      if (lower.includes('ses') || lower.includes('renk') || lower.includes('kontrast') || lower.includes('bak')) {
        analyses.push(`Bu ayda görsel keskinlik yaklaşık 20/400 — kontrast desenler en iyi uyaran! ${name}'${this.getSuffix(name, 'in')} duyusal keşif yolculuğuna uygun, yüksek kontrastlı ve ritmik sesli ürünler düşüneceğim.`);
      }
      if (lower.includes('uyku') || lower.includes('peluş') || lower.includes('battaniye') || lower.includes('ninni')) {
        analyses.push(`Erikson'ın "güven" evresi tam da bu! Uyku rutinini destekleyen güvenlik nesnesi (transitional object) bebek için çok önemli. Yumuşak peluş, müzik kutusu veya beyaz gürültü cihazı düşünüyorum.`);
      }
      if (analyses.length === 0) {
        analyses.push(`Bu dönem tüm duyularla dünyayı keşif dönemi. ${name}'${this.getSuffix(name, 'in')} gelişim evresine uygun, güvenli ve duyusal zenginlikte ürünler hazırlayacağım.`);
      }
      return analyses[0];
    }

    // Baby 6-12 months (Piaget: object permanence / Erikson: trust consolidation)
    if (age !== undefined && age <= 1) {
      if (lower.includes('otur') || lower.includes('emekl') || lower.includes('kalk') || lower.includes('tut')) {
        analyses.push(`Motor gelişim hızla ilerliyor! Oturma ve emekleme, mekansal keşfi başlatır. Neden-sonuç oyuncakları (düğmeye bas→ses çıkar) ve istifleme kapları bu evreye çok uygun.`);
      }
      if (lower.includes('ce') || lower.includes('peek') || lower.includes('sakla') || lower.includes('ara')) {
        analyses.push(`Nesne sürekliliği gelişiyor — Piaget'nin en önemli dönüm noktalarından biri! "Saklanan şey var olmaya devam ediyor" bilgisi, peek-a-boo ve saklama-bulma oyuncaklarını çok heyecanlı kılıyor.`);
      }
      if (lower.includes('ses') || lower.includes('müzik') || lower.includes('ışık')) {
        analyses.push(`Duyusal uyaranlara güçlü tepki vermesi harika! Bu neden-sonuç bağlantısını gösteriyor. "Benim eylemim bir sonuç üretir" keşfi — sesli, ışıklı, tepki veren oyuncaklar mükemmel.`);
      }
      if (lower.includes('banyo') || lower.includes('su')) {
        analyses.push(`Banyo zamanı duyusal keşif şöleni! Su oyuncakları, su değirmeni, fıskiye oyuncakları bu evrede hem eğlenceli hem gelişimsel.`);
      }
      if (analyses.length === 0) {
        analyses.push(`Bu bilgi ${name}'${this.getSuffix(name, 'in')} gelişim evresini anlamamda çok değerli. Nesne sürekliliği ve neden-sonuç keşfine uygun ürünler hazırlayacağım.`);
      }
      return analyses[0];
    }

    // Toddler (1-3 years) — Piaget: late sensorimotor to preoperational / Erikson: autonomy
    if (age && age <= 3) {
      if (lower.includes('yürü') || lower.includes('koş') || lower.includes('merdiven') || lower.includes('tırman')) {
        analyses.push(`Motor gelişim harika ilerliyor! Yürüme ve koşma, tüm fiziksel dünyayı keşfe açar. İtme-çekme oyuncaklar, sürme arabalar, mini trambolin — hareket özgürlüğünü destekleyen hediyeler düşüneceğim.`);
      }
      if (lower.includes('ben') || lower.includes('bağımsız') || lower.includes('yapac') || lower.includes('ısrar')) {
        analyses.push(`Erikson'ın "Özerklik vs Utanç" evresi tam da bu! "Ben yapabilirim!" isteği, gelişimin en önemli basamaklarından. Çocuk boyu mutfak araçları, kendi seçeceği bloklar, giydirmeli bebekler — bağımsızlık hissi veren hediyeler mükemmel.`);
      }
      if (lower.includes('blok') || lower.includes('istifle') || lower.includes('devir') || lower.includes('yerleştir')) {
        analyses.push(`İstifleme ve yerleştirme, Piaget'nin sembolik düşünce başlangıcına işaret ediyor! Bir blok artık sadece blok değil, belki bir araba veya bir kule. Şekil yerleştirme kutuları ve büyük parçalı blok setleri çok uygun.`);
      }
      if (lower.includes('boya') || lower.includes('kum') || lower.includes('su') || lower.includes('hamur')) {
        analyses.push(`Duyusal zengin materyaller! Parmak boya, kinetik kum, hamur — bunlar sadece eğlence değil, ince motor gelişimi, duyusal ayrım ve yaratıcılığın temelini oluşturuyor.`);
      }
      if (lower.includes('hayvan') || lower.includes('araba') || lower.includes('bebek') || lower.includes('renk')) {
        analyses.push(`İlgi alanı netleşiyor! Bu dönemde tematik ilgiler (hayvanlar, araçlar, karakterler) ilk sembolik oyunun malzemeleri oluyor. İlgi alanına özel oyun setleri harika bir seçim.`);
      }
      if (lower.includes('müzik') || lower.includes('dans') || lower.includes('şarkı') || lower.includes('kitap')) {
        analyses.push(`Müzik ve kitaplar dil gelişiminin süper kahramanları! Dil patlaması döneminde ritmik ve tekrarlayan içerikler çok değerli. Sesli kitaplar, basit enstrümanlar düşünüyorum.`);
      }
      if (analyses.length === 0) {
        analyses.push(`Bu bilgi ${name}'${this.getSuffix(name, 'in')} özerklik ve keşif dönemini anlamamda çok yardımcı oldu. Bağımsızlığını destekleyen, güvenli ve yaşına uygun hediyeler hazırlayacağım.`);
      }
      return analyses[0];
    }

    // Preschool (3-6) — Piaget: preoperational peak / Erikson: initiative
    if (age && age <= 6) {
      if (lower.includes('karakter') || lower.includes('çizgi film') || lower.includes('kahraman') || lower.includes('prenses') || lower.includes('dinozor')) {
        analyses.push(`Favori karakteri var — animizm döneminde bu karakterler gerçekten "canlı"! Tematik hediye vermek ${name}'${this.getSuffix(name, 'in')} hayal dünyasına direkt giriş bileti. Bu karakter temalı ürünler düşüneceğim.`);
      }
      if (lower.includes('boya') || lower.includes('hamur') || lower.includes('yapıştır') || lower.includes('proje') || lower.includes('yapmak ist')) {
        analyses.push(`İnisiyatif evresi! "Ben şunu yapmak istiyorum" demesi, Erikson'a göre sağlıklı gelişimin işareti. Açık uçlu sanat malzemeleri, süreç odaklı yaratıcı kitleri — sonuç değil, deneyim önemli.`);
      }
      if (lower.includes('koş') || lower.includes('dans') || lower.includes('park') || lower.includes('dışarı') || lower.includes('bisiklet')) {
        analyses.push(`Enerjik bir çocuk! Kaba motor becerileri geliştiren ve inisiyatifi destekleyen açık hava oyuncakları — bisiklet, scooter, keşif kiti — mükemmel seçimler olur.`);
      }
      if (lower.includes('lider') || lower.includes('kural') || lower.includes('arkadaş') || lower.includes('paylaş')) {
        analyses.push(`Sosyal oyun gelişimi hakkında değerli bir bilgi! Bu dönemde kooperatif oyunlar (yarışma değil!) ve birlikte yapılabilen projeler sosyal becerileri destekler.`);
      }
      if (analyses.length === 0) {
        analyses.push(`Harika! ${name}'${this.getSuffix(name, 'in')} hayal dünyası ve inisiyatif evresi hakkında güzel bir tablo oluşuyor. Yaratıcılığını besleyen hediyeler hazırlayacağım.`);
      }
      return analyses[0];
    }

    // School age (6-9) — Piaget: concrete operational / Erikson: industry
    if (age && age <= 9) {
      if (lower.includes('fen') || lower.includes('deney') || lower.includes('bilim') || lower.includes('uzay') || lower.includes('robot')) {
        analyses.push(`Bilime meraklı — Piaget'nin somut işlemler döneminde bilimsel gözlem anlamlı hale geliyor! Deney kitleri, kristal yetiştirme, teleskop, kodlama robotları ${name} için harika olur.`);
      }
      if (lower.includes('başar') || lower.includes('tamamla') || lower.includes('öğren') || lower.includes('beceri')) {
        analyses.push(`"Ustalık" ihtiyacı — Erikson'ın "Yeterlilik" evresinin özü! Bir şeyi başarma, bir sonuç üretme hissi bu yaşta altın değerinde. Beceri kitleri, adım adım projeler, koleksiyon başlatıcılar çok uygun.`);
      }
      if (lower.includes('sanat') || lower.includes('çizim') || lower.includes('resim') || lower.includes('boya')) {
        analyses.push(`Sanatsal yetenek! Somut işlemler döneminde sanat, soyut ifadeden ziyade "teknik" ustalıktır. Çizim seti, origami, maket yapma kitleri — beceri geliştiren sanat ürünleri düşüneceğim.`);
      }
      if (lower.includes('kitap') || lower.includes('oku') || lower.includes('hikaye') || lower.includes('seri')) {
        analyses.push(`Okuma alışkanlığı bu yaşta paha biçilmez! Bölümlü kitap serileri (Harry Potter, Percy Jackson, Kaşifler Serisi) somut işlemler döneminde çoklu perspektifi öğretir.`);
      }
      if (lower.includes('koleksiyon') || lower.includes('kart') || lower.includes('taş') || lower.includes('pul')) {
        analyses.push(`Koleksiyon yapma! Sınıflama, sıralama ve kategorileme — Piaget'nin somut işlemler döneminin temel becerileri. Koleksiyon başlatıcı hediyeler bu ihtiyacı mükemmel karşılar.`);
      }
      if (lower.includes('lego') || lower.includes('yapı') || lower.includes('inşa') || lower.includes('model')) {
        analyses.push(`İnşa ve yapılandırma sevgisi — somut mantıksal düşüncenin uygulaması! LEGO temalı setler, model kitler, elektronik devre setleri somut işlemler dönemine biçilmiş kaftan.`);
      }
      if (analyses.length === 0) {
        analyses.push(`Bu bilgi ${name}'${this.getSuffix(name, 'in')} ilgi alanlarını ve ustalık ihtiyacını anlamamda çok faydalı oldu. Doğru hediyeye giderek yaklaşıyoruz!`);
      }
      return analyses[0];
    }

    // Trend/Social
    if (lower.includes('trend') || lower.includes('popüler') || lower.includes('herkes') || lower.includes('tiktok') || lower.includes('instagram')) {
      analyses.push(`${name} sosyal onay ve ait olma ihtiyacı yüksek biri — akranlarıyla aynı trendleri takip ediyor. Bu bana, "herkesin konuştuğu" ürünlerin onu heyecanlandıracağını söylüyor.`);
    }

    // Unique/Individual
    if (lower.includes('farklı') || lower.includes('özel') || lower.includes('benzersiz') || lower.includes('kimse')) {
      analyses.push(`${name}'${this.getSuffix(name, 'in')} bireysellik arayışı güçlü — "herkesin sahip olduğu" şeylerden kaçınıyor. Bu kişiliğe, kişiselleştirilmiş veya niş ürünler çok daha anlamlı gelir.`);
    }

    // Surprise preference
    if (lower.includes('sürpriz') || lower.includes('şaşırt') || lower.includes('eğlenceli')) {
      analyses.push(`Sürpriz hediye tercih ediyorsunuz — bu çok güzel! "Bunu nereden buldun!" dedirtecek, beklenmedik ve yaratıcı ürünlere odaklanacağım. Sıradan hediyeler yerine, keşfetme heyecanı yaşatacak öneriler hazırlayacağım.`);
    }

    // Practical
    if (lower.includes('pratik') || lower.includes('ihtiyaç') || lower.includes('kullan') || lower.includes('lazım')) {
      analyses.push(`Pratik ve işe yarar hediye tercihi, ${name}'${this.getSuffix(name, 'in')} rasyonel ve planlı bir kişiliğe sahip olduğunu gösteriyor. Hediyenin hayatını kolaylaştırması önemli.`);
    }

    // Home/Room
    if (lower.includes('oda') || lower.includes('ev') || lower.includes('dekor') || lower.includes('ışık')) {
      analyses.push(`Odasında/evinde vakit geçirmeyi seven biri — kişisel alanını güzelleştiren, atmosfer yaratan ürünler harika bir seçim olabilir. LED ışıklar, dekoratif objeler, rahat aksesuarlar düşünülebilir.`);
    }

    // Social/Friends
    if (lower.includes('arkadaş') || lower.includes('takıl') || lower.includes('dışarı') || lower.includes('parti') || lower.includes('buluş')) {
      analyses.push(`Sosyal ve arkadaş odaklı bir kişilik — birlikte kullanılabilecek veya sosyal ortamlarda dikkat çekecek hediyeler çok iyi karşılanır.`);
    }

    // Tech
    if (lower.includes('bilgisayar') || lower.includes('telefon') || lower.includes('tablet') || lower.includes('konsol') || lower.includes('oyun')) {
      analyses.push(`Teknoloji kullanan biri olduğunu anlıyorum. Bu bilgi çok değerli — sahip olduğu cihazlara uygun aksesuarlar veya tamamlayıcı ürünler düşünebilirim.`);
    }

    // No tech
    if (lower.includes('yok') || lower.includes('kullanmı') || lower.includes('ilgilen')) {
      analyses.push(`Bu bilgi altın değerinde — sahip olmadığı veya ilgilenmediği alanları bilmek, yanlış hediyelerden kaçınmamı sağlıyor. Doğru yöne odaklanabiliyorum.`);
    }

    // Beauty/Fashion
    if (lower.includes('makyaj') || lower.includes('bakım') || lower.includes('güzellik') || lower.includes('moda') || lower.includes('giyim') || lower.includes('şık')) {
      analyses.push(`Kişisel bakım ve stil konusunda bilinçli biri — kozmetik, bakım ürünleri veya şık aksesuarlar hediye listesinin başına oturabilir.`);
    }

    // Emotional/Memory
    if (lower.includes('anı') || lower.includes('hatıra') || lower.includes('duygu') || lower.includes('kalıcı')) {
      analyses.push(`Duygusal bağ kuran bir hediye istiyorsunuz. ${name} için anlam yüklü, kişisel dokunuş taşıyan ürünler çok daha etkili olacaktır.`);
    }

    // Sport
    if (lower.includes('spor') || lower.includes('futbol') || lower.includes('basketbol') || lower.includes('koş') || lower.includes('yüz') || lower.includes('dans')) {
      analyses.push(`Sporla ilgilenen biri — aktif yaşam tarzına uygun, performans artıran veya spor deneyimini zenginleştirecek hediyeler düşünülebilir.`);
    }

    // Art/Creative
    if (lower.includes('çiz') || lower.includes('boya') || lower.includes('sanat') || lower.includes('resim') || lower.includes('el işi')) {
      analyses.push(`Yaratıcı bir ruha sahip! Sanat malzemeleri, DIY kitleri veya el yapımı deneyim hediyeleri bu kişiliğe çok uygun.`);
    }

    if (analyses.length === 0) {
      const genericAnalyses = [
        `Bu bilgi profili şekillendirmeme çok yardımcı oldu. ${name}'${this.getSuffix(name, 'in')} kişiliği hakkında giderek daha net bir tablo ortaya çıkıyor.`,
        `Harika! Her cevap, doğru hediyeye bir adım daha yaklaştırıyor beni. ${name} için çok güzel bir liste hazırlayacağım.`,
        `Teşekkürler! Bu detaylar ${name}'${this.getSuffix(name, 'in')} ne tür hediyelerden hoşlanacağını tahmin etmemde çok kıymetli.`,
        `Bu perspektif çok önemli. ${name}'${this.getSuffix(name, 'in')} dünyasını anlamamı sağlıyor ve hediye seçimimi çok daha isabetli yapacak.`,
      ];
      analyses.push(genericAnalyses[questionIdx % genericAnalyses.length]);
    }

    return analyses[0];
  }

  /** Extract enriched tags from conversation — context and demographic aware */
  private extractTagsFromConversation(messages: GiftConversationMessage[]): string[] {
    const tags = new Set<string>();
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
    const allText = userMessages.join(' ');

    const keywords: Record<string, string[]> = {
      'led': ['led', 'ışık', 'dekor', 'oda süs'],
      'polaroid': ['fotoğraf', 'polaroid', 'kamera'],
      'kozmetik': ['kozmetik', 'makyaj', 'bakım', 'cilt', 'güzellik', 'lip gloss'],
      'moda': ['moda', 'giyim', 'stil', 'şık', 'kıyafet'],
      'spor': ['spor', 'fitness', 'koşu', 'yoga', 'futbol', 'basketbol', 'dans'],
      'sanat': ['sanat', 'çizim', 'boya', 'resim', 'el işi', 'diy'],
      'kitap': ['kitap', 'okuma', 'roman', 'edebiyat', 'journal', 'günlük'],
      'müzik': ['müzik', 'enstrüman', 'gitar', 'piyano', 'kulaklık', 'hoparlör'],
      'outdoor': ['doğa', 'kamp', 'outdoor', 'trekking', 'bisiklet', 'gez'],
      'takı': ['takı', 'kolye', 'bileklik', 'küpe', 'yüzük', 'aksesuar'],
      'parfüm': ['parfüm', 'koku'],
      'teknoloji': ['teknoloji', 'tablet', 'akıllı saat', 'gadget'],
      'ev': ['ev', 'mutfak', 'dekorasyon', 'mobilya'],
      'sürpriz': ['sürpriz', 'şaşırt', 'beklenmedik', 'eğlenceli'],
      'yaratıcı': ['farklı', 'benzersiz', 'özel', 'kişiselleştirilmiş'],
      'oyun': ['oyun', 'game', 'konsol', 'playstation', 'xbox'],
      'sosyal medya': ['tiktok', 'instagram', 'youtube', 'sosyal medya', 'video'],
    };

    for (const [tag, words] of Object.entries(keywords)) {
      if (words.some(w => allText.includes(w))) {
        tags.add(tag);
      }
    }

    return [...tags];
  }

  private getSuffix(name: string, suffix: string): string {
    const lastChar = name.charAt(name.length - 1).toLowerCase();
    const vowels = 'aeıioöuü';
    if (vowels.includes(lastChar)) return `'${suffix === 'i' ? 'yi' : 'nın'}`;
    return `'${suffix === 'i' ? 'i' : 'ın'}`;
  }

  private getSmartCategories(age?: number, gender?: string, profile?: { personality?: string; emotionalNeed?: string; giftType?: string }): string[] {
    const cats = new Set<string>();
    const gt = profile?.giftType || '';

    // Surprise gifts → creative categories
    if (gt === 'sürpriz') {
      cats.add('Hediyelik');
      cats.add('Oyuncak & Hobi');
    }

    // Age + gender demographic targeting
    if (age && age < 10) {
      cats.add('Oyuncak & Hobi');
      cats.add('Anne & Çocuk');
      cats.add('Kitap & Kırtasiye');
    } else if (age && age < 15 && gender === 'female') {
      cats.add('Hediyelik');
      cats.add('Kozmetik');
      cats.add('Oyuncak & Hobi');
      cats.add('Ev & Yaşam');
    } else if (age && age < 15 && gender === 'male') {
      cats.add('Oyuncak & Hobi');
      cats.add('Elektronik');
      cats.add('Spor & Outdoor');
    } else if (age && age < 15) {
      cats.add('Oyuncak & Hobi');
      cats.add('Hediyelik');
    } else if (age && age < 25 && gender === 'female') {
      cats.add('Kozmetik');
      cats.add('Saat & Aksesuar');
      cats.add('Hediyelik');
      cats.add('Ev & Yaşam');
    } else if (age && age < 25 && gender === 'male') {
      cats.add('Elektronik');
      cats.add('Spor & Outdoor');
      cats.add('Saat & Aksesuar');
    } else if (gender === 'female') {
      cats.add('Kozmetik');
      cats.add('Ev & Yaşam');
      cats.add('Saat & Aksesuar');
    } else if (gender === 'male') {
      cats.add('Elektronik');
      cats.add('Ev & Yaşam');
      cats.add('Saat & Aksesuar');
    }

    if (cats.size === 0) {
      return ['Hediyelik', 'Ev & Yaşam', 'Saat & Aksesuar'];
    }
    return [...cats];
  }

  private mapInterestsToCategories(interests: string[]): string[] {
    const map: Record<string, string[]> = {
      'teknoloji': ['Elektronik'],
      'müzik': ['Ev & Yaşam', 'Elektronik'],
      'spor': ['Spor & Outdoor'],
      'moda & giyim': ['Kadın', 'Erkek', 'Ayakkabı & Çanta'],
      'güzellik': ['Kozmetik'],
      'yemek & mutfak': ['Süpermarket', 'Ev & Yaşam'],
      'okuma': ['Kitap & Kırtasiye', 'Ev & Yaşam'],
      'ev': ['Ev & Yaşam'],
      'oyun': ['Elektronik', 'Oyuncak & Hobi'],
      'sanat': ['Oyuncak & Hobi', 'Hediyelik'],
      'fotoğrafçılık': ['Elektronik'],
      'bahçe & doğa': ['Ev & Yaşam', 'Spor & Outdoor'],
      'film & dizi': ['Elektronik', 'Ev & Yaşam'],
      'yoga & meditasyon': ['Spor & Outdoor'],
      'koleksiyon': ['Saat & Aksesuar', 'Hediyelik'],
      'el işi & diy': ['Oyuncak & Hobi', 'Hediyelik'],
      'dans': ['Spor & Outdoor'],
      'seyahat': ['Spor & Outdoor', 'Ayakkabı & Çanta'],
    };
    const cats = new Set<string>();
    for (const interest of interests) {
      const mapped = map[interest.toLowerCase()];
      if (mapped) mapped.forEach(c => cats.add(c));
    }
    return cats.size > 0 ? [...cats] : ['Hediyelik', 'Ev & Yaşam'];
  }

  /* ───── Hybrid Scoring Engine ───── */

  /** Build a user preference vector from analysis */
  private buildUserVector(analysis: GiftAIResponse['analysis']): UserVector {
    if (!analysis) {
      return { techAffinity: 0.5, emotionalPreference: 0.5, noveltySeeking: 0.5, practicality: 0.5, socialOrientation: 0.5, aestheticSensitivity: 0.5, outdoorActive: 0.5, creativeExpression: 0.5 };
    }

    const ocean = analysis.ocean || { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.3 };
    const tags = analysis.tags || [];
    const tagStr = tags.join(' ').toLowerCase();

    return {
      techAffinity: (tagStr.includes('teknoloji') || tagStr.includes('gadget') || tagStr.includes('elektronik')) ? 0.8 : 0.2,
      emotionalPreference: ocean.agreeableness * 0.7 + (analysis.giftType === 'kalıcı_anı' ? 0.3 : 0),
      noveltySeeking: ocean.openness * 0.6 + (analysis.giftType === 'sürpriz' ? 0.4 : 0),
      practicality: ocean.conscientiousness * 0.7 + (analysis.giftType === 'ihtiyaç' ? 0.3 : 0),
      socialOrientation: ocean.extraversion,
      aestheticSensitivity: (tagStr.includes('estetik') || tagStr.includes('tasarım') || tagStr.includes('sanat') || tagStr.includes('dekor')) ? 0.8 : 0.4,
      outdoorActive: (tagStr.includes('outdoor') || tagStr.includes('spor') || tagStr.includes('macera')) ? 0.8 : 0.2,
      creativeExpression: ocean.openness * 0.5 + ((tagStr.includes('diy') || tagStr.includes('sanat') || tagStr.includes('yaratıcı')) ? 0.4 : 0),
    };
  }

  /** Score a single product against user vector and analysis */
  private scoreProduct(product: any, analysis: GiftAIResponse['analysis'], userVector: UserVector): number {
    if (!analysis) return 0;

    const pName = (product.name || '').toLowerCase();
    const pTags = JSON.stringify(product.tags || []).toLowerCase();
    const pCats = JSON.stringify(product.categories || []).toLowerCase();
    const pDesc = (product.description || '').toLowerCase();
    const allProductText = `${pName} ${pTags} ${pDesc}`;

    // 1. Interest match score (0.35 weight)
    let interestScore = 0;
    const analysisTags = analysis.tags || [];
    if (analysisTags.length > 0) {
      const matches = analysisTags.filter(tag =>
        allProductText.includes(tag.toLowerCase())
      ).length;
      interestScore = matches / analysisTags.length;
    }

    // 2. Personality fit score (0.25 weight)
    let personalityScore = 0.5;
    // Map OCEAN to product traits
    if (userVector.noveltySeeking > 0.6 && (allProductText.includes('yaratıcı') || allProductText.includes('farklı') || allProductText.includes('sürpriz') || allProductText.includes('trend'))) {
      personalityScore += 0.3;
    }
    if (userVector.practicality > 0.6 && (allProductText.includes('pratik') || allProductText.includes('günlük') || allProductText.includes('kullanışlı'))) {
      personalityScore += 0.3;
    }
    if (userVector.emotionalPreference > 0.6 && (allProductText.includes('kişisel') || allProductText.includes('anı') || allProductText.includes('özel'))) {
      personalityScore += 0.3;
    }
    if (userVector.aestheticSensitivity > 0.6 && (allProductText.includes('tasarım') || allProductText.includes('estetik') || allProductText.includes('dekor'))) {
      personalityScore += 0.2;
    }
    personalityScore = Math.min(1, personalityScore);

    // 3. Context fit score (0.25 weight) — gift type alignment
    let contextScore = 0.5;
    if (analysis.giftType === 'sürpriz' && (allProductText.includes('sürpriz') || allProductText.includes('yaratıcı') || allProductText.includes('led') || allProductText.includes('hediyelik'))) {
      contextScore = 0.9;
    } else if (analysis.giftType === 'trend' && (allProductText.includes('trend') || allProductText.includes('popüler'))) {
      contextScore = 0.9;
    } else if (analysis.giftType === 'kalıcı_anı' && (allProductText.includes('anı') || allProductText.includes('fotoğraf') || allProductText.includes('kişisel'))) {
      contextScore = 0.9;
    }

    // 4. Popularity/novelty score (0.15 weight)
    let popularityScore = 0.5;
    const rating = product.ratingAverage || 0;
    const ratingCount = product.ratingCount || 0;
    popularityScore = (rating / 5) * 0.5 + Math.min(ratingCount / 100, 1) * 0.3 + (product.isFeatured ? 0.2 : 0);

    // Weighted combination
    const finalScore =
      (interestScore * 0.35) +
      (personalityScore * 0.25) +
      (contextScore * 0.25) +
      (popularityScore * 0.15);

    return Math.min(1, finalScore);
  }

  /* ───── Gift Date Astrology ───── */

  /** Analyze the gift date astrologically */
  private getGiftDateAstrology(dateStr: string): string | null {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;

      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayOfWeek = date.getDay();

      // Determine which zodiac sign the Sun is in on this date
      const sunSign = this.getZodiacSignForDate(month, day);
      const element = this.getZodiacElement(sunSign);
      const modality = this.getZodiacModality(sunSign);

      // Day of week energy
      const dayEnergy: Record<number, string> = {
        0: 'Güneş günü — gösterişli, prestijli ve dikkat çekici hediyeler için ideal',
        1: 'Ay günü — duygusal, ev odaklı ve bakım temalı hediyeler öne çıksın',
        2: 'Mars günü — enerjik, sportif ve aksiyon dolu hediyeler uygun',
        3: 'Merkür günü — iletişim, teknoloji ve kitap temalı hediyeler destekleniyor',
        4: 'Jüpiter günü — lüks, büyüme ve deneyim odaklı hediyeler için güçlü',
        5: 'Venüs günü — güzellik, estetik ve romantik hediyeler için mükemmel gün',
        6: 'Satürn günü — kaliteli, dayanıklı ve klasik hediyeler için uygun',
      };

      let insight = `${sunSign} burcu enerjisi altında, ${element} elementinin etkisiyle `;

      if (element === 'ateş') {
        insight += 'cesaret, tutku ve yenilik ön planda. Enerjik ve heyecan verici hediyeler önerilir. ';
      } else if (element === 'toprak') {
        insight += 'kalite, konfor ve pratiklik ön planda. Somut ve dokunulabilir hediyeler ideal. ';
      } else if (element === 'hava') {
        insight += 'iletişim, düşünce ve sosyallik ön planda. Paylaşılabilir ve ilham verici hediyeler uygun. ';
      } else {
        insight += 'duygusallık, sezgi ve yaratıcılık ön planda. Kişisel ve anlam yüklü hediyeler mükemmel. ';
      }

      insight += dayEnergy[dayOfWeek] || '';

      // Special periods (simplified)
      if ((month === 1 && day <= 18) || (month === 8 && day >= 20 && day <= 31) || (month === 9 && day <= 12) || (month === 12 && day >= 19 && day <= 31)) {
        insight += ' ⚠️ Bu dönemde Merkür retrosu etkili olabilir — teknolojik hediyeler yerine duygusal/deneyim hediyeleri daha güvenli.';
      }

      return insight;
    } catch {
      return null;
    }
  }

  /** Get tags influenced by gift date astrology */
  private getGiftDateTags(dateStr: string): string[] {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return [];

      const dayOfWeek = date.getDay();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const sunSign = this.getZodiacSignForDate(month, day);
      const element = this.getZodiacElement(sunSign);

      const tags: string[] = [];

      // Element-based tags
      if (element === 'ateş') tags.push('enerji', 'macera');
      if (element === 'toprak') tags.push('kalite', 'konfor');
      if (element === 'hava') tags.push('iletişim', 'sosyal');
      if (element === 'su') tags.push('duygusal', 'yaratıcı');

      // Day-based tags
      if (dayOfWeek === 5) tags.push('güzellik', 'estetik'); // Venüs günü
      if (dayOfWeek === 1) tags.push('ev', 'bakım'); // Ay günü

      return tags;
    } catch {
      return [];
    }
  }

  /** Get zodiac sign for a given month/day */
  private getZodiacSignForDate(month: number, day: number): string {
    const signs = [
      { sign: 'Oğlak', start: [1, 1], end: [1, 19] },
      { sign: 'Kova', start: [1, 20], end: [2, 18] },
      { sign: 'Balık', start: [2, 19], end: [3, 20] },
      { sign: 'Koç', start: [3, 21], end: [4, 19] },
      { sign: 'Boğa', start: [4, 20], end: [5, 20] },
      { sign: 'İkizler', start: [5, 21], end: [6, 20] },
      { sign: 'Yengeç', start: [6, 21], end: [7, 22] },
      { sign: 'Aslan', start: [7, 23], end: [8, 22] },
      { sign: 'Başak', start: [8, 23], end: [9, 22] },
      { sign: 'Terazi', start: [9, 23], end: [10, 22] },
      { sign: 'Akrep', start: [10, 23], end: [11, 21] },
      { sign: 'Yay', start: [11, 22], end: [12, 21] },
      { sign: 'Oğlak', start: [12, 22], end: [12, 31] },
    ];
    for (const s of signs) {
      const afterStart = month > s.start[0] || (month === s.start[0] && day >= s.start[1]);
      const beforeEnd = month < s.end[0] || (month === s.end[0] && day <= s.end[1]);
      if (afterStart && beforeEnd) return s.sign;
    }
    return 'Oğlak';
  }

  /** Get element group for a zodiac sign */
  private getZodiacElement(sign: string): string {
    const elements: Record<string, string> = {
      'Koç': 'ateş', 'Aslan': 'ateş', 'Yay': 'ateş',
      'Boğa': 'toprak', 'Başak': 'toprak', 'Oğlak': 'toprak',
      'İkizler': 'hava', 'Terazi': 'hava', 'Kova': 'hava',
      'Yengeç': 'su', 'Akrep': 'su', 'Balık': 'su',
    };
    return elements[sign] || 'toprak';
  }

  /** Get modality for a zodiac sign */
  private getZodiacModality(sign: string): string {
    const modalities: Record<string, string> = {
      'Koç': 'kardinal', 'Yengeç': 'kardinal', 'Terazi': 'kardinal', 'Oğlak': 'kardinal',
      'Boğa': 'sabit', 'Aslan': 'sabit', 'Akrep': 'sabit', 'Kova': 'sabit',
      'İkizler': 'değişken', 'Başak': 'değişken', 'Yay': 'değişken', 'Balık': 'değişken',
    };
    return modalities[sign] || 'sabit';
  }

  /* ───── Zodiac helpers ───── */

  private getZodiacInsight(sign: string): string {
    const insights: Record<string, string> = {
      'Koç': 'bana çok şey anlatıyor — enerjik, cesur ve yenilikçi bir karakter. Hediyede de sıradanlıktan hoşlanmaz.',
      'Boğa': 'çok önemli bir ipucu — kaliteye düşkün, konfor seven ve estetik değer taşıyan şeyleri tercih eden biri.',
      'İkizler': 'ilginç! Meraklı, sosyal ve çok yönlü bir kişilik. Sıkıcı hediyelerden kaçınmak lazım.',
      'Yengeç': 'duygusal ve ev odaklı bir profil çiziyor — kişisel anlam taşıyan hediyeler çok daha etkili olur.',
      'Aslan': 'önemli bir detay — gösterişli, dikkat çekici ve kaliteli ürünleri seven biri. Hediyenin prestijli olması önemli.',
      'Başak': 'analitik ve detaycı bir kişilik gösteriyor — pratik, kaliteli ve işlevsel hediyeler en çok onu mutlu eder.',
      'Terazi': 'estetik ve denge arayan bir profil — zarif, uyumlu ve güzel tasarımlı ürünler tam onluk.',
      'Akrep': 'tutkulu ve gizemli bir karakter — derin anlam taşıyan, özel ve benzersiz hediyeler en etkili olur.',
      'Yay': 'maceraperest ve özgürlükçü bir ruh — seyahat, deneyim ve keşif temalı hediyeler harika olur.',
      'Oğlak': 'disiplinli ve geleneksel bir profil — kaliteli, dayanıklı ve uzun ömürlü hediyeler tercih eder.',
      'Kova': 'yenilikçi ve bağımsız bir karakter — farklı, teknolojik ve alışılmadık hediyeler onu şaşırtır.',
      'Balık': 'yaratıcı ve hayalperest bir ruh — sanatsal, duygusal ve romantik hediyeler en çok onu etkiler.',
    };
    return insights[sign] || 'kişiliği hakkında güzel ipuçları veriyor.';
  }

  private getAscendantInsight(sign: string): string {
    const insights: Record<string, string> = {
      'Koç': 'bu da dış dünyaya enerjik ve kararlı bir görünüm yansıttığını gösteriyor.',
      'Boğa': 'dışarıdan sakin, zarif ve güvenilir bir izlenim veriyor.',
      'İkizler': 'çevresine neşeli, konuşkan ve merak dolu bir enerji yayıyor.',
      'Yengeç': 'dışarıya sıcak, koruyucu ve şefkatli bir görünüm yansıtıyor.',
      'Aslan': 'çevresinde karizmatik ve dikkat çekici bir izlenim bırakıyor.',
      'Başak': 'dışarıdan düzenli, titiz ve güvenilir görünüyor.',
      'Terazi': 'çevresine zarif, diplomatik ve uyumlu bir hava yayıyor.',
      'Akrep': 'dışarıya güçlü, kararlı ve manyetik bir enerji veriyor.',
      'Yay': 'çevresinde iyimser, neşeli ve maceraperest bir izlenim bırakıyor.',
      'Oğlak': 'dışarıdan ciddi, olgun ve hedef odaklı görünüyor.',
      'Kova': 'çevresine özgün, farklı ve bağımsız bir hava yayıyor.',
      'Balık': 'dışarıya hassas, empatik ve rüya gibi bir enerji veriyor.',
    };
    return insights[sign] || 'ilginç bir dış görünüm profili çiziyor.';
  }

  private getZodiacGiftAdvice(sign: string): string {
    const advice: Record<string, string> = {
      'Koç': 'enerjik ve cesur yapısı düşünüldüğünde, spor ekipmanları, macera deneyimleri veya yenilikçi teknoloji ürünleri ideal hediyeler.',
      'Boğa': 'kalite ve konfora düşkünlüğü göz önüne alındığında, lüks bakım ürünleri, yumuşak tekstil veya gurme lezzetler mükemmel seçimler.',
      'İkizler': 'meraklı ve çok yönlü yapısıyla, kitaplar, bulmaca/oyunlar veya iletişim teknolojileri harika hediyeler.',
      'Yengeç': 'duygusal ve ev odaklı yapısı düşünüldüğünde, fotoğraf çerçeveleri, ev dekoru veya kişiselleştirilmiş hediyeler çok anlamlı olur.',
      'Aslan': 'gösterişi ve kaliteyi seven yapısıyla, markalı aksesuarlar, şık kıyafetler veya prestijli parfümler ideal.',
      'Başak': 'pratik ve detaycı yapısı düşünüldüğünde, organize edici ürünler, kaliteli kırtasiye veya sağlıklı yaşam ürünleri harika seçimler.',
      'Terazi': 'estetik ve uyum arayan yapısıyla, sanat eserleri, zarif takılar veya güzel tasarımlı ev aksesuarları mükemmel.',
      'Akrep': 'tutkulu ve derin yapısı düşünüldüğünde, gizemli parfümler, derin kitaplar veya benzersiz el yapımı ürünler çok etkili.',
      'Yay': 'özgürlükçü ve maceraperest yapısıyla, seyahat aksesuarları, outdoor ekipmanları veya farklı kültür ürünleri ideal.',
      'Oğlak': 'geleneksel ve kalite odaklı yapısı düşünüldüğünde, klasik saatler, deri ürünler veya iş aksesuarları mükemmel hediyeler.',
      'Kova': 'yenilikçi ve farklı yapısıyla, teknolojik gadget\'lar, bilim/uzay temalı ürünler veya sosyal sorumluluk projeleri harika.',
      'Balık': 'hayalperest ve sanatsal yapısı düşünüldüğünde, müzik aletleri, sanat malzemeleri veya romantik deneyimler ideal hediyeler.',
    };
    return advice[sign] || 'kişiliğine uygun özel hediyeler seçtim.';
  }

  private getZodiacGiftTags(sign: string): string[] {
    const tagMap: Record<string, string[]> = {
      'Koç': ['spor', 'macera', 'enerji', 'yenilik'],
      'Boğa': ['lüks', 'konfor', 'gurme', 'kalite'],
      'İkizler': ['kitap', 'oyun', 'iletişim', 'teknoloji'],
      'Yengeç': ['ev', 'aile', 'anı', 'duygusal'],
      'Aslan': ['marka', 'şık', 'prestij', 'parfüm'],
      'Başak': ['pratik', 'organik', 'düzen', 'sağlık'],
      'Terazi': ['sanat', 'estetik', 'takı', 'tasarım'],
      'Akrep': ['parfüm', 'gizem', 'kitap', 'özel'],
      'Yay': ['seyahat', 'outdoor', 'macera', 'keşif'],
      'Oğlak': ['klasik', 'saat', 'deri', 'iş'],
      'Kova': ['teknoloji', 'farklı', 'bilim', 'yenilik'],
      'Balık': ['sanat', 'müzik', 'romantik', 'yaratıcı'],
    };
    return tagMap[sign] || [];
  }
}
