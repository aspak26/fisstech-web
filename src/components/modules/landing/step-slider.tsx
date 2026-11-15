"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ClipboardCheck, PiggyBank, Receipt, ScanLine, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Reveal } from "./reveal";

const STEPS = [
  {
    icon: UploadCloud,
    title: "Belgeyi Yükleyin",
    description: "Fişini, faturanı veya kredi kartı ekstreni telefonundan ya da bilgisayarından tek tıkla yükle.",
  },
  {
    icon: ScanLine,
    title: "AI Analiz Etsin",
    description: "Fişştech'in yapay zekâsı mağaza adını, tarihi, ürünleri ve tutarları saniyeler içinde okur.",
  },
  {
    icon: ClipboardCheck,
    title: "Kontrol Edin",
    description: "Okunan verileri gözden geçir, gerekirse tek tıkla düzelt — kontrol her zaman sende.",
  },
  {
    icon: PiggyBank,
    title: "Bütçenize İşlensin",
    description: "Onayladığın harcama otomatik olarak bütçene işlenir, grafiklerle anında görünür olur.",
  },
];

const STEP_DURATION_MS = 3800;

const REVIEW_ROWS = [
  { label: "Mağaza", value: "Kampüs Market" },
  { label: "Toplam", value: "₺258,40" },
  { label: "KDV", value: "%10" },
];

function StageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex h-full w-full flex-col items-center justify-center gap-3 text-center"
    >
      {children}
    </motion.div>
  );
}

function UploadStage() {
  return (
    <StageWrapper>
      <div className="relative flex h-24 w-20 items-center justify-center rounded-lg border-2 border-dashed border-ink/45 bg-surface-alt">
        <Receipt className="h-8 w-8 text-text-secondary" />
        <motion.span
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-3 -right-3 flex h-9 w-9 items-center justify-center rounded-xl border-[1.5px] border-ink/80 bg-accent text-on-accent shadow-sm"
        >
          <UploadCloud className="h-4 w-4" />
        </motion.span>
      </div>
      <p className="text-xs font-medium text-text-secondary">Fiş yükleniyor…</p>
    </StageWrapper>
  );
}

function ScanStage() {
  return (
    <StageWrapper>
      <div className="receipt-edge relative h-28 w-20 overflow-hidden border-x-[1.5px] border-t-[1.5px] border-ink/50 bg-surface-alt">
        <Receipt className="absolute inset-0 m-auto h-8 w-8 text-text-secondary" />
        <motion.div
          animate={{ top: ["4%", "92%", "4%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-0 right-0 h-1 bg-tape"
        />
      </div>
      <p className="text-xs font-medium text-text-secondary">Yapay zekâ okuyor…</p>
    </StageWrapper>
  );
}

function ReviewStage() {
  return (
    <StageWrapper>
      <ul className="w-full max-w-[9.5rem] space-y-2 text-left">
        {REVIEW_ROWS.map((row, i) => (
          <motion.li
            key={row.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.18, duration: 0.3 }}
            className="rounded-md border border-ink/25 bg-surface-alt px-2.5 py-1.5 text-xs"
          >
            <span className="flex items-center gap-1.5 text-text-secondary">
              <CheckCircle2 className="h-3 w-3 shrink-0 text-accent" />
              {row.label}
            </span>
            <span className="mt-0.5 block truncate pl-[1.125rem] font-semibold text-text-primary">{row.value}</span>
          </motion.li>
        ))}
      </ul>
    </StageWrapper>
  );
}

function SuccessStage() {
  return (
    <StageWrapper>
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl border-[1.5px] border-ink/80 bg-accent text-on-accent shadow-md"
      >
        <PiggyBank className="h-7 w-7" />
      </motion.span>
      <div className="flex items-end gap-1.5">
        {[10, 18, 13, 22].map((h, i) => (
          <motion.span
            key={i}
            initial={{ height: 2 }}
            animate={{ height: h * 2 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.4, ease: "easeOut" }}
            className="w-2.5 rounded-t-sm border-[1.5px] border-b-0 border-ink/60 bg-spot"
          />
        ))}
      </div>
      <p className="text-xs font-medium text-text-secondary">Veriler kaydedildi</p>
    </StageWrapper>
  );
}

export function StepSlider() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setActive((a) => (a + 1) % STEPS.length), STEP_DURATION_MS);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <section id="how-it-works" className="notebook bg-bg py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-bold text-text-primary">
            <span className="ink-underline">Nasıl Çalışır?</span>
          </h2>
          <p className="mt-3 font-hand text-2xl text-text-secondary">Dört adımda fişten bütçeye.</p>
        </Reveal>

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="space-y-3">
            {STEPS.map((step, i) => {
              const isActive = active === i;
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "w-full rounded-card border-[1.5px] p-5 text-left transition-all duration-300",
                    isActive
                      ? "-rotate-[0.6deg] border-ink/75 bg-surface shadow-md"
                      : "border-ink/20 border-dashed bg-transparent hover:border-ink/45",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[1.5px] font-hand text-2xl font-bold transition-colors",
                        isActive ? "border-ink/80 bg-accent text-on-accent" : "border-ink/35 text-text-secondary",
                      )}
                    >
                      {i + 1}
                    </span>
                    <h3
                      className={cn(
                        "font-display text-base font-semibold transition-colors",
                        isActive ? "text-text-primary" : "text-text-secondary",
                      )}
                    >
                      {step.title}
                    </h3>
                  </div>
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <p className="ml-14 mt-2 text-sm leading-relaxed text-text-secondary">{step.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </Reveal>

          <Reveal delay={150}>
            {/* Kâğıt sahne: dönen ışıklı halkalar yerine üst üste yığılmış
                iki kâğıt yaprağı + bant; aktif adım üstteki yaprakta oynar.
                Adım numarası el yazısıyla köşede. */}
            <div className="relative mx-auto h-80 w-72">
              <div
                aria-hidden="true"
                className="absolute inset-4 rotate-[5deg] rounded-card border-[1.5px] border-ink/35 bg-surface-alt"
              />
              <div
                aria-hidden="true"
                className="absolute inset-4 -rotate-[3deg] rounded-card border-[1.5px] border-ink/45 bg-surface-alt"
              />
              <div className="absolute inset-4 flex flex-col items-center justify-center overflow-hidden rounded-card border-[1.5px] border-ink/80 bg-surface p-6 shadow-lg">
                <span aria-hidden="true" className="tape -top-1 left-1/2 -translate-x-1/2 -rotate-2" />
                <span
                  aria-hidden="true"
                  className="absolute right-4 top-3 font-hand text-3xl font-bold text-accent"
                >
                  {active + 1}/{STEPS.length}
                </span>
                <AnimatePresence mode="wait">
                  {active === 0 && <UploadStage key="upload" />}
                  {active === 1 && <ScanStage key="scan" />}
                  {active === 2 && <ReviewStage key="review" />}
                  {active === 3 && <SuccessStage key="success" />}
                </AnimatePresence>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
