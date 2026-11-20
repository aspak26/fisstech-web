"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { FAQ_ITEMS } from "@/lib/landing/faq-data";
import { Reveal } from "./reveal";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
        <Reveal className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-display text-4xl font-bold text-text-primary">
            Merak <span className="ink-underline">Edilenler</span>
          </h2>
          <p className="mt-4 max-w-sm text-text-secondary">
            Aradığınız cevabı bulamadınız mı?{" "}
            <a href="mailto:fisstechapp@gmail.com" className="font-semibold text-accent underline decoration-wavy decoration-1 underline-offset-4">
              fisstechapp@gmail.com
            </a>
            , yardımcı olalım.
          </p>
          <div className="mt-8 flex items-center gap-6">
            <div>
              <p className="font-display text-2xl font-bold text-text-primary">{FAQ_ITEMS.length}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Soru</p>
            </div>
            <span className="h-10 border-l-[1.5px] border-dashed border-ink/40" aria-hidden="true" />
            <div>
              <p className="font-display text-2xl font-bold text-text-primary">7/24</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Destek</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100} className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const open = openIndex === i;
            return (
              <div
                key={item.question}
                className={cn(
                  "rounded-xl border-[1.5px] bg-surface transition-all duration-300",
                  open ? "border-ink/80 shadow-md" : "border-ink/40 shadow-xs",
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  aria-expanded={open}
                >
                  <span className={cn("font-hand text-2xl font-bold leading-none", open ? "text-accent" : "text-text-secondary")}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-medium text-text-primary">{item.question}</span>
                  <motion.span
                    animate={{ rotate: open ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-[1.5px]",
                      open ? "border-ink/80 bg-accent text-on-accent" : "border-ink/50 text-text-primary",
                    )}
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 pl-[3.25rem] pr-5 text-sm leading-relaxed text-text-secondary">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
