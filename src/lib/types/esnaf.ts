export interface BusinessRow {
  id: string;
  user_id: string;
  name: string;
  sector: string;
  business_type: string;
  tax_id: string | null;
  address: string | null;
  phone: string | null;
  currency: string;
  vat_enabled: boolean;
  default_vat: number;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessServiceChipRow {
  id: string;
  business_id: string;
  user_id: string;
  label: string;
  price: number;
  sort_order: number;
  created_at: string;
}

export interface BusinessIncomeRow {
  id: string;
  business_id: string;
  user_id: string;
  amount: number;
  description: string | null;
  payment_method: string;
  vat_rate: number;
  vat_amount: number;
  chip_id: string | null;
  chip_label: string | null;
  transaction_date: string;
  is_quick: boolean;
  receipt_url: string | null;
  created_at: string;
}

export interface BusinessExpenseRow {
  id: string;
  business_id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string | null;
  payment_method: string;
  vat_rate: number;
  vat_amount: number;
  receipt_url: string | null;
  expense_date: string;
  created_at: string;
}

export interface InvoiceRow {
  id: string;
  business_id: string;
  user_id: string;
  invoice_type: "giden" | "gelen";
  invoice_number: string | null;
  counterparty: string | null;
  amount: number;
  vat_rate: number;
  vat_amount: number;
  total_with_vat: number;
  status: "bekliyor" | "odendi" | "gecikti";
  invoice_date: string;
  due_date: string | null;
  paid_date: string | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
}

export interface EmployeeRow {
  id: string;
  business_id: string;
  user_id: string;
  full_name: string;
  role: string | null;
  phone: string | null;
  salary: number;
  salary_day: number;
  start_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SalaryPaymentRow {
  id: string;
  employee_id: string;
  business_id: string;
  user_id: string;
  amount: number;
  payment_month: string;
  payment_date: string | null;
  is_paid: boolean;
  notes: string | null;
  created_at: string;
}

export interface StockItemRow {
  id: string;
  business_id: string;
  user_id: string;
  name: string;
  unit: string;
  current_qty: number;
  critical_qty: number;
  unit_cost: number | null;
  barcode: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockMovementRow {
  id: string;
  stock_item_id: string;
  business_id: string;
  user_id: string;
  movement_type: "giris" | "cikis" | "sayim";
  quantity: number;
  note: string | null;
  movement_date: string;
  created_at: string;
}

/** Ported verbatim from fisle_app business_model.dart's BusinessSectors. */
export const BUSINESS_SECTORS = [
  { key: "hizmet_bakim", label: "Hizmet & Bakım", desc: "(Berber, Oto Yıkama, Tamir...)", emoji: "✂️", type: "hizmet" },
  { key: "hizli_perakende", label: "Hızlı Perakende", desc: "(Market, Pastane, Kırtasiye...)", emoji: "🛒", type: "perakende" },
  { key: "yeme_icme", label: "Yeme & İçme", desc: "(Kafe, Lokanta, Çay Ocağı...)", emoji: "☕", type: "kafe" },
  { key: "yuksek_hacim", label: "Yüksek Hacimli Satış", desc: "(Emlak, Galeri, Kuyumcu...)", emoji: "🤝", type: "satis" },
  { key: "toptan_imalat", label: "Toptancı & İmalatçı", desc: "(Toptan, Fabrika, Bayi...)", emoji: "🏭", type: "toptan" },
  { key: "serbest_meslek", label: "Serbest Meslek & Proje", desc: "(Danışman, Mühendis, Avukat...)", emoji: "💼", type: "freelance" },
] as const;

export function businessTypeForSector(sectorKey: string): string {
  return BUSINESS_SECTORS.find((s) => s.key === sectorKey)?.type ?? "hizmet";
}

export function sectorLabel(sectorKey: string): string {
  return BUSINESS_SECTORS.find((s) => s.key === sectorKey)?.label ?? "İşletme";
}

export function sectorEmoji(sectorKey: string): string {
  return BUSINESS_SECTORS.find((s) => s.key === sectorKey)?.emoji ?? "🏪";
}
