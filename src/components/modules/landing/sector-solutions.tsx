"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SECTOR_SOLUTIONS } from "@/lib/landing/sector-data";
import { Reveal } from "./reveal";

export function SectorSolutions() {
  const [activeId, setActiveId] = useState(SECTOR_SOLUTIONS[0].id);
  const active = SECTOR_SOLUTIONS.find((s) => s.id === activeId)!;

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
          İşletmenizin İhtiyacına Özel 6 Farklı Esnaf Modu
        </h2>
        <p className="mt-4 text-text-secondary">
          Fişştech, tek bir kalıba sığmaya çalışan sıradan ön muhasebe programlarından farklıdır.
          Sektörünüzü seçtiğiniz an, uygulamanın tüm arayüzü ve özellikleri sizin iş akışınıza göre
          şekillenir.
        </p>
      </Reveal>

      <div className="mt-12 grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-10">
        {/* min-w-0 zorunlu — CSS Grid item'ları varsayılan min-width:auto
            alır, bu da içindeki overflow-x-auto sekme çubuğunun kaydırma
            yerine grid sütununu (ve sayfayı) genişletmesine yol açıyordu. */}
        <Reveal delay={80} className="min-w-0">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {SECTOR_SOLUTIONS.map((sector) => {
              const isActive = sector.id === activeId;
              return (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => setActiveId(sector.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-3 rounded-control border-l-4 px-4 py-3 text-left text-sm font-medium transition-all duration-300",
                    isActive
                      ? "border-l-accent bg-accent-soft text-accent"
                      : "border-l-transparent bg-transparent text-text-secondary hover:border-l-border hover:bg-bg",
                  )}
                >
                  <sector.icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap lg:whitespace-normal">{sector.label}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={140} className="min-w-0">
          <div className="grid items-start gap-8 md:grid-cols-2 lg:gap-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <p className="text-sm italic text-text-secondary">{active.subSectors.join(", ")}</p>
                <p className="mt-3 text-base leading-relaxed text-text-primary">{active.description}</p>
                <ul className="mt-6 space-y-3">
                  {active.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-text-primary">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${active.id}-mockup`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="rounded-2xl border border-border bg-surface p-5"
                style={{ boxShadow: "0 0 50px -12px color-mix(in srgb, var(--color-accent) 35%, transparent)" }}
              >
                <div className="flex items-center gap-2.5 border-b border-border pb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-control bg-accent-soft text-accent">
                    <active.icon className="h-5 w-5" />
                  </span>
                  <p className="font-display text-base font-semibold text-text-primary">{active.label} Özellikleri</p>
                </div>
                
                <div className="mt-5 space-y-4">
                  {active.highlights.map((highlight) => (
                    <div key={highlight.title} className="flex gap-4 rounded-xl border border-border/40 bg-bg p-4 transition-colors hover:border-accent/30 hover:bg-accent-soft/30">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface text-accent shadow-sm">
                        <highlight.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-semibold text-text-primary">{highlight.title}</h4>
                        <p className="mt-1 text-sm text-text-secondary leading-relaxed">{highlight.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>

      <Reveal delay={200} className="mt-12">
        <div
          className="mx-auto flex max-w-3xl items-start gap-3 rounded-card border border-accent/20 px-6 py-5 text-center sm:items-center sm:text-left"
          style={{ background: "color-mix(in srgb, var(--color-accent) 8%, transparent)" }}
        >
          <Lightbulb className="mx-auto h-5 w-5 shrink-0 text-accent sm:mx-0" />
          <p className="text-sm leading-relaxed text-text-secondary">
            <strong className="font-semibold text-text-primary">Ortak İşletme Gücü:</strong> Hangi
            modülü seçerseniz seçin; personel maaş yönetimi, yapay zeka ile masraf fişi tarama ve
            anlık İşletme Sağlık Raporu özelliklerine standart olarak erişirsiniz.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
