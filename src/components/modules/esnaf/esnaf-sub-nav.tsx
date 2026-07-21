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
  Warehouse,
  Building2,
  Truck,
  FolderKanban,
  ListChecks,
  Receipt,
  Image as ImageIcon,
  GitBranch,
  Settings,
  LayoutGrid,
  ShoppingBag,
  Calculator,
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
  { href: "/esnaf/ayarlar", label: "Ayarlar", icon: Settings },
];

const SECTOR_TABS: Record<string, { href: string; label: string; icon: typeof Wallet }[]> = {
  kafe: [
    { href: "/esnaf/kafe/salon", label: "Salon", icon: LayoutGrid },
    { href: "/esnaf/kafe/paket", label: "Paket Servis", icon: ShoppingBag },
    { href: "/esnaf/menu", label: "Menü", icon: UtensilsCrossed },
    { href: "/esnaf/kafe/kasa", label: "Restoran Kasa", icon: Calculator },
  ],
  perakende: [
    { href: "/esnaf/perakende/urunler", label: "Ürünler", icon: Tags },
    { href: "/esnaf/perakende/kasa", label: "Hızlı Kasa", icon: ShoppingCart },
    { href: "/esnaf/perakende/veresiye", label: "Veresiye", icon: HandCoins },
    { href: "/esnaf/perakende/gecmis", label: "Geçmiş", icon: Receipt },
  ],
  hizmet: [
    { href: "/esnaf/hizmet/ajanda", label: "Ajanda", icon: CalendarClock },
    { href: "/esnaf/hizmet/atolye", label: "Atölye", icon: Wrench },
    { href: "/esnaf/hizmet/musteri", label: "Müşteriler", icon: Contact },
    { href: "/esnaf/hizmet/katalog", label: "Katalog", icon: BookOpen },
  ],
  toptan: [
    { href: "/esnaf/toptan/depo", label: "Depo", icon: Warehouse },
    { href: "/esnaf/toptan/siparis", label: "Toplu Sipariş", icon: ShoppingCart },
    { href: "/esnaf/toptan/sevkiyat", label: "Sevkiyat", icon: Truck },
    { href: "/esnaf/toptan/bayiler", label: "Bayiler", icon: Building2 },
  ],
  freelance: [
    { href: "/esnaf/freelance/projeler", label: "Projeler", icon: FolderKanban },
    { href: "/esnaf/freelance/gorevler", label: "Görevler", icon: ListChecks },
    { href: "/esnaf/freelance/musteri", label: "Müşteriler", icon: Contact },
    { href: "/esnaf/freelance/finans", label: "Finans", icon: Receipt },
  ],
  satis: [
    { href: "/esnaf/satis/portfoy", label: "Portföy", icon: ImageIcon },
    { href: "/esnaf/satis/surecler", label: "Süreçler", icon: GitBranch },
    { href: "/esnaf/satis/musteri", label: "Müşteriler", icon: Contact },
  ],
};

export function EsnafSubNav({ businessType }: { businessType: string }) {
  const pathname = usePathname();
  const extraTabs = SECTOR_TABS[businessType] ?? [];
  const tabs = [...BASE_TABS.slice(0, 2), ...extraTabs, ...BASE_TABS.slice(2)];

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
