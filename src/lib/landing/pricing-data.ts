export interface PricingPlan {
  id: string;
  emoji: string;
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
    emoji: "⭐",
    name: "Premium",
    description: "Sınırsız fiş tarama ve tüm kişisel finans özellikleri.",
    monthly: "49,99",
    yearly: "399,99",
    yearlyEffective: "33,33",
    yearlySavings: "%33",
    popular: true,
    features: [
      "Sınırsız fiş/fatura tarama",
      "Gelişmiş analiz ve raporlar",
      "Bütçe ve hedef takibi",
      "Bulut yedekleme dahil",
    ],
  },
  {
    id: "esnaf",
    emoji: "🏪",
    name: "Esnaf Modu",
    description: "Kasa defteri, stok ve satış takibiyle işletmeni yönet.",
    monthly: "199,99",
    yearly: "1.999,99",
    yearlyEffective: "166,66",
    yearlySavings: "%17",
    features: [
      "6 sektöre özel işletme paneli",
      "Kasa defteri ve stok takibi",
      "Personel ve maaş yönetimi",
      "Ek personel erişimi eklentisiyle büyütülebilir",
    ],
  },
  {
    id: "family",
    emoji: "👨‍👩‍👧‍👦",
    name: "Aile Planı",
    description: "Ortak bütçe ve harcama paylaşımıyla tüm aile bir arada.",
    monthly: "119,99",
    yearly: "1.199,99",
    yearlyEffective: "99,99",
    yearlySavings: "%17",
    features: [
      "Grup bütçesi ve ortak harcamalar",
      "Üye bazlı harcama analizleri",
      "Sınırsız fiş tarama (tüm üyeler)",
      "Bulut yedekleme dahil",
    ],
  },
];

export const BACKUP_ADDON = {
  emoji: "☁️",
  name: "Bulut Yedekleme",
  description: "Sadece bulut yedekleme isteyen kullanıcılar için tekil eklenti.",
  monthly: "₺29,99",
};
