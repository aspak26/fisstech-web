import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRateLimiter } from "@/lib/utils/rate-limit";
import { consumeAiChatCredit } from "@/lib/ai-chat/credits";

// Bu route kimlik doğrulamalı olsa da her çağrı gerçek Gemini API maliyeti
// doğuruyor — önceden hiçbir rate limit/mesaj uzunluğu sınırı yoktu
// (landing-chat'te vardı). Güvenlik denetimi bulgusu, bkz. docs/PROGRESS.md.
const MAX_MESSAGE_LENGTH = 4000;
const isRateLimited = createRateLimiter(20, 10 * 60 * 1000);

const SYSTEM_INSTRUCTION = `Sen "Fişştech AI" adlı deneyimli bir kişisel muhasebe ve finans danışmanısın. Kullanıcıların bireysel bütçe yönetimi, harcama analizi, tasarruf planlaması ve finansal farkındalık konularında derinlemesine, uzman seviyesinde yardım edersin.

KİMLİĞİN:
Sen 15 yıllık deneyime sahip bir serbest muhasebeci ve kişisel finans danışmanısın. Kullanıcının verilerine bakarak onlar adına gerçek analiz yaparsın — genel laflar söylemezsin. Her analiz kişiselleştirilmiş, somut ve veriye dayalı olmalı.

TEMEL YETKİNLİKLERİN:
- Harcama Analizi: Kategorilere göre detaylı kırılım, dönemsel karşılaştırma, anormallik tespiti
- Bütçe Optimizasyonu: Hangi kategoride ne kadar kısılabileceğini rakamla belirt, tasarruf potansiyelini hesapla
- Tasarruf Planlaması: Aylık tasarruf hedefi belirleme, hangi harcamayı azaltırsa ne kadar birikirim olur
- Limit Yönetimi: Belirlenen kategori limitlerini aşan/aşmayan kalemleri karşılaştır, uyarı ver
- Trend Analizi: Geçmiş dönemlerle karşılaştırmalı yorum yap
- Mali Sağlık Skoru: Harcama alışkanlıklarını değerlendirerek genel bir yorum yap

YANIT KALİTESİ KURALLARI:
- Veriye dayalı konuş: "Gıda'ya ₺850 harcamışsın" gibi somut sayılar kullan, "çok harcıyorsunuz" gibi muğlak ifade kullanma
- Karşılaştırmalı analiz yap: Limit varsa "Gıda limitin ₺600 ama ₺850 harcadın, ₺250 aşımdısın" de
- Yüzde hesapla: "Gıda toplam harcamanın %34'ünü oluşturuyor" gibi oran bazlı içgörü sun
- Öneri somut olsun: "Dışarıda yeme sıklığını haftada 3'ten 2'ye düşürürsen aylık ~₺400 tasarruf edebilirsin"
- Başlık ve madde işareti kullan: Uzun analizlerde **başlık**, • madde veya 📊 emoji ile düzenli sun
- Türkçe yaz, samimi ama profesyonel ol
- Sayıları ₺ cinsinden yaz

KAPSAM KİLİDİ: Yalnızca kişisel finans, bütçe, harcama ve tasarruf konularında konuş. Finans dışı bir konu açılırsa: "Ben bir kişisel finans asistanıyım, bütçen hakkında yardımcı olabilirim."

YASAL KİLİT: Hisse senedi, kripto, döviz, altın veya yatırım aracı alım/satım tavsiyesi ASLA verme. Sadece harcama azaltma ve tasarruf planlaması yap.

TİCARİ KİLİT: Kullanıcının kendi işletme muhasebesini yapma (bireysel bütçeye odaklan). ANCAK kullanıcı "Esnaf Modu nedir", "Premium ile Esnaf Modu farkı nedir" diye sorarsa ürün özelliklerini anlatabilirsin.

FİŞŞTECH KNOWLEDGE BASE (ÜRÜN BİLGİSİ):
Sen Fişştech'i kusursuz tanıyan bir ürün uzmanısın. Kullanıcı paketler veya özellikler hakkında soru sorarsa şu bilgileri kullan (kısa ve sohbet havasında yanıtla):
1. Fişştech Farkı: Fişleri elle girmeye gerek bırakmaz, fotoğraftan saniyeler içinde kategorize eder. "Sıfır bilişsel yük" felsefesiyle tasarlanmıştır. Tek uygulamada hem Bireysel hem İşletme yönetimi vardır.
2. Kişisel Paketler: Ücretsiz (sınırlı hak, temel özellik), Premium (₺49,99/ay - Sınırsız fiş tarama, aylık 50 AI sohbet hakkı, ortak bütçe), Aile Planı (₺119,99/ay - 4 kişiye kadar).
3. Esnaf Modu (İşletmeler İçin): Ayrı bir pakettir (Premium'u içermez). Tek kişi ₺199,99/ay (personel arttıkça 10 kişi 349,99₺ vb. artar). Bulut Yedekleme +29,99₺. Kasa, stok, müşteri yönetimi içerir.
4. Esnaf Modu'nun 6 Sektörü: Hizmet/Bakım (Ajanda/Randevu), Hızlı Perakende (Barkod/Veresiye), Yeme-İçme (Masa/Adisyon), Yüksek Hacimli Satış (Emlak/CRM), Toptancı (Depo/Sevkiyat), Serbest Meslek (Proje/Görev takibi).

ÖRNEK SORU-CEVAPLAR (Referans al):
Soru: Fişştech'in diğer uygulamalardan farkı nedir? Niye kullanayım?
Cevap: En büyük farkımız seni uğraştırmaması! Diğerlerinde harcamayı elle girersin, Fişştech'te ise fişin fotoğrafını çekmen yeterli. Yapay zeka anında okur ve kaydeder.
Soru: Benim kafem var. Premium paket alırsam Esnaf Modu'nu da kullanabilir miyim?
Cevap: Hayır, Premium paket (49,99 ₺) sadece kişisel finans özelliklerini içerir. Kafeni profesyonelce yönetmek (Masa, adisyon, stok) için tamamen ayrı bir paket olan 'Esnaf Modu'nu (199,99 ₺) alman gerekir.
Soru: Uygulama tamamen ücretsiz mi yoksa para ödemem şart mı?
Cevap: Fişştech'i temel özellikleriyle ücretsiz kullanabilirsin. Ancak sınırsız fiş tarama, aylık 50 yapay zeka sohbeti ve ortak bütçe gibi eşsiz özellikleri açmak istersen aylık 49,99 ₺'ye Premium pakete geçebilirsin.`;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Yetkilendirme gerekli." }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Kullanıcı doğrulanamadı." }, { status: 401 });
    }

    if (isRateLimited(user.id)) {
      return NextResponse.json({ error: "Çok fazla istek gönderdiniz, biraz sonra tekrar deneyin." }, { status: 429 });
    }

    const body = await request.json();
    const { message, history = [], startDate, endDate, periodLabel } = body;

    if (!message) {
      return NextResponse.json({ error: "Mesaj boş olamaz." }, { status: 400 });
    }
    if (typeof message !== "string" || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: "Mesaj çok uzun." }, { status: 400 });
    }

    const hasCredit = await consumeAiChatCredit(supabase, user.id);
    if (!hasCredit) {
      return NextResponse.json(
        { error: "Bu ayki AI sohbet hakkınız doldu. Daha fazlası için Premium'a geçebilirsiniz." },
        { status: 402 },
      );
    }

    // Default dates if not provided
    const now = new Date();
    const m = (now.getMonth() + 1).toString().padStart(2, "0");
    const defaultStart = `${now.getFullYear()}-${m}-01`;
    const start = startDate || defaultStart;
    let end = endDate;
    if (!end) {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nm = (nextMonth.getMonth() + 1).toString().padStart(2, "0");
      end = `${nextMonth.getFullYear()}-${nm}-01`;
    }

    // Fetch expenses
    let query = supabase
      .from("expenses")
      .select("total, date, store_name, expense_items(name, price, quantity, categories(name))")
      .eq("user_id", user.id)
      .gte("date", start);
      
    if (startDate && endDate) {
      query = query.lte("date", end);
    } else {
      query = query.lt("date", end);
    }

    const { data: expRows, error: expError } = await query;
    if (expError) throw expError;

    // Fetch limits
    const { data: limitRows, error: limitError } = await supabase
      .from("category_limits")
      .select("amount, categories(name)")
      .eq("user_id", user.id);
    if (limitError) throw limitError;

    // Aggregate data
    let periodTotal = 0.0;
    const catMap: Record<string, number> = {};
    const storeMap: Record<string, number> = {};

    for (const exp of (expRows || [])) {
      periodTotal += exp.total || 0;
      const storeName = exp.store_name || "Bilinmiyor";
      if (storeName && storeName !== "Bilinmiyor") {
        storeMap[storeName] = (storeMap[storeName] || 0) + (exp.total || 0);
      }
      
      const items = exp.expense_items || [];
      for (const item of items) {
        // @ts-ignore
        const cat = item.categories?.name || "Diğer";
        const price = item.price || 0;
        const quantity = item.quantity || 1;
        const amt = price * quantity;
        catMap[cat] = (catMap[cat] || 0) + amt;
      }
    }

    const limitMap: Record<string, number> = {};
    for (const l of (limitRows || [])) {
      // @ts-ignore
      const cat = l.categories?.name;
      if (cat) {
        limitMap[cat] = l.amount || 0;
      }
    }

    const limitAnalysis: any[] = [];
    Object.entries(limitMap).forEach(([cat, limit]) => {
      const spent = catMap[cat] || 0;
      const diff = spent - limit;
      limitAnalysis.push({
        kategori: cat,
        limit: limit,
        harcanan: spent.toFixed(2),
        durum: diff > 0 ? `AŞIM +₺${diff.toFixed(2)}` : `OK (kalan ₺${Math.abs(diff).toFixed(2)})`
      });
    });

    const topStores = Object.entries(storeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => ({ mağaza: e[0], toplam: e[1].toFixed(2) }));

    const catsData = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(e => ({
        kategori: e[0],
        toplam: e[1].toFixed(2),
        oran: periodTotal > 0 ? `%${Math.round((e[1] / periodTotal) * 100)}` : "%0"
      }));

    const contextJson = {
      seçiliDönem: periodLabel || "Bu Ay",
      tarihAralığı: `${start} → ${end}`,
      toplamHarcama: periodTotal.toFixed(2),
      fişSayısı: expRows?.length || 0,
      kategoriler: catsData,
      limitAnalizi: limitAnalysis.length > 0 ? limitAnalysis : "Limit tanımlanmamış",
      enÇokHarcananMağazalar: topStores.length > 0 ? topStores : "Mağaza verisi yok",
    };

    const systemWithCtx = `${SYSTEM_INSTRUCTION}

─── KULLANICININ FİNANSAL VERİSİ (DÖNEM: ${periodLabel || "Bu Ay"}) ───
${JSON.stringify(contextJson, null, 2)}`;

    const geminiHistory = (history || []).slice(-16).map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: String(h.content ?? "").slice(0, MAX_MESSAGE_LENGTH) }],
    }));

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Yapay zeka asistanı yapılandırılmamış." }, { status: 503 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemWithCtx }] },
          contents: [...geminiHistory, { role: "user", parts: [{ text: message }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.4, topP: 0.9 },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Yapay zeka hizmetine ulaşılamıyor." }, { status: 502 });
    }

    const data = await response.json();
    const reply: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!reply) {
      return NextResponse.json({ error: "Boş yanıt alındı." }, { status: 502 });
    }

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("AI Chat API Error:", error);
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 });
  }
}
