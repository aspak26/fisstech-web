// Fişştech — scan-receipt Edge Function (web-owned kopya)
// Gemini 2.5 Flash Vision ile fiş tarama + taksit tablosu okuma + akıllı kategori eşleştirme
// GÜVENLİK: JWT doğrulaması zorunlu (C-3), kullanıcı kimliği token'dan alınır
//
// Bu dosya fisleapp/fisle_app/supabase/functions/scan-receipt/index.ts'in
// (mobil repo, SALT OKUNUR referans) web'e ait bir kopyasıdır — mobil ve web
// AYNI canlı Supabase projesini paylaşıyor, bu yüzden asıl deploy edilmiş
// fonksiyon hangi kaynaktan güncellenirse güncellensin ikisini de etkiler.
// TİP C bloğu (fatura/banka ekstresi/resmi belge) web'e özgüdür.
// 2026-07-25/26: Fiş doğruluk turu — "price" alanının birim fiyat/toplam
// karışıklığı, ağırlıklı (kg) ürünlerde adet/kg birim tespiti ve ürün
// başına KDV oranı (vat_rate) mobil tarafla birebir aynı mantığa
// getirildi. Bu dosya (TİP C dahil en kapsamlı sürüm) canlıya deploy
// edildi — mobil repodaki kopya da aynı mantığı içerir ama TİP C'yi
// içermez, bundan sonra güncellemeler öncelikle burada yapılıp deploy
// edilmeli.

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
    {"name": "ürün adı", "category": "kategori adı", "price": birim_fiyat, "quantity": adet_veya_agirlik, "unit": "adet veya kg", "vat_rate": KDV_orani}
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TİP C — FATURA / BANKA EKSTRESİ / RESMİ BELGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Görsel bir taksit tablosu (TİP A) veya ürün listesi içeren bir market/restoran
fişi (TİP B) DEĞİLSE ve aşağıdaki üç durumdan biriyse TİP C'dir. TİP B'nin JSON
şemasını kullan ama "items" dizisine SADECE TEK bir eleman koy:

1) FATURA (elektrik, su, doğalgaz, internet, telefon vb. abonelik/hizmet faturası):
   items: [{"name": "<fatura türü, örn. Elektrik Faturası>", "category": "Faturalar", "price": <toplam_tutar>, "quantity": 1, "unit": "adet", "vat_rate": 0}]
   store_name: faturayı kesen kurum/şirket adı

2) BANKA EKSTRESİ (kredi kartı ekstresi, hesap ekstresi):
   items: [{"name": "Banka Ekstresi", "category": "Faturalar", "price": <toplam_borç_tutarı>, "quantity": 1, "unit": "adet", "vat_rate": 0}]
   store_name: banka adı

3) SÖZLEŞME / RESMİ BELGE (kontrat, iş anlaşması, noter belgesi, resmi yazışma):
   items: [{"name": "<belge/sözleşme başlığı>", "category": "Diğer", "price": 0, "quantity": 1, "unit": "adet", "vat_rate": 0}]
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
- Tutar değerlerinde virgül/nokta ayırıcılarını düzelt (16.864,03 → 16864.03).
- ÖNEMLİ (A101/BİM KURALI): Fişlerdeki "2 X 14,00" gibi adet satırları, DAİMA KENDİNDEN BİR SONRAKİ (ALTINDAKİ) ürünün bilgisidir! ASLA üstündeki ürüne ait değildir. Bir üstündeki ürünün fiyatını veya adedini KESİNLİKLE değiştirme.
- DİKKAT (KDV Oranları): A101/BİM gibi market fişlerinde ürün adının yanındaki %01, %10, %20 gibi yüzdeler KDV oranıdır. Bunları KESİNLİKLE ADET (quantity) OLARAK ALMA! Bu oranları (1, 10, 20 vb. tam sayı olarak) "vat_rate" alanına yaz. Eğer üründe KDV yazmıyorsa 0 yaz.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KESİN KURAL — "price" ALANI HER ZAMAN BİRİM FİYATTIR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"price" alanı ASLA yıldızlı (*) satır toplamı değildir. "price" her zaman "N X fiyat" ya da "ağırlık KG X fiyat" kalıbındaki X'ten SONRA gelen BİRİM tutardır.
Bir üründe böyle bir "X" satırı YOKSA: price = o ürünün yıldızlı (*) toplam tutarı, quantity = 1, unit = "adet".
Bir üründe "X" satırı VARSA: price = X'ten sonraki birim tutar, quantity = X'ten önceki sayı, ve price × quantity çarpımı MUTLAKA ürünün yıldızlı (*) toplam tutarına eşit (±0.05 TL tolerans) olmalıdır. JSON'u döndürmeden önce bunu KENDİN KONTROL ET; eşleşmiyorsa price veya quantity'yi yanlış okumuşsundur, satırı tekrar incele.

