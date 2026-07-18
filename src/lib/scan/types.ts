export interface ScanResultItem {
  name: string;
  category: string;
  price: number;
  quantity: number;
}

export interface ScanInstallmentOption {
  count: number;
  monthlyAmount: number;
  label: string;
  badge: string | null;
}

export interface ScanResult {
  storeName: string;
  date: string;
  total: number;
  paymentMethod: string;
  items: ScanResultItem[];
  isInstallment: boolean;
  installmentOptions: ScanInstallmentOption[];
  imageUrls: string[];
}

export interface CategoryOption {
  name: string;
  group: string;
  emoji: string;
}

/** Raw JSON shape returned by the `scan-receipt` edge function. */
export interface ScanReceiptResponse {
  store_name?: string;
  date?: string;
  total?: number;
  payment_method?: string;
  is_installment?: boolean;
  installment_options?: {
    count: number;
    monthly_amount: number;
    label?: string;
    badge?: string | null;
  }[];
  items?: { name?: string; category?: string; price?: number; quantity?: number }[];
  error?: string;
}

export function scanResultFromResponse(json: ScanReceiptResponse): ScanResult {
  return {
    storeName: json.store_name || "Bilinmiyor",
    date: json.date || new Date().toISOString().slice(0, 10),
    total: json.total ?? 0,
    paymentMethod: json.payment_method || "unknown",
    items: (json.items ?? []).map((item) => ({
      name: item.name ?? "",
      category: item.category ?? "Diğer",
      price: item.price ?? 0,
      quantity: item.quantity ?? 1,
    })),
    isInstallment: json.is_installment ?? false,
    installmentOptions: (json.installment_options ?? []).map((opt) => ({
      count: opt.count,
      monthlyAmount: opt.monthly_amount,
      label: opt.label || (opt.count === 1 ? "Tek Çekim" : `${opt.count} Taksit`),
      badge: opt.badge ?? null,
    })),
    imageUrls: [],
  };
}
