import type { SupabaseClient } from "@supabase/supabase-js";
import { currentMonthString } from "@/lib/utils/date";
import { requireUserId } from "@/lib/utils/auth";
import type { CategoryLimitsRow } from "@/lib/types/database";

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
  expense_items: { price: number; quantity: number; category_id: string | null }[];
}

/** Ported from mobile's AnalyticsService.getCategoryLimits — fetches limits
 * from (and including) the current month onward, computes "spent" for the
 * current month only (future months always show spent = 0, "Planlandı").
 *
 * NOT: "payment_method" limit tipi kaldırıldı (kart bazlı limitler artık
 * cards.limit_amount üzerinden yönetiliyor, bkz. src/lib/data/cards.ts) —
 * eski payment_method satırları DB'de kalabilir ama artık "Kategori"
 * bucket'ına düşer (mobildeki aynı geriye dönük uyumluluk kararı). */
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
      .select("total, expense_items(price, quantity, category_id)")
      .eq("user_id", userId)
      .gte("date", monthStart)
      .lt("date", monthEnd),
    supabase.from("subscriptions").select("amount, frequency").eq("user_id", userId).eq("status", "active"),
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
  const activeSubs = (subsRes.data ?? []) as { amount: number; frequency: string }[];

  const categorySpent = new Map<string, number>();
  let monthlySpent = 0;

  for (const expense of expenses) {
    const expTotal = Number(expense.total);
    monthlySpent += expTotal;

    const items = expense.expense_items ?? [];
    const itemsSum = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
    for (const item of items) {
      if (!item.category_id) continue;
      const raw = Number(item.price) * item.quantity;
      const normalized = itemsSum > 0 ? raw * (expTotal / itemsSum) : raw;
      categorySpent.set(item.category_id, (categorySpent.get(item.category_id) ?? 0) + normalized);
    }
  }

  for (const sub of activeSubs) {
    monthlySpent += sub.frequency === "yearly" ? Number(sub.amount) / 12 : Number(sub.amount);
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
    } else {
      // "category" ve eski "payment_method" satırları (kaldırılan tip —
      // artık yeni oluşturulamıyor, ama var olanlar bozulmasın diye kategori
      // bucket'ına düşüyor, mobildeki aynı geriye dönük uyumluluk kararı).
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
 * key for each limit type (category+month / month), matching the DB's
 * partial unique indexes. "payment_method" limit tipi artık oluşturulamıyor
 * (bkz. getCategoryLimits'teki not) — bu yüzden paymentMethod/cardLabel
 * parametreleri kaldırıldı. */
export async function setLimit(
  supabase: SupabaseClient,
  userId: string,
  params: {
    limitType: CategoryLimitsRow["limit_type"];
    amount: number;
    categoryId?: string | null;
    month?: string;
    existingId?: string | null;
  },
): Promise<void> {
  const month = params.month ?? currentMonthString();

  if (params.existingId) {
    await supabase
      .from("category_limits")
      .update({ amount: params.amount })
      .eq("id", params.existingId)
      .eq("user_id", userId);
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
  const { data: existing } = await query.maybeSingle();

  if (existing) {
    await supabase
      .from("category_limits")
      .update({ amount: params.amount })
      .eq("id", existing.id)
      .eq("user_id", userId);
    return;
  }

  const insertData: Record<string, unknown> = {
    user_id: userId,
    limit_type: params.limitType,
    amount: params.amount,
    month,
  };
  if (params.limitType === "category" && params.categoryId) insertData.category_id = params.categoryId;
  await supabase.from("category_limits").insert(insertData);
}

export async function deleteLimit(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("category_limits").delete().eq("id", id).eq("user_id", userId);
}
