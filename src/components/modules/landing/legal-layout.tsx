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
      <header className="border-b border-border px-4 py-4 sm:px-6">
        <Link href="/" aria-label="Fişştech anasayfa">
          <LogoHorizontal />
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-text-primary">{title}</h1>
        <p className="mt-2 text-sm text-text-secondary">Son güncelleme: {updatedAt}</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-text-secondary [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-text-primary [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text-primary [&_strong]:text-text-primary [&_strong]:font-medium [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_a]:text-accent [&_a]:hover:underline">
          {children}
        </div>

        <Link href="/" className="mt-12 inline-block text-sm font-medium text-accent hover:underline">
          ← Anasayfaya dön
        </Link>
      </main>
    </div>
  );
}
