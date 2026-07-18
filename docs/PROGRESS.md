# PROGRESS.md — Fişştech Web Sitesi Geliştirme Takibi

> Bu dosya projenin neresinde olduğumuzu gösterir. Her önemli aşama tamamlandığında güncellenmeli. En son güncelleme tarihini üstte tut.

**Son güncelleme:** 18 Temmuz 2026

---

## Genel Durum

✅ **Faz 1 (iskelet + tasarım sistemi + auth + Dashboard + Fiş Tara) tamamlandı ve gerçek kullanıcı hesabıyla canlı doğrulandı.**

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
- [ ] Harcamalarım *(route var, "yakında" placeholder)*
- [ ] Gelirlerim *(route var, "yakında" placeholder)*
- [ ] Net Bakiye & Gelir-Gider *(route var, "yakında" placeholder)*
- [ ] Borçlarım *(route var, "yakında" placeholder)*
- [ ] Hedeflerim *(route var, "yakında" placeholder)*
- [ ] Yatırımlarım *(route var, "yakında" placeholder)*
- [ ] Abonelikler *(route var, "yakında" placeholder)*
- [ ] Gruplarım *(route var, "yakında" placeholder)*
- [ ] Analizler & Raporlar *(route var, "yakında" placeholder)*
- [ ] AI Sohbet & Özet Oluştur butonu *(route var, "yakında" placeholder — Dashboard'daki buton da disabled)*
- [ ] Notlar *(route var, "yakında" placeholder — Dashboard'da teaser widget'ı çalışıyor)*
- [ ] Ayarlar (Profil, Görünüm, Bildirimler, Yedekleme) *(route var, "yakında" placeholder)*

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
- [ ] Gerçek zamanlı/kısa gecikmeli veri senkronizasyonu (mobil ↔ web) — Faz 1 kapsamında yok, sayfa yenilemesiyle güncel veri geliyor
- [ ] Esnaf modülü seçimi mobil ve web arasında senkron *(Esnaf Modu web'e henüz gelmedi)*

**Önemli mimari not:** Mobildeki AI Chat ve Esnaf-lokal-OCR özellikleri Gemini'yi `google_generative_ai` paketiyle **doğrudan client'tan, gömülü bir API key ile** çağırıyor. Bu pattern web'de KULLANILMAMALI — tarayıcıda API key ifşa olur. Bu iki özellik web'e geldiğinde (AI Sohbet fazı, Esnaf Modu fazı) sunucu tarafı bir çözüm (yeni Edge Function veya Next.js Route Handler) tasarlanmalı.

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

---

## Açık Sorular / Bekleyen Kararlar

- `subscriptions` tablosunun tam kolon şeması Dashboard'a henüz bağlanmadı (Faz 1 kapsamı dışı bırakıldı, ileride Abonelikler modülü fazında ele alınacak).
- Fiş yükleme alanı için özel illüstrasyon/mockup (blueprint §5.4 "imza öğesi") henüz yok — şu an ikon kompozisyonu placeholder olarak kullanılıyor, kod içinde TODO olarak işaretli.
- GitHub remote bağlantısı henüz kurulmadı — sadece local git repo (kullanıcı isteğiyle, ileride ele alınacak).
- Deployment hedefi (Vercel) henüz kesinleşmedi/kurulmadı.
- Fiş Tara akışının gerçek bir fiş fotoğrafıyla uçtan uca (yükle → tara → onayla → kaydet) testi kullanıcı tarafından henüz teyit edilmedi — Dashboard doğrulandı ama bu adım ayrıca kontrol edilmeli.

**Çözülen (referans için tutuluyor):** Supabase projesinde e-posta doğrulamasının açık olup olmadığı — canlı testte `signUp()` çağrısının e-posta gönderme rate-limitine takılması bunun AÇIK olduğunu doğruladı.
