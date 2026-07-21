"use client";

import { useId, useState } from "react";
import { MessageCircleQuestion, Plus } from "lucide-react";
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

      <Reveal delay={100} className="mt-10 divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
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
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-bg"
              >
                <span className={cn("font-medium transition-colors", open ? "text-accent" : "text-text-primary")}>
                  {item.question}
                </span>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-text-secondary transition-all duration-300",
                    open && "rotate-45 border-accent bg-accent text-on-accent",
                  )}
                >
                  <Plus className="h-3.5 w-3.5" />
                </span>
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={cn("grid transition-all duration-300 ease-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-text-secondary">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </Reveal>

      <Reveal delay={200} className="mt-6">
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-accent/30 bg-accent-soft/40 px-6 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
              <MessageCircleQuestion className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium text-text-primary">Hâlâ sorunuz mu var?</p>
              <p className="text-sm text-text-secondary">Sağ alttaki Fişştech Asistanı ile hemen sohbet edebilirsiniz.</p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
