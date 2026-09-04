# SECURITY AUDIT: Fişştech Web (fisstech.co) — Next.js 16 / Supabase

**Kapsam:** `src/app/api/`, `src/lib/actions/`, `src/lib/data/`, `src/lib/scan/`, `src/lib/esnaf/`, `src/lib/subscriptions/`, `src/lib/utils/`, `src/lib/supabase/`, `src/proxy.ts`, `next.config.ts`, `.env*`, `supabase/functions/*`. Toplam 35+ dosya okundu (tam liste raporun sonunda).

**Risk Assessment:** Medium — bir adet Critical bulgu (bot/kota bypass) hariç, kod tabanı zaten önceki bir güvenlik denetimi turundan geçmiş görünüyor (dosyalarda "Güvenlik denetimi bulgusu" yorumlarıyla işaretli defense-in-depth eklemeleri, XSS-güvenli dosya doğrulaması, JWT zorunluluğu, CSP, rate limiting mevcut). Ana risk müşteri tarafında (client-side) hardcode edilmiş bir "sihirli bypass string"i.

> **ROUND 2 — 2 Ağustos 2026.** Bu denetimin ikinci turu. Round 1'in temel alındığı commit (`790196b`) ile şu anki `HEAD` arasında **25 commit** var (`git log --oneline 790196b..HEAD`). Round 1'in 5 bulgusunun hepsi kod okunarak yeniden doğrulandı (her birine "**Durum (Round 2):**" satırı eklendi) ve 25 commit'lik delta ayrıca tarandı. **Yeni bulunan tek Critical, bu turun en önemli sonucu:** yeni "7 günlük ücretsiz deneme" özelliği, `users.trial_started_at` kolonunu koruma altına almayı unutmuş — herhangi bir kimlik doğrulamalı kullanıcı tarayıcı konsolundan bu kolonu doğrudan güncelleyip **süresiz, sınırsız ücretsiz premium** elde edebilir. Aşağıda Round 2 Findings #6'ya bakın. Hiçbir dosya bu denetim sırasında değiştirilmedi — sadece bu rapor güncellendi.
>
> **Güncel Risk Assessment: Critical** (yeni #6 bulgusu yüzünden — round 1'in tek Critical'i olan Turnstile bypass ise tamamen düzeltildi, aşağıya bakın).

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

**Durum (Round 2): FIXED.** `src/lib/actions/scan-demo.ts:38-39` artık tam olarak önerilen şekilde `const allowBypass = process.env.NODE_ENV !== "production"` ile prod'da bypass'ı tamamen kapatıyor. `src/components/modules/landing/scan-demo.tsx`'teki `finalToken = turnstileToken || "bypass"` fallback'i de kaldırılmış, token yoksa istek hiç gönderilmiyor. Bellek-tabanlı rate limiter'lar (Bulgu #2'nin konusu) hâlâ duruyor, ama asıl "hiç doğrulama yapılmıyor" açığı kapandı.

---

### 2. `/api/ai-chat` ve `scan-demo`/`landing-chat` Rate Limitleri Serverless Ortamda Etkisiz (High)

**Location:** `src/lib/utils/rate-limit.ts`, `src/app/api/ai-chat/route.ts`, `src/app/api/landing-chat/route.ts`, `src/lib/actions/scan-demo.ts`

**The Exploit:** `createRateLimiter` ve `scan-demo.ts`'teki `ipScanCounts`/`globalScanCount` tamamen process-içi `Map`/`let` değişkenleridir. Vercel'de her fonksiyon çağrısı farklı bir lambda instance'ına düşebilir (özellikle trafik arttıkça otomatik ölçeklenir) ve her cold start sayaçları sıfırlar. Kod içindeki yorum bunu zaten kabul ediyor ("resets on cold start / doesn't share state across serverless instances"). `/api/ai-chat` gerçek para maliyeti olan, KİMLİK DOĞRULAMALI bir endpoint olduğu için (`isRateLimited(user.id)`, 20 istek/10dk) — bir saldırgan/kötü niyetli abone, farklı bölge/instance'lara denk gelecek şekilde paralel istek göndererek veya fonksiyonun soğumasını bekleyerek bu limiti pratikte aşabilir.

