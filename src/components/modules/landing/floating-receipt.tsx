"use client";

import { motion } from "framer-motion";

// Fiş kağıdının teker teker CSS ile çizilen "koparılmış kenar" efekti —
// alternatif y değerleriyle (%94/%100) dişli bir clip-path polygonu.
const TORN_EDGE_CLIP_PATH =
  "polygon(0% 0%, 100% 0%, 100% 100%, 92% 92%, 84% 100%, 76% 92%, 68% 100%, 60% 92%, 52% 100%, 44% 92%, 36% 100%, 28% 92%, 20% 100%, 12% 92%, 4% 100%, 0% 92%)";

const SKELETON_LINE_WIDTHS = ["70%", "45%", "85%", "55%", "60%", "40%"];

/** Placeholder görsel yerine tamamen kodla (CSS 3D transform + clip-path +
 * framer-motion) çizilen, havada süzülen fiş simülasyonu — dış bir asset
 * gerektirmiyor. Kağıt rengi bilinçli olarak siteye teması bağlı DEĞİL
 * (gerçek kağıt her zaman açık renktir — bkz. PROGRESS.md gerekçe notu). */
export function FloatingReceipt() {
  return (
    <div className="relative flex aspect-square items-center justify-center" style={{ perspective: "1200px" }}>
      {/* Kâğıt: bulanık ışık topları yerine fişin altında kareli defter
          yaprağı ve yanında el yazısı not. */}
      <div
        aria-hidden="true"
        className="grid-paper absolute inset-[12%] -rotate-[4deg] rounded-2xl border-[1.5px] border-ink/30 bg-surface-alt"
      />
      <p aria-hidden="true" className="absolute bottom-0 right-2 z-10 rotate-[-6deg] font-hand text-2xl font-bold text-accent sm:bottom-[8%] sm:right-[6%]">
        bu ay ₺342 market
      </p>

      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          transform: "rotateX(15deg) rotateY(-15deg) rotateZ(5deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* clip-path gölgeyi de keser — gölge sarmalayıcıda drop-shadow ile */}
        <div className="relative drop-shadow-[2px_3px_0_var(--shadow-ink)]">
        <span aria-hidden="true" className="tape -top-3 left-1/2 z-10 -translate-x-1/2 rotate-3" />
        <div
          className="w-52 bg-white px-5 pb-8 pt-6 sm:w-60"
          style={{ clipPath: TORN_EDGE_CLIP_PATH }}
        >
          <p className="text-center font-display text-lg font-extrabold tracking-tight text-neutral-900">FİŞŞTECH</p>
          <p className="mt-0.5 text-center text-[10px] text-neutral-400">Kampüs Market · 21.07.2026</p>

          <div className="mt-5 space-y-2">
            {SKELETON_LINE_WIDTHS.map((w, i) => (
              <div key={i} className="h-1.5 rounded-full bg-neutral-200" style={{ width: w }} />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-dashed border-neutral-300 pt-3">
            <span className="text-xs font-medium text-neutral-500">Toplam</span>
            <span className="text-sm font-bold text-neutral-900">₺342,10</span>
          </div>

          <div className="mt-4 flex h-8 items-end justify-center gap-[2px]" aria-hidden="true">
            {[2, 1, 3, 1, 2, 3, 1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1, 3, 2, 1].map((w, i) => (
              <span key={i} className="bg-neutral-900" style={{ width: `${w}px`, height: "100%" }} />
            ))}
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  );
}
