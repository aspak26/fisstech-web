import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ScanLine,
  Receipt,
  Wallet,
  Scale,
  HandCoins,
  Target,
  TrendingUp,
  CreditCard,
  Users,
  BarChart3,
  MessageCircle,
  StickyNote,
  Settings,
  Store,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  status: "active" | "soon";
}

/** Single source of truth for the sidebar. "soon" items are real routes that
 * land on the shared ComingSoonPage — never dead links. */
export const primaryNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, status: "active" },
  { label: "Fiş Tara", href: "/scan", icon: ScanLine, status: "active" },
];

export const upcomingNavItems: NavItem[] = [
  { label: "Harcamalarım", href: "/expenses", icon: Receipt, status: "active" },
  { label: "Gelirlerim", href: "/income", icon: Wallet, status: "active" },
  { label: "Net Bakiye & Gelir-Gider", href: "/balance", icon: Scale, status: "active" },
  { label: "Borçlarım", href: "/debts", icon: HandCoins, status: "active" },
  { label: "Hedeflerim", href: "/goals", icon: Target, status: "active" },
  { label: "Yatırımlarım", href: "/investments", icon: TrendingUp, status: "active" },
  { label: "Abonelikler", href: "/subscriptions", icon: CreditCard, status: "active" },
  { label: "Gruplarım", href: "/groups", icon: Users, status: "active" },
  { label: "Analizler & Raporlar", href: "/analytics", icon: BarChart3, status: "active" },
  { label: "AI Sohbet", href: "/ai-chat", icon: MessageCircle, status: "active" },
  { label: "Notlar", href: "/notes", icon: StickyNote, status: "active" },
];

export const bottomNavItems: NavItem[] = [
  { label: "Ayarlar", href: "/settings", icon: Settings, status: "active" },
  { label: "Esnaf Modu", href: "/esnaf", icon: Store, status: "active" },
];

export const allNavItems: NavItem[] = [
  ...primaryNavItems,
  ...upcomingNavItems,
  ...bottomNavItems,
];
