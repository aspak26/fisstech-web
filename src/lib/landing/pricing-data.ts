import { Crown, Users, type LucideIcon } from "lucide-react";

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
      "Fiş arşivi (Sınırsız)",
      "Sınırsız toplu fiş tarama",
      "Gelişmiş analiz raporları",
      "Ortak bütçe (Grup)",
      "Veri dışa aktarma (CSV/PDF)",
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

export const BACKUP_ADDON = {
  emoji: "☁️",
  name: "Bulut Yedekleme",
  description: "Fiş, fatura ve evrak fotoğraflarını orijinal görsel haliyle güvenle saklamak isteyenler için özel ek paket.",
  monthly: "₺29,99",
};