**The Fix:** Tüm rate limiter'ları paylaşımlı, kalıcı bir backend'e taşı: Vercel KV, Upstash Redis (`@upstash/ratelimit` — Vercel Edge/Serverless için tasarlanmış, sabit pencere/sliding window destekli) veya Supabase'te atomik bir `increment_and_check` RPC'si. `consumeAiChatCredit` zaten atomik bir Postgres RPC (`try_consume_ai_chat_credit`) kullanıyor — bu asıl kota kontrolüdür ve doğru çalışıyor; ama ek "istek/dakika" rate limiti olan `isRateLimited(user.id)` katmanı hâlâ belleğe güveniyor, bu da API-cost-per-request odaklı (spam/DoS) bir korumadan çok "iyi niyetli kullanıcı" için bir güvenlik ağı durumunda.

**Durum (Round 2): STILL OPEN.** `src/lib/utils/rate-limit.ts` hâlâ birebir aynı — `Map`-tabanlı, tek instance içi, kalıcı değil. `package.json`'da Upstash/Vercel KV bağımlılığı yok. Bu, kod değişikliğinden çok bir altyapı kararı (Redis/KV hesabı açılması) gerektiriyor — kullanıcının onayı/hesap kurulumu beklemede. Yeni eklenen `supabase/functions/get-investment-prices/index.ts`'teki rate limiter da (Bulgu #5, aşağıda) AYNI process-içi deseni kullanıyor — bu limitasyon artık 3 ayrı yerde tekrarlanıyor.

---

### 3. CSP `script-src` içinde `'unsafe-inline'` — XSS Savunmasını Büyük Ölçüde Zayıflatıyor (Medium)

**Location:** `next.config.ts:20`

**The Exploit:** 
```ts
`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`
```
`'unsafe-inline'`, prod dahil her zaman açık. Bu, CSP'nin en önemli sağladığı korumayı (inline `<script>` / `onerror=` gibi olay-tabanlı payload'ların çalışmasını engellemek) etkisiz kılar — ileride bir yerde (ör. üçüncü parti bir kütüphane, kullanıcı girdisinin render edildiği bir nokta) bir XSS açığı oluşursa, bu CSP onu **engellemez**. Şu an kod tabanında `dangerouslySetInnerHTML` kullanımı yok ve `react-markdown` (AI özet modalında) `rehype-raw` eklentisi olmadan varsayılan olarak ham HTML render etmiyor — yani bugün aktif bir XSS bulunamadı, ama CSP "ikinci savunma katmanı" görevini şu haliyle göremiyor.

**The Fix:** Next.js'in nonce-tabanlı CSP desteğine geçin (App Router `next.config` + `proxy.ts`'te nonce üretip `<Script nonce={nonce}>` / `next/script` ile enjekte etme) ve `'unsafe-inline'`'ı kaldırın. Nonce yaklaşımı mümkün değilse en azından `'strict-dynamic'` + hash-tabanlı bir geçiş planı değerlendirin.

**Durum (Round 2): STILL OPEN.** `next.config.ts:20` hâlâ `'unsafe-inline'` içeriyor, değişmemiş. Aktif bir XSS hâlâ bulunamadı (yeni `react-markdown` kullanımları — AI özet modalı — hâlâ `rehype-raw` eklentisiz, ham HTML render etmiyor). Düşük öncelik, mimari bir refactor gerektiriyor.

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

