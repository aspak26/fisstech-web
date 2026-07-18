# PROGRESS.md — Fişştech Web Sitesi Geliştirme Takibi

> Bu dosya projenin neresinde olduğumuzu gösterir. Her önemli aşama tamamlandığında güncellenmeli. En son güncelleme tarihini üstte tut.

**Son güncelleme:** 18 Temmuz 2026

---

## Genel Durum

✅ **Faz 1 tamamlandı ve gerçek kullanıcı hesabıyla canlı doğrulandı.**
✅ **Faz 2 (tüm bireysel kullanıcı modülleri) tamamlandı ve gerçek kullanıcı hesabıyla canlı doğrulandı** (3 canlı-test hatası bulunup düzeltildi — bkz. Kararlar Günlüğü). AI Sohbet kodu düzeldi ama Google tarafındaki API kotası nedeniyle kullanıcı kararıyla ayrı ele alınacak.
✅ **Faz 3 — Esnaf Modu ortak altyapısı + Bugünkü Ciro kartı + Evrak Arşivi (seri tarama) + Yeme-İçme Menü Yönetimi tamamlandı**, build/lint/type-check temiz — tarayıcı doğrulaması bekleniyor. Kalan 5 sektörün kendine özgü ekranları (bkz. Blueprint Bölüm 4.2) sonraki bir oturumda ele alınacak.

---

## Faz 0 — Planlama & Blueprint

- [x] Mobil uygulama ekranları incelendi, tasarım sistemi çıkarıldı
- [x] `Fisstech_Web_Blueprint.md` oluşturuldu
- [x] Tema stratejisi netleştirildi (Web: Açık/Koyu Mod)
- [x] `AGENTS.md` oluşturuldu
- [x] `PROGRESS.md` oluşturuldu
- [x] Kesin tasarım token'ları (hex kodları, font seçimi) netleştirildi
- [x] Teknoloji yığını (stack) kararı verildi

---

## Faz 1 — Tasarım Sistemi Kurulumu

- [x] Renk paleti kesinleştirildi (Açık Mod + Koyu Mod, tam hex değerleriyle, WCAG AA kontrastı hesaplanarak doğrulandı) — `styles/tokens.css`
- [x] Tipografi çifti seçildi (Bricolage Grotesque + Plus Jakarta Sans, `next/font/google` ile self-host)
- [x] Spacing/grid sistemi tanımlandı (8pt)
- [x] Temel UI komponentleri (buton, kart, input, badge, tab, skeleton, empty-state) oluşturuldu — `src/components/ui/`
- [x] Açık/Koyu mod geçiş mekanizması çalışır durumda (`next-themes`, class stratejisi)

---

## Faz 2 — Bireysel Kullanıcı Modülleri

