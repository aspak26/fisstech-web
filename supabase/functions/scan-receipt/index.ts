// Fişştech — scan-receipt Edge Function (web-owned kopya)
// Gemini 2.5 Flash Vision ile fiş tarama + taksit tablosu okuma + akıllı kategori eşleştirme
// GÜVENLİK: JWT doğrulaması zorunlu (C-3), kullanıcı kimliği token'dan alınır
//
// Bu dosya fisleapp/fisle_app/supabase/functions/scan-receipt/index.ts'in
// (mobil repo, SALT OKUNUR referans) web'e ait bir kopyasıdır — mobil ve web
// AYNI canlı Supabase projesini paylaşıyor, bu yüzden asıl deploy edilmiş
// fonksiyon hangi kaynaktan güncellenirse güncellensin ikisini de etkiler.
// TİP C bloğu (fatura/banka ekstresi/resmi belge) bu turda EKLENDİ — geri
// kalan mantık orijinal dosyayla birebir aynı. DEPLOY BU TURDA YAPILMADI,
// bkz. docs/PROGRESS.md.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// C-4: Mobil uygulamalar tarayıcı CORS kısıtlamalarına tabi değildir.
// Gerçek güvenlik JWT doğrulamasından (aşağıda) gelir.
// OPTIONS preflight için Allow-Methods kısıtlaması eklendi.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_BASE64_BYTES = 5 * 1024 * 1024 // 5 MB — M-8 düzeltmesi

interface CategoryItem {
  name: string
  group: string
  emoji: string
}

function buildCategorySection(categories: CategoryItem[]): string {
  if (!categories || categories.length === 0) {
    return `KATEGORİ: Her ürün için en uygun Türkçe kategori adını yaz (ör: "Gıda", "İçecek", "Temizlik", "Kişisel Bakım", "Giyim", "Elektronik", "Diğer").`
  }
  const uniqueNames = [...new Set(categories.map((c) => c.name))]
  return `KATEGORİ: Her ürünün "category" değeri aşağıdaki listeden biri olmalı (birebir aynı yazım):
${uniqueNames.join(', ')}
Bu listede uygun bir kategori yoksa "Diğer" yaz.`
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ─── C-3: JWT Doğrulaması ──────────────────────────────────────────────────
    // Kimlik token'ı olmadan istek reddedilir — user_id body'den kabul edilmez.
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) {
      return jsonError('Yetkisiz: Geçerli bir oturum belirteci gerekiyor', 401)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) {
      return jsonError('Yetkisiz: Geçersiz veya süresi dolmuş oturum', 401)
    }

    // Kullanıcı kimliği her zaman doğrulanmış token'dan alınır
    const verifiedUserId = user.id

    // ─── Env kontrol ─────────────────────────────────────────────────────────
    const geminiKey = Deno.env.get('GEMINI_API_KEY')?.trim()
    if (!geminiKey) {
      return jsonError('Sunucu yapılandırma hatası', 500)
    }

    // ─── İstek gövdesi ───────────────────────────────────────────────────────
    const body = await req.json()
    const { image_base64, categories } = body
    // Not: body'deki user_id artık kullanılmıyor — doğrulanmış kimlik geçerlidir

    if (!image_base64) {
      return jsonError('image_base64 zorunlu', 400)
    }

    // C-4 / M-8: Görüntü boyut kontrolü
    if (image_base64.length > MAX_BASE64_BYTES) {
      return jsonError('Görüntü çok büyük (maks 5 MB)', 413)
    }

    const categorySection = buildCategorySection(categories as CategoryItem[])
    const today = new Date().toISOString().split('T')[0]

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
  "installment_options": [
    {"count": 1, "monthly_amount": 16864.03, "label": "Tek Çekim", "badge": null},
    {"count": 2, "monthly_amount": 8959.86, "label": "2 Taksit", "badge": null},
    {"count": 3, "monthly_amount": 5621.34, "label": "3 Taksit", "badge": "Peşin Fiyatına"},
    {"count": 4, "monthly_amount": 4658.27, "label": "4 Taksit", "badge": null},
    {"count": 6, "monthly_amount": 3198.54, "label": "6 Taksit", "badge": null},
    {"count": 8, "monthly_amount": 2516.32, "label": "8 Taksit", "badge": null},
    {"count": 9, "monthly_amount": 2283.01, "label": "9 Taksit", "badge": null}
  ],
  "items": []
}

