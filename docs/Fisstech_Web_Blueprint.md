# Fişştech — Web Sitesi Tam Kapsamlı Blueprint

> Bu doküman, mobil uygulamadan (eski adıyla Fişle) alınan ekran görüntüleri incelenerek çıkarılmıştır. Web sitesinin uygulamayla **tam senkronize**, aynı tasarım dilini taşıyan ama **kopya hissi vermeyen, profesyonel** bir deneyim olarak inşa edilmesi için referans kaynağıdır.

> **GÜNCELLEME — 21 Temmuz 2026:** Aşağıdaki §2.1 ve §5'te anlatılan "Gül" temalı (#B23A65 pembe/bordo) karar **artık geçerli değil**. Kullanıcı, pazarlama sayfası ile ürün arayüzü arasında marka/renk bütünlüğü istediği için site geneli mobilin **"Yeşil"** temasına (`accent` #1E4D2B koyu orman yeşili / koyu modda #4CAF50, `accent-soft` #D6EAD9 yumuşak mint) geçirildi — güncel, tek doğru kaynak `styles/tokens.css`'teki değerler ve oradaki yorum satırlarıdır. Bu bölüm, orijinal tasarım kararının **tarihsel gerekçesini** anlamak için hâlâ değerli (aynı yöntemle mobilden renk çıkarma süreci), ama aşağıdaki hex değerleri artık canlı sitede kullanılmıyor.

---

## 1. Marka Kimliği

| Alan | Değer |
|---|---|
| Eski isim | Fişle |
| Yeni isim | **Fişştech** |
| Konsept | Fiş tarama + kişisel/işletme finans yönetimi süper uygulaması |
| Ton | Sıcak, güven veren, "sıfır bilişsel yük" felsefesi, hem bireysel hem esnaf kullanıcıya hitap eden çift kimlikli ürün |

---

## 2. Mobil Uygulamadan Çıkarılan Tasarım Sistemi

### 2.1 Renk Paleti (Ekran görüntülerinden tespit edilen — "Gül" teması, varsayılan)

| Rol | Yaklaşık Renk | Kullanım |
|---|---|---|
| Arka plan (App BG) | `#FBE9EE` — çok açık pudra pembe | Genel sayfa zemini |
| Hero / Ana Kart Gradyanı | `#C2447B` → `#A83566` (koyu pembe/bordo gradyan) | Aylık toplam kartı, üst hero alanı |
| Aksan / CTA rengi | `#B23A65` (derin gül/bordo pembe) | Butonlar, aktif sekme, ikon vurguları, FAB (kamera) |
| Kart yüzeyi | `#FFFFFF` | Tüm içerik kartları |
| İkincil metin | `#8C7A80` gri-pembe tonu | Alt başlıklar, tarih etiketleri |
| Başarı / Pozitif | `#2E7D32` yeşil | Gelir, pozitif trend |
| Uyarı / Negatif | `#C0392B` kırmızı | Gider, negatif bakiye, limit uyarısı |
| Bildirim vurgusu | `#F5A623` amber/turuncu | "%578 artış" gibi trend etiketleri, taksit rozetleri |

**Not:** Uygulamada 4 tema seçeneği var → Yeşil, Karanlık, Vintage, Gül. Bu, mobilin kişiselleştirme katmanı — web sitesine taşınmayacak.

**Web Sitesi Tema Kararı:** Web sitesinde sadece **Açık Mod / Koyu Mod** (2 seçenek) sunulacak. Gerekçe: web'in önceliği marka tutarlılığı ve profesyonel ilk izlenimdir; 4 temalı seçim kurumsal/SaaS bağlamında gereksiz karmaşıklık ve geliştirme yükü yaratır. Koyu mod, mobildeki "Karanlık" temayla marka bağını korur; açık mod ise "Gül" paletinden türetilen ama birebir kopya olmayan özgün bir ana tema taşır (bkz. Bölüm 5).

### 2.2 Tipografi (gözlemlenen karakter)

