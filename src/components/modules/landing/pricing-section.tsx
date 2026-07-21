"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { BACKUP_ADDON, PRICING_PLANS } from "@/lib/landing/pricing-data";
import { Reveal } from "./reveal";

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-bold text-text-primary">Fiyatlandırma</h2>
        <p className="mt-3 text-text-secondary">
          İhtiyacına göre seç. Satın alma işlemi mobil uygulama üzerinden yapılır.
        </p>
      </Reveal>

      <Reveal delay={80} className="mt-8 flex items-center justify-center gap-3">
        <span className={cn("text-sm font-medium", !yearly ? "text-text-primary" : "text-text-secondary")}>
          Aylık
        </span>
        <Switch checked={yearly} onChange={setYearly} />
        <span className={cn("text-sm font-medium", yearly ? "text-text-primary" : "text-text-secondary")}>
          Yıllık
        </span>
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {PRICING_PLANS.map((plan, i) => (
          <Reveal key={plan.id} delay={i * 100}>
            <div
              className={cn(
                "flex h-full flex-col rounded-card border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl",
                plan.popular ? "border-2 border-accent shadow-accent/10" : "border-border",
              )}
            >
              {plan.popular && (
                <span className="mb-3 inline-flex w-fit items-center rounded-full bg-accent px-3 py-1 text-xs font-bold text-on-accent">
                  En Popüler
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">
                  {plan.emoji}
                </span>
                <h3 className="font-display text-lg font-semibold text-text-primary">{plan.name}</h3>
              </div>
              <p className="mt-2 text-sm text-text-secondary">{plan.description}</p>

              <div className="mt-5">
                <span className="font-display text-3xl font-bold text-text-primary">
                  {yearly ? plan.yearlyEffective : plan.monthly}
                </span>
                <span className="text-sm text-text-secondary">/ay</span>
                {yearly && (
                  <p className="mt-1 text-xs text-success">
                    Yıllık {plan.yearly} olarak tahsil edilir · {plan.yearlySavings} tasarruf
                  </p>
                )}
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-primary">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={buttonVariants(plan.popular ? "primary" : "secondary", "md", "mt-6 w-full")}
              >
                Hemen Başla
              </Link>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={300} className="mt-6">
        <div className="flex flex-col items-center justify-between gap-3 rounded-card border border-border bg-surface p-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              {BACKUP_ADDON.emoji}
            </span>
            <div>
              <p className="font-medium text-text-primary">
                {BACKUP_ADDON.name} <span className="text-text-secondary">— Eklenti</span>
              </p>
              <p className="text-sm text-text-secondary">{BACKUP_ADDON.description}</p>
            </div>
          </div>
          <span className="font-display text-lg font-bold text-text-primary">
            {BACKUP_ADDON.monthly}
            <span className="text-sm font-normal text-text-secondary">/ay</span>
          </span>
        </div>
      </Reveal>

      <p className="mt-4 text-center text-xs text-text-secondary">
        Fiyatlar güncel uygulama fiyatlarını yansıtır, App Store/Google Play üzerindeki güncel fiyatla
        küçük farklılıklar olabilir.
      </p>
    </section>
  );
}
