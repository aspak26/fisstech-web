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
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
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
