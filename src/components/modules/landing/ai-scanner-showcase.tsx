"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";
import { AlertCircle, Check, FileUp, Receipt, Smartphone, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { Reveal } from "./reveal";

// Market accent (marka) rengiyle tema-uyumlu kalıyor; diğer üçü kategorik
// (birbirinden ayırt edilmesi gereken) sabit tonlar — analytics.ts'teki
// CHART_COLORS ile aynı gerekçe: çok-kategorili grafiklerde marka rengine
// bağlı kalmak okunabilirliği düşürür, sabit canlı tonlar daha net ayrışır.
const DONUT_SEGMENTS = [
  { name: "Market", pct: 0.4, amount: 980, color: "var(--color-accent)" },
  { name: "Akaryakıt", pct: 0.3, amount: 735, color: "#3B82F6" },
  { name: "Yemek", pct: 0.15, amount: 367, color: "#A855F7" },
  { name: "Diğer", pct: 0.15, amount: 368, color: "#F97316" },
];

// Statik veri, bileşen dışında bir kez hesaplanıyor — render sırasında
// bir değişkeni mutasyona uğratmak (React Compiler'ın yakaladığı gibi)
// yerine saf bir reduce ile kümülatif offset'ler önceden çıkarılıyor.
const DONUT_SEGMENTS_WITH_OFFSET = DONUT_SEGMENTS.reduce<
  { name: string; pct: number; amount: number; color: string; offset: number }[]
>((acc, seg) => {
  const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].pct : 0;
  return [...acc, { ...seg, offset: prevOffset }];
}, []);

const TOTAL_AMOUNT = DONUT_SEGMENTS.reduce((sum, seg) => sum + seg.amount, 0);

/** Görünüme girince 0'dan hedefe sayan tutar — framer-motion'ın imperative
 * `animate()` fonksiyonuyla, her tick'te state güncelleyip formatCurrency
 * ile Türkçe para birimi formatına çeviriyor. */
function AnimatedAmount({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, target]);

  return <span ref={ref}>{formatCurrency(display)}</span>;
}