ÖRNEK 1 — ADET BAZLI ÇOKLU ÜRÜN (A101/BİM/marketler):
Fişte şöyle yazıyorsa:
SÜT YARIM YAĞLI 1L    *30,00
2 X 15,00
BİSKÜVİ KAKAOLU 100G  *30,00
MADEN SUYU SADE       *10,00
3 X 1,00
EKMEK 200G            *3,00

Şu JSON'u üretmelisin:
items: [
  {"name": "SÜT YARIM YAĞLI 1L", "price": 30.00, "quantity": 1, "unit": "adet"},
  {"name": "BİSKÜVİ KAKAOLU 100G", "price": 15.00, "quantity": 2, "unit": "adet"},
  {"name": "MADEN SUYU SADE", "price": 10.00, "quantity": 1, "unit": "adet"},
  {"name": "EKMEK 200G", "price": 1.00, "quantity": 3, "unit": "adet"}
]
(Kontrol: 15.00×2=30.00 ✓, 1.00×3=3.00 ✓ — yıldızlı toplamlarla eşleşiyor. "3 X 1,00" ibaresi EKMEK içindir, üstündeki MADEN SUYU için değildir!)

ÖRNEK 2 — AĞIRLIKLA SATILAN ÜRÜNLER (manav, kasap, şarküteri):
Fişte "9,910 KG X 13,90" gibi bir satır görürsen bu da tıpkı adet satırı gibi DAİMA ALTINDAKİ ürünün bilgisidir, sadece adet yerine ağırlıktır:
9,910 KG X 13,90
MANAV KARPUZ           *137,75
0,747 kg X 99,00
DOY PİLİÇ KAL BUT       *73,95
1,245 kg X 44,90
PORTAKAL                *55,90

Şu JSON'u üretmelisin:
items: [
  {"name": "MANAV KARPUZ", "price": 13.90, "quantity": 9.910, "unit": "kg"},
  {"name": "DOY PİLİÇ KAL BUT", "price": 99.00, "quantity": 0.747, "unit": "kg"},
  {"name": "PORTAKAL", "price": 44.90, "quantity": 1.245, "unit": "kg"}
]
(Kontrol: 13.90×9.910≈137.75 ✓, 99.00×0.747≈73.95 ✓, 44.90×1.245≈55.90 ✓ — DOY PİLİÇ'te price'ı yanlışlıkla 73.95 (toplam) yazmak YAYGIN BİR HATADIR, bundan kaçın: price her zaman 99.00'dır, 73.95 değil.)

- "unit" alanı: ürün "KG X" veya "KG" ibaresiyle tartılarak satılmışsa "kg", aksi halde (adet/paket bazlı ürünlerde) "adet" yaz.
- Ürün adedini/ağırlığını (quantity) yalnızca açıkça yazılı miktardan al. Belirsizse quantity=1, unit="adet" yaz.`

    // --- AI DİNAMİK ÖĞRENME (FEW-SHOT INJECTION) ---
    let aiCorrectionsText = ''
    try {
      const { data: correctionsData } = await userClient
        .from('ai_corrections')
        .select('raw_name, corrected_category')
        .order('created_at', { ascending: false })
        .limit(30)

      if (correctionsData && correctionsData.length > 0) {
        const uniqueCorrections = new Map<string, string>()
        for (const c of correctionsData) {
          if (!uniqueCorrections.has(c.raw_name)) {
            uniqueCorrections.set(c.raw_name, c.corrected_category)
          }
        }
        
        if (uniqueCorrections.size > 0) {
          aiCorrectionsText = `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nÖĞRENİLMİŞ KISALTMALAR (DİKKATE ALINACAK)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nAşağıda kullanıcıların geçmişte düzelttiği ürün isimleri ve doğru kategorileri yer almaktadır. Görseldeki ürün isimleri bu listedekilere benziyorsa, KESİNLİKLE aşağıdaki doğru kategoriyi kullan:\n`
          for (const [raw, cat] of uniqueCorrections.entries()) {
             aiCorrectionsText += `- "${raw}" -> Kategori: "${cat}"\n`
          }
        }
      }
    } catch (e) {
      console.error('Error fetching ai_corrections:', e)
    }

    const finalPrompt = prompt + aiCorrectionsText

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: finalPrompt },
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
