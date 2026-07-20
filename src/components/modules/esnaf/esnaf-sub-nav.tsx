"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  FileText,
  Users,
  Package,
  BarChart3,
  UtensilsCrossed,
  FolderOpen,
  Tags,
  ShoppingCart,
  HandCoins,
  CalendarClock,
  Wrench,
  Contact,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const BASE_TABS = [
  { href: "/esnaf/pano", label: "Pano", icon: LayoutDashboard },
  { href: "/esnaf/kasa", label: "Kasa Defteri", icon: Wallet },
  { href: "/esnaf/faturalar", label: "Faturalar", icon: FileText },
  { href: "/esnaf/evrak", label: "Evrak Arşivi", icon: FolderOpen },
  { href: "/esnaf/personel", label: "Personel", icon: Users },
  { href: "/esnaf/stok", label: "Stok", icon: Package },
  { href: "/esnaf/raporlar", label: "Raporlar", icon: BarChart3 },
];

const MENU_TAB = { href: "/esnaf/menu", label: "Menü", icon: UtensilsCrossed };

const PERAKENDE_TABS = [
  { href: "/esnaf/perakende/urunler", label: "Ürünler", icon: Tags },
  { href: "/esnaf/perakende/kasa", label: "Hızlı Kasa", icon: ShoppingCart },
  { href: "/esnaf/perakende/veresiye", label: "Veresiye", icon: HandCoins },
];

const HIZMET_TABS = [
  { href: "/esnaf/hizmet/ajanda", label: "Ajanda", icon: CalendarClock },
  { href: "/esnaf/hizmet/atolye", label: "Atölye", icon: Wrench },
  { href: "/esnaf/hizmet/musteri", label: "Müşteriler", icon: Contact },
  { href: "/esnaf/hizmet/katalog", label: "Katalog", icon: BookOpen },
];

export function EsnafSubNav({ businessType }: { businessType: string }) {
  const pathname = usePathname();
  const tabs =
    businessType === "kafe"
      ? [...BASE_TABS.slice(0, 3), MENU_TAB, ...BASE_TABS.slice(3)]
      : businessType === "perakende"
        ? [...BASE_TABS.slice(0, 2), ...PERAKENDE_TABS, ...BASE_TABS.slice(2)]
        : businessType === "hizmet"
          ? [...BASE_TABS.slice(0, 2), ...HIZMET_TABS, ...BASE_TABS.slice(2)]
          : BASE_TABS;

  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium",
              active
                ? "border-accent text-accent"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
