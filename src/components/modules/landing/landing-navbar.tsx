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
  { href: "#features", label: "Özellikler" },
  { href: "#how-it-works", label: "Nasıl Çalışır?" },
  { href: "#faq", label: "S.S.S" },
  { href: "#pricing", label: "Fiyatlandırma" },
];

const NAV_LINK_CLASS =
  "relative text-sm font-medium text-text-secondary transition-colors hover:text-accent after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-accent after:transition-all after:duration-300 hover:after:w-full";

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
        "sticky top-0 z-40 border-b bg-surface/85 backdrop-blur-md transition-shadow duration-300",
        scrolled ? "border-border shadow-sm" : "border-transparent",
      )}
    >
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
            <div className="group relative">
              <button className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
                  <User className="h-4 w-4" />
                </div>
                <span className="max-w-[120px] truncate">{userEmail}</span>
              </button>
              <div className="invisible absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl border border-border bg-surface p-2 shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-primary hover:bg-bg">
                  <LayoutDashboard className="h-4 w-4 text-text-secondary" />
                  Panele Git
                </Link>
                <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-danger hover:bg-bg">
                  <LogOut className="h-4 w-4" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" className={buttonVariants("secondary", "sm")}>
                Giriş Yap
              </Link>
              <Link href="/register" className={buttonVariants("primary", "sm", "transition-transform hover:scale-[1.03]")}>
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
        <div className="border-t border-border bg-surface px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobil menü">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-control px-2 py-2.5 text-sm font-medium text-text-primary hover:bg-bg"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2 px-2 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
                    <User className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-text-primary truncate">{userEmail}</span>
                </div>
                <div className="flex gap-2">
                  <Link href="/dashboard" className={buttonVariants("primary", "sm", "flex-1 gap-2")}>
                    <LayoutDashboard className="h-4 w-4" />
                    Panele Git
                  </Link>
                  <button onClick={handleLogout} className={buttonVariants("secondary", "sm", "flex-1 gap-2 !text-danger hover:!bg-bg border-danger/20")}>
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
