"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, Loader2, RotateCcw, ScanLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { DropzoneUploader } from "@/components/modules/scan/dropzone-uploader";
import { DEMO_RECEIPT_RESULTS, type DemoReceiptResult } from "@/lib/landing/demo-receipts";
import { Reveal } from "./reveal";

const MAX_TRIES = 5;
const STORAGE_KEY = "fisstech_demo_scans_used";

const emptySubscribe = () => () => {};
// Same hydration-safe pattern as theme-toggle.tsx — avoids setState-in-effect
// for the initial localStorage read (see reveal.tsx for the same trick).
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function ScanDemo() {
  const mounted = useMounted();
  const [overrideCount, setOverrideCount] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<DemoReceiptResult | null>(null);

  // Plain render-time read once mounted — matches SSR/first hydration pass
  // (mounted=false → 0), real value appears on the client-only re-render.
  const storedCount = mounted ? Number(window.localStorage.getItem(STORAGE_KEY) ?? "0") : 0;
  const usedCount = overrideCount ?? (Number.isFinite(storedCount) ? Math.min(storedCount, MAX_TRIES) : 0);

  function handleFiles() {
    if (usedCount >= MAX_TRIES) return;
    setScanning(true);
    setResult(null);
    window.setTimeout(() => {
      const next = DEMO_RECEIPT_RESULTS[usedCount % DEMO_RECEIPT_RESULTS.length];
      setResult(next);
      setScanning(false);
      const newCount = usedCount + 1;
      setOverrideCount(newCount);
      window.localStorage.setItem(STORAGE_KEY, String(newCount));
    }, 1600);
  }

  const remaining = MAX_TRIES - usedCount;
  const locked = mounted && remaining <= 0;

  return (
    <section id="demo" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <Reveal className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3.5 py-1.5 text-xs font-semibold text-accent">
          <ScanLine className="h-3.5 w-3.5" />
          Üye Olmadan Dene
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold text-text-primary">Ücretsiz Fiş Tarama Demosu</h2>
        <p className="mx-auto mt-3 max-w-xl text-text-secondary">
          Bir fiş fotoğrafı yükle, Fişştech&apos;in yapay zekâsının verileri nasıl okuyup kategorize ettiğini
          gör. Üye olmadan {MAX_TRIES} kez deneyebilirsin.
        </p>
      </Reveal>

      <Reveal delay={120} className="mt-8">
        <Card>
          {!mounted ? null : locked ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
                <Lock className="h-6 w-6 text-accent" />
              </div>
              <p className="font-medium text-text-primary">
                Deneme hakkınız bitti, tüm özellikleri sınırsız kullanmak için ücretsiz hesap oluşturun!
              </p>
              <Link href="/register" className={buttonVariants("primary", "lg", "mt-2")}>
                Ücretsiz Hesap Oluştur
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">
                  Kalan deneme hakkı: <span className="text-accent">{remaining}</span> / {MAX_TRIES}
                </span>
              </div>

              {scanning ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-accent/40 bg-accent-soft/40 px-6 py-14 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-accent" />
                  <p className="font-medium text-text-primary">Yapay zekâ fişini okuyor…</p>
                </div>
              ) : result ? (
                <div>
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{result.storeName}</p>
                      <p className="text-xs text-text-secondary">{result.date}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Okundu
                    </span>
                  </div>
                  <ul className="mt-3 divide-y divide-border">
                    {result.items.map((item) => (
                      <li key={item.name} className="flex items-center justify-between py-2 text-sm">
                        <span className="flex items-center gap-2 text-text-primary">
                          <span aria-hidden="true">{item.icon}</span>
                          {item.name}
                          <span className="rounded-full bg-bg px-2 py-0.5 text-xs text-text-secondary">
                            {item.category}
                          </span>
                        </span>
                        <span className="font-medium text-text-secondary">{item.amount}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-sm font-semibold text-text-primary">Toplam</span>
                    <span className="font-display text-lg font-bold text-accent">{result.total}</span>
                  </div>
                  {remaining > 0 && (
                    <button
                      type="button"
                      onClick={() => setResult(null)}
                      className={buttonVariants("secondary", "sm", "mt-4 gap-2")}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Başka Bir Fiş Dene
                    </button>
                  )}
                </div>
              ) : (
                <DropzoneUploader
                  multiple={false}
                  onFiles={handleFiles}
                  onRejected={() => handleFiles()}
                  title="Bir fiş fotoğrafı yükle veya sürükle"
                  subtitle="Herhangi bir fiş/fatura görseli olabilir — JPEG veya PNG"
                />
              )}
            </>
          )}

          <p className="mt-5 text-center text-xs text-text-secondary">
            Bu alanda taranan fişler veritabanına veya gerçek harcama geçmişine kaydedilmez, sadece test
            amaçlı simülasyondur.
          </p>
        </Card>
      </Reveal>
    </section>
  );
}
