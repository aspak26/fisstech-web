"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { NavItem } from "@/lib/nav-config";
import { Badge } from "@/components/ui/badge";

export function NavLink({ item, collapsed }: { item: NavItem; collapsed?: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-accent/10 text-accent"
          : "text-text-secondary hover:bg-bg hover:text-text-primary",
        item.status === "soon" && "pointer-events-none opacity-60",
      )}
      title={collapsed ? item.label : undefined}
      tabIndex={item.status === "soon" ? -1 : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
      <span className={cn("truncate", collapsed && "hidden lg:inline")}>{item.label}</span>
      {item.status === "soon" && (
        <Badge tone="neutral" className={cn("ml-auto shrink-0", collapsed && "hidden lg:inline-flex")}>
          Test Aşamasında
        </Badge>
      )}
    </Link>
  );
}
