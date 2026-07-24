import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanType = "free" | "premium" | "esnaf_premium" | "family";
export type EsnafPlan = "inactive" | "esnaf_premium";

export interface UserPlanInfo {
  planType: PlanType;
  esnafPlan: EsnafPlan;
  esnafStaffLimit: number;
}

const DEFAULT_PLAN_INFO: UserPlanInfo = {
  planType: "free",
  esnafPlan: "inactive",
  esnafStaffLimit: 5,
};

export async function getUserPlanInfo(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserPlanInfo> {
  const { data } = await supabase
    .from("users")
    .select("plan_type, esnaf_plan, esnaf_staff_limit")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return DEFAULT_PLAN_INFO;
  return {
    planType: (data.plan_type as PlanType) ?? "free",
    esnafPlan: (data.esnaf_plan as EsnafPlan) ?? "inactive",
    esnafStaffLimit: data.esnaf_staff_limit ?? 5,
  };
}

/** Kişisel Premium/Aile aboneliği — fiş tarama, AI sohbet, grup limitleri gibi
 * KİŞİSEL finans özelliklerini kapsar. Esnaf Modu ayrı bir üründür, bunu
 * KAPSAMAZ (webhook her iki ödemede de `plan='premium'` yazsa da, tier
 * ayrımı `plan_type` üzerinden yapılmalı — bkz. docs/PROGRESS.md). */
export function isPersonalPremium(planType: PlanType): boolean {
  return planType === "premium" || planType === "family";
}

export function isEsnafSubscriber(esnafPlan: EsnafPlan): boolean {
  return esnafPlan === "esnaf_premium";
}
