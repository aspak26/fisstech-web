# SECURITY AUDIT: Fişştech Web (fisstech.co) — Next.js 16 / Supabase

**Kapsam:** `src/app/api/`, `src/lib/actions/`, `src/lib/data/`, `src/lib/scan/`, `src/lib/esnaf/`, `src/lib/subscriptions/`, `src/lib/utils/`, `src/lib/supabase/`, `src/proxy.ts`, `next.config.ts`, `.env*`, `supabase/functions/*`. Toplam 35+ dosya okundu (tam liste raporun sonunda).

**Risk Assessment:** Medium — bir adet Critical bulgu (bot/kota bypass) hariç, kod tabanı zaten önceki bir güvenlik denetimi turundan geçmiş görünüyor (dosyalarda "Güvenlik denetimi bulgusu" yorumlarıyla işaretli defense-in-depth eklemeleri, XSS-güvenli dosya doğrulaması, JWT zorunluluğu, CSP, rate limiting mevcut). Ana risk müşteri tarafında (client-side) hardcode edilmiş bir "sihirli bypass string"i.

---

## Findings

### 1. Turnstile Bot Doğrulaması Sabit String İle Tamamen Atlatılabiliyor (Critical)

**Location:** `src/lib/actions/scan-demo.ts:33` (server action) + `src/components/modules/landing/scan-demo.tsx:40` (client çağıran kod)

**The Exploit:**
Server action şu kontrolü yapıyor:
```ts
if (turnstileToken !== "bypass") {
  if (!turnstileToken) { throw new Error(...); }
  // ... gerçek Cloudflare Turnstile doğrulaması
}
```
Yani istemciden gelen `turnstileToken` parametresi **literal olarak `"bypass"` string'i ise** Cloudflare Turnstile doğrulaması (siteverify çağrısı) tamamen atlanıyor — bu, `NODE_ENV` veya herhangi bir sunucu-taraflı sırra bağlı değil, prod dahil her ortamda çalışan bir üretim kodu yolu.

Bunu tetikleyen istemci kodu da zaten bu davranışı normalleştirmiş durumda:
```ts
const finalToken = turnstileToken || "bypass";
// Geçici olarak Turnstile zorunluluğunu kaldırıyoruz ki site çalışsın.
```
Next.js Server Actions, encode edilmiş bir action-id ile normal bir `POST` endpoint'i olarak dışa açılır (`fetch` ile doğrudan çağrılabilir, tarayıcı JS'i gerekmez). Bir saldırgan, Turnstile widget'ını hiç yüklemeden/çözmeden doğrudan `scanDemoReceipt(imageBase64, "bypass")` isteğini script ile tekrar tekrar gönderebilir. Bu:

1. Turnstile'ın var olma amacını (bot/otomasyon engelleme) tamamen geçersiz kılar.
2. Geriye kalan tek savunma, aynı dosyadaki **process-içi bellek tabanlı** rate limiter'lardır (`ipScanCounts` Map + cookie sayacı) — bunlar Vercel serverless ortamında instance başına izole çalışır, cold start'ta sıfırlanır ve birden fazla eşzamanlı instance arasında paylaşılmaz; `x-forwarded-for` da rotating/residential proxy ile kolayca değiştirilebilir. Pratikte saldırgan cookie'siz + IP rotasyonuyla bu sayaçları da anlamsız hale getirebilir.
3. Sonuç: kimliksiz, ücretsiz, tekrarlanabilir bir şekilde `GEMINI_API_KEY` üzerinden gerçek Gemini 2.5 Flash Vision çağrıları tetiklenebilir → **maliyet/DoS (cüzdan boşaltma) saldırısı** — `MAX_GLOBAL_DAILY_SCANS = 5000` genel günlük tavan var ama bu da tek bir process'in belleğinde tutuluyor, yatay ölçeklenen serverless'ta güvenilir bir üst sınır değil.

