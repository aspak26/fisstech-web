# Fişştech Web — Optimizasyon Denetimi

**Kapsam:** `Fisstech_web` (Next.js 16 / App Router / React 19 / Supabase). Bu SADECE bir denetim raporudur — hiçbir kod değiştirilmedi. Aşağıdaki bulgular kod okunarak (Server Component/Server Action veri çekme, `select()` kalıpları, `use client` dağılımı, bundle/code-splitting, resim yükleme, middleware, API route'ları) doğrulandı. 30+ dosya taranmıştır (route'lar, `lib/data/*`, `lib/esnaf/*`, `lib/scan/*`, shell/landing component'leri, `next.config.ts`, `proxy.ts`, `middleware.ts`, `package.json`).

**Referans dosyalar:** `AGENTS.md`, `docs/AGENTS.md`, `docs/PROGRESS.md`, `next.config.ts`, `src/proxy.ts`, `src/lib/supabase/{server,middleware,client}.ts`.

---

## 1) Optimization Summary

**Genel sağlık durumu:** Kod tabanı genel olarak **iyi disiplinli** — çoğu server component `Promise.all`/`Promise.allSettled` kullanıyor, `jspdf`/`xlsx` zaten lazy-load ediliyor, landing page'in bir kısmı zaten `next/dynamic` ile bölünmüş, ve `lib/data/analytics.ts` içinde geçmişte tam olarak bu denetimde bulunacak türden bir "aynı veri iki kez çekiliyor" hatası zaten bulunup düzeltilmiş (bkz. `fetchBreakdownData` yorum satırı). Ancak bu disiplin **tutarlı uygulanmamış**: aynı anti-pattern (aynı sorgunun birden fazla kez tekrarlanması) en az 4 farklı yerde, en ağır haliyle de **Esnaf Modu'nun her sayfasında** yeniden ortaya çıkıyor.

**En yüksek etkili 3 bulgu:**
1. **Esnaf Modu'nda her sayfa yüklemesinde `auth.getUser()` 6-8 kez ve `get_my_businesses` RPC'si 2-3 kez tekrar çağrılıyor** (layout + page.tsx ikisi de `getActiveBusiness()`'ı bağımsız çağırıyor, o da içeride tekrar `getUserBusinesses()`'ı çağırıyor). 36 dosya bu kalıbı tekrarlıyor. — **Kritik, Bulgu #1**
2. **Kişisel sayfalarda dahi `auth.getUser()` en az 2-3 kez tekrarlanıyor** (`proxy.ts` middleware + `layout.tsx` + her `page.tsx`), ve middleware bunu herkese açık pazarlama sayfalarında (`/`, `/gizlilik` vb.) bile, oturum durumundan bağımsız olarak, HER istekte çalıştırıyor. — **Yüksek, Bulgu #2**
3. **Grup Analizi'nde 3 farklı grafik (kategori/üst-kategori/market dağılımı) aynı `getGroupExpenseDetails` sorgusunu birbirinden habersiz 3 kez çalıştırıyor** — aynı hata kişisel Analiz'de zaten bulunup `fetchBreakdownData` ile tek sorguya indirilmişti, grup tarafına taşınmamış. — **Orta-Yüksek, Bulgu #3**

**Düzeltilmezse en büyük risk:** Esnaf Modu şu an sadece `is_admin` kullanıcılarına açık (mobil taraftaki gate ile aynı, Play Store lansmanı öncesi kasıtlı bir kısıtlama — bkz. proje hafızası) ama **kilit kalkıp gerçek kullanıcı trafiğine açıldığında**, sayfa başına 6-8 auth round-trip + 2-3 duplike RPC çağrısı hem gözle görülür yavaşlık (muhtemelen saniyeler mertebesinde TTFB) hem de Supabase Auth/Postgres üzerinde gereksiz yük/maliyet olarak katlanarak büyüyecek.

---

## 2) Findings (Prioritized)

### Bulgu #1 — Esnaf Modu: layout + her page.tsx aynı iş yerini/kullanıcıyı bağımsız olarak yeniden çözüyor

- **Category:** Network / DB / Concurrency (N+1 fetch)
- **Severity:** Critical
- **Impact:** Latency (esnaf sayfa başına ~6-8 auth round-trip + 2-3 duplike RPC), DB/Auth yükü, ölçeklenebilirlik
- **Evidence:**
  - `src/app/(app)/esnaf/(dashboard)/layout.tsx:64-78` — sırasıyla: `createClient()+auth.getUser()` (1), `isAdminUser()`, `getActiveBusiness()` (kendi içinde 2. `auth.getUser()` + `getUserBusinesses()` → 3. `auth.getUser()` + `rpc('get_my_businesses')` #1), sonra AYRICA `getUserBusinesses()` tekrar çağrılıyor (4. `auth.getUser()` + `rpc('get_my_businesses')` #2 — **birebir aynı RPC'nin ikinci kez, sırayla, sonuçları hiç paylaşılmadan çalıştırılması**), sonra `isBusinessSubscribed()` (ayrı bir RPC, hâlâ sıralı).
  - `src/lib/esnaf/active-business.ts:14-27` (`getActiveBusiness`) ve `:29-52` (`getUserBusinesses`) — her ikisi de kendi `createClient()` + `auth.getUser()` çağrısını yapıyor, birbirini çağırdıklarında da bu tekrarlanıyor.
  - **36 dosya** (`grep -rl "getActiveBusiness()" "src/app/(app)/esnaf/(dashboard)"` → 36 sonuç: layout.tsx + 35 page.tsx) her page.tsx'in KENDİSİ de `getActiveBusiness()`'ı layout'tan bağımsız olarak TEKRAR çağırıyor. Örnek: `src/app/(app)/esnaf/(dashboard)/stok/page.tsx:7`, `.../faturalar/page.tsx:7`, `.../ekip/page.tsx:8` (ki ekip/page.tsx ayrıca kendi `auth.getUser()`'ını da `:12-15`'te tekrar çağırıyor).
  - Somut toplam (örn. `/esnaf/ekip` sayfası): `proxy.ts` (1) + layout direkt (1) + layout'un `getActiveBusiness` (1) + o'nun içindeki `getUserBusinesses` (1) + layout'un ayrı `getUserBusinesses` çağrısı (1) + page'in `getActiveBusiness` (1) + o'nun içindeki `getUserBusinesses` (1) + page'in kendi `auth.getUser()` (1) = **8 `auth.getUser()` ağ çağrısı** ve **3 kez aynı `get_my_businesses` RPC'si**, hepsi sıralı (paralel değil).
- **Why it's inefficient:** `@supabase/ssr`'ın `auth.getUser()`'ı her çağrıda Supabase Auth sunucusuna gidip JWT'yi yeniden doğrular (yerel/ücretsiz bir `getSession()` değil) — yani her çağrı gerçek bir ağ round-trip'i. Bunun 8 katına çıkması + aynı RPC'nin 3 kez sırayla tekrarlanması, sayfa TTFB'sine yüzlerce ms – birkaç saniye ekleyebilir (özellikle Supabase projesi farklı bir bölgedeyse) ve Supabase'in auth/RPC rate limit'lerine karşı gereksiz yük bindirir.
- **Recommended fix:**
  1. `getActiveBusiness`, `getUserBusinesses`, `isAdminUser`'ı React'in `cache()` fonksiyonuyla sarmalayın (`import { cache } from "react"`) — aynı request içinde birden fazla çağrılsalar bile gerçek işi sadece bir kez yapar, imza değişmez, tüm çağıranlar dokunulmadan kalır.
  2. Ayrıca `layout.tsx`'teki `getActiveBusiness()` + ayrı `getUserBusinesses()` çağrısını kaldırıp, `getActiveBusiness()`'ın zaten döndürdüğü `businesses` listesini de döndürecek şekilde imzasını genişletin (tek çağrıda hem aktif işletme hem liste) — `cache()` bunu otomatik yapmasa da fonksiyonu birleştirmek RPC'yi tek çağrıya indirir.
  3. `layout.tsx` içindeki `isAdminUser`, `getActiveBusiness`/`getUserBusinesses` çağrılarını (aralarında veri bağımlılığı yoksa) `Promise.all` ile paralelleştirin; `isBusinessSubscribed` da business id geldikten sonra diğerleriyle paralel çalışabilir çoğu durumda.
- **Tradeoffs/Risks:** `cache()` sadece TEK bir React render/request ömrü boyunca geçerlidir (Server Action'lar arası paylaşılmaz) — mutasyon sonrası `router.refresh()` zaten yeni bir render başlattığı için stale veri riski yok. Düşük risk.
- **Expected impact estimate:** Esnaf sayfa TTFB'sinde potansiyel **%50-80 azalma** (8 sıralı round-trip → 1-2'ye iner); Supabase Auth/RPC çağrı hacminde esnaf trafiğinde **~6-7x azalma**.
- **Removal Safety:** Likely Safe (davranış değişmiyor, sadece tekrar eden ağ çağrıları birleşiyor) — `cache()` eklemek mekanik ve düşük riskli; fonksiyon imzası birleştirmesi orta düzeyde test gerektirir.
- **Reuse Scope:** Service-wide (`lib/esnaf/active-business.ts`, `lib/utils/admin.ts` + 36 çağıran dosya).

---

### Bulgu #2 — `auth.getUser()` her sayfada 2-3+ kez tekrarlanıyor; middleware bunu herkese açık sayfalarda bile her istekte çalıştırıyor

- **Category:** Network / Concurrency
- **Severity:** High
- **Impact:** Latency (her navigasyonda), gereksiz Supabase Auth trafiği (public/SEO sayfaları dahil)
- **Evidence:**
  - `src/lib/supabase/middleware.ts:35-37` — `auth.getUser()` HER istekte (proxy.ts matcher'ı `_next/static`, `_next/image`, favicon ve resim uzantıları dışında her şeyi kapsıyor — `src/proxy.ts:11-13`) çağrılıyor, `isPublicRoute` kontrolünden (`:41`) ÖNCE. `PUBLIC_ROUTES` (`/`, `/gizlilik`, `/kullanim-sartlari`, `/kvkk`, `/yardim`, `/veri-guvenligi`, `/indir`) için `user` değişkeni hiç kullanılmıyor (`:43-53`'teki redirect mantığı sadece auth-route/private-route içindir) — yani anonim bir ziyaretçi landing page'i her açtığında, middleware'in hiçbir işine yaramayan bir Supabase Auth round-trip'i tetikleniyor.
  - `src/app/(app)/layout.tsx:26-29` kendi `auth.getUser()`'ını yapıyor, ardından HER `(app)/*` sayfası (`dashboard/page.tsx:32-35`, `expenses/page.tsx:19-22`, `analytics/page.tsx:29-32`, `groups/[id]/page.tsx:33-37`, vb. — grep 91 çağrı sitesi buluyor, ~20'si sayfa/layout seviyesinde) kendi `auth.getUser()`'ını tekrar yapıyor.
  - `src/app/page.tsx:41-45` (herkese açık landing page) de kendi `auth.getUser()`'ını yapıyor — bu meşru (CTA'yı oturum durumuna göre uyarlamak için) ama middleware'inki ile birlikte anonim bir ziyaretçi için bile 2 ayrı Auth round-trip'i demek.
