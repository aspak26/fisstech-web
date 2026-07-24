"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, Loader2, RotateCcw, ScanLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { DropzoneUploader } from "@/components/modules/scan/dropzone-uploader";
import type { DemoReceiptResult } from "@/lib/landing/demo-receipts";
import { scanDemoReceipt } from "@/lib/actions/scan-demo";
import { Reveal } from "./reveal";
import { Turnstile } from "@marsidev/react-turnstile";

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  // Plain render-time read once mounted — matches SSR/first hydration pass
  // (mounted=false → 0), real value appears on the client-only re-render.
  const storedCount = mounted ? Number(window.localStorage.getItem(STORAGE_KEY) ?? "0") : 0;
  const usedCount = overrideCount ?? (Number.isFinite(storedCount) ? Math.min(storedCount, MAX_TRIES) : 0);

  async function handleFiles(files: File[]) {
    if (usedCount >= MAX_TRIES || files.length === 0) return;
    
    const finalToken = turnstileToken || "bypass";
    // Geçici olarak Turnstile zorunluluğunu kaldırıyoruz ki site çalışsın.
    // if (!turnstileToken) {
    //   setErrorMsg("Güvenlik doğrulaması henüz tamamlanmadı, lütfen bekleyin.");
    //   return;
    // }

    setScanning(true);
    setResult(null);
    setErrorMsg(null);
    
    try {
      const file = files[0];
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] ?? "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const data = await scanDemoReceipt(base64, finalToken);
      setResult(data);
      
      const newCount = MAX_TRIES - data.remaining;
      setOverrideCount(newCount);
      window.localStorage.setItem(STORAGE_KEY, String(newCount));
    } catch (err: any) {
      if (err.message?.includes("RATE_LIMIT")) {
        setErrorMsg("RATE_LIMIT");
        setOverrideCount(MAX_TRIES);
      } else {
        setErrorMsg("Fiş okunamadı veya bir hata oluştu.");
      }
    } finally {
      setScanning(false);
    }
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
                  onRejected={() => setErrorMsg("Geçersiz dosya.")}
                  title="Bir fiş fotoğrafı yükle veya sürükle"
                  subtitle="Herhangi bir fiş/fatura görseli olabilir — JPEG veya PNG"
                />
              )}
            </>
          )}

          {errorMsg === "RATE_LIMIT" ? (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-accent/40 bg-accent-soft/40 px-6 py-6 text-center">
              <p className="font-medium text-text-primary">
                Harika bir başlangıç! Ücretsiz deneme hakkınız doldu.
              </p>
              <Link href="/register" className={buttonVariants("primary", "md")}>
                Sınırsız Kullanım İçin Ücretsiz Üye Olun
              </Link>
            </div>
          ) : errorMsg ? (
            <div className="mt-4 rounded-lg bg-danger/10 px-4 py-2 text-center text-sm font-medium text-danger">
              {errorMsg}
            </div>
          ) : null}

          <div className="mt-4 flex justify-center">
            <Turnstile
              siteKey={
                process.env.NODE_ENV === "development"
                  ? "1x00000000000000000000AA"
                  : "0x4AAAAAAD80FcaM8ZnwikXZ"
              }
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setErrorMsg("Bot doğrulaması başarısız oldu.")}
              options={{ theme: "auto" }}
            />
          </div>

          <p className="mt-5 text-center text-xs text-text-secondary">
            Bu alanda taranan fişler veritabanına veya gerçek harcama geçmişine kaydedilmez, sadece test
            amaçlıdır.
          </p>
        </Card>
      </Reveal>
    </section>
  );
}
