# AGENTS.md — Fişştech Web Sitesi

> Bu dosya, bu proje üzerinde çalışan her AI kodlama ajanının (Claude Code, Cursor, vb.) uyması gereken kuralları içerir. Kod yazmaya başlamadan önce bu dosya okunmalı.

---

## 1. Proje Nedir

Fişştech, fiş tarama (AI/OCR) ve kişisel + esnaf finans yönetimini birleştiren bir mobil uygulamadır. Bu repo, o uygulamanın **web sitesi** versiyonunu inşa etmek için var — mobil uygulamayla **aynı backend'e bağlanan, fonksiyonel paritede** bir web deneyimi.

**Tasarım ve özellik referansı:** `Fisstech_Web_Blueprint.md` dosyası bu projenin tek doğruluk kaynağıdır (source of truth). Herhangi bir özellik, ekran veya tasarım kararı konusunda şüphe olduğunda önce o dosyaya bakılmalı.

---

## 2. Kesin Kurallar (İhlal Edilmemeli)

1. **fisle.co'yu kopyalama.** O site sadece kalite/profesyonellik referansı. Layout, renk, tipografi birebir alınmayacak. Bkz. Blueprint Bölüm 5.
2. **Mobildeki 4 temayı (Yeşil, Karanlık, Vintage, Gül) web'e taşıma.** Web sitesinde sadece **Açık Mod / Koyu Mod** olacak.
3. **"Vibe coding" / jenerik AI-tasarımı hissi vermeyecek.** Bol gradyan, abartılı gölge, template-hissi veren hero bölümlerinden kaçın. Bkz. `/mnt/skills/public/frontend-design/SKILL.md` prensipleri.
4. **Fiş tarama akışı gerçek AI pipeline'ına bağlanmalı** (n8n/Gemini) — sahte/mock veri ile "tamamlanmış" gösterilmemeli, açıkça TODO/stub olarak işaretlenmeli.
5. **Esnaf modu 6 modülünün her biri kendi özel ekran setine sahip olmalı** — tek bir generic şablonla hepsini geçiştirme.
6. **Kod her zaman gerçek dosya olarak yazılmalı**, sadece açıklama/plan olarak bırakılmamalı.

---

## 3. Teknoloji Yığını (Tech Stack)

> Bu bölüm proje başladığında netleştirilecek. İlk kurulumda seçilen stack buraya yazılmalı ve sonrasında değiştirilmemeli (büyük bir gerekçe olmadıkça).

- Framework: *(örn. Next.js / React + Vite — karar verilecek)*
- Styling: *(örn. Tailwind CSS + custom design tokens)*
- State/Data: *(örn. mobil ile ortak backend API'sine bağlanan bir data layer)*
- Deployment hedefi: *(belirlenecek)*

---

## 4. Tasarım Sistemi Uygulama Kuralları

- Renkler asla hardcoded hex olarak component içine yazılmaz — `design-tokens` / CSS variable dosyasından çekilir.
- Açık/Koyu mod, tüm componentlerde CSS variable üzerinden yönetilir; component bazında ayrı dark-mode class'ı yazılmaz.
- Tipografi ölçeği (type scale) bir kez tanımlanır, her yeni ekranda o ölçekten seçim yapılır — serbest punto kullanılmaz.
- Grid: 8pt spacing sistemi kullanılır.
- Her yeni ekran/komponent tamamlandığında responsive (mobil/tablet/masaüstü) kontrolü yapılmadan "bitti" sayılmaz.

---

## 5. Dosya/Klasör Konvansiyonu

> Proje kurulduğunda gerçek yapı buraya yazılacak. Öneri şablon:

```
/src
  /app veya /pages         → route bazlı sayfalar
  /components/ui           → genel, tekrar kullanılabilir UI parçaları
  /components/modules       → esnaf modülüne özel bileşenler (hizmet, perakende, yeme-icme, vb.)
  /lib                      → API çağrıları, senkronizasyon mantığı
  /styles/tokens.css        → renk, tipografi, spacing değişkenleri
  /docs
    Fisstech_Web_Blueprint.md
    AGENTS.md
    PROGRESS.md
```

---

## 6. Çalışma Akışı Beklentisi

1. Her yeni özellik/ekran öncesi, Blueprint'teki ilgili bölüm tekrar okunur.
2. Büyük bir ekran/modül tamamlandığında `PROGRESS.md` güncellenir (bitti/devam ediyor/planlanan).
3. Tasarım kararlarında belirsizlik varsa (Blueprint'te yoksa) varsayım açıkça belirtilip ilerlenir, sessizce tahmin edilmez.
4. Mobil uygulamayla senkronizasyon gerektiren her özellik (fiş tarama, gruplar, esnaf modu geçişi) için hangi API/endpoint'in kullanıldığı `PROGRESS.md` içinde not düşülür.

---

## 7. Komutlar

> Proje kurulduğunda doldurulacak.

```bash
# Kurulum
# npm install

# Geliştirme sunucusu
# npm run dev

# Build
# npm run build

# Test
# npm run test
```
