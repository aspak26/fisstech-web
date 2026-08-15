export type ComparisonValue = true | false | string;

export interface ComparisonRow {
  feature: string;
  premium: ComparisonValue;
  family: ComparisonValue;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: "Aylık fiş tarama hakkı", premium: "Sınırsız", family: "Sınırsız" },
  { feature: "Yapay zeka ile fiş okuma", premium: true, family: true },
  { feature: "Toplu fiş tarama (birden fazla fişi tek seferde)", premium: true, family: true },
  { feature: "Aylık AI sohbet limiti", premium: "50", family: "Kişi başı 50" },
  { feature: "Veri dışa aktarma (PDF/CSV)", premium: true, family: true },
  { feature: "Lisans / Kullanıcı Sayısı", premium: "Bireysel (1 Kişi)", family: "4 Kişiye Kadar" },
  { feature: "Orijinal fiş görseli yedekleme (Bulut)", premium: false, family: false },
];