- Başlıklar: **Kalın, yuvarlak hatlı sans-serif** (SF Pro / Inter / Poppins ailesine yakın), büyük punto (₺20.928 gibi tutarlar ekranın odak noktası)
- Gövde metni: Orta ağırlıkta, okunabilir sans-serif
- Sayısal veriler her zaman görsel hiyerarşide en büyük, en kalın öğe — "harcama tutarı" tasarımın kahramanı

### 2.3 Bileşen Dili

- **Yumuşak köşeli kartlar** (radius ~20-24px), hafif gölge, beyaz zemin üzerinde pembe arka plana oturuyor
- **Donut / halka grafikler** — ortada toplam tutar, etrafında kategori dilimleri (Analiz ekranı)
- **Çizgi/alan grafikler** — 6 aylık trend, gelir-gider karşılaştırması
- **Segmented control / tab bar** — Harcamalar / Gelir-Gider / Abonelikler / Grup gibi üst sekmeler
- **Alt navigasyon (bottom nav)** — 5 öğe: Pano, Harcamalar, (ortada büyük dairesel Kamera FAB), Analiz, Ayarlar
- **Rozet (badge) sistemi** — "1/3 taksit", "Ücretsiz", "9999 hak" gibi durum etiketleri pill-shaped
- **İlerleme çubukları** — bütçe kullanım oranı, üye bazlı harcama karşılaştırması

### 2.4 Uygulama İçi Ekranlardan Notlar

- **Pano (Dashboard):** Ay seçici (◀ TEMMUZ 2026 ▶) → Aylık toplam hero kart → Gelir/Gider/Net Bakiye üç sütun özet → Grup Bütçesi kartları → Hızlı erişim grid'i (Fiş Tara, Manuel Giriş, Abonelikler, Gelir&Gider, Net Bakiye, Hedeflerim) → Notlarım → Özet Rapor kartı → Sabit Giderler → Son harcamalar listesi
- **Fiş Tara:** Normal Fiş / Uzun Fiş (Çoklu) sekmeleri, büyük ikon + "Fişini fotoğrafla" mesajı, Kamera/Galeri butonları, kalan tarama hakkı göstergesi
- **Analiz:** 4 sekme (Harcamalar, Gelir/Gider, Abonelikler, Grup) — her biri kendine özgü grafik tipiyle
- **Ayarlar:** Esnaf Modu geçişi, Personel Yönetimi, Profil kartı, Görünüm (tema seçici), Bildirim tercihleri (Limit Uyarıları, Abonelik Hatırlatmaları, Otomatik Raporlama, Fiş Hakkı Uyarısı), Tarama ayarları (Otomatik Fiş Kaydı toggle)
- **Esnaf Modu geçişi:** Modal ile işletme seçimi (hizmet, yüksek hacimli, hızlı perakende, yeme içme, toptancı, serbest meslek — emoji ikonlu liste) + "Yeni İşletme Ekle"
- **Esnaf Dashboard (örnek: Toptancı):** Aktif Siparişler hero kartı → Özet Rapor → 3x3 grid: Yeni Sipariş, Bayiler, Depo, Sevkiyat, Cari Hesap, Raporlar, Fiş Tara, Ayarlar, Ekip → alt nav modülüne özel değişiyor (Pano, Depo, Sevkiyat, Bayiler)

---

## 3. Bilgi Mimarisi — Web Sitesi Navigasyonu

Web sitesi, mobil uygulamadaki tüm modülleri **birebir fonksiyonel paritede**, gerçek zamanlı senkronize şekilde sunmalı.

```
Fişştech Web
├── Dashboard (Pano)
├── Fiş Tara (drag & drop / dosya yükleme ile web'e özel akış)
├── Harcamalarım
├── Gelirlerim
├── Net Bakiye & Gelir-Gider
├── Borçlarım
├── Hedeflerim
├── Yatırımlarım
├── Abonelikler
├── Gruplarım
├── Analizler & Raporlar
├── AI Sohbet & "Özet Oluştur"
├── Notlar
├── Ayarlar
│   ├── Profil & Üyelik (Premium)
│   ├── Görünüm / Tema
│   ├── Bildirimler
│   └── Yedekleme
└── Esnaf Modu (İşletme Değiştir)
    ├── 1. Hizmet & Bakım Modülü
    ├── 2. Hızlı Perakende Modülü
    ├── 3. Yeme & İçme Modülü
    ├── 4. Yüksek Hacimli Satış Modülü
    ├── 5. Toptancı & İmalatçı Modülü
    └── 6. Serbest Meslek & Proje Modülü
```

