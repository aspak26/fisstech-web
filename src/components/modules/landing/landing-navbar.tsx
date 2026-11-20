"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import { LogoHorizontal } from "./logo-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "#demo", label: "Ücretsiz Fiş Tarama" },
  { href: "#features", label: "Özellikler" },
  { href: "#how-it-works", label: "Nasıl Çalışır?" },
  { href: "#faq", label: "S.S.S" },
  { href: "#pricing", label: "Fiyatlandırma" },
];

const NAV_LINK_CLASS =
  "relative text-sm font-medium text-text-secondary transition-colors hover:text-accent after:absolute after:-bottom-1 after:left-0 after:h-[3px] after:w-0 after:rounded-full after:bg-tape after:transition-all after:duration-300 hover:after:w-full";

export function LandingNavbar({ userEmail }: { userEmail?: string }) {
  const isAuthenticated = !!userEmail;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  };

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        // Kâğıt: buzlu cam yerine yırtık alt kenarlı kâğıt şerit. Kaydırınca
        // bant rengine değil, kart kâğıdına geçer ve gölgesi belirginleşir.
        // (Yırtık kenar ayrı şerit — header'a mask verilse açılır menüler kesilirdi.)
        "sticky top-0 z-40 transition-colors duration-300",
        scrolled ? "bg-surface" : "bg-bg",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "torn-strip pointer-events-none absolute inset-x-0 top-full h-[10px] transition-colors duration-300",
          scrolled ? "bg-surface drop-shadow-[0_2px_0_var(--shadow-ink)]" : "bg-bg",
        )}
      />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Fişştech anasayfa" className="shrink-0">
          <LogoHorizontal />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Ana menü">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className={NAV_LINK_CLASS}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              {/* Kâğıt: "Panele Git" artık gizli bir menüde değil, birincil
                  düğme. Hesap (e-posta + çıkış) bantlı küçük not kâğıdında. */}
              <Link href="/dashboard" className={buttonVariants("primary", "sm", "gap-2")}>
                <LayoutDashboard className="h-4 w-4" />
                Panele Git
              </Link>
              <div className="group relative">
                <button
                  type="button"
                  aria-label="Hesap menüsü"
                  aria-haspopup="menu"
                  className="press flex h-9 w-9 items-center justify-center rounded-xl border-[1.5px] border-ink/70 bg-surface text-text-primary shadow-xs transition-colors hover:bg-surface-alt"
                >
                  <User className="h-4 w-4" />
                </button>
                <div className="invisible absolute right-0 top-full z-50 pt-3 opacity-0 transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div role="menu" className="relative w-60 rotate-[0.8deg] rounded-xl border-[1.5px] border-ink/80 bg-surface p-2 shadow-lg">
                    <span aria-hidden="true" className="tape -top-3 right-6 rotate-6" />
                    <div className="px-3 pb-2 pt-1.5">
                      <p className="font-hand text-lg leading-none text-text-secondary">hesabın</p>
                      <p className="mt-1 truncate text-sm font-semibold text-text-primary">{userEmail}</p>
                    </div>
                    <div className="my-1 border-t-[1.5px] border-dashed border-ink/25" />
                    <Link role="menuitem" href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-alt">
                      <LayoutDashboard className="h-4 w-4 text-accent" />
                      Panele Git
                    </Link>
                    <button role="menuitem" type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10">
                      <LogOut className="h-4 w-4" />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants("secondary", "sm")}>
                Giriş Yap
              </Link>
              <Link href="/register" className={buttonVariants("primary", "sm")}>
                Hemen Başla
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-control p-2 text-text-primary lg:hidden"
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="dashed-rule bg-surface px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobil menü">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-control px-2 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-alt"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="dashed-rule mt-3 flex items-center justify-between gap-3 pt-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2 rounded-xl border-[1.5px] border-dashed border-ink/35 bg-surface-alt px-3 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-ink/70 bg-surface text-text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="truncate text-sm font-semibold text-text-primary">{userEmail}</span>
                </div>
                <div className="flex gap-2">
                  <Link href="/dashboard" className={buttonVariants("primary", "sm", "flex-1 gap-2")}>
                    <LayoutDashboard className="h-4 w-4" />
                    Panele Git
                  </Link>
                  <button onClick={handleLogout} className={buttonVariants("secondary", "sm", "flex-1 gap-2 text-danger")}>
                    <LogOut className="h-4 w-4" />
                    Çıkış Yap
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 gap-2">
                <Link href="/login" className={buttonVariants("secondary", "sm", "flex-1")}>
                  Giriş Yap
                </Link>
                <Link href="/register" className={buttonVariants("primary", "sm", "flex-1")}>
                  Hemen Başla
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
