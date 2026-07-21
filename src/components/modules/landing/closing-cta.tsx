import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const TRUST_ITEMS = ["Kredi kartı gerekmez", "İlk 1 hafta ücretsiz", "Anında başlatın"];

export function ClosingCta() {
  return (
    <div className="dark">
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div
          className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-surface px-6 py-16 text-center sm:px-12"
          style={{ boxShadow: "inset 0 0 120px -20px color-mix(in srgb, var(--color-accent) 30%, transparent)" }}
        >
          <h2 className="font-display text-5xl font-extrabold leading-tight tracking-tight text-text-primary md:text-6xl lg:text-7xl">
            Zamanınızı Geri Kazanın.
            <br />
            <span className="text-accent">Fişleri Yapay Zeka Yönetsin.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-base text-text-secondary">
            Manuel veri girişini tarihe gömün. Fişştech ile saniyeler içinde hesap oluşturup bütçenizi
            otomatikleştirin.
          </p>

          <div className="mt-8">
            <Link
              href="/register"
              className={buttonVariants(
                "primary",
                "lg",
                "rounded-full px-10 py-4 text-base transition-transform hover:scale-105",
              )}
            >
              Ücretsiz Hesap Oluşturun
            </Link>
          </div>

          <div className="mt-8 flex flex-row flex-wrap items-center justify-center gap-6 md:gap-8">
            {TRUST_ITEMS.map((item) => (
              <span key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Check className="h-2.5 w-2.5" />
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
