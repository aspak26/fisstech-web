# Fişştech Web — Optimizasyon Denetimi

**Kapsam:** `Fisstech_web` (Next.js 16 / App Router / React 19 / Supabase). Bu SADECE bir denetim raporudur — hiçbir kod değiştirilmedi. Aşağıdaki bulgular kod okunarak (Server Component/Server Action veri çekme, `select()` kalıpları, `use client` dağılımı, bundle/code-splitting, resim yükleme, middleware, API route'ları) doğrulandı. 30+ dosya taranmıştır (route'lar, `lib/data/*`, `lib/esnaf/*`, `lib/scan/*`, shell/landing component'leri, `next.config.ts`, `proxy.ts`, `middleware.ts`, `package.json`).

**Referans dosyalar:** `AGENTS.md`, `docs/AGENTS.md`, `docs/PROGRESS.md`, `next.config.ts`, `src/proxy.ts`, `src/lib/supabase/{server,middleware,client}.ts`.

> **ROUND 2 — 2026-09-04.** Bu, aynı denetimin ikinci turu. Round 1'in temel alındığı commit (`790196b`) ile şu anki `HEAD` arasında **25 commit** ve **216 değişen dosya** var (`git diff 790196b..HEAD --stat`). Round 1'in 13 bulgusunun hepsi aşağıda tek tek yeniden doğrulandı (her birine "**Durum (Round 2, 2026-09-04):**" satırı eklendi) ve 25 commit'lik delta için yeni bulgular **#14'ten itibaren** eklendi. Hiçbir dosya bu denetim sırasında değiştirilmedi — sadece `OPTIMIZATIONS_WEB.md` güncellendi.
>
> **Kritik not — Bulgu #9 hakkında (okumadan geçmeyin):** Round 1, `sidebar.tsx`'ten `"use client"` kaldırılmasını önermişti ("marjinal etkili, risk yok" diyerek). Bu öneri **YANLIŞTI** ve eşzamanlı bir oturumda uygulanınca **production'ı kırdı** — `/dashboard` dahil TÜM kimlik doğrulamalı sayfalar "Functions cannot be passed directly to Client Components" hatasıyla çöktü, çünkü `Sidebar`'ın render ettiği `NavLink` (Client Component) `nav-config.ts`'ten `item.icon` adında bir Lucide ikon component'ini (yani bir **fonksiyon referansı**) prop olarak alıyor — ve bir fonksiyonu server→client sınırından geçirmek React Server Components modelinde geçersiz. Olay `ff51e9b` commit'iyle (`"use client"` geri eklenerek) düzeltildi. Bulgu #9 aşağıda **RETRACTED** olarak işaretlendi — bu öneri bir daha yapılmamalı. Ayrıntı için Bulgu #9'un Round 2 durum notuna bakın.

---

## 1) Optimization Summary

**Genel sağlık durumu (Round 2):** Round 1'den bu yana kod tabanı iki yönde ilerledi. Olumlu tarafta: Bulgu #1'in `cache()` önerisi birebir uygulandı (`src/lib/esnaf/active-business.ts`), Bulgu #4 (duplike `categories` sorgusu) ve Bulgu #7 (eksik `next/dynamic` bölümleri) tam olarak önerilen şekilde düzeltildi, ve Esnaf Modu'nun tamamen kilitlenmesi (`16db0b8`) Bulgu #1 ve #11'i pratikte devre dışı bıraktı. Olumsuz tarafta: **round 1'de "iyi disiplinli" olarak tanımlanan `cache()`/tek-sorgu deseni yeni özelliklere hiç taşınmamış** — 25 commit'lik delta, tam olarak round 1'in uyardığı türden en az 3 yeni/genişlemiş anti-pattern getirdi, en ciddisi de round 1'in doğrudan işaret ettiği riskin gerçekleşmesi: yeni 7 günlük deneme özelliği (`7289063`), `cache()`'siz `getUserPlanInfo()`'yu layout + her sayfa + iç yardımcı fonksiyonlarda bağımsız olarak çağırıyor. Ayrıca Esnaf Modu'nun kilitlenmesi, ~125 dosyalık bir kod alanını (route'lar dahil) artık hiçbir zaman render edilmeyen, derlemeye giren "hayalet" koda çevirdi.

**En yüksek etkili 3 bulgu (Round 2, güncel kod durumu için):**
1. **`getUserPlanInfo()` (plan/deneme bilgisi) `cache()` ile sarmalanmamış ve tek bir sayfa yüklemesinde 2-3 kez bağımsız olarak `users` tablosunu sorguluyor** — `layout.tsx` + `settings`/`scan`/`ai-chat`/`reports`/`expenses/archive` sayfalarının HER BİRİ + `getRemainingScanCredits`/`getAiChatQuotaStatus` gibi iç yardımcılar aynı sorguyu tekrar çalıştırıyor (`/scan` sayfası tek başına 3x). Tam olarak Bulgu #1'in çözdüğü sorunun bir kopyası, yeni kodda tekrarlanmış. — **Kritik, Bulgu #14 (YENİ)**
2. **Esnaf Modu tamamen kilitlendi (`16db0b8`) ama kodu silinmedi** — `src/app/(app)/esnaf/**` (38 dosya), `src/lib/esnaf/**` (9 dosya) ve `src/components/modules/esnaf/**` (78 dosya) artık layout seviyesinde koşulsuz `EsnafLockedPage` döndüğü için (`{children}` hiç render edilmiyor) fiilen ulaşılamaz durumda ama build'e/koda dahil olmaya devam ediyor. — **Orta (bakım/build maliyeti), Bulgu #15 (YENİ)**
3. **Grup sohbetindeki okundu-bilgisi (read receipt) yazma işlemi, grup detay sayfasının TÜM realtime-tetiklemeli veri paketini (Bulgu #3'ün 3x duplike sorgusu dahil) her mesaj okunduğunda açık olan HER görüntüleyici için yeniden çekiyor** — `markGroupAsRead` yazdığı `group_members` tablosu aynı zamanda sohbetin dinlediği realtime tablo, bu yüzden bir okundu-bilgisi güncellemesi zincirleme `router.refresh()` tetikliyor. — **Orta-Yüksek, Bulgu #17 (YENİ)**

**Düzeltilmezse en büyük risk (Round 2):** `getUserPlanInfo()` deseni (Bulgu #14) tam olarak Esnaf Modu'nda (Bulgu #1, round 1) yaşanan sorunun KİŞİSEL modülde, gerçek/canlı trafiğe açık sayfalarda (herkes kullanıyor, admin-gate yok) tekrarlanmış hali — yani round 1'deki "en büyük risk" senaryosu (gate kalkınca patlar) burada zaten şu an, canlıda, gate olmadan gerçekleşiyor. Her `/scan`, `/ai-chat`, `/reports`, `/expenses/archive`, `/settings` yüklemesi 2-3 fazla `users` sorgusu yapıyor; trafik arttıkça bu Supabase Postgres/Auth yükünde katlanarak büyüyen, ölçülebilir bir maliyet ve gecikme kaynağı.

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

**Durum (Round 2): FIXED (öneri #1 uygulandı), ama şu an MOOT.** `src/lib/esnaf/active-business.ts:3,16` — `getUserBusinesses` artık `import { cache } from "react"` ile sarmalanmış, önerilen değişiklik birebir uygulanmış. Ancak `16db0b8` commit'i Esnaf Modu'nu HERKESE (admin dahil) kapattığı için (`(app)/esnaf/(dashboard)/layout.tsx` artık koşulsuz `<EsnafLockedPage />` döndürüyor, bu fonksiyonlar hiç çağrılmıyor) bu düzeltmenin bugün ölçülebilir bir etkisi yok — modül tekrar açıldığında devreye girecek, hazır bekliyor.

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

**Durum (Round 2): STILL OPEN, ve aynı desen yeni 7 günlük deneme özelliğinde tekrarlanmış.** Middleware hâlâ public route ayrımı yapmadan her istekte `auth.getUser()` çağırıyor. Ayrıca `getUserPlanInfo()` (yeni entitlement/trial okuma fonksiyonu, `entitlements.ts`) da `cache()`'siz — bkz. aşağıdaki **Bulgu #14 (YENİ)**, bu bulgunun kişisel modüldeki genişlemiş/daha ciddi hali.

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

**Durum (Round 2): STILL OPEN.** `getGroupExpenseDetails` (`src/lib/data/groups.ts:260-`) hâlâ `cache()`'siz düz bir `async function`; `getGroupCategoryBreakdown`/`getGroupParentCategoryBreakdown`/`getGroupStoreBreakdown` üçü de hâlâ bağımsız çağırıyor. Ayrıca bu turda AYNI sayfada yeni bir katman daha eklendi — bkz. **Bulgu #17 (YENİ)**, grup sohbetindeki okundu-bilgisi yazımının bu 3x sorguyu her mesaj okunduğunda tekrar tetiklemesi.

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

**Durum (Round 2): FIXED.** `src/app/(app)/expenses/page.tsx:26-33` artık sadece `getCategoriesFull(supabase)`'ı çağırıp `categories`/`categoryNamesById`'yi bundan türetiyor (`.map(...)`) — önerilen çözüm birebir uygulanmış, ikinci sorgu kaldırılmış.

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

**Durum (Round 2): STILL OPEN, ama şu an MOOT.** `global-batch-scan-dialog.tsx:63,94` hâlâ `for (const draft of ...)` ile sıralı. Esnaf Modu'nun tamamen kilitlenmesi (bkz. Bulgu #1'in Round 2 notu) bu dosyanın da hiç render edilmediği anlamına geliyor — modül tekrar açıldığında düzeltilmesi gereken bir öğe olarak kalıyor.

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

**Durum (Round 2): STILL OPEN.** `next.config.ts`'de hâlâ `images:` alanı yok, `business-logo-form.tsx:75` hâlâ `unoptimized` kullanıyor. Esnaf Modu kilitli olsa da bu component'in kilitten ETKİLENMEYEN bir kardeşi var: logo yükleme akışı esnaf-özel ama görüntüleme tarafı (`business-switcher.tsx`) da kilitli sayfaların İÇİNDE, yani bu da şu an fiilen çağrılmıyor — Bulgu #1/#5 ile aynı "esnaf kilidi yüzünden moot" durumu.

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

**Durum (Round 2): FIXED.** `src/app/page.tsx:32-36` — `WorkflowSection` ve `PricingSection` artık diğer 5 section ile aynı `next/dynamic` kalıbına taşınmış.

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

**Durum (Round 2): Not re-verified in detail** — bu turda `/analytics` sayfasının tab yapısı değişmemiş görünüyor (`9a34d9c` yeni bir `cashflow-forecast-card.tsx` ve `installments-analytics-tab.tsx` EKLEDİ, `analytics-tabs-nav.tsx`'e yeni bir sekme daha katarak — bu, aynı code-splitting sorununu BÜYÜTMÜŞ olabilir, tab sayısı arttıkça statik-import edilen client chart kodu da artıyor). Kesin bundle ölçümü yapılmadı, önceki "Needs Verification" durumu geçerliliğini koruyor, artık bir tab daha eklendiği için önceliği artmış olabilir.

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
- **Recommended fix:** ~~`sidebar.tsx`'in başındaki `"use client"` satırını kaldırın; `NavLink` zaten kendi `"use client"` sınırını taşıdığı için davranış değişmez.~~
- **Tradeoffs/Risks:** ~~Yok.~~
- **Expected impact estimate:** ~~Küçük (muhtemelen ölçülemeyecek kadar küçük, ama sıfır maliyetli bir düzeltme).~~
- **Removal Safety:** ~~Safe.~~ **YANLIŞ — bkz. Round 2 durumu.**
- **Reuse Scope:** Local file.

> ## ⚠️ RETRACTED (Round 2, 2 Ağustos 2026) — bu bulgunun önerisi PRODUCTION'I KIRDI, bir daha uygulanmasın
>
> Bu bulgu "Tradeoffs/Risks: Yok" ve "Removal Safety: Safe" diyordu. **İkisi de yanlıştı.** Eş zamanlı bir oturum bu öneriyi aynen uyguladı (`"use client"` kaldırıldı) ve bu, `/dashboard` dahil **TÜM kimlik doğrulamalı sayfaları** çökertti — kullanıcılar "This page couldn't load / A server error occurred" hatası aldı (digest `1621801304`).
>
> **Neden yanlıştı:** Analiz "sadece statik markup render ediyor, hook yok" derken doğruydu, ama gözden kaçırdığı şey şuydu: `Sidebar`'ın çocuğu `NavLink` (`nav-link.tsx:1`) Client Component ve `nav-config.ts`'ten gelen `item.icon`'u — yani bir **Lucide ikon component'i (fonksiyon referansı)** — prop olarak alıyor. `Sidebar` Server Component'e dönüşünce, bu artık bir Server Component'in bir Client Component'e FONKSİYON geçirmeye çalışması demek — React Server Components modelinde bu geçersiz ve React bunu reddediyor ("Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with 'use server'"). Bu, "hook/state var mı" kontrolü kadar basit değil — bir bileşenin server'a taşınıp taşınamayacağını belirlemek için TÜM prop zincirinin serileştirilebilir olup olmadığı da kontrol edilmeli, sadece kendi içindeki hook kullanımı değil.
>
> Olay `ff51e9b` commit'iyle (`"use client"` geri eklenerek) düzeltildi ve o zamandan beri stabil. **Ders:** Bu tarz "gereksiz use client" bulguları için Removal Safety'yi "Safe" işaretlemeden önce, kaldırılacak bileşenin render ettiği HER client çocuğunun aldığı HER prop'un serileştirilebilir (string/number/boolean/plain object/array/JSX) olduğu, fonksiyon/Symbol/class instance içermediği doğrulanmalı — "Needs Verification" olarak işaretlenip bu kontrol yapılmadan asla "Safe" denmemeli.

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

**Durum (Round 2): FIXED (kaldırılmış).** `grep -rn "getUserProfile" src` artık `dashboard.ts`'te bile sıfır sonuç veriyor — fonksiyonun kendisi tamamen silinmiş (önerinin "sil" seçeneği uygulanmış).

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

**Durum (Round 2): Not Applicable Anymore (esnaf kilidi yüzünden).** Esnaf Modu tamamen kapalı olduğu için `esnaf/(dashboard)/layout.tsx`'teki ikinci Realtime kanalı hiç mount olmuyor — çift kanal sorunu şu an fiilen yok. Modül tekrar açıldığında bu bulgu geri gelir, öneri hâlâ geçerli.

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

**Durum (Round 2): STILL OPEN, genişlemiş.** Yeni `cards.ts`/`installments.ts`/`forecast.ts`/`banks.ts` dosyaları bu deseni tekrarlamıyor (`CARD_COLS` gibi açık kolon listeleri kullanıyorlar, bkz. Bulgu #7'nin kod incelemesi — iyi bir işaret), ama genel `select("*")` sayısı 25 commit'lik yeni kodla muhtemelen artmıştır (tam sayım bu turda yeniden yapılmadı). Düşük öncelik olarak kalıyor.

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

**Durum (Round 2): STILL OPEN, ve aynı desen yeni `get-investment-prices` edge function'ına da kopyalanmış.** `rate-limit.ts` değişmemiş. Ayrıca `supabase/functions/get-investment-prices/index.ts:37-49`'a (bkz. `SECURITY_AUDIT_WEB.md` Bulgu #5'in Round 2 notu) TAM OLARAK aynı temizlenmeyen `Map` deseni yeni eklenmiş — artık bu limitasyon 3 yerde (`rate-limit.ts`, `scan-demo.ts`, `get-investment-prices/index.ts`) bağımsız olarak var, hiçbiri paylaşılmıyor/temizlenmiyor. Ortak bir `lib/utils/`'a çıkarılıp (edge function Deno olduğu için doğrudan import edilemez ama aynı mantık kopyalanabilir) periyodik temizlik eklenmesi artık 3 kopyayı birden düzeltir.

---

## Round 2 Findings — 25 commit'lik delta (`790196b..HEAD`)

### Bulgu #14 — `getUserPlanInfo()` (plan/deneme bilgisi) `cache()`'siz, sayfa başına 2-3 kez bağımsız sorgulanıyor

- **Category:** Database / Network (N+1, aynı sınıf Bulgu #1/#2 ile)
- **Severity:** Critical
- **Impact:** Latency, DB yükü — bu sefer Esnaf Modu gibi kilitli/admin-only bir modülde değil, **canlı, herkese açık, en çok trafik alan kişisel sayfalarda**
- **Evidence:**
  - `src/lib/utils/entitlements.ts` — `getUserPlanInfo(supabase, userId)` düz bir `export async function`, `cache()` sarmalaması YOK (`grep "= cache("` sıfır sonuç bu dosyada; kıyasla `active-business.ts` Bulgu #1'in düzeltmesiyle `cache()` kullanıyor).
  - Çağıran sayıları: `grep -rn "getUserPlanInfo(" src` → **9 çağıran site**, en az `(app)/layout.tsx`, `/scan/page.tsx`, `/ai-chat/page.tsx`, `/reports` altındaki bir sayfa, `/settings/page.tsx`. `/scan/page.tsx` özelinde: layout'un kendi çağrısı + page'in kendi çağrısı + `getRemainingScanCredits`'in içindeki dolaylı `isPersonalPremium` kontrolü — tek sayfa yüklemesinde 2-3 bağımsız `users` sorgusu.
  - Her çağrı `supabase.from("users").select("plan_type, esnaf_plan, esnaf_staff_limit, trial_started_at, trial_offer_dismissed").eq("id", userId).maybeSingle()` — küçük bir sorgu ama gerçek bir ağ round-trip.
- **Why it's inefficient:** Bulgu #1'in TAM OLARAK çözdüğü sorunun bir kopyası — aynı proje içinde kanıtlanmış bir çözüm (`cache()`) var ama yeni kodun yazıldığı an unutulmuş. Fark: Bulgu #1 (Esnaf) artık modül kilidi yüzünden moot; bu bulgu ise KİLİTSİZ, gerçek kullanıcı trafiğine açık sayfalarda birebir gerçekleşiyor.
- **Recommended fix:** `entitlements.ts`'e `import { cache } from "react"` ekleyip `getUserPlanInfo`'yu `export const getUserPlanInfo = cache(async (...) => {...})` şeklinde sarmalayın — imza değişmez, 9 çağıran dosya dokunulmadan fayda görür (Bulgu #1'in aynı deseni).
- **Tradeoffs/Risks:** Yok — `cache()` tek bir React render/request ömrü boyunca geçerli, mutasyon sonrası (`startTrialAction` gibi) zaten `revalidatePath` ile yeni bir render tetikleniyor.
- **Expected impact estimate:** `/scan`, `/ai-chat`, `/reports`, `/settings` sayfa yüklemelerinde 1-2 DB round-trip tasarrufu; bu sayfalar Esnaf'ın aksine GERÇEK trafik alıyor, bu yüzden toplam etkisi Bulgu #1'den daha yüksek olabilir.
- **Removal Safety:** Safe (mekanik, `active-business.ts`'te zaten kanıtlanmış aynı değişiklik).
- **Reuse Scope:** Service-wide (`entitlements.ts` + 9 çağıran dosya).

---

### Bulgu #15 — Esnaf Modu tamamen kilitlendi ama ~125 dosya hâlâ build'e/koda dahil (dead code, build maliyeti)

- **Category:** Code Reuse & Dead Code / Build
- **Severity:** Medium (bakım + build maliyeti; performans etkisi yok çünkü hiç render edilmiyor)
- **Impact:** Bundle/build süresi, kod tabanı bakım yükü, "bu kod hâlâ çalışıyor mu" belirsizliği
- **Evidence:**
  - `16db0b8` commit'i `(app)/esnaf/(dashboard)/layout.tsx` ve `esnaf/page.tsx`'i koşulsuz `<EsnafLockedPage />` döndürecek şekilde değiştirdi — ama `src/app/(app)/esnaf/**` (38 route dosyası), `src/lib/esnaf/**` (9 dosya), `src/components/modules/esnaf/**` (78 component dosyası) SİLİNMEDİ, hâlâ repo'da.
  - Bu route'lar Next.js'in build-time route taramasına dahil oluyor (her biri kendi sayfa bundle'ını üretiyor) ama hiçbir kullanıcı hiçbir zaman bu koda ulaşamıyor (layout seviyesinde erken dönüş).
- **Why it's inefficient:** Ölü kod build süresini, `tsc`/lint taramasını ve kod tabanının zihinsel yükünü artırıyor; ayrıca bu koddaki bir bug asla fark edilmez (test/kullanım yok) — modül tekrar açıldığında sürpriz regresyon riski.
- **Recommended fix:** Eğer Esnaf Modu'nun yakın zamanda geri açılması PLANLANMIYORSA, bu 125 dosyayı bir git branch'inde/tag'de saklayıp ana daldan kaldırmayı değerlendirin. Yakın zamanda geri açılması planlanıyorsa, mevcut durum (kod dursun, tek bir layout guard'ı ile kapalı) makul bir tradeoff — sadece net bir yorum/TODO ile "ne zaman/nasıl açılacağı" belgelenmeli (`layout.tsx`'teki mevcut yorum bunu kısmen yapıyor).
- **Tradeoffs/Risks:** Silme kararı geri dönüşü zor (git history'de kalır ama "aktif kod" olmaktan çıkar) — ÜRÜN kararı, bir mühendislik kararı değil. Fix olarak ÖNERİLMİYOR, sadece gözlemleniyor.
- **Expected impact estimate:** Build süresinde küçük-orta azalma (125 dosya derlenmeye devam ediyor); asıl kazanç bakım/netlik.
- **Removal Safety:** Needs Verification (ürün kararı gerektirir, kod-safety sorunu değil).
- **Reuse Scope:** Service-wide (125 dosya).

---

### Bulgu #16 — Grup sohbeti okundu-bilgisi yazımı, sayfanın TÜM verisini (3x duplike sorgu dahil) her açılışta yeniden çekiyor

- **Category:** Database / Reliability (realtime-tetiklemeli aşırı refetch)
- **Severity:** Medium-High
- **Impact:** Bir grup sohbeti açık olan HER görüntüleyici için, herhangi bir üye mesaj okuduğunda tetiklenen gereksiz tam sayfa server-refetch
- **Evidence:**
  - `src/components/modules/groups/group-chat-card.tsx:49` — `useRealtimeRefresh(["group_messages", "group_members"])` — bu component `group_members` tablosundaki HERHANGİ bir değişiklikte sayfayı yeniden çeker.
  - `:53` — `markGroupAsRead(createClient(), groupId, currentUserId)` component mount/görünür olduğunda çağrılıyor, bu da `src/lib/data/groups.ts:594-`'teki `markGroupAsRead`'in `group_members.last_read_at` kolonunu UPDATE etmesine yol açıyor.
  - Sonuç: kullanıcı A sohbeti açar → `last_read_at` güncellenir → `group_members` realtime event'i tetiklenir → sohbeti açık tutan kullanıcı B, C, D'nin HER BİRİNDE `useRealtimeRefresh` bunu yakalayıp `router.refresh()` çağırır → grup detay sayfasının TÜM server component ağacı (Bulgu #3'ün 3x duplike `getGroupExpenseDetails` sorgusu dahil) yeniden render/fetch edilir — sadece küçük bir "okundu" tik'i göstermek için.
- **Why it's inefficient:** Okundu-bilgisi göstermek için sayfanın harcama/analiz verisinin TAMAMEN yeniden çekilmesine gerek yok — bu, granülerlik uyuşmazlığı (bir mesajlaşma özelliği bir finans-analiz sayfasını yeniden yüklüyor).
- **Recommended fix:** `markGroupAsRead`'i `useRealtimeRefresh`'in dinlediği tablo listesinden (`group_members`) ayırın — ya `last_read_at` güncellemesini ayrı bir tabloya/mekanizmaya taşıyın (realtime dinlenmeyen), ya da `useRealtimeRefresh`'e bir "bu tablodaki HANGİ kolon değişirse tetiklensin" filtresi ekleyin (Supabase Realtime `postgres_changes` bunu native desteklemiyor ama client tarafında payload'daki değişen kolonlara bakıp `last_read_at`-only değişiklikleri filtreleyip `router.refresh()` çağırmayı atlayabilirsiniz).
- **Tradeoffs/Risks:** Filtreleme mantığı realtime payload'ın eski/yeni satır farkına güvenir — Supabase'in `REPLICA IDENTITY` ayarına bağlı olarak payload'da tüm kolonlar gelmeyebilir, doğrulanmalı.
- **Expected impact estimate:** Aktif bir grup sohbetinde (birden fazla eşzamanlı görüntüleyici) gereksiz tam-sayfa refetch sayısında büyük azalma — mesaj-okuma sıklığı, mesaj-gönderme sıklığından genelde çok daha yüksektir.
- **Removal Safety:** Needs Verification (realtime payload davranışı canlı test edilmeli).
- **Reuse Scope:** Local module (`group-chat-card.tsx` + `groups.ts`).

---

## 3) Quick Wins (Do First) — Round 2, güncel durum

~~Bulgu #4, #9(→RETRACTED, uygulamayın), #10, #7~~ — hepsi Round 1'den bu yana FIXED, aşağıdan çıkarıldı.

1. **Bulgu #14 (YENİ) — En yüksek ROI/efor oranı olan tek değişiklik, tıpkı eski Bulgu #1 gibi.** `getUserPlanInfo`'yu `React.cache()` ile sarmalayın (`entitlements.ts`) — tek satırlık, imza değişmiyor, 9 çağıran dosya otomatik fayda görür, GERÇEK/canlı trafiğe açık sayfalarda (Esnaf'ın aksine).
2. **Bulgu #16 (YENİ)** — `markGroupAsRead`'in `group_members` realtime kanalını tetiklemesini durdurun (filtre veya ayrı tablo) — aktif grup sohbetlerinde gereksiz tam-sayfa refetch'i keser.
3. **Bulgu #3** — hâlâ açık, hâlâ ucuz bir düzeltme: `getGroupExpenseDetails`'i `cache()`'leyin (tam `getGroupAnalytics` birleşimini beklemeden bile, sadece cache eklemek 3x sorguyu 1x'e indirir aynı request içinde).

## 4) Deeper Optimizations (Do Next) — Round 2, güncel durum

~~Bulgu #1 (tam çözüm), #2, #6, #11~~ — Esnaf Modu kilitli olduğu için #1/#6/#11 şu an moot (modül açılırsa öncelik kazanır); #2 hâlâ geçerli ama Bulgu #14 ile aynı kök nedenin (auth/entitlement sorgularının cache'lenmemesi) bir parçası olarak birlikte ele alınabilir.

1. **Bulgu #2 + #14 birlikte** — `getCurrentUser()`/`getUserPlanInfo` ikisini de `cache()`'leyip middleware'in public-route kısayolunu ekleyin — aynı kök neden sınıfı, tek bir "auth/entitlement caching" turu olarak ele alınabilir.
2. **Bulgu #3 (tam çözüm)** — `getGroupAnalytics` birleşik fonksiyonunu yazın.
3. **Bulgu #16** — realtime payload filtreleme mantığını canlı ortamda test ederek uygulayın.
4. **Bulgu #8** — artık 5 sekmeye çıkan `/analytics`'i route segment'lerine veya `next/dynamic` chart'lara bölmeyi değerlendirin — bundle analyzer ile önce ölçün.
5. **Bulgu #15** — Esnaf Modu'nun geri açılma zaman çizelgesine göre ~125 dosyayı tutma/kaldırma kararını ürün ekibiyle netleştirin.

## 5) Validation Plan

- **Network/latency ölçümü (Bulgu #1, #2):** `npm run build && npm start` sonrası Chrome DevTools Network sekmesinde `/esnaf/stok` gibi bir sayfayı açıp Supabase'e giden istek sayısını/sıralamasını (auth + RPC) önce/sonra karşılaştırın. Alternatif: Next.js'in server log'larına geçici `console.time`/`console.timeEnd` ekleyip TTFB'yi ölçün.
- **DB sorgu sayımı (Bulgu #1, #3, #4):** Supabase Dashboard → Logs → Postgres Logs'ta `get_my_businesses` ve `expense_groups` sorgularının tekil bir sayfa yüklemesinde kaç kez çalıştığını (önce/sonra) sayın.
- **Bundle boyutu (Bulgu #7, #8):** `next build` çıktısındaki route bazlı "First Load JS" tablosunu (veya `@next/bundle-analyzer` eklenip) önce/sonra karşılaştırın — özellikle `/` ve `/analytics` route'ları.
- **Toplu tarama süresi (Bulgu #5):** 5-10 test fişiyle "Evrak Arşivi → Toplu Fiş Tarama"da önce/sonra toplam süreyi (ilk dosya seçiminden son sonucun gelmesine kadar) stopwatch ile ölçün.
- **Resim boyutu (Bulgu #6):** DevTools Network'te işletme logosu isteğinin transfer boyutunu (`unoptimized` kaldırılmadan/kaldırıldıktan sonra) karşılaştırın.
- **Regresyon testleri:** `flutter`/Jest yok bu projede; `npm run lint` + manuel duman testi (esnaf sayfa geçişleri, grup detay sayfası, `/expenses` kategori seçimi, landing page scroll) her değişiklik sonrası yeterli — proje test altyapısına sahip değil, bu yüzden davranış değişikliği yapan her fix (özellikle #1, #2, #3, #5) canlı/staging'de elle uçtan uca doğrulanmalı (bu projenin `docs/PROGRESS.md`'de belirttiği mevcut QA kültürüyle tutarlı).

## 6) Optimized Code / Patch (öneriler — UYGULANMADI)

Aşağıdakiler somut kod önerileridir, siz ayrıca uygulayacaksınız.

**Round 2 durumu:** 6.1 (`cache()` sarmalaması) ve 6.2 (duplike `categories` sorgusu) Round 1'den bu yana UYGULANMIŞ (bkz. Bulgu #1/#4'ün Round 2 notları) — aşağıda referans için tutuluyor ama artık aksiyon gerektirmiyor. 6.3 RETRACTED (aşağıya bakın, uygulamayın). 6.4 UYGULANMIŞ (Bulgu #7). Yeni Round 2 bulguları (#14/#16) için hazır patch'ler henüz yazılmadı — bu turun kapsamı sadece raporlamaydı, kod değiştirilmedi.

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

### 6.3 — ~~Bulgu #9: `Sidebar`'dan `"use client"` kaldırma~~ — KALDIRILDI, RETRACTED

**Bu patch buradan bilerek silindi.** Aynen burada yazılı olduğu gibi uygulandı ve production'ı kırdı (bkz. yukarıdaki Bulgu #9'un "⚠️ RETRACTED" notu, tam olay anlatımı orada). `Sidebar`'da `"use client"` KALMALI — kaldırmayın. Bu patch'i buradan referans alıp tekrar uygulamayın.

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
