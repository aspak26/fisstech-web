"use client";

import { MessageSquarePlus, Bug } from "lucide-react";
import { Reveal } from "./reveal";

export function FeedbackSection() {
  return (
    <section id="feedback" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 sm:p-12">
          {/* Decorative glow */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-danger/10 blur-3xl" aria-hidden="true" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-6 flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <MessageSquarePlus className="h-6 w-6" />
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
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
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-8 font-medium text-on-accent transition-colors hover:bg-accent-hover"
              >
                Bize Mail Gönderin
              </a>
              <span className="text-sm font-medium text-text-secondary sm:ml-4">
                veya doğrudan: <a href="mailto:fisstechapp@gmail.com" className="text-accent hover:underline">fisstechapp@gmail.com</a>
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
