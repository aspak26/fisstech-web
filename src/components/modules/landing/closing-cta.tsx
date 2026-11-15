import Link from "next/link";
import { ArrowRight, CreditCard, Lock, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const TRUST_ITEMS = [
  { icon: CreditCard, label: "Kredi kartı gerekmez" },
  { icon: Users, label: "Aile Modu" },
  { icon: Lock, label: "Uçtan Uca Şifreleme" },
];

export function ClosingCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      {/* Kâğıt: radyal ışık yerine büyük, hafif eğik yapıştırılmış kart +
          bant + el yazısı not. Arkada ikinci yaprak derinlik verir. */}
      <div className="relative">
      <div
        aria-hidden="true"
        className="absolute inset-0 rotate-[1.4deg] rounded-3xl border-[1.5px] border-ink/35 bg-surface-alt"
      />
      <div className="grid-paper relative rounded-3xl border-[1.5px] border-ink/80 bg-surface px-6 py-16 text-center shadow-lg sm:px-12">
        <span aria-hidden="true" className="tape -top-3 left-1/2 -translate-x-1/2 -rotate-2" />
        <p
          aria-hidden="true"
          className="absolute right-6 top-6 hidden rotate-[8deg] font-hand text-2xl font-bold text-accent md:block"
        >
          artık kolay!
        </p>

        <div className="relative">
          <h2 className="font-display text-5xl font-extrabold leading-tight tracking-tight text-text-primary md:text-6xl lg:text-7xl">
            Manuel Hesap Devri Kapandı.
            <br />
            <span className="marker text-accent">Akıllı Bütçe Dönemi Başlıyor.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-base text-text-secondary">
            İster kendi bütçenizi yönetin, ister aile bütçenizi planlayın. Fişştech ile
            saniyeler içinde masraflarınızı dijitalleştirip kontrolü elinize alın.
          </p>

          <div className="mt-8">
            <Link
              href="/register"
              className={buttonVariants(
                "primary",
                "lg",
                "gap-2 px-10 py-4 text-base",
              )}
            >
              Hemen Ücretsiz Başla
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 flex flex-row flex-wrap items-center justify-center gap-6 md:gap-8">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="spot flex h-6 w-6 items-center justify-center text-text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