- **Why it's inefficient:** Her `auth.getUser()` gerçek bir ağ isteği. Next.js'in "Request Memoization"ı (aynı render'da tekrarlanan `fetch`'leri otomatik birleştirmesi) Supabase SDK'sının bu çağrılarını güvenilir şekilde kapsadığı garanti değil (Edge middleware zaten ayrı bir execution context, kesinlikle birleşmiyor) — bu yüzden kod açıkça `cache()` kullanmadıkça en az 2-3 round-trip garantidir.
- **Recommended fix:**
  1. `middleware.ts`'de `isPublicRoute`/`isAuthRoute` kontrolünü path'e bakarak `auth.getUser()` çağrısından ÖNCE yapın; sadece gerçekten redirect kararı için kullanıcıya ihtiyaç duyulan durumlarda (private route veya auth route) `getUser()`'ı çağırın. Not: cookie'yi tazelemek için `getUser()`'ın her yanıtta çalışması isteniyorsa (yorumda belirtildiği gibi), bu bilinçli bir tradeoff olarak kalabilir ama en azından public-marketing sayfalarında atlanabilir.
  2. `src/lib/supabase/server.ts`'teki `createClient()`'ı çağıran her yerde kullanıcıyı tekrar çekmek yerine, React `cache()` ile sarılmış bir `getCurrentUser()` helper'ı (`src/lib/utils/auth.ts`'e eklenebilir) kullanın; layout ve page bu helper'ı çağırsın.
