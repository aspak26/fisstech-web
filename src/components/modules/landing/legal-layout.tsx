import Link from "next/link";
import type { ReactNode } from "react";
import { LogoHorizontal } from "./logo-mark";

/** Uzun biçimli yasal metinler (Gizlilik Politikası, KVKK, Kullanım Şartları)
 * için paylaşılan çerçeve — LegalStub'ın header/geri-dön desenini korur,
 * ama gerçek içerik için okunabilir, prose-benzeri bir gövde sağlar. */
export function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-bg">
      <header className="border-b-[1.5px] border-dashed border-ink/30 px-4 py-4 sm:px-6">
        <Link href="/" aria-label="Fişştech anasayfa">
          <LogoHorizontal />
        </Link>
      </header>

      <main className="mx-4 my-8 max-w-3xl rounded-card border-[1.5px] border-ink/70 bg-surface px-5 py-10 shadow-md sm:mx-auto sm:my-10 sm:px-10 sm:py-12">
        <h1 className="font-display text-3xl font-bold text-text-primary">{title}</h1>
        <p className="mt-2 text-sm text-text-secondary">Son güncelleme: {updatedAt}</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-text-secondary [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-text-primary [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text-primary [&_strong]:text-text-primary [&_strong]:font-medium [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_a]:text-accent [&_a]:hover:underline">
          {children}
        </div>

        <Link href="/" className="mt-12 inline-block text-sm font-semibold text-accent underline decoration-wavy decoration-1 underline-offset-4">
          ← Anasayfaya dön
        </Link>
      </main>
    </div>
  );
}
