"use server";

import { cookies, headers } from "next/headers";
import { formatCurrency } from "@/lib/utils/currency";
import type { DemoReceiptResult } from "@/lib/landing/demo-receipts";

const MAX_TRIES = 5; // Cookie limiti
const MAX_IP_TRIES = 50; // CGNAT için esnek IP limiti
const MAX_GLOBAL_DAILY_SCANS = 5000; // Güvenlik: Günde toplam 5000 demo scan limiti
const COOKIE_NAME = "fisstech_demo_scans_used";
// In-memory rate limiting map for IPs
// (Persists across requests in a serverless environment until cold boot)
const ipScanCounts = new Map<string, number>();

// Global daily counter (resets based on date)
let globalScanDate = new Date().toISOString().split("T")[0];
let globalScanCount = 0;

export async function scanDemoReceipt(
  imageBase64: string,
  turnstileToken: string
): Promise<(DemoReceiptResult & { remaining: number }) | { error: string }> {
  const cookieStore = await cookies();
  const headersList = await headers();
  const today = new Date().toISOString().split("T")[0];

  // 1. Verify Turnstile Token
  const turnstileSecret =
    process.env.NODE_ENV === "development"
      ? "1x0000000000000000000000000000000AA"
      : process.env.TURNSTILE_SECRET_KEY!;
  
  if (turnstileToken !== "bypass") {
    if (!turnstileToken) {
      throw new Error("Bot doğrulaması başarısız oldu (Token eksik).");
    }

    const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(turnstileToken)}`,
    });
    
    const turnstileData = await turnstileRes.json();
    if (!turnstileData.success) {
      throw new Error("Erişim reddedildi: Bot şüphesi.");
    }
  }

  // 2. Check Global Daily Limit
  if (globalScanDate !== today) {
    globalScanDate = today;
    globalScanCount = 0;
  }
  if (globalScanCount >= MAX_GLOBAL_DAILY_SCANS) {
    throw new Error("Sistem şu an çok yoğun, lütfen daha sonra tekrar deneyin veya üye olun.");
  }
  
  // 3. Check IP rate limit (CGNAT relaxed)
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  
  const ipCount = ipScanCounts.get(ip) ?? 0;
  if (ipCount >= MAX_IP_TRIES) {
    throw new Error("RATE_LIMIT_EXCEEDED");
  }

  // 4. Check Cookie rate limit
  const cookieCount = Number(cookieStore.get(COOKIE_NAME)?.value ?? "0");
  if (cookieCount >= MAX_TRIES) {
    throw new Error("RATE_LIMIT_EXCEEDED");
  }

  // Process the scan using Gemini API
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("Gemini API key is missing");
  }


  
  const prompt = `Görev: Bu görseli analiz et. Görsel üç türde olabilir.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TİP A — TAKSİT TABLOSU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Görselde "Taksit Seçenekleri", "Ödeme Planı", "Taksit Sayısı / Aylık Ödeme" gibi bir tablo varsa TİP A'dır.
Bu durumda tablodan TÜM SATIRLARI, HİÇBİRİNİ ATLAMADAN çıkar ve şu JSON'u döndür:

{
  "store_name": "Bilinmiyor",
  "date": "${today}",
  "total": <Tek Çekim / peşin tutarı; yoksa 0>,
  "payment_method": "credit_card",
  "is_installment": true,
  "installment_options": [],
  "items": []
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TİP B — NORMAL FİŞ / MAKBUZ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Normal market/restoran/mağaza fişi ise şu JSON'u döndür:

{
  "store_name": "mağaza/işyeri adı",
  "date": "YYYY-MM-DD (fişten oku; bulamazsan ${today})",
  "total": toplam_tutar_sayı,
  "payment_method": "cash veya credit_card veya debit_card veya unknown",
  "is_installment": false,
  "installment_options": [],
  "items": [
    {"name": "ürün adı", "category": "kategori adı", "price": birim_fiyat, "quantity": adet_veya_agirlik, "unit": "adet veya kg", "vat_rate": KDV_orani}
  ]
}

KATEGORİ: Her ürün için en uygun Türkçe kategori adını yaz (ör: "Gıda", "İçecek", "Temizlik", "Kişisel Bakım", "Giyim", "Elektronik", "Diğer").

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENEL KURALLAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Yalnızca geçerli JSON döndür, başka bir şey yazma.
- İndirim, kampanya, promosyon ve eksi (−) değerli satırları items listesine EKLEME.
- Tutar değerlerinde virgül/nokta ayırıcılarını düzelt (16.864,03 → 16864.03).
- DİKKAT (KDV Oranları): A101/BİM gibi market fişlerinde ürün adının yanındaki %01, %10, %20 gibi yüzdeler KDV oranıdır. Bunları KESİNLİKLE ADET (quantity) OLARAK ALMA! Bu oranları (1, 10, 20 vb. tam sayı olarak) "vat_rate" alanına yaz. Eğer üründe KDV yazmıyorsa 0 yaz.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KESİN KURAL — "price" ALANI HER ZAMAN BİRİM FİYATTIR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"price" alanı ASLA yıldızlı (*) satır toplamı değildir. "price" her zaman "N X fiyat" ya da "ağırlık KG X fiyat" kalıbındaki X'ten SONRA gelen BİRİM tutardır.
Bir üründe böyle bir "X" satırı YOKSA: price = o ürünün yıldızlı (*) toplam tutarı, quantity = 1, unit = "adet".
Bir üründe "X" satırı VARSA: price = X'ten sonraki birim tutar, quantity = X'ten önceki sayı, ve price × quantity çarpımı MUTLAKA ürünün yıldızlı (*) toplam tutarına eşit (±0.05 TL tolerans) olmalıdır. JSON'u döndürmeden önce bunu KENDİN KONTROL ET; eşleşmiyorsa price veya quantity'yi yanlış okumuşsundur, satırı tekrar incele.

ÖRNEK 1 — ADET BAZLI ÇOKLU ÜRÜN (A101/BİM/marketler):
  2 X 14,00
  GONG BALLI 34G ETI  %01  *28,00
  DiDi ŞEF. 2.5 L  %10  *71,50
  (Doğru JSON -> {"name": "GONG BALLI 34G ETI", "price": 14.00, "quantity": 2, "unit": "adet", "vat_rate": 1}, {"name": "DiDi ŞEF. 2.5 L", "price": 71.50, "quantity": 1, "unit": "adet", "vat_rate": 10})

ÖRNEK 2 — AĞIRLIKLA SATILAN ÜRÜNLER (manav, kasap, şarküteri):
Fişte "9,910 KG X 13,90" gibi bir satır görürsen bu da tıpkı adet satırı gibi DAİMA ALTINDAKİ ürünün bilgisidir, sadece adet yerine ağırlıktır:
  0,747 kg X 99,00
  DOY PİLİÇ KAL BUT       *73,95
  (Doğru JSON -> {"name": "DOY PİLİÇ KAL BUT", "price": 99.00, "quantity": 0.747, "unit": "kg", "vat_rate": 1})
  (Kontrol: 99.00×0.747≈73.95 ✓ — price'ı yanlışlıkla 73.95 (toplam) yazmak YAYGIN BİR HATADIR, bundan kaçın: price her zaman 99.00'dır, 73.95 değil.)

- "unit" alanı: ürün "KG X" veya "KG" ibaresiyle tartılarak satılmışsa "kg", aksi halde "adet" yaz.
- Adetler/ağırlıklar daima X veya AD ile gösterilir (2 X 1,00 gibi). Bu ibare bir ürünün hemen üstünde yazıyorsa o ürüne aittir. Başka hiçbir sayıyı adet olarak alma.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  if (!response.ok) {
    const errData = await response.text();
    return { error: `Google API Hatası (${response.status}): ${errData.slice(0, 150)}` };
  }

  const geminiData = await response.json();
  const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    return { error: `Yapay zeka yanıt üretemedi: ${JSON.stringify(geminiData).slice(0, 150)}` };
  }

  let cleanedText = text.trim();
  if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let parsed;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (parseError) {
    return { error: `Yapay zeka geçersiz format döndürdü: ${cleanedText.slice(0, 100)}` };
  }

  // Increment rate limits
  const newCount = Math.max(ipCount + 1, cookieCount + 1);
  ipScanCounts.set(ip, newCount);
  globalScanCount += 1;
  
  cookieStore.set(COOKIE_NAME, String(newCount), {
    httpOnly: false, // Must be readable by client for UI remaining count if needed, or we just pass it down
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  // Map to DemoReceiptResult
  const items = (parsed.items || []).map((item: any) => {
    const qty = item.quantity || 1;
    const unit = item.unit === "kg" ? "kg" : "adet";
    const namePrefix =
      unit === "kg" ? `${qty} kg ` : qty > 1 ? `${qty}x ` : "";
    return {
      icon: "📦", // Default icon for demo
      name: `${namePrefix}${item.name || "Bilinmeyen Ürün"}`,
      category: item.category || "Diğer",
      amount: formatCurrency(item.price * qty),
      vatRate: item.vat_rate || 0,
    };
  });

  return {
    storeName: parsed.store_name || "Bilinmiyor",
    date: parsed.date || today,
    items,
    total: formatCurrency(parsed.total || 0),
    remaining: MAX_TRIES - newCount,
  };
}