- **Tradeoffs/Risks:** Middleware'deki mevcut yorum ("cookie'yi transparent olarak tazeler, bu çağrı ile arasına mantık eklenmesin") kasıtlı bir tasarım — public route kısayolu eklerken cookie tazeleme davranışının bozulmadığından emin olun (örn. session token yenilemesi hâlâ gerekiyorsa public route'larda da çalışmalı, sadece redirect kararı için `user` değişkenine ihtiyaç yok).
- **Expected impact estimate:** Kişisel modül sayfalarında sayfa başına 1 auth round-trip tasarrufu (~%30-50 TTFB azalması, bölgeye göre değişir); landing page ziyaretlerinde middleware'in auth maliyeti ortadan kalkar (yüksek SEO/anonim trafik hacminde kayda değer Auth yük azalması).
- **Removal Safety:** Needs Verification (middleware'deki cookie-refresh davranışı dikkatlice korunmalı).
- **Reuse Scope:** Service-wide (tüm `(app)/*` sayfaları + middleware).

---

### Bulgu #3 — Grup Analizi: aynı sorgu 3 grafik için bağımsız olarak 3 kez çalıştırılıyor (kişisel Analiz'de zaten düzeltilmiş aynı hata)

- **Category:** Database / Algorithm (redundant fetch)
- **Severity:** Medium-High
- **Impact:** DB yükü, latency (paralel ama 3x veri transferi)
- **Evidence:**
  - `src/lib/data/groups.ts:233-248` (`getGroupExpenseDetails`) — `expense_groups`+`expenses`+`expense_items`+`categories` join'i yapan tek fonksiyon.
  - `:282-292` (`getGroupCategoryBreakdown`), `:294-304` (`getGroupParentCategoryBreakdown`), `:306-327` (`getGroupStoreBreakdown`) — ÜÇÜ DE bağımsız olarak `getGroupExpenseDetails(supabase, groupId, periodKey)`'i çağırıyor; sonuç hiç paylaşılmıyor.
  - Çağıran yer: `src/app/(app)/groups/[id]/page.tsx:39-47` — bu 3 fonksiyon `Promise.all` içinde (paralel, iyi) ama yine de aynı sorguyu 3 kez Postgres'e gönderiyor.
  - **Kontrast:** `src/lib/data/analytics.ts:167-171` (`fetchBreakdownData` yorumu) tam olarak bu anti-pattern'in kişisel Analiz tarafında bulunup düzeltildiğini belgeliyor: *"expenses + installment_plans + subscriptions'ı BİR kez çeker ... Önceden getCategoryBreakdown/getParentCategoryBreakdown ikisi de bağımsız olarak aynı fetch'i tekrarlıyordu."* Bu düzeltme grup analizine (`groups.ts`, aynı 21 Temmuz eklenen özellik) hiç taşınmamış.
- **Why it's inefficient:** Üç fonksiyon da aynı `expenses!inner(...)` sorgusunu (aynı filtreler, aynı join) çalıştırıyor; tek fark sonucun JS tarafında nasıl gruplandığı. Postgres'e 3x round-trip + 3x aynı satırların ağdan taşınması.
- **Recommended fix:** `analytics.ts`'teki `fetchBreakdownData` deseni birebir uygulanabilir: `getGroupExpenseDetails`'i bir kez çağırıp sonucu hem `groupBreakdown(data, "item")`, hem `groupBreakdown(data, "parent")`, hem de store-bazlı toplamaya besleyen tek bir `getGroupAnalytics(supabase, groupId, periodKey)` fonksiyonu yazın; `group-analytics-card.tsx`'in ihtiyaç duyduğu 3 şekli tek dönüşten üretin.
- **Tradeoffs/Risks:** Düşük risk — saf bir refactor, dış davranış (dönen veri şekli) değişmiyor.
- **Expected impact estimate:** Grup detay sayfası için DB round-trip sayısı 3'ten 1'e iner (~%60-70 azalma bu üç sorgunun toplam süresinde).
- **Removal Safety:** Safe.
- **Reuse Scope:** Local module (`lib/data/groups.ts` + `group-analytics-card.tsx` çağıranı).

---

### Bulgu #4 — `/expenses` sayfası aynı `categories` tablosunu iki kez sorguluyor

- **Category:** Database (redundant fetch)
- **Severity:** Low-Medium
- **Impact:** 1 gereksiz DB round-trip, her `/expenses` yüklemesinde
- **Evidence:**
  - `src/app/(app)/expenses/page.tsx:25-30` — `Promise.all([getExpenses(...), getCategoriesForScan(supabase), getCategoriesFull(supabase), getGroups(...)])`.
  - `src/lib/data/categories.ts:7-16` (`getCategoriesForScan`) — içeride `getCategoriesFull(supabase)`'ı ÇAĞIRIYOR (`:10`), sonra farklı bir şekle map'liyor.
  - Sonuç: `categories` tablosu (`select("*").order("name")`) aynı istekte paralel olarak 2 kez sorgulanıyor, ikisi de birebir aynı satırları döndürüyor.
- **Why it's inefficient:** Basit bir "bir kez çek, iki şekilde kullan" fırsatı kaçırılmış.
- **Recommended fix:** `expenses/page.tsx`'te sadece `getCategoriesFull(supabase)`'ı çağırın, `CategoryOption[]` şeklini (name/group/emoji) sayfa içinde `categoriesFull.map(...)` ile türetin (mantık zaten `getCategoriesForScan` içinde 3 satır, taşımak trivial).
- **Tradeoffs/Risks:** Yok — pure refactor.
- **Expected impact estimate:** `/expenses` sayfa yüklemesinde 1 DB round-trip tasarrufu.
- **Removal Safety:** Safe.
- **Reuse Scope:** Local file.

---

### Bulgu #5 — Esnaf "Toplu Fiş Tarama" (Evrak Arşivi) dosyaları sırayla (paralel değil) tarıyor

- **Category:** Concurrency / Cost (AI API)
- **Severity:** Medium
- **Impact:** Kullanıcı deneyimi (toplu tarama süresi dosya sayısıyla doğrusal artıyor), algılanan performans
- **Evidence:**
  - `src/components/modules/esnaf/global-batch-scan-dialog.tsx:63-82` (`handleFiles`) — `for (const draft of newDrafts) { await fileToBase64(...); await supabase.functions.invoke("scan-receipt", ...) }` — her dosya bir öncekinin AI cevabını bekleyip SIRAYLA taranıyor.
  - `:92-128` (`saveAll`) — kaydetme adımı da (`upload` + 2 insert) aynı şekilde `for...of` ile sıralı.
  - **Kontrast:** `src/components/modules/scan/scan-workspace.tsx:166-173` (`startMultiScan`, "Uzun Fiş" modu) doğru şekilde `Promise.all(pending.map(async (item) => {...}))` kullanıyor — yani proje içinde zaten doğru paralel kalıp mevcut, evrak arşivi tarafına taşınmamış. (Not: `scan-workspace.tsx`'teki `startBatchScan` — `:193-243` — kredi sayısını tek tek azalttığı için BİLEREK sıralı, bu meşru bir tradeoff; ama `global-batch-scan-dialog.tsx`'te kredi/limit mantığı YOK, sıralılığın hiçbir zorunlu nedeni yok.)
- **Why it's inefficient:** `scan-receipt` edge function'ı Gemini'ye gidiyor — tipik olarak 2-6 saniye sürebilir. 10 belgelik bir "toplu tarama" sırayla 20-60 saniye sürerken, 4-5'lik bir concurrency limitiyle paralelleştirilirse birkaç saniyeye inebilir.
- **Recommended fix:** `handleFiles`'ı `Promise.all` (veya rate-limit/hata izolasyonu için basit bir concurrency-limitli havuz, örn. 3-4 eşzamanlı) ile paralelleştirin — `scan-workspace.tsx`'teki `startMultiScan` deseni birebir örnek alınabilir. `saveAll`'daki DB yazımları da `Promise.all` ile paralelleştirilebilir (her draft bağımsız, sırayla olma zorunluluğu yok).
- **Tradeoffs/Risks:** Çok yüksek concurrency Supabase Edge Function eşzamanlılık limitlerine veya Gemini API rate limit'ine çarpabilir — makul bir üst sınır (örn. 3-4) ile sınırlandırılmalı, sınırsız `Promise.all` değil.
- **Expected impact estimate:** N belgelik toplu taramada toplam süre yaklaşık `N × tek-tarama-süresi`'nden `⌈N / concurrency⌉ × tek-tarama-süresi`'ne düşer (concurrency=4 için ~4x hızlanma).
- **Removal Safety:** Likely Safe (davranış aynı, sadece sıralama paralelleşiyor) — hata izolasyonunun (`try/catch` per-item) korunduğundan emin olun.
- **Reuse Scope:** Local file (`global-batch-scan-dialog.tsx`).

---

### Bulgu #6 — İşletme logosu: `next/image` `unoptimized` ile kullanılıyor + `next.config.ts`'de `images` yapılandırması hiç yok + upload öncesi resize/compress yok

- **Category:** Frontend / Asset loading
- **Severity:** Medium
- **Impact:** Bandwidth, LCP/sayfa ağırlığı (logo her sayfada Topbar/Sidebar'da görünür boyutta gösteriliyor)
- **Evidence:**
  - `next.config.ts` — dosyanın tamamında (`:1-48`) `images:` alanı yok (sadece güvenlik header'ları var).
  - `src/components/modules/esnaf/business-logo-form.tsx:71` — `<Image src={preview} ... unoptimized />`.
  - `src/components/modules/esnaf/business-switcher.tsx:19` — `<Image src={business.logo_url} ... sizes="32px" ... unoptimized />` — bu component **her `/esnaf/*` sayfasının üstünde** render ediliyor (`esnaf/(dashboard)/layout.tsx:99`).
  - `src/lib/esnaf/business-logo.ts:11-36` (`uploadBusinessLogo`) — dosya tipini magic-byte ile doğruluyor (güvenlik açısından iyi) ama **hiçbir resize/compress adımı yok**, kullanıcının orijinal (potansiyelde birkaç MB'lık telefon fotoğrafı) dosyası doğrudan Storage'a yükleniyor.
- **Why it's inefficient:** `unoptimized` next/image'ın otomatik yeniden boyutlandırma/format dönüşümü (WebP/AVIF) ve response-boyutu küçültme özelliğini tamamen devre dışı bırakıyor — `sizes="32px"` verilmiş olsa da tarayıcı orijinal (ör. 3000×3000px, birkaç MB) dosyayı indirip 32px'e sıkıştırıyor. Bu, **her esnaf sayfası** yüklemesinde tekrarlanan gereksiz bir indirme.
- **Recommended fix:**
  1. `next.config.ts`'e Supabase Storage public URL domain'i için `images.remotePatterns` ekleyin (`{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }`), `unoptimized` prop'unu kaldırın — Next.js image optimizer devreye girsin.
  2. `uploadBusinessLogo`'da client tarafında upload öncesi bir resize/compress adımı ekleyin (ör. `<canvas>` ile max 512×512'ye indirip JPEG/WebP kalite ~80 ile sıkıştırma) — hem storage hem bandwidth tasarrufu.
- **Tradeoffs/Risks:** Next.js image optimizer harici domain'lere `remotePatterns` izni gerektirir (güvenlik açısından nötr, sadece belirtilen path'e izin veriliyor); Vercel'de image optimization kullanım/maliyet sınırlarına tabi olabilir (proje zaten Vercel'de deploy ediliyor — `.vercel/` dizini mevcut), bu maliyeti göz önünde bulundurun.
- **Expected impact estimate:** Logo başına indirilen veri boyutunda (orijinal foto → 32-56px thumbnail) potansiyel **%90+ azalma**.
- **Removal Safety:** Needs Verification (Vercel image optimization kotası/maliyeti kontrol edilmeli; `remotePatterns` doğru path'e kısıtlanmalı).
- **Reuse Scope:** Local module + config (`next.config.ts`, 2 component, 1 upload fonksiyonu).

---

### Bulgu #7 — Landing page: `PricingSection`/`WorkflowSection` framer-motion kullanıyor ama `next/dynamic` ile bölünmemiş (sibling section'ların aksine)

- **Category:** Frontend / Bundle size
- **Severity:** Medium
- **Impact:** İlk sayfa JS bundle boyutu (landing page, en yüksek trafikli sayfa)
- **Evidence:**
  - `src/app/page.tsx:10-11` — `FeaturesSection`, `WorkflowSection`, `:12` `PricingSection` STATİK import ediliyor.
  - `:22-36` — `StepSlider`, `AiScannerShowcase`, `SectorSolutions`, `FaqSection`, `FeedbackSection` `next/dynamic` ile bölünmüş, sayfadaki yorum (`:18-21`) açıkça "framer-motion-yoğun, katlanma altındaki bölümler" için bu deseni tarif ediyor.
  - `grep "framer-motion"` sonucu `workflow-section.tsx` ve `pricing-section.tsx` da framer-motion kullanıyor (dosya listesinde mevcut) — yani deseni uygulaması gereken ama unutulmuş iki dosya.
- **Why it's inefficient:** Bu iki section da katlanma altında (hero'dan çok sonra render ediliyor) ama framer-motion'ın kod boyutu (gzip'siz ~5.5MB paket, gzip'li tipik olarak yine de onlarca KB) diğer bölünmüş section'larla birlikte DEĞİL, ana/ilk JS bundle'ında taşınıyor — tam olarak önlenmeye çalışılan şeyin bir kısmı kaçmış.
- **Recommended fix:** `WorkflowSection` ve `PricingSection`'ı da diğer 5 section ile aynı `dynamic(() => import(...).then((m) => m.X))` kalıbına taşıyın.
- **Tradeoffs/Risks:** Düşük risk — proje içinde zaten kanıtlanmış bir desen, sadece 2 satır ekleniyor.
- **Expected impact estimate:** Landing page ilk JS indirmesinde küçük-orta azalma (kesin % framer-motion'ın gerçek gzip boyutuna ve diğer bölünmüş chunk'larla paylaşılan koda bağlı — ölçülmeli).
- **Removal Safety:** Safe.
- **Reuse Scope:** Local file (`app/page.tsx`).

---

### Bulgu #8 — `/analytics` sayfasında 4 sekmenin tüm client component'leri (4 farklı recharts grafiği dahil) tek bundle'da — sekme bazlı code-splitting yok

- **Category:** Frontend / Bundle size
- **Severity:** Medium
- **Impact:** `/analytics` sayfası ilk yüklemesinde gereksiz JS (görünmeyen 3 sekmenin grafik kodu dahil)
- **Evidence:**
  - `src/app/(app)/analytics/page.tsx:37-67` — `tab` server-side bir `searchParams` değeri, hangi tab component'inin render edileceğine dair dallanma bir ASYNC SERVER COMPONENT içinde yapılıyor (`IncomeExpenseAnalyticsTab`, `SubscriptionsAnalyticsTab`, `GroupAnalyticsTab`, `ExpensesAnalyticsTab` — hepsi statik import, `:13-16`).
  - Bu 4 component'in her biri kendi client chart component'ini import ediyor (`recharts` kullanan 10 dosyadan çoğu `analytics/` altında — bkz. `net-balance-trend-chart.tsx`, `income-expense-bar-chart.tsx`, `trend-line-chart.tsx`, `member-spend-chart.tsx`, `donut-breakdown.tsx`, `store-breakdown-chart.tsx`).
  - Next.js, bir Server Component'in runtime'da hangi dalı render edeceğini build-time'da bilemez — yani 4 sekmenin de client JS'i (recharts dahil) `/analytics` route'unun client bundle'ına dahil olur, kullanıcı sadece 1 sekmeyi görse bile.
- **Why it's inefficient:** `recharts` (~8.9MB unpacked, gzip'li de kayda değer) tek bir sekme aktifken bile diğer 3 sekmenin grafik kodunu da indirtiyor olabilir.
- **Recommended fix:** Her tab component'ini (`ExpensesAnalyticsTab`, `IncomeExpenseAnalyticsTab`, `SubscriptionsAnalyticsTab`, `GroupAnalyticsTab`) `next/dynamic` ile client tarafında lazy-import edin (veya bu 4 component'i ayrı route segment'lerine — `/analytics/expenses`, `/analytics/income` vb. — taşıyıp Next'in kendi route-level code splitting'ine bırakın, ki `AnalyticsTabsNav` zaten `?tab=` query param'ı kullanıyor, bir route-segment geçişi UX'i bozmadan yapılabilir).
- **Tradeoffs/Risks:** `next/dynamic` client tarafı lazy-load ise, server-side veri çekme mantığının (şu an page.tsx'te tab'a göre şartlı) nasıl bölüneceği yeniden düşünülmeli — muhtemelen her tab kendi server component'i + kendi dynamic-import edilen client chart'ı olacak şekilde ayrıştırılmalı. Orta karmaşıklıkta bir refactor.
- **Expected impact estimate:** "Likely" — kesin kazanç için build sonrası `next build` bundle analizi (`@next/bundle-analyzer` veya `next build` çıktısındaki route boyutları) ile doğrulanmalı; recharts'ın chunk'lar arası zaten paylaşılıyor olma ihtimali var (webpack ortak chunk çıkarımı).
- **Removal Safety:** Needs Verification (ölçülmeden kesin kazanç iddia edilemez, bu yüzden "likely").
- **Reuse Scope:** Module-wide (`analytics/page.tsx` + 4 tab component).