- [x] Dashboard (Net Bakiye & Gelir-Gider özeti, ay seçici, hero kart, hızlı erişim, notlar, sabit giderler, son harcamalar)
- [x] Fiş Tarama (web'e özel: drag-drop / dosya seçici, tekli + uzun fiş çoklu mod, gerçek `scan-receipt` edge function entegrasyonu)
- [x] Harcamalarım — liste + manuel ekleme/düzenleme (kalemli, kategori seçimli), silme. `expenses`+`expense_items` gerçek tablolara yazıyor. **Mobil detay-parite geçişiyle genişletildi:** Dönem Seçin filtresi (Bu Hafta/Bu Ay/Geçen Ay/Son 3-6 Ay/Bu Yıl/Son 1 Yıl/Tüm Zamanlar + son 12 ay + özel aralık), tarihe göre gruplama ("Bugün"/"Dün"/gün adı/tarih), taksitli harcama (taksit sayısı, sabit aylık ödeme veya "her taksit farklı tutar" özel modu, `installment_plans` tablosu), "Kart (isteğe bağlı)" alanı (sadece kredi/banka kartı ödeme yönteminde), ürün adına göre otomatik kategori tahmini (`category_predictor.dart`'taki ~250 kurallık Türkçe sözlük birebir portlandı), "Gruba Ekle" (harcamayı bir veya birden çok gruba paylaşma + "ikisinde de/sadece grupta" görünürlük seçimi, `expense_groups` + `expenses.visibility`), "💳 Taksitler" filtre çipi.
- [x] Gelirlerim + Sabit Giderler — sekmeli tek sayfa, gerçek `incomes`/`fixed_expenses` + kategori tabloları, sabit gider "ödendi" toggle'ı. **Mobil detay-parite geçişiyle genişletildi:** üçüncü sekme olarak Değişken Giderler eklendi (aynı dönemdeki `expenses` kayıtları), ortak Dönem Seçin filtresi üç sekmeye de uygulanıyor, NET BAKİYE kartı (Gelir − Sabit − Değişken; mobildeki ekran kartı sadece Gelir − Sabit hesaplıyor, Excel raporu ise üçünü de düşüyor — bu tutarsızlık web'de bilinçli olarak DOĞRU/3-bileşenli formülle çözüldü), "Excel'e Aktar" butonu (`xlsx` paketiyle 5 sayfalı gerçek dosya indirme: Özet/Gelirler/Sabit Giderler/Değişken Giderler/Satın Alınan Ürünler — mobildeki native paylaşım sheet'i yerine tarayıcı indirmesi).
- [x] Net Bakiye & Gelir-Gider — bu ay özeti + son 6 ay gelir/gider/net trend grafiği (recharts).
- [x] Borçlarım — borç aldım/verdim ayrımı, toplam borç/alacak kartları, vade, "kapandı" toggle'ı. `user_debts` (text PK — `crypto.randomUUID()` ile üretiliyor). **Mobil detay-parite geçişiyle genişletildi:** üst kartlarda yön okları (Alacaklarım = yeşil ↑, Borçlarım = kırmızı ↓), filtre sekmeleri (Tümü/Alınan/Verilen/Ödenmedi — mobildeki gibi bu sekmeler her zaman sadece AÇIK kayıtları gösteriyor), ayrı bir "Borç Geçmişi" arşiv görünümü (sadece kapanmış kayıtlar, kendi dönem filtresiyle: Tümü/Bu Hafta/Bu Ay/Son 3-6 Ay/Bu Yıl/Geçen Yıl), kart üzerinde tip rozeti + renkli sol çerçeve + Türkçe ondalık ayraç destekli tutar girişi (`1.234,56` → `1234.56`), Hatırlatıcı toggle'ı (vade tarihi + panoda "Bugün/Yarın/Dün" vurgusu — **tarayıcı push bildirimi henüz YOK**, mobildeki yerel bildirim web'e taşınmadı, bkz. Açık Sorular).
- [x] Hedeflerim — ilerleme çubuklu hedef kartları, "Para Ekle" ile `goals.saved_amount` güncelleme + `goal_transactions` kaydı. `savings_pool` havuz akışı bu fazda YOK (doğrudan hedefe ekleme var) — bkz. Açık Sorular.
- [x] Yatırımlarım — mobildeki `AssetType` enum'u birebir portlandı (altın/kripto/döviz/gümüş). Canlı piyasa fiyatı YOK, sadece alış maliyeti takibi — bkz. Açık Sorular.
- [x] Abonelikler — aylık toplam gider özeti, ekle/duraklat/etkinleştir/sil/düzenle. **Mobil detay-parite geçişiyle genişletildi:** periyot/tarihler/ödeme yöntemi/kart etiketi/durum/bildirim alanları, canlı aylık↔yıllık önizleme.
- [x] Gruplarım — TEMEL sürüm: grup oluştur, listele, detay sayfasında ortak harcamalar (`expense_groups` join). Davet/üye listesi/sohbet/harcama paylaştırma bu fazda YOK — RLS'nin `group_invites`/`group_members` üzerindeki kısıtları nedeniyle ayrı bir oturumda ele alınmalı, bkz. Açık Sorular.
- [x] Analizler & Raporlar — **mobil detay-parite geçişiyle 4 sekmeli yapıya genişletildi:** Harcamalar (dönem filtresi + carousel: Kategori Dağılımı/Genel Kategoriler/Market Analizi + 6 Aylık Trend), Gelir-Gider (ayrı bar + ayrı net bakiye trend grafiği), Abonelikler (özet/insight/trend/timeline), Grup (üye bazlı harcama). Detaylar için Kararlar Günlüğü'ndeki "ikinci detay-parite turu" girdisine bkz.
- [x] AI Sohbet — mobil tarafta zaten var olan, sunucu taraflı ve JWT korumalı `fisle-ai-chat` Supabase Edge Function'ına bağlandı (Gemini key client'a hiç gelmiyor).
- [x] Özet Oluştur (`/reports`) — **AI Sohbet'ten TAMAMEN AYRI, gerçek rapor özelliği** (mobildeki `reports` modülü, AI değil): dönem seçimi (Günlük/Aylık) → `report_service.dart`'taki `generateReport()` ile birebir aynı sorgularla (expenses+items, incomes, fixed_expenses, user_debts, goals, subscriptions) özet ekranı — Gelir/Gider/Net kartları, kategori donut grafiği, borç/alacak, hedefler, abonelikler, ürün detay tablosu. PDF/Excel export yerine tarayıcının native `window.print()`'i kullanılıyor ("Yazdır / PDF Kaydet" butonu) — mobildeki `pdf`/`printing` paket bağımlılığı web'e taşınmadı, bkz. Açık Sorular. Dashboard'daki "Özet Oluştur" butonu `/reports`'a yönlendiriyor (düzeltme: ilk yazımda yanlışlıkla AI Sohbet'e yönlendirilmişti).
- [x] Notlar — tam sayfa not ızgarası, renk seçimi, tamamlandı işaretleme, silme. `user_notes` (text PK).
- [x] Ayarlar — Profil (ad düzenleme, gerçek `users.name` update), Görünüm (tema seçici). Bildirimler mobilde cihaz-yerel olduğu için web'e henüz taşınmadı (bilgilendirme notu var).

---

## Faz 3 — Esnaf Modu

Mobilde de önce ortak altyapı, sonra sektörel modüller sırasıyla inşa edilmişti (bkz. proje hafızası) — web'de aynı sıra izlendi.

- [x] **Ortak Esnaf Altyapısı** (bu fazda tamamlandı):
  - İşletme kurulum formu (`/esnaf`) — sektör seçimi (mobildeki `BusinessSectors.all` ile birebir 6 sektör), işletme adı/vergi no/telefon/KDV oranı. `businesses` tablosuna `sector` + `business_type` (sektöre göre otomatik türetiliyor) yazıyor.
  - Aktif işletme mekanizması — mobil `active_business_provider.dart`'ın (SharedPreferences) web karşılığı: `fisstech-active-business` cookie'si + Server Action (`src/lib/esnaf/active-business.ts`). Birden fazla işletmesi olan kullanıcılar için üstte switcher.
  - Esnaf alt-navigasyonu (Pano/Kasa Defteri/Faturalar/Personel/Stok/Raporlar) — `/esnaf/(dashboard)` route group'u altında, ana Sidebar'ın içinde (mobildeki gibi tamamen ayrı bir shell değil, tek sayfa uygulaması içinde ikinci seviye tab bar).
  - **Pano** — bu ay ciro/gider/kâr özeti + son işlemler.
  - **Kasa Defteri** — gelir/gider hızlı giriş, `business_service_chips` ile hızlı fiyat seçimi, KDV inclusive hesaplama (mobildeki gibi `tutar × oran / (100+oran)`).
  - **Faturalar** — giden/gelen ayrımı, KDV exclusive hesaplama (`tutar × oran / 100`), ödendi işaretleme.
  - **Personel & Maaş** — çalışan ekle/sil, `ensureSalaryRecords()` ile her ay otomatik maaş kaydı oluşturma (mobildeki `EmployeeService.ensureSalaryRecords()` ile aynı mantık), ödendi toggle.
  - **Stok** — ürün ekle/sil, giriş/çıkış/sayım hareketleri ile `current_qty` atomik güncelleme, kritik seviye rozeti.
  - **İşletme Raporları** — son 6 ay ciro/gider trend grafiği, bu ay KDV özeti (tahsil/ödenen/net), gider kategorisi kırılımı.
  - **Bugünkü Ciro kartı** (Kasa Defteri'nde) — mobildeki Kafe/Restoran "Kasa & Tahsilat" ekranının hero kartıyla aynı fikir (bugünkü ciro + hesap/işlem sayısı), kullanıcı geri bildirimiyle eklendi. `getDailyTotals()` — sadece bugünün `business_incomes`/`business_expenses` kayıtlarını toplar.
  - **Evrak Arşivi** (`/esnaf/evrak`, TÜM sektörler) — çoklu belge yükleme + seri tarama: her dosya `scan-receipt` edge function'ına (Fiş Tara'daki AYNI, zaten deploy edilmiş fonksiyon) gönderilir, sonuç (mağaza/tarih/tutar) fatura taslağına (karşı taraf/tarih/tutar) eşlenir, kullanıcı düzenleyip toplu kaydeder. Görseller `receipts` bucket'ına yüklenir, `invoices.image_url` alanına yazılır (mobil şemada ayrı bir "documents" tablosu yok — evrak arşivi = görseli olan faturalar). **Not:** `scan-receipt` fiş için optimize edilmiş bir prompt kullanıyor, genel evrak/fatura OCR'ı için özel tasarlanmamış — pratikte mağaza adı/tarih/tutar çoğu belgede makul çıkarılıyor ama mükemmel değil; ileride evraka özel bir edge function daha doğru olur (bkz. Açık Sorular).
  - **Menü Yönetimi** (`/esnaf/menu`, SADECE Yeme & İçme/`business_type='kafe'`) — kategori + ürün CRUD, `031_kafe_restoran.sql`'deki `menu_categories`/`menu_items` tablolarına yazıyor. Diğer sektörlerde bu sekme gösterilmiyor (nav sektöre göre koşullu) ve direkt URL ile girilirse "yakında" mesajı gösteriyor (masa/adisyon/sipariş gibi kafe'nin diğer özellikleri henüz yok, bkz. Açık Sorular).
- [ ] **Premium gating uygulanmadı** — mobilde Esnaf Modu `users.esnaf_plan === 'esnaf_premium'` ile kilitli; web'de henüz ödeme/premium akışı olmadığından herhangi bir giriş yapmış kullanıcı erişebiliyor. Bilinçli bir kapsam kararı, bkz. Açık Sorular.
- [ ] Modül 1 — Hizmet & Bakım *(sektör seçilebiliyor ama modüle özel ekranlar yok — ortak altyapı kullanılıyor)*
- [ ] Modül 2 — Hızlı Perakende *(aynı durum)*
- [x] Modül 3 — Yeme & İçme *(kısmi — Menü Yönetimi var; masa/adisyon/sipariş/paket servis yok)*
- [ ] Modül 4 — Yüksek Hacimli Satış *(aynı durum)*
- [ ] Modül 5 — Toptancı & İmalatçı *(aynı durum)*
- [ ] Modül 6 — Serbest Meslek & Proje *(aynı durum)*

---

## Faz 4 — Senkronizasyon & Entegrasyon

- [x] Mobil ile ortak backend/API bağlantısı kuruldu (aynı Supabase projesi, `@supabase/ssr`)
- [x] Fiş tarama AI pipeline'ı (`scan-receipt` Supabase Edge Function, Gemini 2.5 Flash) web'den tetiklenebiliyor
- [x] AI Sohbet pipeline'ı (`fisle-ai-chat` Supabase Edge Function, Gemini 2.5 Flash + function calling) web'den tetiklenebiliyor
- [ ] Gerçek zamanlı/kısa gecikmeli veri senkronizasyonu (mobil ↔ web) — Faz 1/2 kapsamında yok, sayfa yenilemesiyle (`router.refresh()`) güncel veri geliyor
- [ ] Esnaf modülü seçimi mobil ve web arasında senkron *(Esnaf Modu web'e henüz gelmedi)*

**Önemli mimari not (Esnaf-lokal-OCR için hâlâ geçerli):** Mobildeki Esnaf-lokal-OCR özelliği Gemini'yi `google_generative_ai` paketiyle **doğrudan client'tan, gömülü bir API key ile** çağırıyor. Bu pattern web'de KULLANILMAMALI. AI Chat için bu artık bir sorun değil — mobilde de aslında sunucu taraflı `fisle-ai-chat` edge function'ı zaten mevcuttu (mobil client'ın onu kullanmıyor olması ayrı bir konu), web bunu doğrudan kullanıyor. Esnaf Modu fazına gelindiğinde OCR için benzer bir sunucu taraflı çözüm (yeni Edge Function veya Route Handler) tasarlanmalı.

---

## Faz 5 — Cilalama & Yayına Hazırlık

- [x] Responsive test (mobil ~390px / tablet ~768px / masaüstü ~1440px) — auth ekranlarında Playwright ile, Dashboard'da gerçek kullanıcı hesabıyla doğrulandı
- [ ] Erişilebilirlik kontrolü (klavye odağı, kontrast, azaltılmış hareket) — renk kontrastları hesaplanarak doğrulandı (bkz. Kararlar Günlüğü), `prefers-reduced-motion` desteği eklendi; tam a11y taraması bekleniyor
- [ ] Performans/yükleme hızı kontrolü
- [ ] Gerçek içerik/metin geçişi
- [ ] Yayına alma

---

## Kararlar Günlüğü (Decision Log)

- **18 Temmuz 2026:** Web sitesinde tema seçimi 4'ten (mobildeki Yeşil/Karanlık/Vintage/Gül) 2'ye (Açık/Koyu) düşürüldü. Gerekçe: web'de öncelik marka tutarlılığı ve profesyonel ilk izlenim.
- **18 Temmuz 2026:** Tech stack: Next.js (App Router, TypeScript) + Tailwind CSS v4 + Supabase (`@supabase/supabase-js` + `@supabase/ssr`). Next.js 16 kurulduğu için `middleware.ts` yerine yeni `proxy.ts` dosya kuralı kullanıldı (kırıcı değişiklik — paketin kendi `node_modules/next/dist/docs/` dokümantasyonundan doğrulandı).
- **18 Temmuz 2026:** Açık Mod token'ları: bg `#F8F5F2`, surface `#FFFFFF`, accent `#B23A65` (mobil CTA rengiyle aynı), text-primary `#241A1E`, text-secondary `#6B5A60`. Koyu Mod: bg `#1B1417`, surface `#241B1F`, accent `#E85D8A` (AA kontrastı için parlatıldı), text-primary `#F5EDEF`. Semantik renkler (success/danger) koyu modda mobil değerlerinden açıklaştırıldı çünkü ham değerler koyu zeminde AA kontrastını geçemiyordu (hesaplanan kontrast oranları koda yorum olarak not düşüldü).
- **18 Temmuz 2026:** Font çifti: Bricolage Grotesque (display) + Plus Jakarta Sans (body), `next/font/google` ile self-host.
- **18 Temmuz 2026:** Navigasyon: sol sidebar (masaüstünde tam, tablette ikon-rail, mobilde slide-over drawer) — 15 üst düzey bölüm bir top-nav'a sığmadığı için.
- **18 Temmuz 2026:** `src/lib/types/database.ts` el yazımı olarak, `fisle_app/supabase/migrations/*.sql` dosyaları doğrudan okunarak (tahmin değil) oluşturuldu. `supabase login` sonrası `supabase gen types typescript` ile değiştirilmesi planlanıyor.
- **18 Temmuz 2026:** Fiş Tara kredi mantığı mobildeki `scan_service.dart`/`scan_screen.dart` davranışıyla birebir: kredi taramadan ÖNCE tüketiliyor; tarama başarısız/okunamaz olsa bile kredi otomatik iade EDİLMİYOR (sadece kullanıcı inceleme ekranında "İptal" derse iade ediliyor). Uzun Fiş (çoklu) modunda tüm sayfalar için TEK kredi harcanıyor, sayfa başına değil.
- **18 Temmuz 2026:** Gerçek kullanıcı hesabıyla canlı testte bulunan hata düzeltildi — `Sidebar` bir Server Component olarak Lucide ikon bileşeni içeren `NavItem` objesini `"use client"` olan `NavLink`'e prop olarak geçiriyordu; React Server Components fonksiyon/bileşen referanslarının server→client sınırını geçmesine izin vermiyor ("Only plain objects can be passed to Client Components..."). Çözüm: `Sidebar`'a `"use client"` eklendi (zaten sunucu tarafı bir işi yoktu). **Genel kural:** bir Server Component, içinde bileşen/fonksiyon referansı barındıran bir objeyi (örn. `{icon: LucideIcon}`) bir Client Component'e prop olarak geçiremez — ya kaynak Server Component'i client yap, ya da ikonu orada `<item.icon />` olarak elemente çevirip children/slot olarak geçir.
- **18 Temmuz 2026:** Dashboard, gerçek kullanıcı hesabıyla (mevcut mobil verileriyle) canlı doğrulandı — ay seçici, aylık toplam hero kart, Gelir/Gider/Net Bakiye, boş grup durumu doğru render oluyor.
- **18 Temmuz 2026:** Faz 2 kararı: kullanıcı "faz 2 başla hepsini yap" dedi — tüm bireysel modüller tek oturumda, aynı desenle (Server Component veri çekimi + Client Component dialog form + `supabase` browser client ile doğrudan insert/update/delete + `router.refresh()`) inşa edildi. Grafikler için `recharts` eklendi (Tailwind CSS custom property'leriyle temaya uyumlu).
- **18 Temmuz 2026:** AI Sohbet için mobil kod tabanında zaten var olan `supabase/functions/fisle-ai-chat/index.ts` keşfedildi — tam sunucu taraflı, JWT doğrulamalı, kullanıcının harcama verisini kendi çekip Gemini'ye bağlam olarak veren, `{reply}` döndüren bir edge function. Web `scan-receipt` ile aynı desenle (`supabase.functions.invoke`) buna bağlandı — yeni bir sunucu mimarisi kurmaya gerek kalmadı.
- **18 Temmuz 2026:** Gruplarım kasıtlı olarak temel tutuldu. `004_fix_rls_recursion.sql`'deki `group_invites_manage` politikası `FOR ALL USING (group_id IN get_owned_groups())` — yani grup SAHİBİ olmayan bir kullanıcı, kendisine gönderilen bir daveti token ile SELECT bile edemiyor (RLS engelliyor). Mobil kodda `getInviteByToken()` düz bir `.select()` çağrısı yapıyor; bu policy ile bu çağrının normal (owner olmayan) bir davetli için çalışması teknik olarak mümkün görünmüyor — ileride bu ya yeni bir SECURITY DEFINER RPC (bkz. `accept_business_invite` örneği) ile çözülmeli ya da mobildeki gerçek davranış daha derinlemesine doğrulanmalı. Bu nedenle web'de davet/katılma akışı bilinçli olarak ERTELENDİ, yanlış çalışan bir şey inşa edilmedi.
- **18 Temmuz 2026 (canlı testte bulunan 3 hata düzeltildi):**
  1. `NavLink` bileşeninde `collapsed && "lg:hidden"` yazılmıştı — Tailwind'de bu, etiketi TAM TERSİ şekilde masaüstünde (lg+) gizliyordu, tablette gösteriyordu. Doğrusu `collapsed && "hidden lg:inline"` — masaüstünde göster, tablette (icon-rail) gizle. `Sidebar`'daki `md:w-18` de geçersiz bir Tailwind class'ıydı (Tailwind'in standart skalasında "18" yok) → `md:w-16` yapıldı.
  2. AI Sohbet hata veriyordu ama neden belirsizdi — `invokeAiChat` hata mesajını görmezden gelip jenerik bir mesaj gösteriyordu. `@supabase/functions-js`'in `FunctionsHttpError.context`'i (ham `Response` objesi) okunarak edge function'ın gerçek `{error: "..."}` gövdesi kullanıcıya gösterilecek şekilde düzeltildi — asıl sebep bir sonraki canlı testte görülecek.
  3. **"Özet Oluştur" yanlış anlaşılmıştı** — AI Sohbet'e yönlendirilmişti ama mobildeki gerçek karşılığı tamamen ayrı bir modül (`features/reports/`): dönem seçimi + `ReportService.generateReport()` ile PDF/Excel'e dönüştürülen kapsamlı bir finansal rapor. `report_service.dart` ve `report_generator.dart` incelenerek doğru şekilde `/reports` altında yeniden inşa edildi. Ayrıca "Alınan Ürünler" tablosu, kullanıcı geri bildirimiyle mobildeki gibi tarih bazlı çerçeveli gruplara dönüştürüldü.
- **18 Temmuz 2026:** `fisle-ai-chat` edge function'ında `GEMINI_MODELS = ['gemini-1.5-flash']` — bu model Google tarafında artık mevcut değil (404). Kullanıcıya düzeltilmiş kod verildi (`['gemini-2.5-flash', 'gemini-2.0-flash']`, `scan-receipt`'in zaten kullandığı modelle aynı) — kullanıcı Supabase Dashboard'dan deploy etti. Model hatası düzeldi ama ardından Gemini API 429 (kota) hatası çıktı — bu artık kod sorunu değil, Google AI Studio/Cloud tarafındaki key'in kota/faturalandırma kısıtı. Kullanıcı kararıyla bu konu ERTELENDİ, Faz 3'e geçildi.
- **18 Temmuz 2026:** Faz 3 (Esnaf Modu) kapsamı: kullanıcı "diğer faza geç" dedi, mobildeki gerçek build sırası (önce ortak altyapı — `026_esnaf_modu.sql`, sonra sektörel modüller) esas alınarak SADECE ortak altyapı bu oturumda inşa edildi. 6 sektörün her biri mobilde ayrı, büyük alt sistemler (kendi tabloları, kendi ekran setleri) olduğu için tek oturumda hepsini yapmak yerine önce sağlam bir temel kuruldu; sektör modülleri sıradaki iş.
- **18 Temmuz 2026:** Esnaf Modu'nda aktif işletme takibi için mobildeki `SharedPreferences` yaklaşımı yerine web'e uygun bir cookie + Next.js Server Action deseni kullanıldı (`src/lib/esnaf/active-business.ts`) — Server Component'lerin de aktif işletmeyi okuyabilmesi için (client-only state yeterli olmazdı).
- **18 Temmuz 2026:** Esnaf Modu premium gating'i (mobildeki `esnaf_plan === 'esnaf_premium'` kontrolü) web'e kasıtlı olarak taşınmadı — web'de henüz ödeme/premium satın alma akışı yok, gating eklemek özelliği test edilemez hale getirirdi. Bkz. Açık Sorular.
- **18 Temmuz 2026:** Kullanıcı mobil ekran görüntüsüne bakarak 3 somut ekleme istedi: Kasa Defteri'ne "Bugünkü Ciro" kartı, Yeme-İçme'ye özel Menü Yönetimi, tüm sektörlere Evrak Arşivi + seri tarama. Menü Yönetimi için `031_kafe_restoran.sql`'deki `menu_categories`/`menu_items` şeması doğrudan okunarak doğrulandı. Evrak Arşivi için ayrı bir "documents" tablosu OLMADIĞI için (mobil şemada yok), `invoices.image_url` alanı üzerinden modellendi — taranan her evrak bir fatura kaydı oluşturuyor.
- **18 Temmuz 2026:** Evrak tarama için YENİ bir edge function kurmak yerine mevcut `scan-receipt` (Fiş Tara'nın kullandığı, zaten deploy ve test edilmiş) yeniden kullanıldı — AGENTS.md kural 7 gereği (Esnaf OCR client-side key ile YAPILMAZ), yeni bir sunucu fonksiyonu gerekirdi ama bu iş mevcut altyapıyla (farklı bir alan eşlemesiyle: store_name→karşı taraf, total→tutar) çözülebildiği için tercih edildi. Kesin doğruluk mağaza fişi kadar yüksek olmayabilir (prompt fiş odaklı) — kullanıcı sonucu her zaman düzenleyip onaylıyor, bu yüzden güvenli.
- **18 Temmuz 2026:** `.next` klasörünü çalışan dev server ile aynı anda silmek "Internal Server Error" (dev server'ın normal hata ekranı bile açamayacağı bir çökme) yarattı — bunu iki kez yaşadık. Kural: dev server çalışırken `.next` silinecekse önce sunucu durdurulmalı (port 3000'i dinleyen process kill edilip `.next` silinip sunucu yeniden başlatılmalı), asla canlı sunucunun altından silinmemeli.
- **18 Temmuz 2026 (mobil detay-parite geçişi):** Kullanıcı "web, mobil kadar detaylı değil" geri bildirimiyle Harcamalarım/Gelir-Gider/Borçlarım ekranlarının fisleapp'teki (`manual_expense_screen.dart`, `income_fixed_expense_screen.dart`, `debt_bottom_sheet.dart`, `period_helper.dart`, `category_predictor.dart`, `export_service.dart`) TAM özellik setinin çıkarılıp uygulanmasını istedi. Read-only bir keşif ajanıyla mobil kaynak dosyaları satır satır incelendi, sonra web'e birebir portlandı: ortak `PeriodHelper`/`PeriodSelector` (`src/lib/utils/period.ts`, `src/components/ui/period-selector.tsx`), 250 kurallık kategori tahmin sözlüğü (`src/lib/expenses/category-predictor.ts`), taksit hesap mantığı (`src/lib/expenses/installment.ts`), Excel export (`src/lib/income/export.ts`, `xlsx` paketi eklendi). Gelir-Gider ekranındaki NET BAKİYE formülü mobilde ekran/Excel arasında tutarsızdı (ekran: Gelir−Sabit, Excel: Gelir−Sabit−Değişken) — web'de bilinçli olarak Excel'deki (daha doğru, 3 bileşenli) formül tek doğruluk kaynağı yapıldı, mobildeki hata tekrarlanmadı.
- **18 Temmuz 2026:** `xlsx` (SheetJS Community Edition) npm paketinin güncel sürümünde bilinen Prototype Pollution / ReDoS güvenlik uyarıları var — ancak bunlar `XLSX.read()` ile GÜVENİLMEYEN dosya AYRIŞTIRIRKEN tetiklenir. Web'de sadece `XLSX.write`/`writeFile` (dosya ÜRETME) kullanılıyor, hiçbir yerde kullanıcı tarafından yüklenen bir xlsx dosyası parse edilmiyor — bu risk yüzeyinin dışında, bilinçli kabul edildi.
- **18 Temmuz 2026:** Tasarım sistemi kuralı hatırlatması: `warning` (#F5A623) rengi bg üzerinde sadece 1.87:1 kontrast veriyor — düz metin rengi olarak KULLANILAMAZ (sadece dolgu rozet/ikon). Değişken Giderler sekmesinde harcama tutarları bu yüzden `text-warning` değil `text-accent` ile renklendirildi.
- **18 Temmuz 2026 (ikinci detay-parite turu — kullanıcı canlı testte 4 somut sorun bildirdi):**
  1. **`Switch` bileşeninde hizalama hatası** ("taksit butonu açınca yamuluyor", "hatırlatıcıdaki buton kayıyor") — kök neden: thumb `<span>`'ına `left` değeri hiç verilmemişti (`absolute top-0.5 ...` ama `left-*` yok), bu da tarayıcıya göre farklı statik konumlanmaya (drift) yol açıyordu. `left-0.5` sabit taban + `checked` olunca `translate-x-5` deltası şeklinde düzeltildi — artık her yerde (taksit toggle'ı, hatırlatıcı toggle'ı, gruba-ekle görünürlük toggle'ı) tutarlı.
  2. **"Taksitler uygulanmıyor" — asıl eksik, mobildeki "Ödeme Takvimi" ekranıydı.** Web'de taksitli bir harcamaya tıklayınca sadece düzenleme formu açılıyordu; mobilde ayrı bir detay sayfası (`expense_detail_screen.dart`) taksit taksit "Ödendi/Bekliyor" listesi, ilerleme çubuğu, düzenlenebilir Başlangıç Tarihi (değişince TÜM ödeme tarihleri + paid-state'ler yeniden hesaplanıyor — mobildeki gerçek davranış, elle işaretlenmiş özel durumlar bu işlemde kasıtlı olarak sıfırlanıyor) ve salt-okunur Bitiş Tarihi gösteriyordu. Bu birebir portlandı: `/expenses/[id]` (yeni route) + `InstallmentScheduleCard` (`src/components/modules/expenses/installment-schedule-card.tsx`) + taksit hesap yardımcıları (`src/lib/expenses/installment.ts`: `paymentDate`, `autoPaidStates`, `autoAdvance`, `remainingAmount`). Her taksit satırına tıklayınca `installment_plans.paid_states` + türetilmiş `paid_count` birlikte güncelleniyor (mobildeki `_persist` ile aynı). Harcamalarım listesinde taksitli harcamalar artık bu detay sayfasına, normal harcamalar hâlâ doğrudan düzenleme formuna gidiyor.
  3. **Analiz sayfası mobil kadar detaylı değildi.** `analytics_screen.dart` (2967 satır) satır satır incelenip 4 sekmeli yapı birebir portlandı: **Harcamalar** (dönem filtresi + kaydırmalı/dot-indicator'lı carousel: Kategori Dağılımı donut / Genel Kategoriler donut (parent_group bazlı, mobildeki `parentGroupIcon()` switch'i birebir portlandı) / Market Analizi (mağaza adı normalize edilip donut + "Alışveriş Sıklığı" bar chart) + "6 Aylık Trend"), **Gelir-Gider** (ayrı "Gelir-Gider Karşılaştırması" bar chart + ayrı "6 Aylık Net Bakiye Trendi" line chart, sıfır çizgisi + işarete göre yeşil/kırmızı nokta rengi — mobildeki gibi TEK combined chart değil, İKİ AYRI kart), **Abonelikler** (özet kart, "Bu yıl toplam X harcandı" bilgi kutusu, Aylık Maliyet Trendi, Zaman Çizelgesi/Gantt timeline, "Tüm Abonelikleri Yönet"), **Grup** (grup seçici + dönem filtresi + Üye Bazlı Harcama progress bar listesi, `getMemberSpendTotals()` yeni eklendi). Kategori kırılımı hesaplaması mobildeki gibi taksitli harcamaları "sadece dönem içine düşen VE ödenmiş taksit tutarı" olarak, aktif abonelikleri de dönem uzunluğuna göre ölçeklenmiş ("Abonelikler" adında) bir sözde-kategori olarak katıyor (`_installmentBoundedAmount`/`_subMultiplier` birebir port edildi). **Not:** Genel Kategoriler sekmesinde taksitli harcamaların parent_group ataması, mobil kaynağın bu kısmı raporda kesilmiş olduğu için item bazlı mantıktan simetrik olarak çıkarsandı (doğrudan doğrulanmadı) — bkz. Açık Sorular. Bütçe/Limit kartı (`category_limits` tablosu) bu turda kapsam dışı bırakıldı, web'de henüz limit CRUD'u yok.
  4. **6 aylık grafiklerin çizgisi başlangıç değerinden geçmiyordu.** Kök neden muhtemelen Bar+Line'ın tek bir `ComposedChart`'ta karışık kullanılmasıydı. Çözüm olarak mobildeki gibi AYRI kartlara bölündü + trend çizgileri için Y ekseni sıfırdan başlayacak şekilde sabitlendi (`domain={[0,...]}`) + çizginin altına hafif gradient dolgu (`Area`) eklendi — mobildeki "alan altı gradient dolgu" detayına daha yakın.
  5a. **"Kaydırarak geçme" mobil deseni web'e uygun değildi.** Kullanıcı: "bir web sitesi geliştiriyoruz mobil uygulama değil, kaydırarak geçmeli şeyler olmamalı" — Harcamalar sekmesindeki `ChartCarousel`'in dot-indicator + touch-swipe mantığı tamamen kaldırıldı, yerine sitenin geri kalanıyla tutarlı sıradan `Tabs` (tıklanabilir sekme) bileşeni kondu. Genel ilke: bundan sonra hiçbir yeni bileşen swipe/touch tabanlı sayfalama kullanmayacak.
  5b. **"Son 6 Ay Trend" (bar+line combo) grafiğinde sıfır çizgisi eksikti.** `/balance` (Net Bakiye & Gelir-Gider), Esnaf Raporları ve Özet Oluştur'un paylaştığı `BalanceTrendChart`'a (ComposedChart) `ReferenceLine y={0}` eklendi — Analiz sayfasındaki yeni `NetBalanceTrendChart`'ta zaten vardı, bu eski/paylaşılan bileşende eksikti.
  6. **Abonelik formu/listesi mobil kadar detaylı değildi.** `add_subscription_screen.dart` incelenip form genişletildi: Periyot toggle, Başlangıç Tarihi (isteğe bağlı), Bitiş Tarihi (isteğe bağlı), Ödeme Yöntemi (Belirtme/Kredi Kartı/Banka Kartı/Nakit + kart etiketi), "Hatırlatmaları Aç" toggle (mobildeki "Yenileme tarihinden 3 gün önce" alt yazısıyla — **not:** bu sadece veri olarak kaydediliyor, web'de henüz gerçek bir bildirim gönderilmiyor, Borçlarım'daki Hatırlatıcı ile aynı sınırlama), Durum dropdown, canlı Aylık/Yıllık dönüşüm önizlemesi. **Önemli mobil-doğru detay:** Sonraki Yenileme Tarihi başlangıç tarihinden OTOMATİK hesaplanmıyor (mobilde de öyle) — kullanıcı elle giriyor. Liste artık satıra tıklayınca düzenleme modunu da destekliyor (öncesinde sadece ekle/duraklat/sil vardı).

---

## Açık Sorular / Bekleyen Kararlar

- **Esnaf Modu — 6 sektörel modülün kendine özgü ekranları yok.** Şu an sadece ortak altyapı (kasa/fatura/personel/stok/rapor) var; Hizmet&Bakım (randevu/ajanda), Hızlı Perakende (POS/barkod), Yeme&İçme (masa/adisyon), Yüksek Hacimli Satış (portföy/CRM), Toptan&İmalat (B2B/depo), Serbest Meslek (proje/müşteri) ekranları mobildeki gibi ayrı ayrı inşa edilmeli.
- **Esnaf Modu — premium gating yok.** Herhangi bir giriş yapmış kullanıcı erişebiliyor; mobildeki `esnaf_plan === 'esnaf_premium'` kısıtı web'de henüz uygulanmadı (ödeme akışı olmadığı için kasıtlı).
- **Esnaf Modu — işletme logosu/adres alanları formda yok**, sadece ad/vergi no/telefon/KDV. `businesses` tablosunda `address`/`logo_url` kolonları var ama form henüz kullanmıyor.
- **Evrak Arşivi'nde OCR doğruluğu sınırlı** — `scan-receipt` fiş için optimize; genel evrak/fatura için özel bir edge function (ayrı prompt) daha doğru sonuç verirdi. Şimdilik kullanıcı düzenleme adımıyla telafi ediliyor.
- **Menü Yönetimi'nin geri kalanı (masa planı, adisyon/sipariş, paket servis, ödeme alma) yok** — sadece kategori+ürün tanımlama var. `restaurant_tables`, `restaurant_orders`, `order_items`, `restaurant_payments` tabloları mevcut ama web'de hiç kullanılmıyor.
- Fiş yükleme alanı için özel illüstrasyon/mockup (blueprint §5.4 "imza öğesi") henüz yok — şu an ikon kompozisyonu placeholder olarak kullanılıyor, kod içinde TODO olarak işaretli.
- GitHub remote bağlantısı henüz kurulmadı — sadece local git repo (kullanıcı isteğiyle, ileride ele alınacak).
- Deployment hedefi (Vercel) henüz kesinleşmedi/kurulmadı.
- Fiş Tara akışının gerçek bir fiş fotoğrafıyla uçtan uca (yükle → tara → onayla → kaydet) testi kullanıcı tarafından henüz teyit edilmedi — Dashboard doğrulandı ama bu adım ayrıca kontrol edilmeli.
- **AI Sohbet — Gemini API 429 (kota) hatası.** Kod tarafı düzeldi (model adı güncellendi), ama Google AI Studio/Cloud tarafındaki `GEMINI_API_KEY`'in kota/faturalandırma durumu kontrol edilmeli. Kullanıcı kararıyla ertelendi.
- **Gruplarım — davet/katılma akışı yok.** `group_invites` RLS politikası owner-olmayan kullanıcıların daveti okumasını engelliyor gibi görünüyor (yukarıdaki karar notuna bkz.) — SECURITY DEFINER bir RPC ile çözülmeli.
- **Gruplarım — üye listesi, sohbet, harcama paylaştırma (split), yorum/reaksiyon yok.** Bunlar mobilde var olan büyük bir alt sistem; ayrı bir oturumda ele alınmalı.
- **Hedeflerim — `savings_pool` (genel birikim havuzu) akışı yok.** Şu an "Para Ekle" doğrudan hedefe ekleniyor; mobildeki havuzdan-hedefe transfer akışı web'e henüz taşınmadı.
- **Yatırımlarım — canlı piyasa fiyatı yok.** Mobildeki `get-investment-prices` edge function'ı ve `price_alerts` (fiyat alarmı) UI'ı web'e henüz bağlanmadı; sadece alış maliyeti üzerinden statik takip var.
- **Özet Oluştur — Excel export yok.** Mobildeki `ExportService().exportToExcel()` web'e taşınmadı, sadece tarayıcı `window.print()` (PDF olarak kaydet) var.
- AI Sohbet hatasının kesin sebebi henüz doğrulanmadı — düzeltilen hata-mesajı gösterimiyle bir sonraki canlı testte netleşecek (muhtemel adaylar: `fisle-ai-chat` fonksiyonunda `GEMINI_CHAT_API_KEY`/`GEMINI_API_KEY` secret'ının tanımlı olmaması ya da Gemini model/kota hatası).
- **Abonelikler Dashboard kutusu** hâlâ gerçek veriye bağlanmadı (Faz 1'de bilinçli bırakılmıştı, artık `subscriptions` şeması net — kolayca eklenebilir, sıradaki küçük iş).
- Yeni eklenen tüm modüllerin (Harcamalarım, Gelirlerim, Borçlarım, Hedeflerim, Yatırımlarım, Abonelikler, Gruplarım, Analizler, AI Sohbet, Notlar, Ayarlar) gerçek kullanıcı hesabıyla tarayıcıda uçtan uca teyidi henüz yapılmadı — build/lint/type-check temiz ama görsel/fonksiyonel doğrulama bekliyor.
- **Borçlarım — Hatırlatıcı tarayıcı bildirimi göndermiyor.** Toggle + vade tarihi kaydediliyor (panoda "Bugün/Yarın/Dün" olarak vurgulanıyor) ama gerçek bir push bildirimi tetiklemiyor — mobildeki yerel (`flutter_local_notifications`) bildirim mimarisi cihaz-yerel, web karşılığı Service Worker + Web Push API + bir zamanlanmış gönderim mekanizması (örn. Supabase Edge Function + `pg_cron`) gerektirir; bu ayrı bir altyapı işi olarak ertelendi.
- **Harcama formunda özel kategori ekleme yok.** Mobildeki `CategoryPickerSheet`'in "yeni kategori ekle" özelliği web'e taşınmadı — mevcut kategori listesinden seçim var, otomatik tahmin de çalışıyor, ama yeni kategori oluşturma bu formda yok (Ayarlar'dan genel kategori yönetimi ayrı bir konu).
- Harcamalarım/Gelir-Gider/Borçlarım'daki yeni Dönem Seçin filtresi, taksit akışı, Gruba Ekle ve Excel export'un gerçek kullanıcı hesabıyla tarayıcıda uçtan uca teyidi henüz yapılmadı — build/lint/type-check temiz.
- **Abonelikler — Hatırlatmaları Aç toggle'ı da gerçek bildirim göndermiyor** (Borçlarım'daki Hatırlatıcı ile aynı altyapı eksikliği — bkz. yukarıdaki madde).
- **Analiz — Genel Kategoriler sekmesinde taksitli harcamaların parent_group ataması doğrudan doğrulanmadı.** Mobil kaynaktaki (`getParentCategoryBreakdown`) installment özel-durumu kod alıntısı raporda kesildiği için, kategori-bazlı kırılımdaki (`getCategoryBreakdown`) aynı desen simetrik olarak uygulandı (ilk kalemin `parent_group`'u kullanılıyor) — davranışı gerçek taksitli bir harcamayla tarayıcıda doğrulamak gerekiyor.
- **Analiz — Bütçe/Limit kartı yok.** Mobildeki `getCategoryLimits()`/`category_limits` tablosu bu turda kapsam dışı bırakıldı; web'de henüz kategori limiti CRUD'u (Ayarlar'da da) yok.
- Taksit ödeme takvimi (`/expenses/[id]`), 4 sekmeli Analiz sayfası ve genişletilmiş Abonelik formunun gerçek kullanıcı hesabıyla tarayıcıda uçtan uca teyidi henüz yapılmadı — build/lint/type-check temiz.

**Çözülen (referans için tutuluyor):** Supabase projesinde e-posta doğrulamasının açık olup olmadığı — canlı testte `signUp()` çağrısının e-posta gönderme rate-limitine takılması bunun AÇIK olduğunu doğruladı.
