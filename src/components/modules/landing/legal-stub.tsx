import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoHorizontal } from "./logo-mark";

/** Footer'daki yasal/destek linklerinin (Gizlilik, KVKK, Yardım Merkezi vb.)
 * hepsinin gerçek bir rotaya gitmesi için — proje kuralı: hiçbir zaman ölü
 * link olmaz. İçerik henüz yazılmadı, dürüstçe "yakında" gösteriyor.
 * Kâğıt görünüm: kareli defter zemininde bantlı bir not kâğıdı. */
export function LegalStub({ title }: { title: string }) {
  return (
    <div className="relative min-h-screen bg-bg">
      <div aria-hidden="true" className="grid-paper pointer-events-none absolute inset-0" />
      <header className="relative flex items-center justify-between border-b-[1.5px] border-dashed border-ink/30 px-4 py-4 sm:px-6">
        <Link href="/" aria-label="Fişştech anasayfa">
          <LogoHorizontal />
        </Link>
        <ThemeToggle />
      </header>
      <main className="relative mx-auto max-w-md px-4 py-20">
        <div className="relative -rotate-[0.8deg] rounded-card border-[1.5px] border-ink/80 bg-surface px-6 py-10 text-center shadow-lg sm:px-10">
          <span aria-hidden="true" className="tape -top-3 left-1/2 -translate-x-1/2 rotate-2" />
          <p aria-hidden="true" className="font-hand text-2xl font-bold text-accent">yakında burada!</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
          <p className="mx-auto mt-3 max-w-sm text-text-secondary">
            Bu içerik yakında eklenecek. Sorularınız için{" "}
            <a
              href="mailto:fisstechapp@gmail.com"
              className="font-semibold text-accent underline decoration-wavy decoration-1 underline-offset-4"
            >
              fisstechapp@gmail.com
            </a>{" "}
            adresinden bize ulaşabilirsiniz.
          </p>
          <Link
            href="/"
            className="press mt-6 inline-flex items-center gap-1.5 rounded-control border-[1.5px] border-ink/70 bg-surface px-4 py-2 text-sm font-semibold text-text-primary shadow-sm hover:bg-surface-alt"
          >
            ← Anasayfaya dön
          </Link>
        </div>
      </main>
    </div>
  );
}