function UploadVisual() {
  return (
    <div className="flex h-64 items-center justify-center gap-6 rounded-2xl border border-border bg-surface">
      <div className="relative flex h-40 w-20 items-center justify-center rounded-2xl border-2 border-border bg-bg">
        <div className="absolute top-2.5 h-1 w-5 rounded-full bg-border" />
        <Smartphone className="h-8 w-8 text-text-secondary/30" />
        <motion.span
          animate={{ opacity: [0, 1, 0], scale: [0.8, 1.15, 0.8] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute flex h-9 w-9 items-center justify-center rounded-full bg-accent text-on-accent"
          style={{ boxShadow: "0 0 20px 2px color-mix(in srgb, var(--color-accent) 70%, transparent)" }}
        >
          <Zap className="h-4 w-4" />
        </motion.span>
      </div>

      <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-dashed border-border">
        <motion.span
          animate={{ y: [-20, 14, 14], opacity: [0, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeIn", times: [0, 0.7, 1] }}
          className="absolute"
        >
          <FileUp className="h-8 w-8 text-accent" />
        </motion.span>
        <span className="text-xs font-medium text-text-secondary/50">Sürükle-Bırak</span>
      </div>
    </div>
  );
}

function ScanVisual() {
  const fields = [
    { label: "Tarih", value: "22.07.2026" },
    { label: "Tutar", value: "₺258,40" },
    { label: "KDV", value: "%10" },
  ];
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-surface">
      <div className="relative h-40 w-28 overflow-hidden rounded-lg border border-border bg-bg">
        <div className="absolute inset-x-2 top-3 h-1.5 rounded-full bg-border" />
        <div className="absolute inset-x-2 top-6 h-1.5 w-2/3 rounded-full bg-border" />
        <div className="absolute inset-x-2 top-9 h-1.5 w-1/2 rounded-full bg-border" />
        <div className="absolute inset-x-2 top-12 h-1.5 w-3/4 rounded-full bg-border" />
        <motion.div
          animate={{ top: ["4%", "94%", "4%"] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-0 right-0 h-0.5 bg-accent"
          style={{ boxShadow: "0 0 16px 3px color-mix(in srgb, var(--color-accent) 85%, transparent)" }}
        />
      </div>
      <div className="flex gap-2">
        {fields.map((f, i) => (
          <motion.span
            key={f.label}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.35 }}
            className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent"
          >
            {f.label}: {f.value}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function ReviewVisual() {
  const rows = [
    { label: "Mağaza: Kampüs Market", flagged: false },
    { label: "Toplam: ₺258,40", flagged: false },
    { label: "KDV Oranı: %10?", flagged: true },
  ];
  return (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-surface">
      <div className="w-full max-w-[15rem] rounded-xl border border-border bg-bg p-4">
        <ul className="space-y-2">
          {rows.map((row, i) => (
            <li
              key={row.label}
              className={cn(
                "relative flex items-center justify-between rounded-control px-2.5 py-2 text-xs",
                row.flagged ? "bg-warning/10" : "bg-surface",
              )}
            >
              <span className="text-text-primary">{row.label}</span>
              {row.flagged ? (
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <AlertCircle className="h-3.5 w-3.5 text-warning" />
                </motion.span>
              ) : (
                <Check className="h-3.5 w-3.5 text-accent" />
              )}
              {i === 2 && (
                <motion.span
                  aria-hidden="true"
                  animate={{ opacity: [0, 0, 1, 1, 0], scale: [1, 1, 0.85, 1, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, times: [0, 0.55, 0.65, 0.8, 1] }}
                  className="pointer-events-none absolute h-6 w-6 rounded-full border-2 border-accent"
                />
              )}
            </li>
          ))}
        </ul>
        <motion.div
          aria-hidden="true"
          animate={{ scale: [1, 1, 0.94, 1, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", times: [0, 0.55, 0.65, 0.75, 1] }}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-control bg-accent py-2 text-xs font-semibold text-on-accent"
        >
          <Check className="h-3.5 w-3.5" />
          Onayla
        </motion.div>
      </div>
    </div>
  );
}

function ReportVisual() {
  return (
    <div className="relative flex h-72 flex-col items-center justify-center gap-6 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:gap-8">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0],
            x: [-60 + i * 6, 0],
            y: [-36 + i * 24, 0],
            scale: [1, 0.4],
          }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: "easeIn" }}
          className="pointer-events-none absolute left-1/4 top-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent sm:left-[22%]"
        >
          <Receipt className="h-4 w-4" />
        </motion.span>
      ))}

      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-border)" strokeWidth="12" />
          {DONUT_SEGMENTS_WITH_OFFSET.map((seg, i) => (
            <motion.circle
              key={seg.name}
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeLinecap="round"
              style={{ pathOffset: seg.offset }}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: seg.pct }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: i * 0.25, ease: "easeOut" }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-base font-bold text-text-primary">
            <AnimatedAmount target={TOTAL_AMOUNT} />
          </span>
          <span className="text-xs text-text-secondary">Bu ay</span>
        </div>
      </div>

      <ul className="w-full max-w-[13rem] space-y-2.5">
        {DONUT_SEGMENTS_WITH_OFFSET.map((seg, i) => (
          <motion.li
            key={seg.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.25, ease: "easeOut" }}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-text-primary">{seg.name}</span>
            </span>
            <span className="shrink-0 font-medium text-text-secondary">{formatCurrency(seg.amount)}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

const STEPS = [
  {
    title: "Her Şey Tek Bir Fotoğrafla Başlar",
    description:
      "İster cebinizden saniyeler içinde fotoğraflayın, ister bilgisayarınızdan toplu PDF yükleyin. Fişştech otomatik kenar algılama ve perspektif düzeltme ile evraklarınızı en net hale getirir.",
    Visual: UploadVisual,
  },
  {
    title: "Saniyeler İçinde Kusursuz Veri Çıkarımı",
    description:
      "Fişştech AI; tarihi, tutarı, KDV oranını ve hatta harcama yaptığınız marketin adını saniyeler içinde okur. Manuel veri girişine son.",
    Visual: ScanVisual,
  },
  {
    title: "Son Onay Sizin Elinizde",
    description:
      "Yapay zekânın emin olamadığı nadir durumlarda, sistem o alanı sarı renkle işaretler. Sadece o kısımlara göz atıp tek tıkla onaylarsınız.",
    Visual: ReviewVisual,
  },
  {
    title: "Anında Finansal Raporlara Dönüşüm",
    description:
      "Onayladığınız her fiş, Esnaf Modu kasasına veya Aile Planı ortak bütçenize otomatik işlenir. Kategorize edilmiş grafikleriniz saniyeler içinde güncellenir.",
    Visual: ReportVisual,
  },
];

export function AiScannerShowcase() {
  return (
    <section className="bg-bg py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
            Fişştech AI İş Başında
          </h2>
          <p className="mt-4 text-sm text-text-secondary">
            Geleneksel veri girişini unutun. Fişlerinizin saniyeler içinde nasıl akıllı verilere
            dönüştüğünü izleyin.
          </p>
        </Reveal>

        <div className="mt-16 space-y-16 lg:space-y-24">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 60}>
              <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                <div className={cn(i % 2 === 1 && "lg:order-2")}>
                  <span className="font-display text-sm font-bold text-accent">0{i + 1}</span>
                  <h3 className="mt-2 font-display text-2xl font-bold text-text-primary sm:text-3xl">{step.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-text-secondary">{step.description}</p>
                </div>
                <div className={cn(i % 2 === 1 && "lg:order-1")}>
                  <step.Visual />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
