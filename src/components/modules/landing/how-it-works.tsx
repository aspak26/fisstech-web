import { Camera, LayoutDashboard, ScanEye } from "lucide-react";
import { Reveal } from "./reveal";

const STEPS = [
  {
    icon: Camera,
    step: "01",
    title: "Fotoğrafla",
    description: "Fişini veya faturanı telefonundan ya da bilgisayarından tek tıkla yükle.",
  },
  {
    icon: ScanEye,
    step: "02",
    title: "Yapay Zekâ Okusun",
    description: "Fişştech mağaza adını, tarihi, ürünleri ve tutarları saniyeler içinde okuyup kategorize eder.",
  },
  {
    icon: LayoutDashboard,
    step: "03",
    title: "Bütçeni Yönet",
    description: "Harcamaların otomatik olarak bütçene işlenir, grafiklerle nereye ne kadar harcadığını gör.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-bold text-text-primary">Nasıl Çalışır?</h2>
        <p className="mt-3 text-text-secondary">Üç adımda fişten bütçeye.</p>
      </Reveal>

      <div className="relative mt-14 grid gap-6 md:grid-cols-3">
        <div
          className="pointer-events-none absolute left-0 right-0 top-[68px] hidden h-px md:block"
          style={{
            background:
              "linear-gradient(to right, transparent, var(--color-accent) 15%, var(--color-accent) 85%, transparent)",
            opacity: 0.25,
          }}
        />
        {STEPS.map(({ icon: Icon, step, title, description }, i) => (
          <Reveal key={step} delay={i * 120} className="relative">
            <div className="group relative h-full overflow-hidden rounded-card border border-border bg-surface p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/30 hover:shadow-xl">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-1 -top-4 select-none font-display text-7xl font-bold text-accent-soft"
              >
                {step}
              </span>
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent bg-surface shadow-sm transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-7 w-7 text-accent" />
              </div>
              <h3 className="relative mt-4 font-display text-lg font-semibold text-text-primary">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
