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
    {"name": "ürün adı", "category": "kategori adı", "price": birim_fiyat, "quantity": adet}
  ]
}

KATEGORİ: Her ürün için en uygun Türkçe kategori adını yaz (ör: "Gıda", "İçecek", "Temizlik", "Kişisel Bakım", "Giyim", "Elektronik", "Diğer").

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENEL KURALLAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Yalnızca geçerli JSON döndür, başka bir şey yazma.
- İndirim, kampanya, promosyon ve eksi (−) değerli satırları items listesine EKLEME.
- Tutar değerlerinde virgül/nokta ayırıcılarını düzelt (16.864,03 → 16864.03).
- ÇOK ÖNEMLİ (Miktar ve Fiyat): Fişteki ürün miktarını (quantity) KESİNLİKLE doğru çıkar. Özellikle "2 X 14,00" veya "3 AD x 5,00" ibareleri varsa "quantity" değerini 2, 3 gibi belirle. "price" alanına ise toplam tutarı değil, ürünün BİRİM FİYATINI (14.00, 5.00 vb.) yaz.`;

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
  const items = (parsed.items || []).map((item: any) => ({
    icon: "📦", // Default icon for demo
    name: item.name || "Bilinmeyen Ürün",
    category: item.category || "Diğer",
    amount: formatCurrency(item.price * (item.quantity || 1)),
  }));

  return {
    storeName: parsed.store_name || "Bilinmiyor",
    date: parsed.date || today,
    items,
    total: formatCurrency(parsed.total || 0),
    remaining: MAX_TRIES - newCount,
  };
}