KURALLAR:
- installment_options içinde tablodaki HER SATIR ayrı bir eleman olmalı (2, 3, 4, 5, 6, 7, 8, 9, 12 taksit vb. hepsini ekle).
- monthly_amount: tablodaki GERÇEK aylık tutar (faiz dahil). Hesaplama yapma, tablodan oku.
- badge: "Peşin Fiyatına", "0 Faiz", "Kampanya" gibi özel etiket varsa yaz; yoksa null bırak.
- total: Tek Çekim / peşin tutarını yaz.

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TİP C — FATURA / BANKA EKSTRESİ / RESMİ BELGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Görsel bir taksit tablosu (TİP A) veya ürün listesi içeren bir market/restoran
fişi (TİP B) DEĞİLSE ve aşağıdaki üç durumdan biriyse TİP C'dir. TİP B'nin JSON
şemasını kullan ama "items" dizisine SADECE TEK bir eleman koy:

1) FATURA (elektrik, su, doğalgaz, internet, telefon vb. abonelik/hizmet faturası):
   items: [{"name": "<fatura türü, örn. Elektrik Faturası>", "category": "Faturalar", "price": <toplam_tutar>, "quantity": 1}]
   store_name: faturayı kesen kurum/şirket adı

2) BANKA EKSTRESİ (kredi kartı ekstresi, hesap ekstresi):
   items: [{"name": "Banka Ekstresi", "category": "Faturalar", "price": <toplam_borç_tutarı>, "quantity": 1}]
   store_name: banka adı

3) SÖZLEŞME / RESMİ BELGE (kontrat, iş anlaşması, noter belgesi, resmi yazışma):
   items: [{"name": "<belge/sözleşme başlığı>", "category": "Diğer", "price": 0, "quantity": 1}]
   store_name: karşı taraf / kurum adı
   total: 0

KURALLAR (TİP C):
- payment_method: net bilgi yoksa "unknown".
- is_installment: false, installment_options: [].
- date: belgede bir tarih varsa onu kullan, yoksa ${today}.
- "Faturalar" kategori listesinde yoksa en yakın kategoriyi veya "Diğer" kullan (aşağıdaki KATEGORİ kuralı zaten bunu güvenli şekilde karşılıyor).

${categorySection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENEL KURALLAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Yalnızca geçerli JSON döndür, başka bir şey yazma.
- İndirim, kampanya, promosyon ve eksi (−) değerli satırları items listesine EKLEME.
- Tutar değerlerinde virgül/nokta ayırıcılarını düzelt (16.864,03 → 16864.03).`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: image_base64 } }
            ]
          }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      }
    )

    if (!response.ok) {
      // H-7: Ham Gemini hata detayı istemciye sızdırılmıyor
      console.error('Gemini API hatası:', response.status, await response.text())
      return jsonError('Görüntü işlenirken bir hata oluştu', 502)
    }

    const geminiData = await response.json()
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return jsonError('receipt_unreadable', 422)
    }

    let cleanedText = text.trim()
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    let parsed
    try {
      parsed = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('JSON Parse Error. Raw text:', text)
      return jsonError('receipt_unreadable', 422)
    }

    if (!parsed.date) parsed.date = today
    if (parsed.is_installment === undefined) parsed.is_installment = false
    if (!parsed.installment_options) parsed.installment_options = []

    // verifiedUserId kullanılabilir — ileride DB'ye yazım gerekirse buradan alınır
    void verifiedUserId

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    // H-7: Detaylı hata sadece server log'una yazılır, istemciye gönderilmez
    console.error('[scan-receipt]', err)
    return jsonError('İşlem sırasında bir hata oluştu', 500)
  }
})
