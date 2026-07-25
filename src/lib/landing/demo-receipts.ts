export interface DemoReceiptItem {
  icon: string;
  name: string;
  category: string;
  amount: string;
  vatRate?: number;
}

export interface DemoReceiptResult {
  storeName: string;
  date: string;
  items: DemoReceiptItem[];
  total: string;
}

/** Sandbox demo için önceden hazırlanmış, gerçekçi ama sabit sonuçlar —
 * ziyaretçi hangi görseli yüklerse yüklesin bunlardan biri sırayla
 * gösterilir. Gerçek OCR çağrısı YOK (kullanıcı kararı: simüle demo). */
export const DEMO_RECEIPT_RESULTS: DemoReceiptResult[] = [
  {
    storeName: "BİM Market",
    date: "21 Temmuz 2026",
    items: [
      { icon: "🍞", name: "Ekmek", category: "Fırın Ürünleri", amount: "₺8,50" },
      { icon: "🥛", name: "Süt 1L", category: "Süt & Kahvaltılık", amount: "₺32,90" },
      { icon: "🍎", name: "Elma 1kg", category: "Meyve & Sebze", amount: "₺24,90" },
      { icon: "🧻", name: "Kağıt Havlu", category: "Temizlik", amount: "₺45,00" },
    ],
    total: "₺111,30",
  },
  {
    storeName: "Starbucks",
    date: "18 Temmuz 2026",
    items: [
      { icon: "☕", name: "Latte (Grande)", category: "Kafe & Restoran", amount: "₺145,00" },
      { icon: "🍰", name: "Cheesecake Dilim", category: "Kafe & Restoran", amount: "₺165,00" },
    ],
    total: "₺310,00",
  },
  {
    storeName: "Şok Market",
    date: "15 Temmuz 2026",
    items: [
      { icon: "🍗", name: "Tavuk Göğsü", category: "Et & Şarküteri", amount: "₺189,90" },
      { icon: "🍚", name: "Pirinç 2,5kg", category: "Bakliyat", amount: "₺94,50" },
      { icon: "🧴", name: "Bulaşık Deterjanı", category: "Temizlik", amount: "₺59,90" },
    ],
    total: "₺344,30",
  },
  {
    storeName: "Eczane Yıldız",
    date: "9 Temmuz 2026",
    items: [
      { icon: "💊", name: "Vitamin C", category: "Sağlık", amount: "₺78,00" },
      { icon: "🩹", name: "Yara Bandı", category: "Sağlık", amount: "₺22,50" },
    ],
    total: "₺100,50",
  },
];
