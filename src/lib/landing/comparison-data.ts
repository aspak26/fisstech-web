export type ComparisonValue = true | false | string;

export interface ComparisonRow {
  feature: string;
  premium: ComparisonValue;
  esnaf: ComparisonValue;
  family: ComparisonValue;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: "Aylık fiş tarama hakkı", premium: "Sınırsız", esnaf: "Sınırsız", family: "Sınırsız" },
  { feature: "Yapay zeka ile fiş okuma", premium: true, esnaf: true, family: true },
  { feature: "Aylık AI sohbet limiti", premium: "50", esnaf: false, family: "Kişi başı 50" },
  { feature: "Veri dışa aktarma (PDF/CSV)", premium: true, esnaf: true, family: true },
  { feature: "Kasa, stok ve satış takibi", premium: false, esnaf: true, family: false },
  { feature: "6 sektöre özel işletme paneli", premium: false, esnaf: true, family: false },
  { feature: "Personel ve müşteri yönetimi", premium: false, esnaf: true, family: false },
  { feature: "Lisans / Kullanıcı Sayısı", premium: "Bireysel (1 Kişi)", esnaf: "1 Kişi (+ Ek Personel)", family: "4 Kişiye Kadar" },
  { feature: "Orijinal fiş görseli yedekleme (Bulut)", premium: false, esnaf: "Eklenti (₺29,99/ay)", family: false },
];
