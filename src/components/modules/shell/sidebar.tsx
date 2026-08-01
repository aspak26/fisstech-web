import Link from "next/link";
import { primaryNavItems, upcomingNavItems, bottomNavItems } from "@/lib/nav-config";
import { NavLink } from "./nav-link";
import { LogoIcon, LogoWordmark } from "../landing/logo-mark";

export function Sidebar() {
  return (
    <aside className="hidden shrink-0 flex-col border-r border-border bg-surface md:flex md:w-16 lg:w-64">
      <div className="flex h-16 items-center border-b border-border px-4 lg:px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <LogoIcon height={28} className="lg:hidden" />
          <LogoIcon height={28} className="hidden lg:block" />
          <LogoWordmark height={24} className="hidden lg:block" />
        </Link>
      </div>

      <nav aria-label="Ana menü" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {primaryNavItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed />
        ))}

        <div className="my-2 border-t border-border" />

        {upcomingNavItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed />
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-border p-3">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed />
        ))}
      </div>
    </aside>
  );
}
