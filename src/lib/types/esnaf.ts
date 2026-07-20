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

// ─── Hizmet & Bakım (migration 030_hizmet_modulu.sql) ───────────────────────

export interface HizmetCustomerRow {
  id: string;
  business_id: string;
  user_id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  vehicle_plate: string | null;
  device_model: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceCatalogRow {
  id: string;
  business_id: string;
  user_id: string;
  name: string;
  default_price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface AppointmentRow {
  id: string;
  business_id: string;
  user_id: string;
  customer_id: string | null;
  staff_id: string | null;
  service_catalog_id: string | null;
  appointment_start: string;
  appointment_end: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export type ServiceJobStatus = "bekliyor" | "devam" | "hazir" | "tamamlandi";

export interface ServiceJobRow {
  id: string;
  business_id: string;
  user_id: string;
  customer_id: string | null;
  appointment_id: string | null;
  staff_id: string | null;
  title: string;
  labor_cost: number;
  parts_cost: number;
  total_amount: number;
  payment_method: string;
  status: ServiceJobStatus;
  is_ai_scanned: boolean;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface ServiceJobPartRow {
  id: string;
  job_id: string;
  business_id: string;
  user_id: string;
  part_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
}

// ─── Hızlı Perakende (migration 029_perakende_modulu.sql) ──────────────────

export interface ProductCategoryRow {
  id: string;
  business_id: string;
  user_id: string;
  name: string;
  emoji: string;
  sort_order: number;
  created_at: string;
}

export interface QuickProductRow {
  id: string;
  business_id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  price: number;
  unit_type: "adet" | "gram" | "kg" | "litre";
  product_code: string | null;
  has_variations: boolean;
  sale_count: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PerakendeCustomerRow {
  id: string;
  business_id: string;
  user_id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PerakendeTransactionRow {
  id: string;
  business_id: string;
  user_id: string;
  customer_id: string | null;
  total_amount: number;
  payment_method: "nakit" | "kart" | "veresiye";
  is_ai_scanned: boolean;
  transaction_date: string;
  notes: string | null;
  created_at: string;
}

export interface PerakendeTransactionItemRow {
  id: string;
  transaction_id: string;
  business_id: string;
  user_id: string;
  product_id: string | null;
  product_name: string;
  variation_label: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

/** amount: pozitif = borç, negatif = tahsilat. */
export interface PerakendeDebtRow {
  id: string;
  business_id: string;
  user_id: string;
  customer_id: string;
  amount: number;
  description: string | null;
  debt_date: string;
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