**Durum (Round 2): FIXED (orijinal 3 örnek), + 3 YENİ örnek aynı sınıftan bulundu.** `getExpenseById` artık `userId` parametresi alıp `.eq("user_id", userId)` filtreliyor (`src/lib/data/expenses.ts:77-87`). `getGroup` artık `group_members` üyeliğini kontrol ediyor (`src/lib/data/groups.ts:59-`). `uploadBusinessLogo`/`removeBusinessLogo` ikisi de `.eq("user_id", userId)` filtreli (`src/lib/esnaf/business-logo.ts:31-36,46-50`). Üçü de öneriyle birebir örtüşüyor.
Yeni Kartlarım özelliğinde (25 commit'lik delta, aşağıda Bulgu #7) AYNI desen tekrarlanmış: `getCardById` (`src/lib/data/cards.ts:29-31`) sadece `.eq("id", id)`, `getCardExpenses`/`getCardCategoryTotals` (aynı dosya) sadece `.eq("card_id", cardId)` — `user_id` filtresi yok. **Ama bu 3 fonksiyon bugün exploit edilemiyor**: `cards` tablosunun RLS'i (`085_cards.sql`) tam (`auth.uid() = user_id`, 4 policy), ve `getCardExpenses`/`getCardCategoryTotals` `expenses` tablosunu sorguluyor — `expenses`'in KENDİ RLS'i (`user_id = auth.uid()`) zaten çağıran kullanıcının SADECE kendi harcamalarını döndürüyor, başka kullanıcının `card_id`'siyle eşleşen satır olamaz (her kullanıcının harcamaları kendi kartlarına referans verir). Yine de aynı tutarsız desen — RLS'e tam güvenmek yerine `requireUserId` + app-layer filtre eklenmesi önerilir.

---

### 5. `get-investment-prices` Edge Function Kimlik Doğrulaması ve Rate Limit Olmadan Herkese Açık (Low)

**Location:** `supabase/functions/get-investment-prices/index.ts`

**The Exploit:** Bu fonksiyon JWT kontrolü yapmıyor (`scan-receipt`'in aksine) ve herhangi bir rate limiting içermiyor. Kullanıcıya özel veri döndürmüyor (sadece piyasa fiyatları), dolayısıyla veri ifşası riski yok — ama sınırsız çağrılabilir olması: (a) CoinGecko/TCMB/Truncgil'e karşı bir "amplifikasyon proxy'si" olarak kötüye kullanılabilir, (b) CoinGecko'nun ücretsiz kota sınırını (rate limit) hızla tüketip **gerçek kullanıcılar için** kripto fiyatlarının kesintiye uğramasına yol açabilir (kendi kendine servis-dışı-bırakma riski).

**The Fix:** JWT doğrulaması ekle (`scan-receipt`'teki desenle aynı) veya en azından IP başına basit bir rate limit + sonuçları kısa süreliğine (ör. 60 sn) cache'leyip tekrarlayan çağrılarda upstream'e gitmeden önbellekten dönme (zaten fiyatlar dakikalık güncellenen veriler, agresif cache mantıklı).

**Durum (Round 2): FIXED (rate-limit yoluyla).** `supabase/functions/get-investment-prices/index.ts:33-49` artık IP başına dakikada 20 istekle sınırlı (`isRateLimited`, aynı `scan-demo.ts` deseni). JWT zorunluluğu eklenmedi (önerinin "veya" kısmı seçilmiş) — kabul edilebilir, veri zaten kullanıcıya özel değil. Cache eklenmedi ama rate limit amplifikasyon riskini yeterince azaltıyor.

---

## Round 2 Findings (25 commit'lik delta, `790196b..HEAD`)

### 6. `users.trial_started_at` Koruma Tetikleyicisinin Kapsamı Dışında — Sınırsız Ücretsiz Premium (Critical)

**Location:** `src/lib/actions/trial.ts:18-21` (server action, kendisi doğru yazılmış) + korumanın eksik olduğu yer: paylaşılan Supabase veritabanındaki `protect_user_plan_columns()` trigger fonksiyonu (`fisle_app/supabase/migrations/048_fix_admin_and_group_join.sql:6-25`, en son bu migration'da tanımlanmış — mobil kaynak, salt-okunur referans, ama trigger PRODUCTION veritabanında canlı ve hem web hem mobili aynı anda etkiliyor).

**The Exploit:** Web'in "7 günlük ücretsiz deneme" özelliği (`startTrialAction`) sunucu tarafında doğru yazılmış — sadece kendi `auth.uid()`'ini günceller, başka bir kullanıcıyı etkileyemez. Sorun bu server action'da DEĞİL: `users` tablosundaki `"users_own"` RLS politikası (`003_rls_policies.sql:17`, `FOR ALL USING (auth.uid() = id)`) her kimlik doğrulamalı kullanıcının KENDİ satırını herhangi bir sütun için doğrudan `UPDATE` etmesine izin veriyor — bunu engelleyen tek şey `protect_user_plan_columns()` trigger'ı, ve bu trigger'ın koruduğu sütun listesi SADECE şunlar: `plan`, `plan_type`, `is_admin`, `esnaf_plan`, `subscription_end_date`. **`trial_started_at` bu listede YOK.**

Yani herhangi bir giriş yapmış kullanıcı, tarayıcı konsolundan (Supabase JS client zaten sayfada yüklü, anon key + kendi JWT'siyle) tek satırlık bir çağrıyla:
```js
await supabase.from('users').update({ trial_started_at: new Date().toISOString() }).eq('id', (await supabase.auth.getUser()).data.user.id)
```
`trial_started_at`'ı istediği zaman "şimdi"ye sıfırlayabilir. `isPersonalPremiumOrTrial()` (yeni eklenen entitlement helper'ı, `entitlements.ts`) bunu "aktif deneme, 7 gün kaldı" olarak okuyup **sınırsız fiş tarama, sınırsız AI sohbet, rapor erişimi, grup limitleri** dahil TÜM premium özellikleri açıyor — kullanıcı bu update'i 6 günde bir tekrarlayarak süresiz, hiç ödeme yapmadan premium kalabilir. Aynı RLS/trigger paylaşıldığı için bu **mobil uygulamayı da aynı şekilde etkiliyor** — web'e özel değil, ama bu denetimin kapsamı web olduğu için burada raporlanıyor.

Ek olarak aynı korumasız sütun sınıfından: `esnaf_staff_limit`, `esnaf_backup_enabled`, `trial_offer_dismissed`, `has_claimed_early_gift`, `is_early_tester` de trigger'ın dışında — bunların çoğu düşük değerli (`trial_offer_dismissed` zararsız) ama `esnaf_staff_limit` da aynı şekilde client tarafından rastgele büyük bir sayıya set edilebilir (Esnaf Modu şu an herkese kapalı olduğu için şu an pratik etkisi yok, ama kilit açılınca aynı sınıf açık olarak geri gelir).

**The Fix:** `protect_user_plan_columns()` fonksiyonunu, korunan sütun listesine `trial_started_at` (ve mantıken `esnaf_staff_limit`, `has_claimed_early_gift`, `is_early_tester`) ekleyecek şekilde güncelleyen yeni bir migration:
```sql
CREATE OR REPLACE FUNCTION public.protect_user_plan_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.plan_type IS DISTINCT FROM OLD.plan_type
     OR NEW.is_admin IS DISTINCT FROM OLD.is_admin
     OR NEW.esnaf_plan IS DISTINCT FROM OLD.esnaf_plan
     OR NEW.subscription_end_date IS DISTINCT FROM OLD.subscription_end_date
     OR NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at
     OR NEW.esnaf_staff_limit IS DISTINCT FROM OLD.esnaf_staff_limit
     OR NEW.has_claimed_early_gift IS DISTINCT FROM OLD.has_claimed_early_gift
     OR NEW.is_early_tester IS DISTINCT FROM OLD.is_early_tester
  THEN
    RAISE EXCEPTION 'Bu alanlar değiştirilemez' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
```
Sonra `startTrialAction()`'ın kendisini de bu triggerdan MUAF tutan bir SECURITY DEFINER RPC'ye taşımak gerekir (aynen `claim_early_gift`'in `084_fix_early_gift.sql`'de yaptığı gibi — `set_config('request.jwt.claims', '', true)` ile trigger'ı geçici olarak bypass edip geri yüklemek), yoksa YENİ trigger web'in KENDİ server action'ını da bloke eder. Bu SQL değişikliği yapılana kadar **hiçbir kod değişikliği web tarafında bu açığı kapatamaz** — RLS/trigger veritabanı seviyesinde bir düzeltme gerektiriyor, kullanıcının Supabase SQL Editor'da çalıştırması gerekecek.

**Durum: DÜZELTME YAZILDI, SQL ÇALIŞTIRILMAYI BEKLİYOR.** `docs/sql/056_protect_trial_and_related_columns.sql` — yukarıda önerilen tam çözüm (trigger'a `trial_started_at`/`esnaf_staff_limit`/`has_claimed_early_gift`/`is_early_tester` eklendi + `start_trial(p_user_id)` RPC'si `claim_early_gift`'teki JWT-claims-bypass deseniyle eklendi, `canStartTrial`'ın uygunluk mantığını veritabanı tarafında tekrar doğruluyor). `src/lib/actions/trial.ts`'teki `startTrialAction()` artık doğrudan `update` yerine bu RPC'yi çağırıyor, kod deploy edildi. **Açık, kullanıcının Supabase SQL Editor'da `056_...sql`'i çalıştırmasına kadar kapanmıyor** — SQL çalıştırılana dek RLS/trigger hâlâ eski (korumasız) halde, `start_trial` RPC'si de mevcut olmadığı için web'deki "Ücretsiz Denemeyi Başlat" butonu SQL çalıştırılana kadar hata verir (kullanıcı deneyimi bozulur ama güvenlik açığı da açık kalmaz — RPC yokken eski `update` yolu da kaldırıldığı için kimse deneme başlatamaz, ama tam tersi bir istismar da mümkün değildir).

---

### 7. Kartlarım — Uygulama Katmanında Sahiplik Filtresi Eksik (Low — RLS ile telafi ediliyor)

**Location:** `src/lib/data/cards.ts:29-31` (`getCardById`), `:100-118` (`getCardExpenses`), `:158-178` (`getCardCategoryTotals`)

Bulgu #4'ün aynısı, yeni Kartlarım özelliğinde tekrarlanmış — ayrıntı ve gerekçe için yukarıdaki Bulgu #4'ün "Durum (Round 2)" notuna bakın. `cards` tablosunun RLS'i (`085_cards.sql`) sağlam olduğu için bugün exploit edilemiyor, ama tutarlılık için `requireUserId` + `.eq("user_id", userId)` eklenmesi önerilir.

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
- **`proxy.ts` route guard mantığı** doğru: `PUBLIC_ROUTES`/`AUTH_ROUTES` dışındaki her şey `!user` durumunda `/login`'e yönlendiriyor — server-side, senkron ve `matcher` ile neredeyse tüm path'leri kapsıyor (sadece statik asset'ler hariç). ~~Esnaf Modu erişiminin `is_admin` bazlı kısıtı...~~ **(Round 2 güncellemesi: artık geçersiz — bkz. aşağıdaki yeni madde.)**
- **Gemini prompt injection yüzeyi**: `ai-chat/route.ts` sistem promptuna kullanıcının kendi harcama verisi (mağaza adları, kategori adları vb.) JSON olarak enjekte ediliyor. Mağaza adı gibi serbest metin alanları teorik olarak prompt injection için kullanılabilir (ör. bir "mağaza adı" alanına talimat benzeri metin yazıp AI'nin sistem talimatlarını geçersiz kılmaya çalışmak) — ancak bu yalnızca kullanıcının **kendi** verisiyle **kendi** sohbetini manipüle etmesi anlamına gelir (başka kullanıcıya ulaşan bir yetkilendirme/veri sızıntısı yolu değil), bu yüzden düşük öncelikli bir "gözlem" olarak not edildi, kritik değil.

**Round 2'de eklenen gözlemler:**
- **Esnaf Modu artık `is_admin` dahil HERKESE kapalı** (`16db0b8`) — `(app)/esnaf/(dashboard)/layout.tsx` ve `esnaf/page.tsx` koşulsuz `<EsnafLockedPage />` döndürüyor, hiçbir gate/kontrol mantığı çalışmıyor (unconditional server-side lock). Bu önceki turda not edilen `is_admin` bazlı gate'i tamamen geçersiz kıldı ve bu oturumun daha önce inşa ettiği `isBusinessSubscribed()` fail-open gate'ini de (madde yukarıda) fiilen erişilemez/ölü koda çevirdi — bir güvenlik riski değil (tam tersi, daha kısıtlayıcı), ama optimizasyon raporunda "ölü kod" olarak ayrıca işaretlendi.
- **`d310e8f` middleware matcher değişikliği ("`.txt` dosyalarına izin ver") doğrulandı, güvenlik riski YOK.** `src/proxy.ts`'in `matcher` regex'ine `.txt|.xml|.webmanifest` uzantıları eklendi (`app-ads.txt`'nin auth middleware'i tarafından `/login`'e yönlendirilmesini önlemek için). Next.js App Router'da dinamik/catch-all bir route (`[...slug]` vb.) veya `next.config.ts`'te bu uzantılarla eşleşecek bir `rewrites()` YOK (ikisi de doğrulandı, sıfır sonuç) — yani bu uzantılarla biten bir path, gerçek bir statik dosya (`public/app-ads.txt`) dışında hiçbir korumalı sayfaya/API'ye denk gelmiyor, 404 döner. Bypass edilebilecek gerçek bir route yok.
- **Grup sohbeti mesaj düzenleme/silme (`5a97d1f`) doğru sahiplik filtreli**: `editMessage`/`deleteMessage` (`src/lib/data/groups.ts:578,588`) ikisi de `.eq("id", id).eq("user_id", userId)` kullanıyor — IDOR yok.
- **`installments.ts` (yeni dosya, Kartlarım özelliği) tek sorgusu** (`installment_plans` tablosu) `.eq("user_id", userId)` ile doğru filtreli, yeni tablo yok, mevcut RLS'e dayanıyor.

---

## Taranan Dosyalar (Kapsam Kanıtı)

`src/app/api/ai-chat/route.ts`, `src/app/api/landing-chat/route.ts`, `src/proxy.ts`, `src/lib/supabase/{client,server,middleware}.ts`, `next.config.ts`, `.env.local`, `.env.vercel`, `.env.vercel.prod`, `.env.example`, `.gitignore`, `src/lib/actions/{seed,scan-demo,esnaf-settings,ai-rapor,trial}.ts`, `src/lib/utils/{rate-limit,entitlements,admin,auth,file-validation}.ts`, `src/lib/scan/{credits,saveExpense}.ts`, `src/lib/features/unlocks.ts`, `src/lib/ai-chat/credits.ts`, `src/lib/esnaf/{active-business,whatsapp,business-logo}.ts`, `src/lib/data/{expenses,income,notes,groups,esnaf-team,cards,installments,banks,forecast}.ts`, `src/components/modules/landing/scan-demo.tsx`, `src/components/modules/esnaf/ai-summary-modal.tsx`, `src/lib/income/export.ts`, `supabase/functions/scan-receipt/index.ts`, `supabase/functions/get-investment-prices/index.ts`, ve destek/doğrulama için `fisle_app/supabase/migrations/{003_rls_policies,004_fix_rls_recursion,026_esnaf_modu,057_businesses_staff_select,039_security_hardening,048_fix_admin_and_group_join,061_trial_start,063_ai_chat_quota,085_cards,20260831085414_084_fix_early_gift,100_item_category_learning}.sql` (paylaşılan backend RLS doğrulaması amacıyla, salt-okunur referans olarak).

**Round 2 ek kapsam:** `git log --oneline 790196b..HEAD` (25 commit) + `git show` ile `9a34d9c` (Kartlarım/Taksitler), `5a97d1f` (grup sohbeti düzenleme), `16db0b8` (Esnaf Modu kilidi), `7289063` (7 günlük deneme), `d310e8f` (middleware `.txt` istisnası) commit'leri tek tek incelendi.
