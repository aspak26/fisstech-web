import { Bot, CloudUpload, Gift, ScanLine, Users } from "lucide-react";
import { Reveal } from "./reveal";

const FLAGSHIP = {
  icon: ScanLine,
  title: "Akıllı Fiş Taraması",
  description:
    "Market fişinden su faturasına, kredi kartı ekstresinden restoran adisyonuna kadar her belgeyi yapay zekâ ile saniyeler içinde dijitalleştir — mağaza, tarih, ürün ve kategori otomatik çıkarılır.",
};

const FEATURES = [
  {
    icon: Bot,
    title: "Fişştech AI",
    description: "Harcama alışkanlıklarını analiz eden, kişiselleştirilmiş tasarruf önerileri sunan yapay zeka danışmanın.",
  },
  {
    icon: Users,
    title: "Aile Bütçesi",
    description: "Grup oluştur, ortak harcamaları paylaş, kim ne kadar harcamış anında gör.",
  },
  {
    icon: CloudUpload,
    title: "Bulut Yedekleme",
    description: "Tüm verilerin güvenle bulutta saklanır, telefon değiştirsen bile hiçbir şey kaybolmaz.",
  },
];

/** "Bento" düzeni — bir öne-çıkan/flagship kart (tam genişlik) + 3 eşit
 * ikincil kart. Klasik tekdüze 4'lü ızgara yerine kasıtlı asimetri
 * (frontend-design skill: "unexpected layouts, asymmetry"). */
export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-bold text-text-primary">
          <span className="ink-underline">Özellikler</span>
        </h2>
        <p className="mt-3 text-text-secondary">Kişisel finansın için ihtiyacın olan her şey tek yerde.</p>
      </Reveal>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        <Reveal className="lg:col-span-3">
          {/* Öne çıkan: defter çizgili kâğıt + bant + damga */}
          <div className="notebook group relative rounded-card border-[1.5px] border-ink/75 bg-surface p-8 shadow-md transition-transform duration-300 hover:-rotate-[0.4deg] sm:flex sm:items-center sm:gap-8">
            <span aria-hidden="true" className="tape -top-3 left-10 -rotate-2" />
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-ink/80 bg-accent text-on-accent shadow-sm transition-transform duration-300 group-hover:-rotate-3">
              <FLAGSHIP.icon className="h-8 w-8" />
            </div>
            <div className="mt-5 sm:mt-0">
              <span className="stamp text-accent">Öne Çıkan</span>
              <h3 className="mt-3 font-display text-xl font-bold text-text-primary">{FLAGSHIP.title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">{FLAGSHIP.description}</p>
            </div>
          </div>
        </Reveal>

        {FEATURES.map(({ icon: Icon, title, description }, i) => (
          <Reveal key={title} delay={i * 100}>
            <div className="group h-full rounded-card border-[1.5px] border-ink/70 bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="spot flex h-11 w-11 items-center justify-center text-text-primary transition-transform duration-300 group-hover:-rotate-6">
                <Icon className="h-6 w-6" strokeWidth={1.9} />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={200} className="mt-10">
        <div className="relative flex flex-col items-center gap-3 rounded-card border-[1.5px] border-ink/80 bg-accent px-6 py-6 text-center text-on-accent shadow-md sm:flex-row sm:justify-between sm:text-left">
          <span aria-hidden="true" className="tape -top-3 right-12 rotate-3" />
          <div className="flex items-center gap-3">
            <Gift className="h-8 w-8 shrink-0" />
            <div>
              <p className="font-display text-lg font-bold">İlk 1 hafta tüm özellikler ücretsiz</p>
              <p className="text-sm opacity-90">Yeni hesap açan herkes, kredi kartı gerekmeden tüm premium özellikleri 7 gün boyunca dener.</p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
