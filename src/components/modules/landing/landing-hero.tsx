import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "./reveal";

const PREVIEW_ITEMS = [
  { icon: "🥖", name: "Fırın Ürünleri", amount: "₺84,50" },
  { icon: "🥛", name: "Süt & Kahvaltılık", amount: "₺127,90" },
  { icon: "🧴", name: "Kişisel Bakım", amount: "₺63,00" },
];

const TRUST_CHIPS = [
  { icon: Zap, label: "Saniyeler içinde tarama" },
  { icon: ShieldCheck, label: "RLS ile uçtan uca güvenli" },
];

export function LandingHero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          backgroundImage: "radial-gradient(var(--color-border) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          opacity: 0.6,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 85% 10%, var(--color-accent-soft) 0%, transparent 70%), radial-gradient(45% 40% at 10% 90%, var(--color-accent-soft) 0%, transparent 70%)",
          opacity: 0.5,
        }}
      />

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:items-center md:py-28">
        <Reveal>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3.5 py-1.5 text-xs font-semibold text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Yapay Zekâ Destekli Finans Asistanı
          </span>

          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-text-primary sm:text-hero">
            Fişini Tara, <span className="text-accent">Bütçeni Yapay Zekâ Yönetsin</span>
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-text-secondary">
            Fişştech; market fişinden esnaf kasasına kadar tüm harcamalarını saniyeler içinde okur,
            kategorize eder ve net bir bütçe resmi çizer. Kişisel finansından işletmene, tek uygulama.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#demo"
              className={buttonVariants("primary", "lg", "gap-2 transition-transform hover:scale-[1.03] active:scale-[0.98]")}
            >
              Ücretsiz Dene
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/dashboard" className={buttonVariants("secondary", "lg")}>
              Uygulamaya Git
            </Link>
          </div>

          {!isAuthenticated && (
            <p className="mt-4 text-sm text-text-secondary">
              Kredi kartı gerekmez · İlk 1 hafta tüm özellikler ücretsiz
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-6">
            {TRUST_CHIPS.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-sm text-text-secondary">
                <Icon className="h-4 w-4 text-accent" />
                {label}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="relative mx-auto max-w-sm">
            <div className="pointer-events-none absolute -inset-3 rounded-card border-2 border-accent/25">
              <span className="absolute -left-0.5 -top-0.5 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-accent" />
              <span className="absolute -right-0.5 -top-0.5 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-accent" />
              <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-accent" />
              <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-accent" />
            </div>

            <div
              className="relative rounded-card border border-border bg-surface p-5"
              style={{ boxShadow: "0 25px 50px -12px color-mix(in srgb, var(--color-accent) 25%, transparent)" }}
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Migros Kampüs</p>
                  <p className="text-xs text-text-secondary">21 Temmuz 2026 · 14:32</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Okundu
                </span>
              </div>
              <ul className="mt-3 space-y-2.5">
                {PREVIEW_ITEMS.map((item) => (
                  <li key={item.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-text-primary">
                      <span
                        aria-hidden="true"
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-xs"
                      >
                        {item.icon}
                      </span>
                      {item.name}
                    </span>
                    <span className="font-medium text-text-secondary">{item.amount}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-semibold text-text-primary">Toplam</span>
                <span className="font-display text-lg font-bold text-accent">₺275,40</span>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden items-center gap-2 rounded-control border border-border bg-surface px-3.5 py-2.5 shadow-lg sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-on-accent">
                <Zap className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-text-primary">2.1 saniyede okundu</p>
                <p className="text-[11px] text-text-secondary">Yapay zekâ ile</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