**The Fix:**
- `"bypass"` sihirli string'ini prod kod yolundan tamamen kaldır. Sadece `NODE_ENV !== "production"` durumunda ve sadece test ortamı Turnstile secret'ı (`1x0000...AA`) ile birlikte devre dışı bırak:
```ts
const allowBypass = process.env.NODE_ENV !== "production";
if (!(allowBypass && turnstileToken === "bypass")) {
  if (!turnstileToken) throw new Error("Bot doğrulaması başarısız oldu (Token eksik).");
  // gerçek siteverify çağrısı — HER ZAMAN prod'da çalışsın
}
```
- Client tarafında `finalToken = turnstileToken || "bypass"` satırını kaldır; token yoksa isteği hiç gönderme (yorumdaki devre dışı bırakılmış kontrolü geri aç):
```ts
if (!turnstileToken) {
  setErrorMsg("Güvenlik doğrulaması henüz tamamlanmadı, lütfen bekleyin.");
  return;
}
```
- Rate limit sayaçlarını (IP/cookie/global) bellek yerine kalıcı bir mağazaya taşı (Upstash Redis / Vercel KV / Supabase tablosu + atomik RPC — projede zaten `try_consume_scan_credit` gibi atomik RPC deseni var, aynı desen burada da kullanılabilir).

---

### 2. `/api/ai-chat` ve `scan-demo`/`landing-chat` Rate Limitleri Serverless Ortamda Etkisiz (High)

**Location:** `src/lib/utils/rate-limit.ts`, `src/app/api/ai-chat/route.ts`, `src/app/api/landing-chat/route.ts`, `src/lib/actions/scan-demo.ts`

**The Exploit:** `createRateLimiter` ve `scan-demo.ts`'teki `ipScanCounts`/`globalScanCount` tamamen process-içi `Map`/`let` değişkenleridir. Vercel'de her fonksiyon çağrısı farklı bir lambda instance'ına düşebilir (özellikle trafik arttıkça otomatik ölçeklenir) ve her cold start sayaçları sıfırlar. Kod içindeki yorum bunu zaten kabul ediyor ("resets on cold start / doesn't share state across serverless instances"). `/api/ai-chat` gerçek para maliyeti olan, KİMLİK DOĞRULAMALI bir endpoint olduğu için (`isRateLimited(user.id)`, 20 istek/10dk) — bir saldırgan/kötü niyetli abone, farklı bölge/instance'lara denk gelecek şekilde paralel istek göndererek veya fonksiyonun soğumasını bekleyerek bu limiti pratikte aşabilir.

**The Fix:** Tüm rate limiter'ları paylaşımlı, kalıcı bir backend'e taşı: Vercel KV, Upstash Redis (`@upstash/ratelimit` — Vercel Edge/Serverless için tasarlanmış, sabit pencere/sliding window destekli) veya Supabase'te atomik bir `increment_and_check` RPC'si. `consumeAiChatCredit` zaten atomik bir Postgres RPC (`try_consume_ai_chat_credit`) kullanıyor — bu asıl kota kontrolüdür ve doğru çalışıyor; ama ek "istek/dakika" rate limiti olan `isRateLimited(user.id)` katmanı hâlâ belleğe güveniyor, bu da API-cost-per-request odaklı (spam/DoS) bir korumadan çok "iyi niyetli kullanıcı" için bir güvenlik ağı durumunda.

---

### 3. CSP `script-src` içinde `'unsafe-inline'` — XSS Savunmasını Büyük Ölçüde Zayıflatıyor (Medium)

**Location:** `next.config.ts:20`

**The Exploit:** 
```ts
`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`
```
`'unsafe-inline'`, prod dahil her zaman açık. Bu, CSP'nin en önemli sağladığı korumayı (inline `<script>` / `onerror=` gibi olay-tabanlı payload'ların çalışmasını engellemek) etkisiz kılar — ileride bir yerde (ör. üçüncü parti bir kütüphane, kullanıcı girdisinin render edildiği bir nokta) bir XSS açığı oluşursa, bu CSP onu **engellemez**. Şu an kod tabanında `dangerouslySetInnerHTML` kullanımı yok ve `react-markdown` (AI özet modalında) `rehype-raw` eklentisi olmadan varsayılan olarak ham HTML render etmiyor — yani bugün aktif bir XSS bulunamadı, ama CSP "ikinci savunma katmanı" görevini şu haliyle göremiyor.