---

### Bulgu #9 — `Sidebar` gereksiz yere `"use client"` (hook/state yok, sadece client `NavLink`'i sarıyor)

- **Category:** Frontend / Bundle (minor over-clienting)
- **Severity:** Low
- **Impact:** Marjinal — Server Component olarak kalabilecek statik markup'ın client component sınırına dahil edilmesi
- **Evidence:**
  - `src/components/modules/shell/sidebar.tsx:1` — `"use client"` ama dosyada `useState`/`useEffect`/event handler YOK, sadece `primaryNavItems`/`upcomingNavItems`/`bottomNavItems` listelerini map'leyip `<NavLink>` render ediyor.
  - `src/components/modules/shell/nav-link.tsx:1,10` — asıl interaktiviteye (`usePathname` ile aktif link vurgulama) ihtiyaç duyan bileşen zaten ayrı ve doğru şekilde `"use client"`.
  - Kontrast: `src/components/modules/shell/topbar.tsx` — HİÇ `"use client"` yok, doğru şekilde client çocuklarını (`MobileNavDrawer`, `UserMenu`, `ThemeToggle`) sarıp kendisi server component kalıyor — yani proje içinde zaten doğru desen (`Topbar`) mevcut, `Sidebar`'a uygulanmamış.
- **Why it's inefficient:** Next.js/React Server Component modelinde bir Server Component, Client Component'leri prop olarak/doğrudan render edebilir — `Sidebar`'ın kendisinin client olmasına gerek yok. Etkisi küçük (zaten `NavLink` + `nav-config` client'a gidiyor) ama `(app)` layout'unun HER sayfasında render edildiği için (her app sayfasında mevcut) toplamda gereksiz bir "bu modül client'tır" sınırı ekliyor.
- **Recommended fix:** `sidebar.tsx`'in başındaki `"use client"` satırını kaldırın; `NavLink` zaten kendi `"use client"` sınırını taşıdığı için davranış değişmez.
- **Tradeoffs/Risks:** Yok.
- **Expected impact estimate:** Küçük (muhtemelen ölçülemeyecek kadar küçük, ama sıfır maliyetli bir düzeltme).
- **Removal Safety:** Safe.
- **Reuse Scope:** Local file.

