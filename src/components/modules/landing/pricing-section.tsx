"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { BACKUP_ADDON, PRICING_PLANS } from "@/lib/landing/pricing-data";
import { Reveal } from "./reveal";

const DEFAULT_PLAN_ID = PRICING_PLANS.find((p) => p.popular)?.id ?? PRICING_PLANS[0].id;

export function PricingSection() {
  const [yearly, setYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(DEFAULT_PLAN_ID);

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

      <div className="mt-14 grid gap-8 md:grid-cols-3 md:items-start">
        {PRICING_PLANS.map((plan, i) => {
          const isSelected = plan.id === selectedPlan;
          return (
            <Reveal key={plan.id} delay={i * 100}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPlan(plan.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedPlan(plan.id);
                  }
                }}
                aria-pressed={isSelected}
                className={cn(
                  "relative flex h-full cursor-pointer flex-col rounded-card border bg-surface p-8 transition-all duration-300 ease-in-out hover:-translate-y-1.5 hover:border-accent",
                  "hover:shadow-[0_0_40px_-10px_color-mix(in_srgb,var(--color-accent)_45%,transparent)]",
                  isSelected ? "border-2 border-accent" : "border-border shadow-sm",
                )}
                style={
                  isSelected
                    ? { boxShadow: "0 0 70px -18px color-mix(in srgb, var(--color-accent) 55%, transparent)" }
                    : undefined
                }
              >
                {plan.popular && (
                  <span className="absolute -top-4 left-1/2 inline-flex w-fit -translate-x-1/2 items-center whitespace-nowrap rounded-full bg-accent px-4 py-1.5 text-xs font-bold tracking-wide text-on-accent shadow-md">
                    En Popüler
                  </span>
                )}

                <div className="flex items-center gap-2.5">
                  <plan.icon className="h-5 w-5 text-accent" aria-hidden="true" />
                  <h3 className="font-display text-lg font-semibold text-text-primary">{plan.name}</h3>
                </div>
                <p className="mt-2 text-sm text-text-secondary">{plan.description}</p>

                <div className="mt-6 flex items-end gap-1.5">
                  <span className="text-lg font-medium text-text-secondary">₺</span>
                  <span className="relative inline-grid font-display text-6xl font-bold leading-none tracking-tight text-text-primary">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={yearly ? plan.yearly : plan.monthly}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="col-start-1 row-start-1"
                      >
                        {yearly ? plan.yearly : plan.monthly}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span className="pb-1 text-lg text-text-secondary">{yearly ? "/yıl" : "/ay"}</span>
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                  {yearly
                    ? `Ayda sadece ₺${plan.yearlyEffective}'a denk gelir · ${plan.yearlySavings} tasarruf`
                    : "Aylık faturalandırılır · vergiler dahildir"}
                </p>

                <Link
                  href="/register"
                  onClick={(e) => e.stopPropagation()}
                  className={buttonVariants(
                    isSelected ? "primary" : "secondary",
                    "lg",
                    cn("mt-6 w-full", !isSelected && "border-border bg-transparent text-text-secondary hover:border-accent hover:text-accent"),
                  )}
                >
                  Hemen Başla
                </Link>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-text-primary">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          );
        })}
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
