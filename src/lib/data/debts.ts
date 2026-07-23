import type { SupabaseClient } from "@supabase/supabase-js";
import { requireUserId } from "@/lib/utils/auth";

export interface UserDebtRow {
  id: string;
  user_id: string;
  type: "borrowed" | "lent";
  person_name: string;
  amount: number;
  date: string;
  note: string;
  is_paid: boolean;
  due_date: string | null;
  is_reminder_active: boolean;
  created_at: string;
}

export async function getDebts(supabase: SupabaseClient, userId: string): Promise<UserDebtRow[]> {
  try {
    const { data } = await supabase
      .from("user_debts")
      .select("*")
      .eq("user_id", userId)
      .order("is_paid")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("date", { ascending: false });
    return (data ?? []) as UserDebtRow[];
  } catch {
    return [];
  }
}

export async function deleteDebt(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("user_debts").delete().eq("id", id).eq("user_id", userId);
}

export async function toggleDebtPaid(
  supabase: SupabaseClient,
  id: string,
  isPaid: boolean,
): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("user_debts").update({ is_paid: isPaid }).eq("id", id).eq("user_id", userId);
}