---

### Bulgu #10 — Dead code: `getUserProfile` (`lib/data/dashboard.ts`) hiçbir yerde çağrılmıyor

- **Category:** Code Reuse & Dead Code
- **Severity:** Low
- **Impact:** Bakım yükü, kafa karışıklığı (aynı işi yapan 2. bir yol var görünümü)
- **Evidence:**
  - `src/lib/data/dashboard.ts:15-29` (`getUserProfile`) — export edilmiş ama `grep -rn "getUserProfile" src` sadece tanımlandığı dosyayı buluyor, hiçbir çağıran yok.
  - `src/app/(app)/layout.tsx:35-39` — bunun yerine `users` tablosuna inline, ayrı bir `select("name, email, plan_type")` sorgusu yapılıyor (farklı kolon seti — `plan_type` var, `getUserProfile`'daki `plan` yok).
- **Why it's inefficient:** Kullanılmayan export — derlenen bundle'a girmez (tree-shaking) ama kod tabanında "bunu kim çağırıyor" belirsizliği ve gelecekte yanlışlıkla iki farklı profil-çekme yolunun senkronsuz kalması riski yaratıyor.
- **Recommended fix:** Ya `getUserProfile`'ı silin, ya da `layout.tsx`'teki inline sorguyu bu fonksiyonu çağıracak şekilde değiştirip kolon setini birleştirin (tek doğruluk kaynağı).
- **Tradeoffs/Risks:** Yok (kullanılmıyor).
- **Expected impact estimate:** Sadece bakım/okunabilirlik.
- **Removal Safety:** Safe.
- **Reuse Scope:** Local file.

---

### Bulgu #11 — `/esnaf/*` sayfalarında iki ayrı Realtime WebSocket kanalı eşzamanlı açık kalıyor (kişisel + esnaf tabloları)

- **Category:** Reliability / Cost (resource usage)
- **Severity:** Low-Medium
- **Impact:** Gereksiz Supabase Realtime bağlantı/replication yükü
- **Evidence:**
  - `src/app/(app)/layout.tsx:49` — `<RealtimeRefresh tables={PERSONAL_REALTIME_TABLES} />` (12 tablo: `expenses`, `incomes`, `goals` vb.) — TÜM `(app)/*` sayfalarını (esnaf dahil, çünkü `esnaf/(dashboard)` bu layout'un İÇİNDE nest'lenmiş) sarıyor.
  - `src/app/(app)/esnaf/(dashboard)/layout.tsx:97` — `<RealtimeRefresh tables={realtimeTables} />` (sektöre göre ek 12+ tablo) — bu, üstteki personal layout'un İÇİNDE ikinci bir bağımsız kanal olarak eklenir.
  - `src/lib/utils/useRealtimeRefresh.ts:20-21` — her `RealtimeRefresh` örneği kendi `supabase.channel(...)` + `.subscribe()` çağrısı yapıyor.
  - Sonuç: bir kullanıcı `/esnaf/stok` gibi bir sayfadayken, hiç ilgisi olmayan 12 kişisel tablo (expenses/goals/notes vb.) için de bir WebSocket kanalı canlı ve dinlemede kalıyor.
- **Why it's inefficient:** Kod zaten debounce + cleanup (`useEffect` return'ünde `removeChannel`) yapıyor, yani "yanlış" değil — ama kullanıcı Esnaf Modu'nda derinlemesindeyken kişisel modül verilerini dinlemenin hiçbir faydası yok, sadece bağlantı/abonelik sayısını artırıyor.
- **Recommended fix:** Kişisel `RealtimeRefresh`'i `(app)/layout.tsx`'ten `(app)/(personal)/layout.tsx` gibi bir route-group'a taşıyarak sadece kişisel modül sayfalarında mount olmasını sağlayın (esnaf route'ları bu group'un dışında kalır) — ya da basitçe `usePathname().startsWith("/esnaf")` kontrolüyla `RealtimeRefresh`'i o durumda render etmeyin.
- **Tradeoffs/Risks:** Route-group taşıması küçük bir yapısal refactor; pathname kontrolü daha düşük riskli hızlı bir yama.
- **Expected impact estimate:** Esnaf sayfalarında aktif Realtime kanal sayısı 2'den 1'e iner (~%50 bağlantı azalması bu bağlamda).
- **Removal Safety:** Likely Safe.
- **Reuse Scope:** Module-wide (`(app)/layout.tsx`, `esnaf/(dashboard)/layout.tsx`).

