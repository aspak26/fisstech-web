"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { primaryNavItems, upcomingNavItems, bottomNavItems } from "@/lib/nav-config";
import { NavLink } from "./nav-link";
import { LogoHorizontal } from "../landing/logo-mark";

export function MobileNavDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Menüyü aç"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-text-primary md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Menüyü kapat"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Ana menü"
            className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface p-3 shadow-xl"
          >
            <div className="flex h-12 items-center justify-between px-2">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center"
              >
                <LogoHorizontal height={24} />
              </Link>
              <button
                type="button"
                aria-label="Menüyü kapat"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-control text-text-secondary hover:bg-bg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav
              aria-label="Ana menü"
              className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto"
              onClick={() => setOpen(false)}
            >
              {primaryNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
              <div className="my-2 border-t border-border" />
              {upcomingNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
              <div className="my-2 border-t border-border" />
              {bottomNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
