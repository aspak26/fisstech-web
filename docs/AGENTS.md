# AGENTS.md — Fişştech Web Sitesi

> Bu dosya, bu proje üzerinde çalışan her AI kodlama ajanının (Claude Code, Cursor, vb.) uyması gereken kuralları içerir. Kod yazmaya başlamadan önce bu dosya okunmalı.

---

## 1. Proje Nedir

Fişştech, fiş tarama (AI/OCR) ve kişisel + esnaf finans yönetimini birleştiren bir mobil uygulamadır. Bu repo, o uygulamanın **web sitesi** versiyonunu inşa etmek için var — mobil uygulamayla **aynı backend'e bağlanan, fonksiyonel paritede** bir web deneyimi.

**Tasarım ve özellik referansı:** `Fisstech_Web_Blueprint.md` dosyası bu projenin tek doğruluk kaynağıdır (source of truth). Herhangi bir özellik, ekran veya tasarım kararı konusunda şüphe olduğunda önce o dosyaya bakılmalı.

**Çalışma alanı kuralı:** `fisleapp` klasörü (mobil uygulama) SADECE read-only referans içindir — veri yapıları, Supabase şeması, tema/renk değerleri, mevcut servis akışları buradan okunur. `fisleapp` içindeki hiçbir dosya değiştirilmez, o dizinde terminal komutu çalıştırılmaz.

---

## 2. Kesin Kurallar (İhlal Edilmemeli)

