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
  { label: "Harcamalarım", href: "/expenses", icon: Receipt, status: "soon" },
  { label: "Gelirlerim", href: "/income", icon: Wallet, status: "soon" },
  { label: "Net Bakiye & Gelir-Gider", href: "/balance", icon: Scale, status: "soon" },
  { label: "Borçlarım", href: "/debts", icon: HandCoins, status: "soon" },
  { label: "Hedeflerim", href: "/goals", icon: Target, status: "soon" },
  { label: "Yatırımlarım", href: "/investments", icon: TrendingUp, status: "soon" },
  { label: "Abonelikler", href: "/subscriptions", icon: CreditCard, status: "soon" },
  { label: "Gruplarım", href: "/groups", icon: Users, status: "soon" },
  { label: "Analizler & Raporlar", href: "/analytics", icon: BarChart3, status: "soon" },
  { label: "AI Sohbet", href: "/ai-chat", icon: MessageCircle, status: "soon" },
  { label: "Notlar", href: "/notes", icon: StickyNote, status: "soon" },
];

export const bottomNavItems: NavItem[] = [
  { label: "Ayarlar", href: "/settings", icon: Settings, status: "soon" },
  { label: "Esnaf Modu", href: "/esnaf", icon: Store, status: "soon" },
];

export const allNavItems: NavItem[] = [
  ...primaryNavItems,
  ...upcomingNavItems,
  ...bottomNavItems,
];
