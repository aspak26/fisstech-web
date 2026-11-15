import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "./reveal";

const PREVIEW_ITEMS = [
  { icon: "🥖", name: "Fırın Ürünleri", amount: "₺84,50" },
  { icon: "🥛", name: "Süt & Kahvaltılık", amount: "₺127,90" },
  { icon: "🧴", name: "Kişisel Bakım", amount: "₺63,00" },
];

const TRUST_CHIPS = [
  { icon: Zap, label: "Saniyeler içinde tarama" },
  { icon: ShieldCheck, label: "RLS ile uçtan uca güvenli" },
];

export function LandingHero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative overflow-hidden">
      {/* Kâğıt: radyal ışık lekeleri yerine silik kareli defter zemini,
          aşağı doğru sönerek sayfa kâğıdına karışıyor. */}
      <div
        aria-hidden="true"
        className="grid-paper pointer-events-none absolute inset-0 -z-10"
        style={{
          maskImage: "linear-gradient(to bottom, black 30%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 30%, transparent 95%)",
        }}
      />

      <div className="mx-auto grid max-w-6xl gap-16 px-4 py-20 sm:px-6 md:grid-cols-2 md:items-center md:gap-12 md:py-28">
        <Reveal>
          <div className="relative mb-8 flex w-full max-w-lg items-start gap-3 rounded-xl border-[1.5px] border-ink/70 bg-surface p-4 text-sm text-text-primary shadow-sm sm:items-center">
            <span aria-hidden="true" className="tape -top-3 left-8 -rotate-3" />
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border-[1.5px] border-ink/70">
              <Image src="/logo-visor.png" alt="Fisstech Logo" fill className="object-cover" />
            </div>
            <p className="leading-relaxed">
              <strong className="text-accent block sm:inline">Web Sürümü Yayında! 🎉</strong> Mobil uygulamamız artık <a href="https://play.google.com/store/apps/details?id=com.fisstech.app" target="_blank" rel="noopener noreferrer" className="underline decoration-wavy decoration-1 underline-offset-4 font-semibold hover:text-accent transition-colors">Play Store&apos;da!</a> Hemen şimdi <strong>ÜCRETSİZ</strong> denemeye başlayabilirsiniz.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-accent/60 bg-accent-soft px-3.5 py-1.5 text-xs font-semibold text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Yapay Zekâ Destekli Finans Asistanı
          </span>

          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-text-primary sm:text-hero">
            Fişini Tara, <span className="ink-underline text-accent">Bütçeni Yapay Zekâ Yönetsin</span>
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-text-secondary">
            Fişştech; market fişlerinden, su faturası ve banka ekstrelerine kadar tüm harcama belgelerini saniyeler içinde okur,
            kategorize eder ve net bir bütçe resmi çizer. Kişisel finansından işletmene, tek uygulama.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#demo" className={buttonVariants("primary", "lg", "gap-2")}>
              Ücretsiz Dene
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/dashboard" className={buttonVariants("secondary", "lg")}>
              Uygulamaya Git
            </Link>
          </div>

          {!isAuthenticated && (
            <p className="mt-4 font-hand text-xl text-text-secondary">
              Kredi kartı gerekmez · İlk 1 hafta tüm özellikler ücretsiz
            </p>
          )}

          <div className="dashed-rule mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 pt-6">
            {TRUST_CHIPS.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="spot flex h-6 w-6 items-center justify-center">
                  <Icon className="h-4 w-4 text-text-primary" />
                </span>
                {label}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="relative mx-auto max-w-sm">
            {/* Arkadaki ikinci fiş — üst üste yığılmış kâğıt hissi */}
            <div
              aria-hidden="true"
              className="absolute inset-x-5 -top-2 bottom-10 rotate-[3.5deg] rounded-t-md border-[1.5px] border-ink/35 bg-surface-alt"
            />

            {/* Fiş: tırtıklı alt kenar (mask), gölge mask'a takılmasın diye
                dış sarmalayıcıda drop-shadow. */}
            <div className="relative -rotate-[1.2deg] drop-shadow-[3px_4px_0_var(--shadow-ink)]">
              <span aria-hidden="true" className="tape -top-3 left-1/2 z-10 -translate-x-1/2 rotate-2" />
              <div className="receipt-edge relative bg-surface px-5 pb-9 pt-6">
                <p className="text-center font-display text-xs font-bold uppercase tracking-[0.2em] text-text-secondary">
                  — Fiş —
                </p>
                <div className="dashed-rule mt-3 flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Kampüs Market</p>
                    <p className="text-xs text-text-secondary">21 Temmuz 2026 · 14:32</p>
                  </div>
                  <span className="stamp text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Okundu
                  </span>
                </div>
                <ul className="dashed-rule space-y-2.5 pt-3">
                  {PREVIEW_ITEMS.map((item) => (
                    <li key={item.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-text-primary">
                        <span
                          aria-hidden="true"
                          className="flex h-6 w-6 items-center justify-center rounded-lg border border-ink/30 bg-accent-soft text-xs"
                        >
                          {item.icon}
                        </span>
                        {item.name}
                      </span>
                      <span className="font-medium tabular-nums text-text-primary">{item.amount}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t-[3px] border-double border-ink/60 pt-3">
                  <span className="text-sm font-bold uppercase tracking-wide text-text-primary">Toplam</span>
                  <span className="font-display text-xl font-extrabold tabular-nums text-accent">₺275,40</span>
                </div>
              </div>
            </div>

            {/* El yazısı not — mobildeki "iyi gidiyor!" notunun eşi */}
            <p
              aria-hidden="true"
              className="absolute -top-12 right-0 rotate-[6deg] font-hand text-2xl font-bold text-accent sm:-right-8"
            >
              hepsi kategorize!
            </p>

            <div className="absolute -bottom-6 -left-4 hidden rotate-[-3deg] items-center gap-2 rounded-xl border-[1.5px] border-ink/75 bg-tape px-3.5 py-2.5 shadow-md sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border-[1.5px] border-ink/75 bg-accent text-on-accent">
                <Zap className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-text-primary">4.3 saniyede okundu</p>
                <p className="text-[11px] text-text-primary/75">Yapay zekâ ile</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
