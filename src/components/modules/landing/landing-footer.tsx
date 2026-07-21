import Link from "next/link";
import { LogoHorizontal } from "./logo-mark";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <Link href="/" aria-label="Fişştech anasayfa">
          <LogoHorizontal />
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text-secondary">
          <a href="#features" className="hover:text-accent">Özellikler</a>
          <a href="#how-it-works" className="hover:text-accent">Nasıl Çalışır?</a>
          <a href="#pricing" className="hover:text-accent">Fiyatlandırma</a>
          <a href="#faq" className="hover:text-accent">S.S.S</a>
          <Link href="/login" className="hover:text-accent">Giriş Yap</Link>
        </nav>
        <p className="text-xs text-text-secondary">© {new Date().getFullYear()} Fişştech</p>
      </div>
    </footer>
  );
}
