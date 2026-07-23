import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import { LogoHorizontal } from "./logo-mark";
import { NewsletterForm } from "./newsletter-form";

// lucide-react bu sürümde (1.25) marka/sosyal ikonları hiç içermiyor
// (Instagram/Linkedin/Twitter kaldırılmış) — gerçek logoları taklit etmek
// yerine aynı stroke stiliyle (currentColor, 24x24) sade/jenerik glifler.
function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}
function IconInstagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconLinkedin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="7.5" y1="10.5" x2="7.5" y2="16.5" />
      <circle cx="7.5" cy="7" r="0.6" fill="currentColor" stroke="none" />
      <path d="M11.5 16.5v-3.5a2 2 0 0 1 4 0v3.5" />
      <line x1="11.5" y1="10.5" x2="11.5" y2="16.5" />
    </svg>
  );
}

const LINK_COLUMNS = [
  {
    heading: "Ürün",
    links: [
      { label: "Özellikler", href: "#features" },
      { label: "Nasıl Çalışır?", href: "#how-it-works" },
      { label: "Fiyatlandırma", href: "#pricing" },
      { label: "Uygulamayı İndir", href: "/indir" },
    ],
  },
  {
    heading: "Çözümler",
    links: [
      { label: "Bireysel Kullanım", href: "/register" },
      { label: "Esnaf Modu", href: "/esnaf" },
      { label: "Aile Planı", href: "#pricing" },
    ],
  },
  {
    heading: "Destek",
    links: [
      { label: "S.S.S.", href: "#faq" },
      { label: "Yardım Merkezi", href: "/yardim" },
      { label: "Veri Güvenliği", href: "/veri-guvenligi" },
      { label: "Bize Ulaşın", href: "mailto:fisstechapp@gmail.com" },
    ],
  },
  {
    heading: "Yasal",
    links: [
      { label: "Gizlilik Politikası", href: "/gizlilik" },
      { label: "Kullanım Şartları", href: "/kullanim-sartlari" },
      { label: "KVKK", href: "/kvkk" },
    ],
  },
];

// Sosyal medya hesaplarının gerçek URL'leri elimizde yok — tahmini/yanlış bir
// bağlantı vermemek için ikonlar şimdilik tıklanabilir link değil, dekoratif.
const SOCIAL_ICONS = [
  { icon: IconX, label: "X (Twitter)" },
  { icon: IconInstagram, label: "Instagram" },
  { icon: IconLinkedin, label: "LinkedIn" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_repeat(4,1fr)] lg:gap-8">
          <div>
            <Link href="/" aria-label="Fişştech anasayfa">
              <LogoHorizontal />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">
              Yapay zeka destekli akıllı fiş ve gider yönetim platformu. Bütçeniz kontrol altında,
              verileriniz güvende.
            </p>

            <div className="mt-8 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">Bülten</p>
              <p className="text-sm leading-relaxed text-text-secondary">
                Akıllı bütçe ipuçları, yeni Fişştech özellikleri ve özel kampanyalardan anında
                haberdar olmak için e-posta listemize katılın.
              </p>
              <NewsletterForm />
              <p className="text-xs text-text-secondary">İstediğiniz zaman çıkabilirsiniz.</p>
            </div>
          </div>

          {LINK_COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="font-display text-sm font-semibold text-text-primary">{col.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-text-secondary transition-colors hover:text-accent">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-3 border-t border-border pt-8 text-center">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-text-secondary">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Güvenli Ödeme
          </p>
          <p className="max-w-md text-xs text-text-secondary">
            Satın alımlar App Store ve Google Play&apos;in güvenli ödeme altyapısı üzerinden yapılır —
            kart bilgileriniz Fişştech sunucularına hiç ulaşmaz.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-text-secondary">© {new Date().getFullYear()} Fişştech. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            {SOCIAL_ICONS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                aria-label={label}
                title={`${label} — yakında`}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
            <a
              href="mailto:fisstechapp@gmail.com"
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors"
            >
              <Mail className="h-5 w-5" />
              fisstechapp@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
