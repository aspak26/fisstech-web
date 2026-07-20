import type { SupabaseClient } from "@supabase/supabase-js";
import { currentMonthString } from "@/lib/utils/date";
import type { CategoryLimitsRow } from "@/lib/types/database";

export const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Nakit", emoji: "💵" },
  { value: "credit_card", label: "Kredi Kartı", emoji: "💳" },
  { value: "debit_card", label: "Banka Kartı", emoji: "🏦" },
] as const;

function paymentLabel(method: string): string {
  return PAYMENT_METHOD_OPTIONS.find((p) => p.value === method)?.label ?? method;
}
function paymentEmoji(method: string): string {
  return PAYMENT_METHOD_OPTIONS.find((p) => p.value === method)?.emoji ?? "💳";
}

export interface CategoryLimitData {
  id: string;
  limitType: CategoryLimitsRow["limit_type"];
  categoryId: string | null;
  paymentMethod: string | null;
  cardLabel: string | null;
  month: string;
  name: string;
  icon: string;
  limit: number;
  spent: number;
  progress: number;
  isWarning: boolean;
  isExceeded: boolean;
}

interface ExpenseForLimits {
  total: number;
  payment_method: string | null;
  card_label: string | null;
  expense_items: { price: number; quantity: number; category_id: string | null }[];
}

/** Ported from mobile's AnalyticsService.getCategoryLimits — fetches limits
 * from (and including) the current month onward, computes "spent" for the
 * current month only (future months always show spent = 0, "Planlandı"). */
export async function getCategoryLimits(
  supabase: SupabaseClient,
  userId: string,
): Promise<CategoryLimitData[]> {
  const currentMonth = currentMonthString();
  const monthStart = `${currentMonth}-01`;
  const [y, m] = currentMonth.split("-").map(Number);
  const nextMonth = new Date(y, m, 1);
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

  const [limitsRes, expensesRes, subsRes] = await Promise.all([
    supabase
      .from("category_limits")
      .select("id, limit_type, category_id, payment_method, card_label, amount, month, categories(name, icon)")
      .eq("user_id", userId)
      .gte("month", currentMonth)
      .order("month"),
    supabase
      .from("expenses")
      .select("total, payment_method, card_label, expense_items(price, quantity, category_id)")
      .eq("user_id", userId)
      .gte("date", monthStart)
      .lt("date", monthEnd),
    supabase
      .from("subscriptions")
      .select("amount, frequency, payment_method, card_label")
      .eq("user_id", userId)
      .eq("status", "active"),
  ]);

  interface LimitQueryRow {
    id: string;
    limit_type: CategoryLimitsRow["limit_type"];
    category_id: string | null;
    payment_method: string | null;
    card_label: string | null;
    amount: number;
    month: string;
    categories: { name: string; icon: string } | null;
  }
  const limits = ((limitsRes.data ?? []) as unknown as LimitQueryRow[]).map((l) => ({
    ...l,
    categories: Array.isArray(l.categories) ? (l.categories[0] ?? null) : l.categories,
  }));
  if (limits.length === 0) return [];

  const expenses = (expensesRes.data ?? []) as unknown as ExpenseForLimits[];
  const activeSubs = (subsRes.data ?? []) as {
    amount: number;
    frequency: string;
    payment_method: string | null;
    card_label: string | null;
  }[];

  const categorySpent = new Map<string, number>();
  const expPaymentSpent = new Map<string, number>();
  const expCardSpent = new Map<string, number>();
  let monthlySpent = 0;

  for (const expense of expenses) {
    const expTotal = Number(expense.total);
    const payMethod = expense.payment_method ?? "unknown";
    const expCardLabel = expense.card_label?.toLowerCase();
    monthlySpent += expTotal;
    expPaymentSpent.set(payMethod, (expPaymentSpent.get(payMethod) ?? 0) + expTotal);
    if (expCardLabel) {
      const key = `${payMethod}|${expCardLabel}`;
      expCardSpent.set(key, (expCardSpent.get(key) ?? 0) + expTotal);
    }

    const items = expense.expense_items ?? [];
    const itemsSum = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
    for (const item of items) {
      if (!item.category_id) continue;
      const raw = Number(item.price) * item.quantity;
      const normalized = itemsSum > 0 ? raw * (expTotal / itemsSum) : raw;
      categorySpent.set(item.category_id, (categorySpent.get(item.category_id) ?? 0) + normalized);
    }
  }

  const subPaymentSpent = new Map<string, number>();
  const subCardSpent = new Map<string, number>();
  for (const sub of activeSubs) {
    const monthly = sub.frequency === "yearly" ? Number(sub.amount) / 12 : Number(sub.amount);
    monthlySpent += monthly;
    const pm = sub.payment_method;
    if (pm) {
      subPaymentSpent.set(pm, (subPaymentSpent.get(pm) ?? 0) + monthly);
      const cl = sub.card_label?.toLowerCase();
      if (cl) {
        const key = `${pm}|${cl}`;
        subCardSpent.set(key, (subCardSpent.get(key) ?? 0) + monthly);
      }
    }
  }

  return limits.map((l) => {
    const isCurrentMonth = l.month === currentMonth;
    const limitAmount = Number(l.amount);
    let spent = 0;
    let name: string;
    let icon: string;

    if (l.limit_type === "monthly") {
      spent = isCurrentMonth ? monthlySpent : 0;
      name = "Aylık Toplam";
      icon = "🗓";
    } else if (l.limit_type === "payment_method") {
      if (isCurrentMonth && l.payment_method) {
        if (l.card_label) {
          const key = `${l.payment_method}|${l.card_label.toLowerCase()}`;
          spent = (expCardSpent.get(key) ?? 0) + (subCardSpent.get(key) ?? 0);
        } else {
          spent = (expPaymentSpent.get(l.payment_method) ?? 0) + (subPaymentSpent.get(l.payment_method) ?? 0);
        }
      }
      const base = paymentLabel(l.payment_method ?? "");
      name = l.card_label ? `${base} · ${l.card_label}` : base;
      icon = paymentEmoji(l.payment_method ?? "");
    } else {
      spent = isCurrentMonth ? (categorySpent.get(l.category_id ?? "") ?? 0) : 0;
      name = l.categories?.name ?? "Kategori";
      icon = l.categories?.icon ?? "📦";
    }

    return {
      id: l.id,
      limitType: l.limit_type,
      categoryId: l.category_id,
      paymentMethod: l.payment_method,
      cardLabel: l.card_label,
      month: l.month,
      name,
      icon,
      limit: limitAmount,
      spent,
      progress: limitAmount > 0 ? Math.min(1, spent / limitAmount) : 0,
      isWarning: limitAmount > 0 && spent / limitAmount >= 0.8,
      isExceeded: spent > limitAmount,
    };
  });
}

