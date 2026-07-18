import type { SupabaseClient } from "@supabase/supabase-js";

export interface GoalRow {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  target_amount: number;
  saved_amount: number;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getGoals(supabase: SupabaseClient, userId: string): Promise<GoalRow[]> {
  try {
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order")
      .order("created_at");
    return (data ?? []) as GoalRow[];
  } catch {
    return [];
  }
}

export async function deleteGoal(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("goals").delete().eq("id", id);
}

export async function contributeToGoal(
  supabase: SupabaseClient,
  userId: string,
  goal: GoalRow,
  amount: number,
): Promise<void> {
  const newSaved = Number(goal.saved_amount) + amount;
  await supabase
    .from("goals")
    .update({
      saved_amount: newSaved,
      completed_at: newSaved >= Number(goal.target_amount) ? new Date().toISOString() : null,
    })
    .eq("id", goal.id);
  await supabase.from("goal_transactions").insert({
    user_id: userId,
    goal_id: goal.id,
    type: "to_goal",
    amount,
  });
}
