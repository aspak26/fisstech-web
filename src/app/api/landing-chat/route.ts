import { NextResponse, type NextRequest } from "next/server";
import { createRateLimiter } from "@/lib/utils/rate-limit";

// Public, unauthenticated endpoint for the landing page's "AI Destek
// Asistanı" widget. Deliberately NOT the same as fisle-ai-chat (that Edge
// Function is JWT-authenticated and scoped to a signed-in user's real
// financial data — wrong tool for an anonymous marketing visitor). This
// route calls Gemini directly, server-side only (GEMINI_API_KEY never
// reaches the client, per AGENTS.md rule 7), with a fixed product-FAQ
// system prompt and no access to any user data.

const SYSTEM_PROMPT = `Sen Fişştech'in web sitesindeki resmi ürün asistanısın. Fişştech; yapay zekâ destekli fiş/fatura tarama, kişisel finans yönetimi (harcama, gelir, bütçe, hedef, yatırım takibi) ve işletmeler için "Esnaf Modu" (kasa defteri, stok, personel, satış yönetimi — market/kafe/kuaför gibi sektörlere özel) sunan bir mobil + web uygulamasıdır.

Kurallar:
- Sadece Fişştech ürünü, özellikleri, fiyatlandırması ve genel kullanımı hakkında soruları yanıtla.
- Hiçbir kullanıcının gerçek hesap verisine, harcamasına veya kişisel bilgisine erişimin YOK — böyle bir soru gelirse hesaba giriş yapıp uygulama içinden bakmalarını söyle.
- Kullanıcılara mantıklı ve tatmin edici ama **özet (kısa)** cevaplar ver. Asla uzun makaleler veya yorucu paragraflar yazma (Maksimum 3-4 cümle veya birkaç kısa madde). Okuyucunun hızlıca cevabı almasını sağla.
- Emin olmadığın veya ürünle ilgisi olmayan konularda nazikçe konuyu Fişştech'e getir.

FİŞŞTECH KNOWLEDGE BASE (ÜRÜN BİLGİSİ):
Sen Fişştech'i kusursuz tanıyan bir ürün uzmanısın. Ziyaretçi paketler veya özellikler hakkında soru sorarsa şu bilgileri kullan (kısa ve pazarlama/sohbet havasında yanıtla, ansiklopedi gibi uzatma):
1. Fişştech Farkı: Fişleri elle girmeye gerek bırakmaz, fotoğraftan saniyeler içinde AI ile kategorize eder. "Sıfır bilişsel yük" felsefesiyle tasarlanmıştır. Tek uygulamada hem Bireysel hem İşletme yönetimi vardır.
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

const MAX_MESSAGE_LENGTH = 500;
const isRateLimited = createRateLimiter(10, 10 * 60 * 1000);

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Sohbet asistanı şu anda yapılandırılmamış." },
      { status: 503 },
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Çok fazla istek gönderdiniz, biraz sonra tekrar deneyin." }, { status: 429 });
  }

  let body: { message?: string; history?: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message || message.length === 0) {
    return NextResponse.json({ error: "Mesaj boş olamaz." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Mesaj çok uzun." }, { status: 400 });
  }

  const history = (body.history ?? []).slice(-6).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content.slice(0, MAX_MESSAGE_LENGTH) }],
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [...history, { role: "user", parts: [{ text: message }] }],
          generationConfig: { maxOutputTokens: 1500, temperature: 0.7 },
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Asistan şu anda yanıt veremiyor." }, { status: 502 });
    }

    const data = await response.json();
    const reply: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      return NextResponse.json({ error: "Asistan şu anda yanıt veremiyor." }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Asistan şu anda yanıt veremiyor." }, { status: 502 });
  }
}
