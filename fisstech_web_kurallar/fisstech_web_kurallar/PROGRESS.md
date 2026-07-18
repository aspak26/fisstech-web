# PROGRESS.md — Fişştech Web Sitesi Geliştirme Takibi

> Bu dosya projenin neresinde olduğumuzu gösterir. Her önemli aşama tamamlandığında güncellenmeli. En son güncelleme tarihini üstte tut.

**Son güncelleme:** 18 Temmuz 2026

---

## Genel Durum

🟡 **Planlama tamamlandı, geliştirme henüz başlamadı.**

---

## Faz 0 — Planlama & Blueprint

- [x] Mobil uygulama ekranları incelendi, tasarım sistemi çıkarıldı
- [x] `Fisstech_Web_Blueprint.md` oluşturuldu (tasarım sistemi + tam özellik listesi + bilgi mimarisi)
- [x] Tema stratejisi netleştirildi (Web: Açık/Koyu Mod — mobildeki 4 temadan farklı)
- [x] `AGENTS.md` oluşturuldu (ajan kuralları)
- [x] `PROGRESS.md` oluşturuldu (bu dosya)
- [ ] Kesin tasarım token'ları (hex kodları, font seçimi) netleştirilecek
- [ ] Teknoloji yığını (stack) kararı verilecek

---

## Faz 1 — Tasarım Sistemi Kurulumu

- [ ] Renk paleti kesinleştirildi (Açık Mod + Koyu Mod, tam hex değerleriyle)
- [ ] Tipografi çifti seçildi (display + body font)
- [ ] Spacing/grid sistemi tanımlandı
- [ ] Temel UI komponentleri (buton, kart, input, badge, tab) oluşturuldu
- [ ] Açık/Koyu mod geçiş mekanizması çalışır durumda

---

## Faz 2 — Bireysel Kullanıcı Modülleri

- [ ] Dashboard (Net Bakiye & Gelir-Gider özeti)
- [ ] Harcamalarım
- [ ] Gelirlerim
- [ ] Fiş Tarama (web'e özel: dosya yükleme / drag-drop akışı)
- [ ] Borçlarım
- [ ] Hedeflerim
- [ ] Yatırımlarım
- [ ] Abonelikler
- [ ] Gruplarım
- [ ] Analizler & Raporlar
- [ ] AI Sohbet & Özet Oluştur butonu
- [ ] Notlar
- [ ] Ayarlar (Profil, Görünüm, Bildirimler, Yedekleme)

---

## Faz 3 — Esnaf Modu

- [ ] İşletme seçim/geçiş arayüzü (mobildeki modal mantığının web karşılığı)
- [ ] Modül 1 — Hizmet & Bakım
- [ ] Modül 2 — Hızlı Perakende
- [ ] Modül 3 — Yeme & İçme
- [ ] Modül 4 — Yüksek Hacimli Satış
- [ ] Modül 5 — Toptancı & İmalatçı
- [ ] Modül 6 — Serbest Meslek & Proje
- [ ] Ortak esnaf özellikleri (çalışan yönetimi, fatura/gider, özet ekranı)

---

## Faz 4 — Senkronizasyon & Entegrasyon

- [ ] Mobil ile ortak backend/API bağlantısı kuruldu
- [ ] Fiş tarama AI pipeline'ı (n8n/Gemini) web'den tetiklenebiliyor
- [ ] Gerçek zamanlı/kısa gecikmeli veri senkronizasyonu (mobil ↔ web) çalışıyor
- [ ] Esnaf modülü seçimi mobil ve web arasında senkron

---

## Faz 5 — Cilalama & Yayına Hazırlık

- [ ] Responsive test (mobil/tablet/masaüstü)
- [ ] Erişilebilirlik kontrolü (klavye odağı, kontrast, azaltılmış hareket)
- [ ] Performans/yükleme hızı kontrolü
- [ ] Gerçek içerik/metin geçişi (placeholder metinler kaldırıldı)
- [ ] Yayına alma

---

## Kararlar Günlüğü (Decision Log)

> Önemli tasarım/teknik kararlar ve gerekçeleri buraya kronolojik eklenir.

- **18 Temmuz 2026:** Web sitesinde tema seçimi 4'ten (mobildeki Yeşil/Karanlık/Vintage/Gül) 2'ye (Açık/Koyu) düşürüldü. Gerekçe: web'de öncelik marka tutarlılığı ve profesyonel ilk izlenim; çoklu tema kurumsal bağlamda gereksiz karmaşıklık yaratıyor.

---

## Açık Sorular / Bekleyen Kararlar

- Teknoloji stack'i henüz seçilmedi.
- Kesin renk hex kodları ve font seçimi henüz netleşmedi.
- Backend/API entegrasyon detayları belirlenmedi.
