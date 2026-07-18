# PROGRESS.md — Fişştech Web Sitesi Geliştirme Takibi

> Bu dosya projenin neresinde olduğumuzu gösterir. Her önemli aşama tamamlandığında güncellenmeli. En son güncelleme tarihini üstte tut.

**Son güncelleme:** 18 Temmuz 2026

---

## Genel Durum

✅ **Faz 1 tamamlandı ve gerçek kullanıcı hesabıyla canlı doğrulandı.**
✅ **Faz 2 (tüm bireysel kullanıcı modülleri) tamamlandı ve gerçek kullanıcı hesabıyla canlı doğrulandı** (3 canlı-test hatası bulunup düzeltildi — bkz. Kararlar Günlüğü). AI Sohbet kodu düzeldi ama Google tarafındaki API kotası nedeniyle kullanıcı kararıyla ayrı ele alınacak.
🚧 **Faz 3 (Esnaf Modu) başlıyor.**

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
- [x] Harcamalarım — liste + manuel ekleme/düzenleme (kalemli, kategori seçimli), silme. `expenses`+`expense_items` gerçek tablolara yazıyor.
- [x] Gelirlerim + Sabit Giderler — sekmeli tek sayfa, gerçek `incomes`/`fixed_expenses` + kategori tabloları, sabit gider "ödendi" toggle'ı.
- [x] Net Bakiye & Gelir-Gider — bu ay özeti + son 6 ay gelir/gider/net trend grafiği (recharts).
- [x] Borçlarım — borç aldım/verdim ayrımı, toplam borç/alacak kartları, vade, "kapandı" toggle'ı. `user_debts` (text PK — `crypto.randomUUID()` ile üretiliyor).
- [x] Hedeflerim — ilerleme çubuklu hedef kartları, "Para Ekle" ile `goals.saved_amount` güncelleme + `goal_transactions` kaydı. `savings_pool` havuz akışı bu fazda YOK (doğrudan hedefe ekleme var) — bkz. Açık Sorular.
- [x] Yatırımlarım — mobildeki `AssetType` enum'u birebir portlandı (altın/kripto/döviz/gümüş). Canlı piyasa fiyatı YOK, sadece alış maliyeti takibi — bkz. Açık Sorular.
- [x] Abonelikler — aylık toplam gider özeti, ekle/duraklat/etkinleştir/sil.
- [x] Gruplarım — TEMEL sürüm: grup oluştur, listele, detay sayfasında ortak harcamalar (`expense_groups` join). Davet/üye listesi/sohbet/harcama paylaştırma bu fazda YOK — RLS'nin `group_invites`/`group_members` üzerindeki kısıtları nedeniyle ayrı bir oturumda ele alınmalı, bkz. Açık Sorular.
- [x] Analizler & Raporlar — ay bazlı kategori dağılımı (donut grafik) + son 6 ay gelir/gider trend grafiği + en çok harcanan kategoriler listesi.
- [x] AI Sohbet — mobil tarafta zaten var olan, sunucu taraflı ve JWT korumalı `fisle-ai-chat` Supabase Edge Function'ına bağlandı (Gemini key client'a hiç gelmiyor).
- [x] Özet Oluştur (`/reports`) — **AI Sohbet'ten TAMAMEN AYRI, gerçek rapor özelliği** (mobildeki `reports` modülü, AI değil): dönem seçimi (Günlük/Aylık) → `report_service.dart`'taki `generateReport()` ile birebir aynı sorgularla (expenses+items, incomes, fixed_expenses, user_debts, goals, subscriptions) özet ekranı — Gelir/Gider/Net kartları, kategori donut grafiği, borç/alacak, hedefler, abonelikler, ürün detay tablosu. PDF/Excel export yerine tarayıcının native `window.print()`'i kullanılıyor ("Yazdır / PDF Kaydet" butonu) — mobildeki `pdf`/`printing` paket bağımlılığı web'e taşınmadı, bkz. Açık Sorular. Dashboard'daki "Özet Oluştur" butonu `/reports`'a yönlendiriyor (düzeltme: ilk yazımda yanlışlıkla AI Sohbet'e yönlendirilmişti).
- [x] Notlar — tam sayfa not ızgarası, renk seçimi, tamamlandı işaretleme, silme. `user_notes` (text PK).
- [x] Ayarlar — Profil (ad düzenleme, gerçek `users.name` update), Görünüm (tema seçici). Bildirimler mobilde cihaz-yerel olduğu için web'e henüz taşınmadı (bilgilendirme notu var).

---

## Faz 3 — Esnaf Modu

- [ ] İşletme seçim/geçiş arayüzü *(route var, "yakında" placeholder)*
- [ ] Modül 1 — Hizmet & Bakım
- [ ] Modül 2 — Hızlı Perakende
- [ ] Modül 3 — Yeme & İçme
- [ ] Modül 4 — Yüksek Hacimli Satış
- [ ] Modül 5 — Toptancı & İmalatçı
- [ ] Modül 6 — Serbest Meslek & Proje
- [ ] Ortak esnaf özellikleri (çalışan yönetimi, fatura/gider, özet ekranı)

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

---

## Açık Sorular / Bekleyen Kararlar

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

**Çözülen (referans için tutuluyor):** Supabase projesinde e-posta doğrulamasının açık olup olmadığı — canlı testte `signUp()` çağrısının e-posta gönderme rate-limitine takılması bunun AÇIK olduğunu doğruladı.
