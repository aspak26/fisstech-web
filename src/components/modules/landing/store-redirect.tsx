"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { LogoHorizontal } from "./logo-mark";

const PLAY_URL = "https://play.google.com/store/apps/details?id=com.fisstech.app";
const APP_STORE_URL = "https://apps.apple.com/tr/app/id6803802362";
// Android: Play Store uygulamasını doğrudan açar; uygulama içi tarayıcıda
// (Instagram, TikTok) https linki çoğu zaman boş sayfada kalıyor.
const PLAY_INTENT =
  "intent://details?id=com.fisstech.app#Intent;scheme=market;package=com.android.vending;" +
  `S.browser_fallback_url=${encodeURIComponent(PLAY_URL)};end`;

const noopSubscribe = () => () => {};

type Platform ="android" | "ios" | "other";

function detect(ua: string): Platform {
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && "ontouchend" in document)) return "ios";
  return "other";
}

export function StoreRedirect() {
  // Sunucuda "" → iki buton birden; tarayıcıda gerçek user-agent.
  const ua = useSyncExternalStore(noopSubscribe, () => navigator.userAgent, () => "");
  const platform: Platform = ua ? detect(ua) : "other";
  const inApp = /instagram|fban|fbav|tiktok|musical_ly|bytedance/i.test(ua);

  useEffect(() => {
    if (platform === "android") window.location.href = PLAY_INTENT;
    else if (platform === "ios") window.location.href = APP_STORE_URL;
  }, [platform]);

  const playHref = platform === "android" ? PLAY_INTENT : PLAY_URL;

  return (
    <div className="min-h-full bg-bg">
      <header className="border-b border-border px-4 py-4 sm:px-6">
        <Link href="/" aria-label="Fişştech anasayfa">
          <LogoHorizontal />
        </Link>
      </header>
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Fişştech&apos;i indir</h1>
        <p className="text-text-secondary">
          Fişini tara, harcamaların kendiliğinden bütçene işlensin. Ücretsiz.
        </p>

        <div className="mt-4 flex w-full flex-col gap-3">
          {platform !== "ios" && (
            <a
              href={playHref}
              className="rounded-xl border-2 border-text-primary bg-accent px-5 py-4 text-lg font-semibold text-white shadow-[3px_3px_0_0_var(--color-text-primary)]"
            >
              Google Play&apos;den indir
            </a>
          )}
          {platform !== "android" && (
            <a
              href={APP_STORE_URL}
              className="rounded-xl border-2 border-text-primary bg-accent px-5 py-4 text-lg font-semibold text-white shadow-[3px_3px_0_0_var(--color-text-primary)]"
            >
              App Store&apos;dan indir
            </a>
          )}
          {platform !== "other" && (
            <a
              href={platform === "android" ? APP_STORE_URL : PLAY_URL}
              className="text-sm font-medium text-accent hover:underline"
            >
              {platform === "android" ? "iPhone kullanıyorum →" : "Android kullanıyorum →"}
            </a>
          )}
        </div>

        {inApp && (
          <p className="mt-6 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-secondary">
            Mağaza açılmazsa: sağ üstteki <strong>⋮</strong> menüsüne dokunup{" "}
            <strong>&quot;Tarayıcıda aç&quot;</strong> seç.
          </p>
        )}
      </main>
    </div>
  );
}