---

### Bulgu #12 — `select("*")` 80 yerde kullanılıyor — bazıları geniş/iç içe join'lerde gereksiz kolon taşıyor

- **Category:** Database
- **Severity:** Low (çoğu için — tablolar kullanıcı/işletme bazlı scope'lu ve küçük), bazı örnekler Medium
- **Impact:** Ağ üzerinden gereksiz veri transferi, büyüyen tablolarla birlikte artan maliyet
- **Evidence:** `grep -rn "select(\"\*\"\|select('\*')" src` → 80 sonuç, `lib/data/*.ts` içindeki hemen her dosyada (`expenses.ts`, `esnaf.ts`, `subscriptions.ts`, `goals.ts`, `perakende.ts`, `restaurant.ts`, `toptan.ts` vb.). Örnek: `src/lib/data/dashboard.ts:101-102` (`getRecentExpenses`) — `expenses` tablosunun TÜM kolonlarını çekiyor ama dashboard kartı sadece birkaçını (`total`, `date`, `store_name`, `item_count`) kullanıyor.
- **Why it's inefficient:** `select("*")` şema değiştikçe sessizce daha fazla veri çeker (ör. büyük bir `notes`/`description` text kolonu eklenirse, onu kullanmayan sorgular da onu taşımaya başlar); ayrıca sorgu niyetini kod okuyucusuna göstermez.
- **Recommended fix:** En azından sık çağrılan, listeleme amaçlı sorgularda (dashboard'daki "son N kayıt" gibi) `select("*")` yerine ihtiyaç duyulan kolonları açıkça listeleyin. Tüm 80 yeri değiştirmek düşük ROI'li olabilir (çoğu zaten `.eq("user_id", ...)`/`.eq("business_id", ...)` ile küçük, scope'lu sonuç kümeleri) — önceliği yüksek-trafik sayfalarına (dashboard, esnaf pano) verin.
- **Tradeoffs/Risks:** Kolon listesini elle senkron tutmak bir bakım yükü ekler; şema değiştiğinde unutulan bir `select` güncellemesi sessiz bug'a yol açabilir. Sadece gerçekten yüksek-trafik / geniş-satır tablolarda yapın.
- **Expected impact estimate:** Genel olarak düşük (tablolar zaten kullanıcı-scope'lu ve küçük); en çok trafik alan birkaç sorguda ölçülebilir bandwidth tasarrufu.
- **Removal Safety:** Safe ama "Needs Verification" per-query (nested join'lerde hangi kolonların gerçekten kullanıldığını component tarafında doğrulamak gerekir).
- **Reuse Scope:** Service-wide ama düşük öncelik.

---

### Bulgu #13 — `/api/ai-chat` rate limiter'ı sınırsız büyüyen bir `Map` (in-memory, hiç temizlenmiyor)

- **Category:** Memory / Reliability
- **Severity:** Low
- **Impact:** Uzun ömürlü process'lerde (self-host/Node runtime) bellek büyümesi
- **Evidence:** `src/lib/utils/rate-limit.ts:8` — `const requestLog = new Map<string, {...}>()` — girişler `resetAt` süresi geçse bile Map'ten hiç silinmiyor, sadece üzerine yazılıyor (kullanıcı tekrar istek attığında). Kod zaten bunun "cold start'ta sıfırlanan, serverless instance'lar arası paylaşılmayan" bir best-effort çözüm olduğunu belgeliyor (`:1-6`).
- **Why it's inefficient:** Vercel serverless fonksiyonlarda pratik etkisi düşük (instance'lar sık recycle olur) ama uzun ömürlü tek bir process'te (ör. self-hosted Node sunucu, `next start` ile) her benzersiz `user.id` kalıcı olarak Map'te birikir — asla temizlenmez.
- **Recommended fix:** Basit bir periyodik temizlik (`setInterval` ile süresi geçmiş girişleri silme) veya `resetAt` geçmiş girişleri her `isRateLimited` çağrısında olasılıksal olarak temizleme (ör. her çağrıda %1 ihtimalle tüm Map'i süzme) ekleyin.
- **Tradeoffs/Risks:** Düşük — davranışı değiştirmez, sadece bellek büyümesini sınırlar.
- **Expected impact estimate:** Düşük (mevcut deploy hedefinde — Vercel serverless — muhtemelen hiç gözlemlenmez), ama gelecekte deploy hedefi değişirse önemli hale gelebilir.
- **Removal Safety:** Safe.
- **Reuse Scope:** Local file (aynı zamanda `landing-chat` route'unun da aynı limiter'ı kullandığı belirtiliyor — kontrol edilmeli).

---

## 3) Quick Wins (Do First)

1. **Bulgu #4** — `expenses/page.tsx`'te duplike `categories` sorgusunu kaldırın (tek satırlık değişiklik, sıfır risk).
2. **Bulgu #9** — `sidebar.tsx`'ten gereksiz `"use client"`'ı kaldırın (tek satır silme).
3. **Bulgu #10** — Kullanılmayan `getUserProfile`'ı silin ya da `layout.tsx`'e bağlayın.
4. **Bulgu #7** — `PricingSection`/`WorkflowSection`'ı diğer 5 section gibi `next/dynamic`'e taşıyın (kopyala-yapıştır desen, ~10 dakika).
5. **Bulgu #1'in en ucuz parçası** — `getActiveBusiness`/`getUserBusinesses`/`isAdminUser`'ı `React.cache()` ile sarmalayın — imza değişmiyor, tüm 36+ çağıran dosya dokunulmadan otomatik fayda görür. **En yüksek ROI/efor oranı olan tek değişiklik.**

## 4) Deeper Optimizations (Do Next)

1. **Bulgu #1 (tam çözüm)** — Esnaf layout + page.tsx'lerin `getActiveBusiness`'ı ayrı ayrı çağırma zorunluluğunu ortadan kaldıracak şekilde, business bilgisini layout'tan page'e context/prop olarak geçirmeyi değerlendirin (Next.js'te layout→page arası doğrudan prop geçişi yok, ama `cache()` + gelecekte parallel routes/slot deseni düşünülebilir).
2. **Bulgu #2** — Middleware'i public-route kısayoluyla optimize edin; `getCurrentUser()` helper'ını `cache()` ile tüm `(app)/*` sayfalarına yayın.
3. **Bulgu #3** — `getGroupAnalytics` birleşik fonksiyonunu yazıp grup analiz sorgularını `analytics.ts`'teki `fetchBreakdownData` desenine hizalayın.
4. **Bulgu #8** — `/analytics` sekmelerini gerçek route segment'lerine (`/analytics/gelir-gider`, `/analytics/abonelikler` vb.) veya `next/dynamic` client-lazy chart'lara bölmeyi değerlendirin — önce bundle analyzer ile mevcut route JS boyutunu ölçün.
5. **Bulgu #6** — `next.config.ts`'e `images.remotePatterns` ekleyip Vercel image-optimization maliyetini/kotasını değerlendirdikten sonra `unoptimized` kaldırın; logo upload'a client-side resize ekleyin.
6. **Bulgu #11** — Kişisel/esnaf Realtime kanallarını route-group ile ayırın.

## 5) Validation Plan

- **Network/latency ölçümü (Bulgu #1, #2):** `npm run build && npm start` sonrası Chrome DevTools Network sekmesinde `/esnaf/stok` gibi bir sayfayı açıp Supabase'e giden istek sayısını/sıralamasını (auth + RPC) önce/sonra karşılaştırın. Alternatif: Next.js'in server log'larına geçici `console.time`/`console.timeEnd` ekleyip TTFB'yi ölçün.
- **DB sorgu sayımı (Bulgu #1, #3, #4):** Supabase Dashboard → Logs → Postgres Logs'ta `get_my_businesses` ve `expense_groups` sorgularının tekil bir sayfa yüklemesinde kaç kez çalıştığını (önce/sonra) sayın.
- **Bundle boyutu (Bulgu #7, #8):** `next build` çıktısındaki route bazlı "First Load JS" tablosunu (veya `@next/bundle-analyzer` eklenip) önce/sonra karşılaştırın — özellikle `/` ve `/analytics` route'ları.
- **Toplu tarama süresi (Bulgu #5):** 5-10 test fişiyle "Evrak Arşivi → Toplu Fiş Tarama"da önce/sonra toplam süreyi (ilk dosya seçiminden son sonucun gelmesine kadar) stopwatch ile ölçün.
- **Resim boyutu (Bulgu #6):** DevTools Network'te işletme logosu isteğinin transfer boyutunu (`unoptimized` kaldırılmadan/kaldırıldıktan sonra) karşılaştırın.
- **Regresyon testleri:** `flutter`/Jest yok bu projede; `npm run lint` + manuel duman testi (esnaf sayfa geçişleri, grup detay sayfası, `/expenses` kategori seçimi, landing page scroll) her değişiklik sonrası yeterli — proje test altyapısına sahip değil, bu yüzden davranış değişikliği yapan her fix (özellikle #1, #2, #3, #5) canlı/staging'de elle uçtan uca doğrulanmalı (bu projenin `docs/PROGRESS.md`'de belirttiği mevcut QA kültürüyle tutarlı).

## 6) Optimized Code / Patch (öneriler — UYGULANMADI)

Aşağıdakiler somut kod önerileridir, siz ayrıca uygulayacaksınız.

### 6.1 — Bulgu #1 + #10 kısmi çözüm: `active-business.ts`'i `cache()` ile sarmalama

```ts
// src/lib/esnaf/active-business.ts
import { cache } from "react";
// ...

export const getUserBusinesses = cache(async (): Promise<BusinessRow[]> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc("get_my_businesses");
  if (!error) {
    return ((data ?? []) as BusinessRow[]).sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  const { data: owned } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  return (owned ?? []) as BusinessRow[];
});

export const getActiveBusiness = cache(async (): Promise<BusinessRow | null> => {
  const businesses = await getUserBusinesses(); // artık aynı request içinde tekrar hesaplanmıyor
  if (businesses.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(COOKIE_NAME)?.value;
  return businesses.find((b) => b.id === activeId) ?? businesses[0];
});
```

`setActiveBusinessId` ve `isBusinessSubscribed` aynı kalır (mutasyon/iş kuralı, cache'lenmemeli). Bu tek değişiklik, `layout.tsx` + her page.tsx'in `getActiveBusiness()`'ı bağımsız çağırması sorununu KÖKTEN çözer — çağıran kod hiç değişmeden aynı request içindeki tekrarlar otomatik birleşir.

### 6.2 — Bulgu #4: duplike `categories` sorgusunu kaldırma

```tsx
// src/app/(app)/expenses/page.tsx
const [expenses, categoriesFull, groups] = await Promise.all([
  getExpenses(supabase, userId, { start, end }),
  getCategoriesFull(supabase),
  getGroups(supabase),
]);
const categories = categoriesFull.map((c) => ({ name: c.name, group: c.parent_group ?? "", emoji: c.icon }));
```

### 6.3 — Bulgu #9: `Sidebar`'dan `"use client"` kaldırma

```diff
- "use client";
-
  import Link from "next/link";
```

### 6.4 — Bulgu #7: eksik dynamic import'ları ekleme

```ts
// src/app/page.tsx — mevcut 5 dynamic() tanımının yanına:
const WorkflowSection = dynamic(() =>
  import("@/components/modules/landing/workflow-section").then((m) => m.WorkflowSection),
);
const PricingSection = dynamic(() =>
  import("@/components/modules/landing/pricing-section").then((m) => m.PricingSection),
);
```
(ve üstteki statik `import { WorkflowSection } from "..."` / `import { PricingSection } from "..."` satırlarını silin)

---

**Not:** Bu rapor sadece bulguları belgeler — hiçbir dosya değiştirilmedi. Yukarıdaki kod önerileri başlangıç noktasıdır, uygulamadan önce ilgili sayfa/component'in tam context'iyle gözden geçirilmelidir.
