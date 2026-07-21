"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { FAQ_ITEMS } from "@/lib/landing/faq-data";
import { Reveal } from "./reveal";

/** Erişilebilir accordion — bu projede henüz bir Accordion primitive'i yok,
 * bu yüzden burada kuruldu. Tek seferde bir soru açık kalır. Yükseklik
 * animasyonu için JS ile ölçüm gerektirmeyen grid-template-rows 0fr→1fr
 * tekniği kullanıldı. */
export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <Reveal className="text-center">
        <h2 className="font-display text-3xl font-bold text-text-primary">Sıkça Sorulan Sorular</h2>
      </Reveal>

      <Reveal delay={100} className="mt-10 divide-y divide-border rounded-card border border-border bg-surface">
        {FAQ_ITEMS.map((item, i) => {
          const open = openIndex === i;
          const buttonId = `${baseId}-button-${i}`;
          const panelId = `${baseId}-panel-${i}`;
          return (
            <div key={item.question}>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-medium text-text-primary">{item.question}</span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-text-secondary transition-transform duration-300", open && "rotate-180 text-accent")}
                />
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={cn("grid transition-all duration-300 ease-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm text-text-secondary">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}