**The Fix:** Next.js'in nonce-tabanlı CSP desteğine geçin (App Router `next.config` + `proxy.ts`'te nonce üretip `<Script nonce={nonce}>` / `next/script` ile enjekte etme) ve `'unsafe-inline'`'ı kaldırın. Nonce yaklaşımı mümkün değilse en azından `'strict-dynamic'` + hash-tabanlı bir geçiş planı değerlendirin.

---

### 4. `getExpenseById` ve Benzeri Bazı Okuma Fonksiyonları Sahiplik Filtresi Olmadan Sorgu Atıyor (Low — RLS ile telafi ediliyor, ama tutarsız desen)

**Location:** `src/lib/data/expenses.ts:54-72` (`getExpenseById`), ayrıca `src/lib/data/groups.ts:56-59` (`getGroup`), `src/lib/esnaf/business-logo.ts:29-46` (`uploadBusinessLogo`/`removeBusinessLogo` — `.update().eq("id", businessId)`, `user_id` filtresi yok)

**The Exploit:** Bu fonksiyonlar `id` parametresini doğrudan sorguya geçiriyor, `.eq("user_id", ...)` gibi ikinci bir sahiplik filtresi eklemiyor — yani IDOR koruması tamamen Supabase RLS politikalarına bağlı. `fisle_app/supabase/migrations/003_rls_policies.sql` ve `026_esnaf_modu.sql` doğrulandı: `expenses` (`user_id = auth.uid()` + grup-üyesi read istisnası) ve `businesses` (`UPDATE ... USING (auth.uid() = user_id)`) tabloları için RLS doğru kurulu — yani **bugün bu spesifik yollar exploit edilemiyor**. Ancak proje genelinde zaten "sadece RLS'e güvenmek yetersiz, defense-in-depth ekle" prensibiyle `requireUserId`/`assertIsBusinessOwner`/`assertCanManageGroup` yardımcıları eklenmiş (bkz. `src/lib/utils/auth.ts`, `src/lib/data/esnaf-team.ts`, `src/lib/data/groups.ts` içindeki "Güvenlik denetimi bulgusu" yorumları) — bu birkaç fonksiyon o geçişten kaçmış görünüyor, aynı standarda taşınmalı. Ayrıca herhangi bir migration'da RLS policy'si yanlışlıkla değiştirilir/gevşetilirse bu fonksiyonlar sessizce IDOR'a dönüşür (ikinci katman yok).

