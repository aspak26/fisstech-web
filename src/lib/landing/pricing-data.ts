import { Crown, Store, Users, type LucideIcon } from "lucide-react";

export interface PricingPlan {
  id: string;
  icon: LucideIcon;
  name: string;
  description: string;
  /** Currency symbol excluded — the pricing card renders "₺" separately,
   * small/muted, next to a large bold amount (premium-SaaS price typography). */
  monthly: string;
  yearly: string;
  yearlyEffective: string;
  yearlySavings: string;
  popular?: boolean;
  features: string[];
}

/** Mobil kaynaktan (fisle_app/lib/features/premium/screens/paywall_screen.dart)
 * birebir alınan güncel fiyatlar — mobil tarafta elle girilmiş Dart display
 * string'leri, gerçek App Store/Play Store fiyatıyla birebir aynı olmayabilir,
 * yayına almadan önce kontrol edilmeli. Web'de gerçek ödeme altyapısı yok
 * (RevenueCat sadece mobil IAP) — kartlar bilgilendirme amaçlı, CTA /register. */
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "premium",
    icon: Crown,
    name: "Premium",
    description: "Sınırsız fiş tarama ve tüm kişisel finans özellikleri.",
    monthly: "49,99",
    yearly: "399,99",
    yearlyEffective: "33,33",
    yearlySavings: "%33",
    popular: true,
    features: [
      "Fişştech AI: Tüm verinizi analiz eden muhasebe uzmanı",
      "Aylık 50 AI sohbet limiti",
      "Sınırsız fiş tarama",
      "Sınırsız toplu fiş tarama",
      "Gelişmiş analiz raporları",
      "Ortak bütçe (Grup)",
      "Veri dışa aktarma (CSV/PDF)",
    ],
  },
  {
    id: "esnaf",
    icon: Store,
    name: "Esnaf Modu",
    description: "Kasa defteri, stok ve satış takibiyle işletmeni yönet.",
    monthly: "199,99",
    yearly: "1.999,99",
    yearlyEffective: "166,66",
    yearlySavings: "%17",
    features: [
      "Kasa takibi ve işletme panosu",
      "6 sektöre özel işletme paneli",
      "Müşteri & personel yönetimi",
      "İşletme PDF/Excel raporları",
      "Yapay Zeka ile Akıllı Gün Sonu Raporu",
    ],
  },
  {
    id: "family",
    icon: Users,
    name: "Aile Planı",
    description: "Ortak bütçe ve harcama paylaşımıyla tüm aile bir arada.",
    monthly: "119,99",
    yearly: "1.199,99",
    yearlyEffective: "99,99",
    yearlySavings: "%17",
    features: ["Tüm Premium özellikler", "4 kişiye kadar aile üyesi", "Her üye kendi hesabı"],
  },
];

export interface EsnafTier {
  id: string;
  label: string;
  monthly: string;
  yearly: string;
  yearlyEffective: string;
  yearlySavings: string;
}

/** Mobil kaynaktaki (paywall_screen.dart) gerçek personel-katmanı fiyatları
 * — bu oturumda daha önce araştırılıp doğrulanmıştı (esnaf_/esnaf10_/
 * esnaf20_/esnaf40_ RevenueCat paket önekleri). */
export const ESNAF_TIERS: EsnafTier[] = [
  { id: "sadece_ben", label: "Sadece Ben", monthly: "199,99", yearly: "1.999,99", yearlyEffective: "166,66", yearlySavings: "%17" },
  { id: "10", label: "10 Kişi", monthly: "349,99", yearly: "3.499,99", yearlyEffective: "291,66", yearlySavings: "%17" },
  { id: "20", label: "20 Kişi", monthly: "549,99", yearly: "5.499,99", yearlyEffective: "458,33", yearlySavings: "%17" },
  { id: "40", label: "40 Kişi", monthly: "899,99", yearly: "8.999,99", yearlyEffective: "749,99", yearlySavings: "%17" },
];

export const BACKUP_ADDON = {
  emoji: "☁️",
  name: "Bulut Yedekleme",
  // "Esnaf Modu" alt metnin içinde vurgulanacak — pricing-section.tsx bu
  // string'i tam bu yazımla arayıp <strong> ile sarıyor, değiştirirsen ikisini
  // birlikte güncelle.
  description: "Fiş, fatura ve evrak fotoğraflarını orijinal görsel haliyle güvenle saklamak isteyen Esnaf Modu kullanıcıları için özel ek paket.",
  monthly: "₺29,99",
};
