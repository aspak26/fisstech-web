export interface BusinessRow {
  id: string;
  user_id: string;
  name: string;
  sector: string;
  business_type: string;
  tax_id: string | null;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
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

// ─── Serbest Meslek & Proje (migration 033_freelance_proje.sql) ────────────

export interface FreelanceClientRow {
  id: string;
  business_id: string;
  user_id: string;
  name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type FreelanceProjectStatus = "planning" | "in_progress" | "completed" | "cancelled";

export interface FreelanceProjectRow {
  id: string;
  business_id: string;
  user_id: string;
  client_id: string;
  name: string;
  description: string | null;
  total_budget: number;
  paid_amount: number;
  hourly_rate: number;
  status: FreelanceProjectStatus;
  deadline: string | null;
  completion_percentage: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestoneRow {
  id: string;
  project_id: string;
  business_id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string | null;
  is_paid: boolean;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface ProjectTaskRow {
  id: string;
  project_id: string;
  business_id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
}

export interface FreelanceTimeLogRow {
  id: string;
  project_id: string;
  business_id: string;
  user_id: string;
  task_id: string | null;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  hourly_rate: number;
  total_amount: number;
  created_at: string;
}

export interface ProjectExpenseRow {
  id: string;
  project_id: string;
  business_id: string;
  user_id: string;
  category: string | null;
  description: string | null;
  amount: number;
  expense_date: string;
  is_ai_scanned: boolean;
  created_at: string;
}

// ─── Yüksek Hacimli Satış (migration 028_satis_modulu.sql) ─────────────────

export type PortfolioCategory = "konut" | "arsa" | "arac" | "kuyum" | "sanat" | "doviz" | "diger";
export type PortfolioStatus = "satista" | "rezerve" | "satildi";

export interface SalePortfolioRow {
  id: string;
  business_id: string;
  user_id: string;
  title: string;
  category: PortfolioCategory;
  description: string | null;
  list_price: number;
  cost_price: number | null;
  status: PortfolioStatus;
  sold_price: number | null;
  image_urls: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleCustomerRow {
  id: string;
  business_id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  tc_or_vat: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleTransactionRow {
  id: string;
  business_id: string;
  user_id: string;
  portfolio_item_id: string | null;
  customer_id: string | null;
  staff_employee_id: string | null;
  total_amount: number;
  down_payment: number;
  remaining_amount: number;
  payment_type: "tek_cekim" | "taksitli";
  installment_count: number;
  sale_date: string;
  notes: string | null;
  pdf_url: string | null;
  created_at: string;
}

export interface SaleInstallmentRow {
  id: string;
  transaction_id: string;
  business_id: string;
  user_id: string;
  installment_no: number;
  amount: number;
  due_date: string;
  is_paid: boolean;
  paid_date: string | null;
  paid_amount: number | null;
  notes: string | null;
  created_at: string;
}

export const PORTFOLIO_CATEGORIES: { value: PortfolioCategory; label: string; emoji: string }[] = [
  { value: "konut", label: "Konut", emoji: "🏠" },
  { value: "arsa", label: "Arsa", emoji: "🗺️" },
  { value: "arac", label: "Araç", emoji: "🚗" },
  { value: "kuyum", label: "Kuyum", emoji: "💍" },
  { value: "sanat", label: "Sanat", emoji: "🎨" },
  { value: "doviz", label: "Döviz", emoji: "💱" },
  { value: "diger", label: "Diğer", emoji: "📦" },
];

// ─── Toptancı & İmalatçı (migration 032_toptan_imalat.sql) ─────────────────

export interface InventoryRow {
  id: string;
  business_id: string;
  user_id: string;
  name: string;
  category: string | null;
  unit_type: string;
  current_stock: number;
  critical_level: number;
  cost_price: number;
  selling_price: number;
  barcode: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type RiskLevel = "low" | "medium" | "high";

export interface B2bCustomerRow {
  id: string;
  business_id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
  credit_limit: number;
  current_debt: number;
  risk_level: RiskLevel;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type WholesaleOrderStatus = "pending" | "preparing" | "shipped" | "delivered" | "cancelled";

export interface WholesaleOrderRow {
  id: string;
  business_id: string;
  user_id: string;
  customer_id: string;
  status: WholesaleOrderStatus;
  total_amount: number;
  delivery_address: string | null;
  notes: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface WholesaleOrderItemRow {
  id: string;
  order_id: string;
  business_id: string;
  user_id: string;
  inventory_id: string | null;
  name: string;
  unit_type: string;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  total_amount: number;
  created_at: string;
}

/** type: 'borc' | 'alacak'. */
export interface B2bTransactionRow {
  id: string;
  business_id: string;
  user_id: string;
  customer_id: string;
  order_id: string | null;
  type: "borc" | "alacak";
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at: string;
}

export interface B2bPaymentRow {
  id: string;
  business_id: string;
  user_id: string;
  customer_id: string;
  amount: number;
  payment_type: "nakit" | "havale" | "cek";
  reference_no: string | null;
  due_date: string | null;
  notes: string | null;
  payment_date: string;
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
