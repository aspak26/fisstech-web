import Link from "next/link";
import { LogoHorizontal } from "./logo-mark";

/** Footer'daki yasal/destek linklerinin (Gizlilik, KVKK, Yardım Merkezi vb.)
 * hepsinin gerçek bir rotaya gitmesi için — proje kuralı: hiçbir zaman ölü
 * link olmaz. İçerik henüz yazılmadı, dürüstçe "yakında" gösteriyor. */
export function LegalStub({ title }: { title: string }) {
  return (
    <div className="min-h-full bg-bg">
      <header className="border-b border-border px-4 py-4 sm:px-6">
        <Link href="/" aria-label="Fişştech anasayfa">
          <LogoHorizontal />
        </Link>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-text-primary">{title}</h1>
        <p className="max-w-sm text-text-secondary">
          Bu içerik yakında eklenecek. Sorularınız için{" "}
          <a href="mailto:fisstechapp@gmail.com" className="text-accent hover:underline">
            fisstechapp@gmail.com
          </a>{" "}
          adresinden bize ulaşabilirsiniz.
        </p>
        <Link href="/" className="mt-4 text-sm font-medium text-accent hover:underline">
          ← Anasayfaya dön
        </Link>
      </main>
    </div>
  );
}
