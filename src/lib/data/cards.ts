import type { SupabaseClient } from "@supabase/supabase-js";
import type { CardsRow } from "@/lib/types/database";
import { requireUserId } from "@/lib/utils/auth";
import { calculatePeriodRange } from "@/lib/utils/period";

const CARD_COLS = "id, user_id, name, last4, card_type, limit_amount, color, created_at";

/** ARGB int (Flutter Color.toARGB32() formatı, mobil tarafın 085/086
 * migration'larında `cards.color` kolonuna bu şekilde yazılıyor) → CSS hex.
 * Alfa kanalı web'de kullanılmıyor, göz ardı edilir. */
export function cardColorToHex(color: number | null): string | null {
  if (color === null) return null;
  return `#${(color & 0xffffff).toString(16).padStart(6, "0")}`;
}

export function cardDisplayLabel(card: Pick<CardsRow, "name" | "last4">): string {
  return `${card.name} •••• ${card.last4}`;
}

export async function getCards(supabase: SupabaseClient, userId: string): Promise<CardsRow[]> {
  const { data } = await supabase
    .from("cards")
    .select(CARD_COLS)
    .eq("user_id", userId)
    .order("created_at");
  return (data ?? []) as unknown as CardsRow[];
}

export async function getCardById(supabase: SupabaseClient, id: string): Promise<CardsRow | null> {
  const { data } = await supabase.from("cards").select(CARD_COLS).eq("id", id).maybeSingle();
  return (data as unknown as CardsRow) ?? null;
}

export async function addCard(
  supabase: SupabaseClient,
  userId: string,
  params: { name: string; last4: string; cardType: "credit_card" | "debit_card"; limitAmount?: number | null; color?: number | null },
): Promise<CardsRow> {
  const { data, error } = await supabase
    .from("cards")
    .insert({
      user_id: userId,
      name: params.name.trim(),
      last4: params.last4.trim(),
      card_type: params.cardType,
      limit_amount: params.limitAmount ?? null,
      color: params.color ?? null,
    })
    .select(CARD_COLS)
    .single();
  if (error || !data) throw error ?? new Error("Kart eklenemedi");
  return data as unknown as CardsRow;
}

export async function updateCard(
  supabase: SupabaseClient,
  id: string,
  params: { name?: string; last4?: string; cardType?: "credit_card" | "debit_card"; limitAmount?: number | null; color?: number | null },
): Promise<void> {
  const userId = await requireUserId(supabase);
  const updates: Record<string, unknown> = {};
  if (params.name !== undefined) updates.name = params.name.trim();
  if (params.last4 !== undefined) updates.last4 = params.last4.trim();
  if (params.cardType !== undefined) updates.card_type = params.cardType;
  if (params.limitAmount !== undefined) updates.limit_amount = params.limitAmount;
  if (params.color !== undefined) updates.color = params.color;
  if (Object.keys(updates).length === 0) return;
  await supabase.from("cards").update(updates).eq("id", id).eq("user_id", userId);
}

export async function deleteCard(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("cards").delete().eq("id", id).eq("user_id", userId);
}

export interface CardExpenseRow {
  id: string;
  store_name: string | null;
  total: number;
  date: string;
  note: string | null;
}

export async function getCardExpenses(
  supabase: SupabaseClient,
  cardId: string,
  periodKey?: string,
): Promise<CardExpenseRow[]> {
  let query = supabase
    .from("expenses")
    .select("id, store_name, total, date, note")
    .eq("card_id", cardId);

  if (periodKey) {
    const range = calculatePeriodRange(periodKey);
    if (range.start) query = query.gte("date", range.start);
    if (range.end) query = query.lte("date", range.end);
  }

  const { data } = await query.order("date", { ascending: false }).order("created_at", { ascending: false }).limit(500);
  return (data ?? []) as unknown as CardExpenseRow[];
}

export async function getCardMonthlySpent(supabase: SupabaseClient, cardId: string): Promise<number> {
  const expenses = await getCardExpenses(supabase, cardId, "month");
  return expenses.reduce((sum, e) => sum + Number(e.total), 0);
}

/** Kartlar arası karşılaştırma (Analiz sekmesi bar/donut grafiği). */
export async function getCardTotals(
  supabase: SupabaseClient,
  userId: string,
  periodKey?: string,
): Promise<Map<string, number>> {
  let query = supabase.from("expenses").select("card_id, total").eq("user_id", userId).not("card_id", "is", null);
  if (periodKey) {
    const range = calculatePeriodRange(periodKey);
    if (range.start) query = query.gte("date", range.start);
    if (range.end) query = query.lte("date", range.end);
  }
  const { data } = await query.limit(2000);
  const totals = new Map<string, number>();
  for (const row of (data ?? []) as { card_id: string | null; total: number }[]) {
    if (!row.card_id) continue;
    totals.set(row.card_id, (totals.get(row.card_id) ?? 0) + Number(row.total));
  }
  return totals;
}

export interface CardCategoryPoint {
  name: string;
  total: number;
}

/** Bir kartın kategori kırılımı (kart detay sayfası / Analiz sekmesi kart donut'u). */
export async function getCardCategoryTotals(
  supabase: SupabaseClient,
  cardId: string,
  periodKey?: string,
): Promise<CardCategoryPoint[]> {
  let query = supabase
    .from("expenses")
    .select("total, expense_items(price, quantity, categories(name))")
    .eq("card_id", cardId);
  if (periodKey) {
    const range = calculatePeriodRange(periodKey);
    if (range.start) query = query.gte("date", range.start);
    if (range.end) query = query.lte("date", range.end);
  }
  const { data } = await query.limit(500);

  interface Row {
    total: number;
    expense_items: { price: number; quantity: number; categories: { name: string } | null }[];
  }
  const totals = new Map<string, number>();
  for (const expense of (data ?? []) as unknown as Row[]) {
    const items = expense.expense_items ?? [];
    const itemsSum = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
    for (const item of items) {
      const name = item.categories?.name ?? "Diğer";
      const raw = Number(item.price) * item.quantity;
      const normalized = itemsSum > 0 ? raw * (Number(expense.total) / itemsSum) : raw;
      totals.set(name, (totals.get(name) ?? 0) + normalized);
    }
  }
  return [...totals.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
}
