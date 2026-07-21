import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "./reveal";

const PREVIEW_ITEMS = [
  { icon: "🥖", name: "Fırın Ürünleri", amount: "₺84,50" },
  { icon: "🥛", name: "Süt & Kahvaltılık", amount: "₺127,90" },
  { icon: "🧴", name: "Kişisel Bakım", amount: "₺63,00" },
];

export function LandingHero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative overflow-hidden">
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

          <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-text-primary sm:text-hero">
            Fişini Tara, <span className="text-accent">Bütçeni Yapay Zekâ Yönetsin</span>
          </h1>

          <p className="mt-5 max-w-lg text-lg text-text-secondary">
            Fişştech; market fişinden esnaf kasasına kadar tüm harcamalarını saniyeler içinde okur,
            kategorize eder ve net bir bütçe resmi çizer. Kişisel finansından işletmene, tek uygulama.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#demo" className={buttonVariants("primary", "lg", "gap-2")}>
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
        </Reveal>

        <Reveal delay={150}>
          <div className="relative mx-auto max-w-sm">
            <div className="pointer-events-none absolute -inset-3 rounded-card border-2 border-accent/25">
              <span className="absolute -left-0.5 -top-0.5 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-accent" />
              <span className="absolute -right-0.5 -top-0.5 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-accent" />
              <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-accent" />
              <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-accent" />
            </div>

            <div className="relative rounded-card border border-border bg-surface p-5 shadow-xl shadow-accent/10">
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
                      <span aria-hidden="true">{item.icon}</span>
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
          </div>
        </Reveal>
      </div>
    </section>
  );
}
