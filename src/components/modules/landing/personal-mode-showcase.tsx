import { HandCoins, CreditCard, Target, Scale, StickyNote, FileSpreadsheet, BarChart3, type LucideIcon } from "lucide-react";
import { Reveal } from "./reveal";

interface PersonalFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** Sidebar'daki gerçek nav ikonlarıyla birebir aynı (nav-config.ts) — landing
 * sayfasında vaat edilen özellik, uygulama içinde AYNI ikonla karşılıyor
 * kullanıcıyı, tutarlılık kırılmıyor. "Özet Oluştur" tek istisna: kendi nav
 * satırı yok (Analiz/Raporlar sayfasının içinde bir eylem), o yüzden aynı
 * ikonu kendi export butonundan (excel-export-button.tsx) alıyor. */
const PERSONAL_FEATURES: PersonalFeature[] = [
  {
    icon: Scale,
    title: "Net Bakiye",
    description: "Gelir ve giderin arasındaki farkı anlık gör, aylık trend grafiğiyle bütçenin nereye gittiğini anla.",
  },
  {
    icon: HandCoins,
    title: "Borçlarım",
    description: "Kime borçlusun, kim sana borçlu — tek ekrandan takip et, ödeme/tahsilat hatırlatıcılarıyla asla unutma.",
  },
  {
    icon: Target,
    title: "Hedeflerim",
    description: "Birikim hedefleri koy, bakiyenden hedefe pay ayır, ilerlemeni görsel olarak adım adım izle.",
  },
  {
    icon: CreditCard,
    title: "Abonelikler",
    description: "Netflix'ten Spotify'a tüm düzenli ödemelerini tek yerde gör, yenilenme tarihi yaklaşınca fark et.",
  },
  {
    icon: BarChart3,
    title: "Analiz",
    description: "Kategori kırılımı, market bazlı harcama ve 6 aylık trendlerle alışkanlıklarını keşfet.",
  },
  {
    icon: FileSpreadsheet,
    title: "Özet Oluştur",
    description: "Seçtiğin dönemin gelir-gider özetini tek tıkla Excel veya PDF olarak dışa aktar.",
  },
  {
    icon: StickyNote,
    title: "Notlarım",
    description: "Finansal planlarını, hatırlatmalarını ve fikirlerini harcamalarının yanı başında tut.",
  },
];

/** Kişisel Mod tanıtım ızgarası — SectorSolutions'ın (Esnaf Modu) bireysel
 * taraftaki karşılığı. Kartlar hover'da yukarı kalkıp (-translate-y) yumuşak
 * bir accent parlamasıyla (radial glow + shadow) tepki veriyor —
 * FeaturesSection'daki ikincil kart deseniyle aynı dil, sadece köşede beliren
 * bir ışıma katmanıyla biraz daha "showcase" hissi katıldı. */
export function PersonalModeShowcase() {
  return (
    <section id="kisisel-mod" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="mx-auto max-w-xl text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-accent">Kişisel Mod</span>
        <h2 className="mt-2 font-display text-3xl font-bold text-text-primary sm:text-4xl">
          Bireysel Bütçeni Tek Elden Yönet
        </h2>
        <p className="mt-3 text-sm text-text-secondary">
          Borcundan hedefine, abonelikten analize — kişisel finansını yönetmen için ihtiyacın olan
          her araç, tek bir çatı altında.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PERSONAL_FEATURES.map(({ icon: Icon, title, description }, i) => (
          <Reveal key={title} delay={i * 60}>
            <div className="group relative h-full overflow-hidden rounded-card border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent/0 blur-2xl transition-colors duration-500 group-hover:bg-accent/20"
              />

              <div className="relative flex h-11 w-11 items-center justify-center rounded-control bg-accent-soft text-accent transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-5.5 w-5.5" strokeWidth={1.75} />
              </div>
              <h3 className="relative mt-4 font-display text-base font-semibold text-text-primary">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