---

## 4. Tam Özellik Listesi

### 4.1 Bireysel & Genel Özellikler

- **Net Bakiye & Gelir-Gider Takibi** — dashboard'da anlık toplam varlık ve akış görünümü
- **Harcamalarım** — kategori bazlı manuel harcama ekleme ve detaylı liste
- **Gelirlerim** — maaş, ek iş gibi gelir kalemleri
- **Fiş Tarama (OCR/AI)** — kamera ile veya **web'de bilgisayardan fotoğraf yükleyerek** tarama; seri (çoklu fiş) ve gece tarama modu desteği
- **Borçlarım** — kişi bazlı alacak/verecek kaydı, vade ve ödenme takibi
- **Hedeflerim** — özel hedefler (araba, tatil vb.) için birikim planları
- **Yatırımlarım** — döviz, altın, borsa gibi araçların değer takibi
- **Abonelikler** — tekrarlayan ödemeler ve hatırlatıcılar
- **Gruplarım** — aile/arkadaş ortak bütçesi, üye bazlı harcama görünümü
- **Analizler & Raporlar** — pasta/donut grafikler, trend çizgileri, haftalık/aylık özetler
- **AI Sohbet & Özet Oluştur** — finansal durum hakkında sohbet + tek tuşla özet raporu
- **Notlar** — finansal hatırlatıcı kısa notlar
- **Yedekleme & Premium** — bulut yedekleme, premium üyelik avantajları

### 4.2 Esnaf Modu — 6 Sektör Modülü

**1. Hizmet & Bakım Modülü** (Berber, Oto Yıkama, Tamir vb.)
Randevu/ajanda takibi · Hizmet kataloğu & fiyat listesi · Müşteri listesi & geçmiş · İş/görev panosu

**2. Hızlı Perakende Modülü** (Market, Pastane, Kırtasiye vb.)
Hızlı kasa işlemleri (barkod/dokunmatik satış) · Satış geçmişi · Günlük kasa & gider takibi · Veresiye defteri

**3. Yeme & İçme Modülü** (Kafe, Lokanta, Çay Ocağı vb.)
Masa/salon yönetimi · Adisyon sistemi · Menü yönetimi (kategori & ürün) · Paket servis & ödeme takibi

**4. Yüksek Hacimli Satış Modülü** (Emlak, Galeri, Kuyumcu vb.)
Portföy yönetimi · Satış hunisi (aday → görüşme → kapora) · Satış evrakları & CRM · Özel satış panosu

**5. Toptancı & İmalatçı Modülü** (Toptan, Fabrika, Bayi vb.)
Depo/ürün/stok yönetimi · Bayi & toptan müşteri yönetimi · B2B toplu sipariş · Sevkiyat/teslimat takibi
*(Ekran görüntüsünde görülen gerçek yapı: Aktif Siparişler hero → Yeni Sipariş, Bayiler, Depo, Sevkiyat, Cari Hesap, Raporlar, Fiş Tara, Ayarlar, Ekip)*

**6. Serbest Meslek & Proje Modülü** (Danışman, Mühendis, Avukat, Freelance vb.)
Proje oluşturma & aşama takibi · Müşteri (client) listesi · Ajanda/toplantı/görev takibi · Proje bazlı gelir-gider-fatura panosu

**Ortak Esnaf Özellikleri (tüm modüllerde):**
İşletme ayarları & çalışan/maaş yönetimi · İşletmeye ait fatura-gider yönetimi · Esnaf özet ekranı (gelir/gider + işletme sağlığı analizi)

---

## 5. Web Sitesi İçin Tasarım Yönergesi (fisle.co'dan İlham, Kopya Değil)

