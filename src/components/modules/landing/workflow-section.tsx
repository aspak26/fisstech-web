"use client";

import { motion } from "framer-motion";
import { Camera, Cloud, FileUp, Lock, ShieldCheck, Zap } from "lucide-react";

const SECURITY_BADGES = [
  { icon: Lock, label: "SSL Şifreli Aktarım" },
  { icon: ShieldCheck, label: "KVKK Uyumlu" },
  { icon: Cloud, label: "Güvenli Bulut Altyapısı" },
  { icon: Zap, label: "Anında Sonuç" },
];

const REPORT_ROWS = [
  { icon: "🍞", label: "Fırın", amount: "₺84,50" },
  { icon: "🛒", label: "Market", amount: "₺342,10" },
  { icon: "☕", label: "Kafe & Restoran", amount: "₺165,00" },
  { icon: "💊", label: "Sağlık", amount: "₺100,50" },
];

function FloatingCard({
  children,
  delay,
  floatDuration,
  className,
}: {
  children: React.ReactNode;
  delay: number;
  floatDuration: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: floatDuration, repeat: Infinity, ease: "easeInOut" }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function WorkflowSection() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-bg py-24">
      {/* Kâğıt: nokta deseni yerine kareli defter zemini (token'dan türer). */}
      <div aria-hidden="true" className="grid-paper pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-bold text-text-primary">
            Yükle, <span className="ink-underline">Analiz Et</span>, Rapor Al
          </h2>
          <p className="mt-3 text-text-secondary">Tek bir iş akışında fişten anlamlı finansal rapora.</p>
        </div>

        <div className="mt-16 grid items-center gap-6 lg:grid-cols-3">
          {/* Sol: Fiş Yükle */}
          <FloatingCard delay={0} floatDuration={4.5} className="lg:scale-95">
            <div className="-rotate-[1.5deg] rounded-card border-[1.5px] border-ink/70 bg-surface p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Fiş Yükle</p>
              <div className="mt-4 flex flex-col items-center gap-2 rounded-control border-2 border-dashed border-ink/40 bg-surface-alt px-4 py-8 text-center">
                <FileUp className="h-7 w-7 text-text-secondary" />
                <p className="text-xs text-text-secondary">kampus_market_fisi.jpg</p>
              </div>
              <div className="mt-4 flex gap-2">
                <span className="flex flex-1 items-center justify-center gap-1.5 rounded-control border-[1.5px] border-ink/60 py-2 text-xs font-medium text-text-primary">
                  <Camera className="h-3.5 w-3.5" />
                  Kamera
                </span>
                <span className="flex flex-1 items-center justify-center rounded-control border-[1.5px] border-ink/60 py-2 text-xs font-medium text-text-primary">
                  Dosya Seç
                </span>
              </div>
            </div>
          </FloatingCard>

          {/* Orta: Analiz Et */}
          <FloatingCard delay={0.15} floatDuration={5.5} className="relative z-10">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative rounded-card border-[1.5px] border-ink/80 bg-surface p-6 shadow-lg"
            >
              <span aria-hidden="true" className="tape -top-3 left-1/2 -translate-x-1/2 -rotate-2" />
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-semibold text-text-primary">Fişştech ile Analiz Et</p>
                <span className="stamp text-accent">AI Okuyor</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  ["Mağaza", "Kampüs Market"],
                  ["Tarih", "21.07.2026"],
                  ["Toplam", "₺258,40"],
                  ["KDV", "%10"],
                ].map(([label, value]) => (
                  <li key={label} className="flex items-center justify-between border-b-[1.5px] border-dashed border-ink/25 pb-2 last:border-0">
                    <span className="text-text-secondary">{label}</span>
                    <span className="font-medium text-text-primary">{value}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-4 flex w-full items-center justify-center rounded-control border-[1.5px] border-ink/80 bg-accent py-2.5 text-xs font-semibold text-on-accent shadow-sm">
                PDF/Excel Aktar
              </span>
            </motion.div>
          </FloatingCard>

          {/* Sağ: Rapor & Dışa Aktarım */}
          <FloatingCard delay={0.3} floatDuration={5} className="lg:scale-95">
            <div className="rotate-[1.5deg] rounded-card border-[1.5px] border-ink/70 bg-surface p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Rapor &amp; Dışa Aktarım</p>
              <ul className="mt-4 space-y-2.5">
                {REPORT_ROWS.map((row) => (
                  <li key={row.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-text-primary">
                      <span aria-hidden="true">{row.icon}</span>
                      {row.label}
                    </span>
                    <span className="font-medium tabular-nums text-text-primary">{row.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FloatingCard>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 dashed-rule pt-10">
          {SECURITY_BADGES.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="spot flex h-6 w-6 items-center justify-center">
                <Icon className="h-4 w-4 text-text-primary" />
              </span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
