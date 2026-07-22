"use client";

import { motion } from "framer-motion";
import { FileUp, Smartphone, Zap } from "lucide-react";
import { Reveal } from "./reveal";

const DONUT_SEGMENTS = [
  { name: "Market", pct: 0.4, color: "var(--color-accent)" },
  { name: "Faturalar", pct: 0.25, color: "var(--color-accent-hover)" },
  { name: "Ulaşım", pct: 0.2, color: "var(--color-accent-soft)" },
  { name: "Diğer", pct: 0.15, color: "rgba(255,255,255,0.15)" },
];

// Statik veri, bileşen dışında bir kez hesaplanıyor — render sırasında
// bir değişkeni mutasyona uğratmak (React Compiler'ın yakaladığı gibi)
// yerine saf bir reduce ile kümülatif offset'ler önceden çıkarılıyor.
const DONUT_SEGMENTS_WITH_OFFSET = DONUT_SEGMENTS.reduce<{ name: string; pct: number; color: string; offset: number }[]>(
  (acc, seg) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].pct : 0;
    return [...acc, { ...seg, offset: prevOffset }];
  },
  [],
);

function PhoneAndDropzoneCard() {
  return (
    <div className="flex h-40 items-center justify-center gap-4">
      <div className="relative flex h-32 w-16 items-center justify-center rounded-xl border-2 border-white/15 bg-white/5">
        <div className="absolute top-2 h-1 w-4 rounded-full bg-white/20" />
        <motion.span
          animate={{ opacity: [0, 1, 0], scale: [0.8, 1.15, 0.8] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-on-accent"
          style={{ boxShadow: "0 0 18px 2px color-mix(in srgb, var(--color-accent) 70%, transparent)" }}
        >
          <Zap className="h-3.5 w-3.5" />
        </motion.span>
      </div>

      <div className="relative flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-white/20">
        <motion.span
          animate={{ y: [-14, 10, 10], opacity: [0, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeIn", times: [0, 0.7, 1] }}
          className="absolute"
        >
          <FileUp className="h-6 w-6 text-accent" />
        </motion.span>
        <Smartphone className="h-6 w-6 text-white/10" />
      </div>
    </div>
  );
}

function LaserScanCard() {
  const fields = [
    { label: "Tarih", value: "22.07.2026" },
    { label: "Tutar", value: "₺258,40" },
    { label: "KDV", value: "%10" },
  ];
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-3">
      <div className="relative h-24 w-16 overflow-hidden rounded-md border border-white/15 bg-white/5">
        <div className="absolute inset-x-1.5 top-2 h-1 rounded-full bg-white/15" />
        <div className="absolute inset-x-1.5 top-4 h-1 w-2/3 rounded-full bg-white/15" />
        <div className="absolute inset-x-1.5 top-6 h-1 w-1/2 rounded-full bg-white/15" />
        <motion.div
          animate={{ top: ["4%", "94%", "4%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-0 right-0 h-0.5 bg-accent"
          style={{ boxShadow: "0 0 16px 3px color-mix(in srgb, var(--color-accent) 85%, transparent)" }}
        />
      </div>
      <div className="flex gap-2">
        {fields.map((f, i) => (
          <motion.span
            key={f.label}
            animate={{ opacity: [0.15, 1, 0.15] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
            className="rounded-full bg-accent-soft/10 px-2 py-1 text-[10px] font-medium text-accent"
          >
            {f.label}: {f.value}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function AnimatedDonutCard() {
  // framer-motion'ın kendi pathLength/pathOffset motion value'ları
  // kullanılıyor (0-1 normalize) — elle strokeDasharray verilmiyor, çünkü
  // ikisi birlikte çakışıp yanlış render üretir; bu, framer-motion'ın
  // dairesel "progress ring" için dokümante edilen standart tekniği.
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
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
          <span className="font-display text-sm font-bold text-white">₺2.450</span>
          <span className="text-[10px] text-white/50">Bu ay</span>
        </div>
      </div>
    </div>
  );
}

const CARDS = [
  { title: "1. Çek veya Sürükle", Content: PhoneAndDropzoneCard },
  { title: "2. Saniyeler İçinde Analiz", Content: LaserScanCard },
  { title: "3. Anında Raporlama", Content: AnimatedDonutCard },
];

export function AiScannerShowcase() {
  return (
    <div className="dark">
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

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {CARDS.map(({ title, Content }, i) => (
              <Reveal key={title} delay={i * 120}>
                <div
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1"
                  style={{ boxShadow: "0 0 40px -16px color-mix(in srgb, var(--color-accent) 45%, transparent)" }}
                >
                  <h3 className="font-display text-base font-semibold text-text-primary">{title}</h3>
                  <Content />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
