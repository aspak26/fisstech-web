/**
 * Hand-authored, schema-accurate types for the tables Phase 1 touches.
 * Verified directly against fisle_app/supabase/migrations/*.sql (read-only reference),
 * not guessed. TODO: once `supabase login` is set up, replace this file wholesale with
 * `supabase gen types typescript --project-id <ref> --schema public` output covering
 * every table, and delete this hand-written subset.
 */

export type PaymentMethod = "cash" | "credit_card" | "debit_card" | "unknown";

export interface UsersRow {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  plan: "free" | "premium";
  plan_type: "free" | "premium" | "esnaf_premium" | "family";
  first_scan_at: string | null;
  rc_app_user_id: string | null;
  subscription_end_date: string | null;
  subscription_platform: string | null;
  esnaf_staff_limit: number | null;
  esnaf_backup_enabled: boolean | null;
  created_at: string;
}

export interface CategoriesRow {
  id: string;
  user_id: string | null; // NULL = system default category, readable by all
  name: string;
  icon: string;
  color: string;
  parent_group: string | null;
  is_default: boolean;
  created_at: string;
}

export interface CategoryLimitsRow {
  id: string;
  user_id: string;
  group_id: string | null;
  category_id: string | null;
  limit_type: "category" | "monthly" | "payment_method";
  payment_method: "cash" | "credit_card" | "debit_card" | null;
  card_label: string | null;
  amount: number;
  month: string; // "YYYY-MM"
}

export interface IncomeCategoriesRow {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface FixedExpenseCategoriesRow {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface ExpensesRow {
  id: string;
  user_id: string;
  group_id: string | null;
  store_name: string | null;
  total: number;
  date: string; // date, YYYY-MM-DD
  payment_method: PaymentMethod;
  is_private: boolean;
  receipt_image_url: string | null; // comma-joined signed URLs (mobile format — not an array)
  card_label: string | null;
  note: string | null;
  visibility: "public" | "group_only" | "private";
  created_at: string;
}

export interface ExpenseItemsRow {
  id: string;
  expense_id: string;
  name: string;
  category_id: string | null;
  price: number;
  quantity: number;
  unit: string;
  vat_rate: number;
}

export interface IncomesRow {
  id: string;
  user_id: string;
  category_id: string | null; // -> income_categories
  amount: number;
  date: string;
  description: string | null;
  recurrence: "none" | "weekly" | "monthly" | "yearly";
  recurrence_day: number | null;
  parent_id: string | null;
  created_at: string;
}

export interface FixedExpensesRow {
  id: string;
  user_id: string;
  category_id: string | null; // -> fixed_expense_categories
  amount: number;
  payment_day: number;
  description: string | null;
  payment_method:
    | "cash"
    | "credit_card"
    | "debit_card"
    | "auto_payment"
    | "bank_transfer";
  recurrence: "once" | "weekly" | "monthly" | "yearly";
  is_paid: boolean;
  paid_date: string | null;
  parent_id: string | null;
  created_at: string;
}

export interface SubscriptionsRow {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  renewal_date: string;
  frequency: "monthly" | "yearly";
  category_id: string | null;
  status: "active" | "paused" | "cancelled";
  is_notify_enabled: boolean;
  payment_method: string | null;
  card_label: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface ReceiptCreditsRow {
  id: string;
  user_id: string;
  used_count: number;
  earned_count: number;
  month: string; // 'YYYY-MM'
}

export interface UserNotesRow {
  id: string;
  user_id: string;
  title: string;
  color: "red" | "blue" | "green";
  body: string;
  items: unknown[];
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface FamilyMembershipsRow {
  id: string;
  owner_id: string;
  member_id: string;
  invited_at: string;
  accepted_at: string | null;
}

export interface InstallmentPlansRow {
  expense_id: string; // PK, -> expenses.id
  user_id: string;
  total_count: number;
  monthly_amount: number;
  paid_count: number;
  start_date: string;
  paid_states: boolean[] | null;
  custom_amounts: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseGroupsRow {
  id: string;
  expense_id: string;
  group_id: string;
  created_at: string;
}
