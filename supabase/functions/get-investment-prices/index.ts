// Edge Function: get-investment-prices
// Altın: Truncgil (best-effort). Döviz (USD/EUR): TCMB resmi XML feed'i.
// Kripto: CoinGecko. Üçü birbirinden bağımsız denenir, normalize edilmiş
// tek bir JSON döner.
//
// Bu, fisleapp/supabase/functions/get-investment-prices/index.ts'in web'e
// özel bir kopyası (scan-receipt ile aynı desen — mobil kaynak SADECE
// referans, asla değiştirilmiyor).
//
// Değişiklik geçmişi (bkz. docs/PROGRESS.md, 28 Temmuz 2026):
// 1) Orijinalde tüm kaynaklar TEK bir try/catch içindeydi — biri
//    (özellikle CoinGecko'nun ücretsiz API'si zaman zaman boş/hatalı gövde
//    döndürüyor) başarısız olunca TÜM fiyatlar (altın dahil) düşüyordu.
//    Kaynaklar artık birbirinden bağımsız deneniyor.
// 2) finans.truncgil.com bu ortamdan (Supabase Edge Runtime) gelen
//    isteklere HER SEFERİNDE aynı byte konumunda kesilmiş bir yanıt
//    veriyor ("Unterminated string in JSON") — retry, gzip kapatma, elle
//    stream okuma, header'sız istek denendi, hepsi aynı sonucu verdi;
//    kontrol amaçlı çekilen 1MB'lık farklı bir kaynak sorunsuz geldiği
//    için bu bir Deno/Supabase boyut sınırı DEĞİL, muhtemelen Truncgil
//    (veya önündeki bir WAF) bu ağı bot olarak algılayıp engelliyor.
//    Düzeltilemedi. Döviz (USD/EUR) bu yüzden artık TCMB'nin resmi XML
//    feed'inden (www.tcmb.gov.tr/kurlar/today.xml — engellenmiyor, test
//    edildi) okunuyor; Truncgil sadece altın için best-effort deneniyor.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Güvenlik denetimi bulgusu: bu fonksiyon üçüncü taraf fiyat API'lerine
// (CoinGecko/TCMB/Truncgil) proxy görevi görüyor, PII yok ama korumasız
// bırakılırsa amplifikasyon/kota-tüketim aracı olarak kötüye kullanılabilir.
// scan-demo.ts'teki aynı desen: instance-local, best-effort IP limiti.
const MAX_REQUESTS_PER_MINUTE = 20;
const ipRequestLog = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestLog.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequestLog.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_MINUTE;
}

/** Yanıt gövdesini `Response.text()`'e güvenmeden, ReadableStream'i elle
 * `done: true` oluncaya kadar okuyup birleştirir — bkz. yukarıdaki not #2. */
async function readBody(res: Response): Promise<string> {
  if (!res.body) throw new Error('Boş gövde');
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (value) chunks.push(value);
    if (done) break;
  }
  const totalLength = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder('utf-8').decode(merged);
}

async function fetchText(url: string, attempts = 2): Promise<string> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await readBody(res);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: 'Çok fazla istek, lütfen daha sonra tekrar deneyin.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 },
    );
  }

  const truncgil = await fetchText('https://finans.truncgil.com/today.json')
    .then((text) => JSON.parse(text) as Record<string, Record<string, string>>)
    .catch((err) => {
      console.error('Truncgil fetch failed:', String(err));
      return null;
    });

  const gecko = await fetchText(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=try',
  )
    .then((text) => JSON.parse(text) as Record<string, Record<string, number>>)
    .catch((err) => {
      console.error('CoinGecko fetch failed:', String(err));
      return null;
    });

  const tcmbXml = await fetchText('https://www.tcmb.gov.tr/kurlar/today.xml').catch((err) => {
    console.error('TCMB fetch failed:', String(err));
    return null;
  });

  if (!truncgil && !gecko && !tcmbXml) {
    return new Response(
      JSON.stringify({ error: 'Tüm fiyat kaynakları başarısız oldu' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 },
    );
  }

  const parseTruncgil = (key: string): number => {
    if (!truncgil) return 0;
    const raw = truncgil[key]?.['Satış'] ?? truncgil[key]?.['Alış'] ?? '0';
    // Türkçe format: "6.210,50" → nokta=binler ayırıcısı, virgül=ondalık
    // Önce tüm noktaları sil, sonra virgülü noktaya çevir
    const cleaned = String(raw).replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  // Altın için olası anahtar varyasyonlarını dene
  const parseGold = (...keys: string[]): number => {
    for (const k of keys) {
      const val = parseTruncgil(k);
      if (val > 0) return val;
    }
    return 0;
  };

  // TCMB'nin sabit, öngörülebilir XML yapısından ForexSelling değerini
  // çıkarır — resmi bir devlet servisi olduğu için tam bir XML parser
  // eklemeye gerek kalmadan güvenle regex ile okunabilir.
  const parseTcmb = (code: string): number => {
    if (!tcmbXml) return 0;
    const m = tcmbXml.match(new RegExp(`Kod="${code}"[\\s\\S]*?<ForexSelling>([\\d.]+)</ForexSelling>`));
    return m ? parseFloat(m[1]) || 0 : 0;
  };

  const prices: Record<string, number> = {
    gram_altin:       parseGold('Gram Altın', 'gram-altin', 'Gram Altin', 'GA', 'Altın'),
    ceyrek_altin:     parseGold('Çeyrek Altın', 'ceyrek-altin', 'Çeyrek Altin', 'CA', 'Ceyrek Altin'),
    yarim_altin:      parseGold('Yarım Altın', 'yarim-altin', 'Yarım Altin', 'YA'),
    cumhuriyet_altin: parseGold('cumhuriyet-altini', 'Cumhuriyet Altını', 'cumhuriyet-altin', 'Cumhuriyet Altini', 'CumAlt'),
    bitcoin:          gecko?.bitcoin?.try  ?? 0,
    ethereum:         gecko?.ethereum?.try ?? 0,
    dolar:            parseTcmb('USD') || parseTruncgil('USD'),
    euro:             parseTcmb('EUR') || parseTruncgil('EUR'),
    gumus:            parseGold('Gümüş', 'gumus', 'Gümüş Gram', 'GUMUS', 'Gumus'),
  };

  console.log('Parsed prices:', JSON.stringify(prices));

  return new Response(
    JSON.stringify({ ...prices, updated_at: new Date().toISOString() }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
});
