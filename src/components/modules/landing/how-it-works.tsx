import { Camera, LayoutDashboard, ScanEye } from "lucide-react";
import { Reveal } from "./reveal";

const STEPS = [
  {
    icon: Camera,
    step: "1",
    title: "Fotoğrafla",
    description: "Fişini veya faturanı telefonundan ya da bilgisayarından tek tıkla yükle.",
  },
  {
    icon: ScanEye,
    step: "2",
    title: "Yapay Zekâ Okusun",
    description: "Fişştech mağaza adını, tarihi, ürünleri ve tutarları saniyeler içinde okuyup kategorize eder.",
  },
  {
    icon: LayoutDashboard,
    step: "3",
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

      <div className="relative mt-12 grid gap-8 md:grid-cols-3">
        <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-border md:block" />
        {STEPS.map(({ icon: Icon, step, title, description }, i) => (
          <Reveal key={step} delay={i * 120} className="relative text-center">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent bg-surface shadow-sm">
              <Icon className="h-7 w-7 text-accent" />
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-on-accent">
                {step}
              </span>
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">{title}</h3>
            <p className="mt-2 text-sm text-text-secondary">{description}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
