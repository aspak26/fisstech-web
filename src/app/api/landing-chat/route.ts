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
- Kısa, samimi, Türkçe ve net cevaplar ver (en fazla 3-4 cümle).
- Emin olmadığın veya ürünle ilgisi olmayan konularda nazikçe konuyu Fişştech'e getir.`;

const MAX_MESSAGE_LENGTH = 500;
const isRateLimited = createRateLimiter(10, 10 * 60 * 1000);

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
          generationConfig: { maxOutputTokens: 300, temperature: 0.6 },
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