1. **fisle.co'yu kopyalama.** O site sadece kalite/profesyonellik referansı. Layout, renk, tipografi birebir alınmayacak. Bkz. Blueprint Bölüm 5.
2. **Mobildeki 4 temayı (Yeşil, Karanlık, Vintage, Gül) web'e taşıma.** Web sitesinde sadece **Açık Mod / Koyu Mod** olacak.
3. **"Vibe coding" / jenerik AI-tasarımı hissi vermeyecek.** Bol gradyan, abartılı gölge, template-hissi veren hero bölümlerinden kaçın.
4. **Fiş tarama akışı gerçek AI pipeline'ına bağlanmalı** (Supabase Edge Function `scan-receipt` → Gemini 2.5 Flash) — sahte/mock veri ile "tamamlanmış" gösterilmemeli, açıkça TODO/stub olarak işaretlenmeli.
5. **Esnaf modu 6 modülünün her biri kendi özel ekran setine sahip olmalı** — tek bir generic şablonla hepsini geçiştirme. (Faz 1 kapsamında değil — sadece nav'da "yakında" placeholder var.)
6. **Kod her zaman gerçek dosya olarak yazılmalı**, sadece açıklama/plan olarak bırakılmamalı. Henüz yapılmayan modüller "yakında" (ComingSoonPage) olarak gerçek route'lara sahip olmalı — ölü link yok, sahte "bitti" görünümü yok.
7. **AI Sohbet ve Esnaf-lokal-OCR gibi ileri fazlardaki Gemini entegrasyonları asla client-side API key ile yapılmamalı.** Mobilde `google_generative_ai` + gömülü key ile client'tan doğrudan çağrı var — bu pattern web'de tarayıcıda key'i ifşa eder. Web'de her zaman sunucu tarafı (Edge Function veya Next.js Route Handler) kullanılmalı.

---

## 3. Teknoloji Yığını (Tech Stack)

- **Framework:** Next.js 16 (App Router, TypeScript, `src/` dizini)
- **Styling:** Tailwind CSS v4 (CSS-first `@theme inline`, config dosyası yok) + `styles/tokens.css` (tek doğruluk kaynağı — CSS custom properties, `.dark` class ile açık/koyu geçiş)
- **State/Data:** `@supabase/supabase-js` + `@supabase/ssr` (browser/server client ikilisi, cookie tabanlı session) — mobil ile birebir aynı Supabase projesine bağlanır
- **Auth/Session yenileme:** `src/proxy.ts` (Next.js 16'da `middleware.ts` → `proxy.ts` olarak yeniden adlandırıldı, dosya kuralı değişti)
- **Tema:** `next-themes` (class stratejisi, `storageKey="fisstech-theme"`)
- **Formlar:** `react-hook-form` + `zod` v4
- **İkonlar:** `lucide-react` (mobildeki `lucide_icons_flutter` ile tutarlı ikon dili)
- **Fontlar:** Bricolage Grotesque (display) + Plus Jakarta Sans (body) — `next/font/google` ile self-host
- **Deployment hedefi:** Vercel (öneri — henüz kesinleşmedi)

---

## 4. Tasarım Sistemi Uygulama Kuralları

- Renkler asla hardcoded hex olarak component içine yazılmaz — `styles/tokens.css`'ten Tailwind utility'lerine (`bg-surface`, `text-text-primary`, `border-border` vb.) map edilir.
- Açık/Koyu mod, `.dark` class'ıyla CSS variable üzerinden yönetilir; component bazında ayrı dark-mode class'ı yazılmaz (Tailwind `dark:` variant'ı sadece istisnai durumlar için `@custom-variant` ile açık tutulur).
- Tipografi ölçeği `styles/tokens.css`'te bir kez tanımlanır (`--text-xs` … `--text-hero`), her yeni ekranda o ölçekten seçim yapılır.
- Grid: 8pt spacing sistemi kullanılır (Tailwind'in 4px tabanlı skalasından çift sayılı adımlar).
- Her yeni ekran/komponent tamamlandığında responsive (mobil ~390px / tablet ~768px / masaüstü ~1440px) kontrolü yapılmadan "bitti" sayılmaz.

---

## 5. Dosya/Klasör Konvansiyonu (gerçek yapı)

```
Fisstech_web/
├── .env.local                 (gitignored)
├── .env.example
├── AGENTS.md                   (bu dosyanın kök kopyası)
├── docs/
│   ├── Fisstech_Web_Blueprint.md
│   ├── AGENTS.md                (bu dosya)
│   └── PROGRESS.md
├── styles/tokens.css            (renk/tipografi/spacing token'ları)
├── src/
│   ├── proxy.ts                 (session refresh + route guard)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx              (/ → /dashboard yönlendirme)
│   │   ├── (auth)/                (login, register, forgot-password, reset-password)
│   │   └── (app)/                 (korumalı shell: dashboard, scan, + "yakında" sayfaları)
│   ├── components/
│   │   ├── ui/                    (Button, Card, Input, Badge, Tabs, Skeleton, EmptyState, ComingSoonPage, ThemeToggle, Avatar)
│   │   └── modules/
│   │       ├── shell/              (Sidebar, Topbar, NavLink, MobileNavDrawer, UserMenu)
│   │       ├── auth/                (LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm)
│   │       ├── dashboard/           (MonthSelector, MonthlyTotalHero, SummaryTriple, ...)
│   │       └── scan/                (ScanWorkspace, DropzoneUploader, ReceiptReviewForm, ...)
│   └── lib/
│       ├── supabase/{client,server,middleware}.ts
│       ├── types/database.ts       (el yazımı, migration'lardan doğrulanmış — supabase gen types ile değiştirilecek)
│       ├── data/{dashboard,categories}.ts
│       ├── scan/{scanClient,credits,mergeResults,saveExpense,types}.ts
│       ├── validation/auth.ts
│       ├── nav-config.ts
│       └── utils/{cn,date,currency}.ts
```

---

## 6. Çalışma Akışı Beklentisi

1. Her yeni özellik/ekran öncesi, Blueprint'teki ilgili bölüm tekrar okunur.
2. Büyük bir ekran/modül tamamlandığında `PROGRESS.md` güncellenir (bitti/devam ediyor/planlanan).
3. Tasarım kararlarında belirsizlik varsa (Blueprint'te yoksa) varsayım açıkça belirtilip ilerlenir, sessizce tahmin edilmez.
4. Mobil uygulamayla senkronizasyon gerektiren her özellik (fiş tarama, gruplar, esnaf modu geçişi) için hangi API/endpoint'in kullanıldığı `PROGRESS.md` içinde not düşülür.

---

## 7. Komutlar

```bash
# Kurulum
npm install

# Geliştirme sunucusu
npm run dev

# Build
npm run build

# Lint
npm run lint

# Supabase DB tiplerini yeniden üret (supabase login sonrası)
npx supabase gen types typescript --project-id <ref> --schema public > src/lib/types/database.ts
```
