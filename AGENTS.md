<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Notably: the `middleware.ts` file convention is deprecated and renamed to `proxy.ts` (exported function `proxy`, not `middleware`) as of Next.js 16 — this project already uses `src/proxy.ts`.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — Fişştech Web Sitesi

> Bu dosya, bu proje üzerinde çalışan her AI kodlama ajanının uyması gereken kuralları içerir. Kanonik/güncel kopya `docs/AGENTS.md` içindedir — bu dosya onunla senkron tutulur, farklılık olursa `docs/AGENTS.md` esas alınır.

## Proje Nedir

Fişştech, fiş tarama (AI/OCR) ve kişisel + esnaf finans yönetimini birleştiren bir mobil uygulamadır. Bu repo, o uygulamanın **web sitesi** versiyonunu inşa etmek için var — mobil uygulamayla **aynı backend'e bağlanan, fonksiyonel paritede** bir web deneyimi.

**Tasarım ve özellik referansı:** `docs/Fisstech_Web_Blueprint.md` bu projenin tek doğruluk kaynağıdır.


## Kesin Kurallar

1. fisle.co kopyalanmaz — sadece kalite referansı.
2. Mobildeki 4 tema (Yeşil/Karanlık/Vintage/Gül) web'e taşınmaz — sadece Açık/Koyu Mod.
3. "Vibe coding" / jenerik AI-tasarımı hissi verilmez.
4. Fiş tarama gerçek Supabase Edge Function (`scan-receipt` → Gemini) pipeline'ına bağlanır — mock veri yok.
5. Esnaf modu her sektör için ayrı ekran seti gerektirir — generic şablon yok.
6. Kod her zaman gerçek dosya olarak yazılır. Henüz yapılmayan modüller gerçek route + "yakında" (ComingSoonPage) olarak var olur.
7. İleri fazlardaki Gemini entegrasyonları (AI Sohbet, Esnaf lokal OCR) client-side API key ile YAPILMAZ — sunucu tarafı (Edge Function / Route Handler) zorunlu.

Detaylı tech stack, klasör yapısı, tasarım sistemi kuralları ve komutlar için: `docs/AGENTS.md`.
