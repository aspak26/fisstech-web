import { MobileNavDrawer } from "./mobile-nav-drawer";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Topbar({
  name,
  email,
  planType,
}: {
  name: string;
  email: string;
  planType: string;
}) {
  return (
    <header className="relative z-10 flex h-16 shrink-0 items-center justify-between bg-surface px-4 lg:px-6">
      <div aria-hidden="true" className="torn-strip pointer-events-none absolute inset-x-0 top-full h-[10px] bg-surface" />
      <div className="flex items-center gap-3">
        <MobileNavDrawer />
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu name={name} email={email} planType={planType} />
      </div>
    </header>
  );
}
