import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoHorizontal } from "@/components/modules/landing/logo-mark";
import Link from "next/link";

// Intentionally no "already logged in -> redirect" check here: it must live
// per-page (see login/register/forgot-password) rather than in this shared
// layout, because /reset-password is also an (auth) route and a password
// recovery link legitimately creates a session before the user has set
// their new password — redirecting it away here would break that flow.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-bg">
      {/* Kâğıt: kareli defter zemini üstüne bantla yapıştırılmış form kartı */}
      <div aria-hidden="true" className="grid-paper pointer-events-none absolute inset-0" />
      <header className="relative flex h-16 items-center justify-between px-4 lg:px-8">
        <Link href="/" aria-label="Fişştech anasayfa">
          <LogoHorizontal />
        </Link>
        <ThemeToggle />
      </header>
      <main className="relative flex flex-1 items-center justify-center px-4 pb-16 pt-6">
        <div className="relative w-full max-w-md">
          <div
            aria-hidden="true"
            className="absolute inset-0 rotate-[2deg] rounded-card border-[1.5px] border-ink/30 bg-surface-alt"
          />
          <div className="relative rounded-card border-[1.5px] border-ink/80 bg-surface px-6 py-8 shadow-lg sm:px-10">
            <span aria-hidden="true" className="tape -top-3 left-1/2 -translate-x-1/2 -rotate-2" />
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
