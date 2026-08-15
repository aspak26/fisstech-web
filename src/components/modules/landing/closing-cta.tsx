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
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface px-6 py-16 text-center sm:px-12">
        {/* Radyal gradyan mesh — sağ alttan yayılan ana zümrüt ışığı +
            sol üstten çok silik ikinci nokta, düz tek tonlu kutu yerine
            teknolojik/premium bir derinlik hissi için. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 55% at 88% 96%, color-mix(in srgb, var(--color-accent) 45%, transparent) 0%, transparent 65%), radial-gradient(40% 40% at 8% 8%, color-mix(in srgb, var(--color-accent-soft) 25%, transparent) 0%, transparent 70%)",
          }}
        />

        <div className="relative">
          <h2 className="font-display text-5xl font-extrabold leading-tight tracking-tight text-text-primary md:text-6xl lg:text-7xl">
            Manuel Hesap Devri Kapandı.
            <br />
            <span className="text-accent">Akıllı Bütçe Dönemi Başlıyor.</span>
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
                "gap-2 rounded-full px-10 py-4 text-base transition-transform hover:scale-105",
              )}
            >
              Hemen Ücretsiz Başla
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 flex flex-row flex-wrap items-center justify-center gap-6 md:gap-8">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
