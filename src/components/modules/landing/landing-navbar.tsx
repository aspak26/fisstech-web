"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoHorizontal } from "./logo-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#features", label: "Özellikler" },
  { href: "#how-it-works", label: "Nasıl Çalışır?" },
  { href: "#faq", label: "S.S.S" },
  { href: "#pricing", label: "Fiyatlandırma" },
];

export function LandingNavbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Fişştech anasayfa" className="shrink-0">
          <LogoHorizontal />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Ana menü">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-text-secondary transition-colors hover:text-accent"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          {isAuthenticated ? (
            <Link href="/dashboard" className={buttonVariants("primary", "sm")}>
              Panele Git
            </Link>
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
              <Link href="/dashboard" className={buttonVariants("primary", "sm", "flex-1")}>
                Panele Git
              </Link>
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
