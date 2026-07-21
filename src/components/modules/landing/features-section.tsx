import { CloudUpload, Gift, ScanLine, Store, Users } from "lucide-react";
import { Reveal } from "./reveal";

const FEATURES = [
  {
    icon: ScanLine,
    title: "Akıllı Fiş Taraması",
    description: "Market fişinden restoran adisyonuna kadar her belgeyi yapay zekâ ile saniyeler içinde dijitalleştir.",
  },
  {
    icon: Store,
    title: "Esnaf Modu",
    description: "Kasa defteri, stok, personel ve satış takibiyle işletmeni de aynı uygulamadan yönet.",
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

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-bold text-text-primary">Özellikler</h2>
        <p className="mt-3 text-text-secondary">Kişisel finansından işletmene, ihtiyacın olan her şey tek yerde.</p>
      </Reveal>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, description }, i) => (
          <Reveal key={title} delay={i * 100}>
            <div className="group h-full rounded-card border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10">
              <div className="flex h-11 w-11 items-center justify-center rounded-control bg-accent-soft text-accent transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-5.5 w-5.5" />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-text-primary">{title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{description}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={200} className="mt-10">
        <div className="flex flex-col items-center gap-3 rounded-card bg-gradient-to-r from-accent to-accent-hover px-6 py-6 text-center text-on-accent shadow-lg shadow-accent/20 sm:flex-row sm:justify-between sm:text-left">
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
