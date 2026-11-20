import Link from "next/link";
import {
  ScanLine,
  PencilLine,
  CreditCard,
  Scale,
  Target,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const items = [
  { label: "Fiş Tara", href: "/scan", icon: ScanLine, active: true },
  { label: "Manuel Giriş", href: "/expenses", icon: PencilLine, active: true },
  { label: "Abonelikler", href: "/subscriptions", icon: CreditCard, active: true },
  { label: "Gelir & Gider", href: "/balance", icon: Wallet, active: true },
  { label: "Net Bakiye", href: "/balance", icon: Scale, active: true },
  { label: "Hedeflerim", href: "/goals", icon: Target, active: true },
];

export function QuickAccessGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "relative flex flex-col items-center gap-2 rounded-card border-[1.5px] border-ink/70 bg-surface p-4 text-center shadow-sm transition-transform hover:-translate-y-0.5 hover:-rotate-[0.6deg] press",
          )}
        >
          {!item.active && (
            <Badge tone="neutral" className="absolute right-2 top-2">
              Yakında
            </Badge>
          )}
          <span className="spot flex h-10 w-10 items-center justify-center">
            <item.icon
              className={cn("h-6 w-6", item.active ? "text-text-primary" : "text-text-secondary")}
              strokeWidth={1.9}
            />
          </span>
          <span className="text-sm font-semibold text-text-primary">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
