"use client";

import { MessageSquarePlus, Bug } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function FeedbackSection() {
  return (
    <section id="feedback" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal>
        {/* Kâğıt: zarf/mektup kâğıdı — bulanık ışık lekeleri yerine defter
            çizgisi, iki köşede bant. */}
        <div className="notebook relative rounded-3xl border-[1.5px] border-ink/75 bg-surface p-8 shadow-md sm:p-12">
          <span aria-hidden="true" className="tape -top-3 left-8 -rotate-6" />
          <span aria-hidden="true" className="tape -top-3 right-8 rotate-6" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-6 flex gap-4">
              <div className="spot flex h-12 w-12 items-center justify-center text-text-primary">
                <MessageSquarePlus className="h-6 w-6" />
              </div>
              <div className="flex h-12 w-12 -rotate-6 items-center justify-center rounded-xl border-[1.5px] border-ink/70 bg-tape text-text-primary">
                <Bug className="h-6 w-6" />
              </div>
            </div>
            
            <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
              Öneri ve Hata Bildirimi
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
              Fisstech'i kullanıcılarımızla birlikte geliştiriyoruz. Uygulamada yaşadığınız bir sorunu iletmek, 
              yeni bir özellik önermek veya fikirlerinizi paylaşmak için bize her zaman yazabilirsiniz.
            </p>
            
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
              <a 
                href="mailto:fisstechapp@gmail.com?subject=Fisstech%20-%20Öneri%20veya%20Hata%20Bildirimi"
                className={buttonVariants("primary", "lg", "px-8")}
              >
                Bize Mail Gönderin
              </a>
              <span className="text-sm font-medium text-text-secondary sm:ml-4">
                veya doğrudan: <a href="mailto:fisstechapp@gmail.com" className="font-semibold text-accent underline decoration-wavy decoration-1 underline-offset-4">fisstechapp@gmail.com</a>
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
