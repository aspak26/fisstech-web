import { Check } from "lucide-react";
import { FloatingReceipt } from "./floating-receipt";
import { Reveal } from "./reveal";

const POINTS = [
  "Fişi yükle, AI otomatik analiz etsin",
  "Giderlerinizi otomatik kategorize edin",
  "Fişştech AI ile kişiselleştirilmiş tasarruf önerileri alın",
  "Verilerinizi PDF veya tablo olarak dışa aktarın",
];

export function WhyFisstech() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <span className="font-hand text-2xl font-bold text-text-secondary">Neden Fişştech?</span>
          <h2 className="mt-3 font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-text-primary md:text-6xl">
            Fişleriniz
            <br />
            Artık <span className="ink-underline text-accent">Dijital.</span>
          </h2>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-text-secondary">
            Yapay zeka ile fişlerinizi saniyeler içinde dijitalleştirin, bütçe yönetiminizi akıllı hale
            getirin. Gelişmiş AI analizi ve detaylı raporlama tek platformda.
          </p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary">
            Her gün onlarca fişi manuel olarak girmek hem zaman alır hem de hata riskini artırır.
            Fişştech, bu süreci tamamen ortadan kaldırarak fişlerinizi fotoğrafladığınız anda yapay
            zekâ ile okur ve doğrudan akıllı bütçenize aktarır.
          </p>

          <ul className="mt-8 space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm font-medium text-text-primary">
                {/* Elle işaretlenmiş onay kutusu */}
                <span className="flex h-6 w-6 shrink-0 -rotate-3 items-center justify-center rounded-md border-[1.5px] border-ink/75 bg-surface text-accent">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={150}>
          <FloatingReceipt />
        </Reveal>
      </div>
    </section>
  );
}