**The Fix:**
```ts
export async function getExpenseById(supabase: SupabaseClient, id: string): Promise<ExpenseWithItems | null> {
  const userId = await requireUserId(supabase);
  const { data } = await supabase
    .from("expenses")
    .select("*, expense_items(*)")
    .eq("id", id)
    .or(`user_id.eq.${userId},group_id.not.is.null`) // grup-paylaşımlı okuma senaryosunu koru
    .maybeSingle();
  ...
}
```
`uploadBusinessLogo`/`removeBusinessLogo` için `assertIsBusinessOwner(supabase, businessId)` çağrısı eklenmeli (zaten `esnaf-team.ts`'te var olan yardımcı fonksiyon yeniden kullanılabilir).

---

### 5. `get-investment-prices` Edge Function Kimlik Doğrulaması ve Rate Limit Olmadan Herkese Açık (Low)

**Location:** `supabase/functions/get-investment-prices/index.ts`

**The Exploit:** Bu fonksiyon JWT kontrolü yapmıyor (`scan-receipt`'in aksine) ve herhangi bir rate limiting içermiyor. Kullanıcıya özel veri döndürmüyor (sadece piyasa fiyatları), dolayısıyla veri ifşası riski yok — ama sınırsız çağrılabilir olması: (a) CoinGecko/TCMB/Truncgil'e karşı bir "amplifikasyon proxy'si" olarak kötüye kullanılabilir, (b) CoinGecko'nun ücretsiz kota sınırını (rate limit) hızla tüketip **gerçek kullanıcılar için** kripto fiyatlarının kesintiye uğramasına yol açabilir (kendi kendine servis-dışı-bırakma riski).

**The Fix:** JWT doğrulaması ekle (`scan-receipt`'teki desenle aynı) veya en azından IP başına basit bir rate limit + sonuçları kısa süreliğine (ör. 60 sn) cache'leyip tekrarlayan çağrılarda upstream'e gitmeden önbellekten dönme (zaten fiyatlar dakikalık güncellenen veriler, agresif cache mantıklı).

---

## Observations

- **`.env.local` / `.env.vercel.prod` gerçek sırlar içeriyor** (`GEMINI_API_KEY`, `TURNSTILE_SECRET_KEY`) — ancak `.gitignore`'da `.env*` (yalnızca `.env.example` hariç) doğru şekilde dışlanmış ve `git ls-files` / `git log` bu dosyaların repoya hiç commit edilmediğini doğruladı. **Sızıntı yok**, sadece yerel makinede düz metin sırlar bulunduğu için normal işletim hijyeni olarak not edildi (rotasyon takvimi, `.env.vercel.prod`'un gereksiz yere diskte tutulmaması önerilir).
- **`NEXT_PUBLIC_*` env değişkenleri arasında `service_role` key sızıntısı YOK** — `NEXT_PUBLIC_SUPABASE_ANON_KEY` beklenen `anon`/`publishable` anahtarı (`sb_publishable_...` prefixli), `service_role` hiçbir client-side dosyada veya `NEXT_PUBLIC_` prefixli değişkende geçmiyor (`grep -rln "service_role"` src/supabase içinde sıfır sonuç). Tüm Supabase client'ları (`src/lib/supabase/{client,server,middleware}.ts`) sadece anon key + kullanıcı JWT/cookie kullanıyor — RLS'in gerçek yetkilendirme katmanı olduğu doğru mimari.
- **RevenueCat webhook endpoint'i web tarafında YOK** — web, abonelik durumunu sadece `users.plan_type`/`esnaf_plan` okuyarak tüketiyor (webhook'u sadece mobil/Supabase Edge Function tarafı işliyor, CLAUDE.md ile tutarlı). Web'de sahte webhook isteğiyle plan değiştirme riski bu repo kapsamında mevcut değil.
- **Ödeme/abonelik yetkilendirmesi client-side'da yapılmıyor** — `getUserPlanInfo`/`isPersonalPremium`/`isBusinessSubscribed` DB'den okunan `plan_type`/`esnaf_plan` üzerinden server-side kontrol ediliyor; scan kredisi/AI sohbet kredisi gibi kritik kotalar atomik Postgres RPC'leriyle (`try_consume_scan_credit`, `try_consume_ai_chat_credit`, `try_consume_feature_credit_atomic`) tüketiliyor — race condition'a karşı doğru desen.
  - Tek istisna: `isBusinessSubscribed()` (`src/lib/esnaf/active-business.ts:61-67`) RPC hata dönerse **fail-open** davranıyor (erişime izin veriyor) — bilinçli bir tercih olarak yorumlanmış ("migration henüz çalıştırılmadıysa herkesin erişimi kaybolmasın"), ama RPC production'da gerçekten silinir/bozulursa bu, Esnaf Modu paywall'unun sessizce devre dışı kalması anlamına gelir. Kabul edilebilir bir trade-off, ama izlenmesi (alerting/monitoring) önerilir.
- **Dosya yükleme güvenliği iyi**: `detectImageType()` magic-byte doğrulaması ile hem `receipts` hem `business_logos` bucket'larına yüklenen dosyaların gerçekten JPEG/PNG/WebP olduğunu doğruluyor — dosya adı/`Content-Type` gibi saldırgan kontrolündeki alanlara güvenmiyor. Özellikle public `business_logos` bucket'ında SVG/script-injection riskini doğru şekilde kapatmış.
- **XSS**: Kod tabanında `dangerouslySetInnerHTML` kullanımı yok. `react-markdown` (AI özet modalı) `rehype-raw` eklentisiz kullanılıyor, yani ham HTML render edilmiyor — AI'nin ürettiği metin güvenli şekilde render ediliyor.
- **Güvenlik header'ları** (`next.config.ts`): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, CSP hepsi mevcut — clickjacking ve MIME-sniffing için iyi bir taban. (Eksik olan tek yaygın header: `Strict-Transport-Security`/HSTS — Vercel'in kendi edge katmanı genelde HTTPS'i zorlar ama açık bir HSTS header'ı eklemek "defense in depth" için ucuz bir ek.)
- **Auth/cookie yönetimi**: `@supabase/ssr` + `createServerClient`/`createBrowserClient` deseni doğru kullanılmış; session cookie'leri Supabase SSR kütüphanesi tarafından yönetiliyor (kütüphane varsayılanları `httpOnly`/`secure`/`sameSite` içerir). `scan-demo.ts`'teki özel `fisstech_demo_scans_used` cookie'si bilinçli olarak `httpOnly: false` (açıklaması: client'ın okuması gerekiyor) — bu cookie oturum/kimlik bilgisi taşımadığı (sadece bir sayaç) için düşük risk, ama not edilmeye değer.
- **`proxy.ts` route guard mantığı** doğru: `PUBLIC_ROUTES`/`AUTH_ROUTES` dışındaki her şey `!user` durumunda `/login`'e yönlendiriyor — server-side, senkron ve `matcher` ile neredeyse tüm path'leri kapsıyor (sadece statik asset'ler hariç). Esnaf Modu erişiminin `is_admin` bazlı kısıtı (mobil CLAUDE.md'de belirtilen) bu repoda `isAdminUser()` üzerinden aynı `users.is_admin` kolonunu okuyor — mobil ile tutarlı.
- **Gemini prompt injection yüzeyi**: `ai-chat/route.ts` sistem promptuna kullanıcının kendi harcama verisi (mağaza adları, kategori adları vb.) JSON olarak enjekte ediliyor. Mağaza adı gibi serbest metin alanları teorik olarak prompt injection için kullanılabilir (ör. bir "mağaza adı" alanına talimat benzeri metin yazıp AI'nin sistem talimatlarını geçersiz kılmaya çalışmak) — ancak bu yalnızca kullanıcının **kendi** verisiyle **kendi** sohbetini manipüle etmesi anlamına gelir (başka kullanıcıya ulaşan bir yetkilendirme/veri sızıntısı yolu değil), bu yüzden düşük öncelikli bir "gözlem" olarak not edildi, kritik değil.

---

## Taranan Dosyalar (Kapsam Kanıtı)

`src/app/api/ai-chat/route.ts`, `src/app/api/landing-chat/route.ts`, `src/proxy.ts`, `src/lib/supabase/{client,server,middleware}.ts`, `next.config.ts`, `.env.local`, `.env.vercel`, `.env.vercel.prod`, `.env.example`, `.gitignore`, `src/lib/actions/{seed,scan-demo,esnaf-settings,ai-rapor}.ts`, `src/lib/utils/{rate-limit,entitlements,admin,auth,file-validation}.ts`, `src/lib/scan/{credits,saveExpense}.ts`, `src/lib/features/unlocks.ts`, `src/lib/ai-chat/credits.ts`, `src/lib/esnaf/{active-business,whatsapp,business-logo}.ts`, `src/lib/data/{expenses,income,notes,groups,esnaf-team}.ts`, `src/components/modules/landing/scan-demo.tsx`, `src/components/modules/esnaf/ai-summary-modal.tsx`, `src/lib/income/export.ts`, `supabase/functions/scan-receipt/index.ts`, `supabase/functions/get-investment-prices/index.ts`, ve destek/doğrulama için `fisle_app/supabase/migrations/{003_rls_policies,004_fix_rls_recursion,026_esnaf_modu,057_businesses_staff_select}.sql` (paylaşılan backend RLS doğrulaması amacıyla, salt-okunur referans olarak).