/** Ported from mobile's AnalyticsService.setLimit — upserts by the natural
 * key for each limit type (category+month / payment_method+card_label+month
 * / month), matching the DB's partial unique indexes. */
export async function setLimit(
  supabase: SupabaseClient,
  userId: string,
  params: {
    limitType: CategoryLimitsRow["limit_type"];
    amount: number;
    categoryId?: string | null;
    paymentMethod?: string | null;
    cardLabel?: string | null;
    month?: string;
    existingId?: string | null;
  },
): Promise<void> {
  const month = params.month ?? currentMonthString();

  if (params.existingId) {
    await supabase.from("category_limits").update({ amount: params.amount }).eq("id", params.existingId);
    return;
  }

  let query = supabase
    .from("category_limits")
    .select("id")
    .eq("user_id", userId)
    .eq("limit_type", params.limitType)
    .eq("month", month);
  if (params.limitType === "category" && params.categoryId) {
    query = query.eq("category_id", params.categoryId);
  }
  if (params.limitType === "payment_method" && params.paymentMethod) {
    query = query.eq("payment_method", params.paymentMethod);
    query = params.cardLabel ? query.eq("card_label", params.cardLabel) : query.is("card_label", null);
  }
  const { data: existing } = await query.maybeSingle();

  if (existing) {
    await supabase.from("category_limits").update({ amount: params.amount }).eq("id", existing.id);
    return;
  }

  const insertData: Record<string, unknown> = {
    user_id: userId,
    limit_type: params.limitType,
    amount: params.amount,
    month,
  };
  if (params.limitType === "category" && params.categoryId) insertData.category_id = params.categoryId;
  if (params.limitType === "payment_method" && params.paymentMethod) {
    insertData.payment_method = params.paymentMethod;
    if (params.cardLabel) insertData.card_label = params.cardLabel;
  }
  await supabase.from("category_limits").insert(insertData);
}

export async function deleteLimit(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("category_limits").delete().eq("id", id);
}
