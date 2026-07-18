import { ThemeToggle } from "@/components/ui/theme-toggle";

// Intentionally no "already logged in -> redirect" check here: it must live
// per-page (see login/register/forgot-password) rather than in this shared
// layout, because /reset-password is also an (auth) route and a password
// recovery link legitimately creates a session before the user has set
// their new password — redirecting it away here would break that flow.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-16 items-center justify-between px-4 lg:px-8">
        <span className="font-display text-xl font-bold text-accent">Fişştech</span>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