Referans alınan `fisle.co` **profesyonel, sade, güven veren** bir SaaS/fintürk estetiği taşıyor. Fişştech web sitesi bu **kalite seviyesini** hedeflemeli ama şu şekilde kendine özgü olmalı:

1. **Renk kimliği farklılaştırılmalı:** Mobil uygulamanın "Gül" pembesini birebir web'e taşımak yerine, o pembeyi **bir aksan rengi** olarak koruyup, web'e özel bir nötr taban (koyu antrasit / sıcak off-white gibi) ile birleştirilmeli. Böylece marka tutarlılığı korunur ama "aynı ekranın web versiyonu" hissi yerine "aynı markanın profesyonel web yüzü" hissi verilir. Bu nötr taban + pembe aksan ikilisi **Açık Mod**'u oluşturur; **Koyu Mod** için aynı aksan rengi koyu antrasit/siyah taban üzerinde korunmalı (mobildeki "Karanlık" temayla tutarlı).
2. **Tipografi:** Karakteristik bir display font (örn. uygulamadaki yuvarlak/kalın hissi taşıyan ama web'e özel seçilmiş bir typeface) + temiz bir gövde fontu ikilisi kurulmalı — jenerik sistem fontlarından kaçınılmalı.
3. **Hero alanı:** Uygulamadaki "aylık toplam" kartının felsefesini (büyük, kalın rakam = odak noktası) web hero'suna taşımalı — örneğin canlı bir demo widget'ı: kullanıcı bir fiş yükler, saniyeler içinde kategorize olmuş veri animasyonla belirir.
4. **İmza öğesi (signature element):** Fiş tarama akışının kendisi web'in en akılda kalıcı görsel anı olabilir — sürükle-bırak fiş yükleme alanı, gerçekçi bir fiş illüstrasyonu/mockup ile birlikte tasarlanmalı, jenerik "upload icon" kullanılmamalı.
5. **Esnaf modu tanıtımı:** 6 modülü site üzerinde sekme/kart geçişli bir bölümde, her birinin kendine özgü mini-arayüz önizlemesiyle (mockup) sunmak, ürünün genişliğini somut şekilde gösterir.
6. **Vibe-coding hissinden kaçınma:** Bol boşluklu, gölgesi abartılı, gradyan bombardımanlı "AI ürettiği belli" tasarımlardan kaçınılmalı. Bunun yerine gerçek bir tasarım stüdyosu işi gibi: kasıtlı tipografi ölçeği, tutarlı 8pt grid, sınırlı ama kesin renk kullanımı, ölçülü animasyon (hover mikro-etkileşimleri, scroll-reveal) tercih edilmeli.
7. **Responsive & erişilebilirlik:** Mobil, tablet, masaüstü kırılım noktalarında test edilmeli; klavye odak durumları görünür olmalı; azaltılmış hareket tercihine saygı gösterilmeli.

---

## 6. Teknik Senkronizasyon Notu

Web sitesi uygulamayla **aynı backend/veri katmanına** bağlanmalı (aynı kullanıcı hesabı, aynı veritabanı). Pratikte:

- Fiş tarama akışı web'de **dosya yükleme (drag & drop + file picker)** üzerinden çalışmalı, aynı AI analiz pipeline'ına (n8n/Gemini) istek atmalı.
- Kullanıcının o an aktif olduğu **esnaf modülü** hem mobilde hem webde aynı seçili modül olarak senkron kalmalı.
- Gerçek zamanlı veya kısa gecikmeli senkronizasyon (polling/websocket) tercih edilmeli ki mobilde eklenen bir harcama web'de anında görünsün.

---

## 7. Sonraki Adım Önerisi

Bu doküman hazır olduğuna göre önerilen sıradaki adımlar:
1. Token sistemi netleştirme (kesin hex kodları + font seçimi ile tasarım planı)
2. Sayfa bazlı wireframe (Dashboard, Fiş Tara, Analiz, Esnaf Modu geçişi)
3. Frontend-design ve senior-frontend skill'leriyle gerçek kod üretimine geçiş
