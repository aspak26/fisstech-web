import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanType = "free" | "premium" | "esnaf_premium" | "family";
export type EsnafPlan = "inactive" | "esnaf_premium";

const TRIAL_DAYS = 7;

export interface UserPlanInfo {
  planType: PlanType;
  esnafPlan: EsnafPlan;
  esnafStaffLimit: number;
  // 7 günlük ücretsiz deneme — fisle_app'teki UserProfile.trialStartedAt ile
  // aynı `users.trial_started_at` kolonu, paylaşılan backend sayesinde
  // mobilde başlatılan bir deneme burada da, web'de başlatılan bir deneme
  // mobilde de aynı anda geçerli olur.
  trialStartedAt: string | null;
  trialOfferDismissed: boolean;
  isInTrial: boolean;
  trialDaysLeft: number;
  canStartTrial: boolean;
}

const DEFAULT_PLAN_INFO: UserPlanInfo = {
  planType: "free",
  esnafPlan: "inactive",
  esnafStaffLimit: 5,
  trialStartedAt: null,
  trialOfferDismissed: false,
  isInTrial: false,
  trialDaysLeft: 0,
  canStartTrial: true,
};

export async function getUserPlanInfo(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserPlanInfo> {
  const { data } = await supabase
    .from("users")
    .select("plan_type, esnaf_plan, esnaf_staff_limit, trial_started_at, trial_offer_dismissed")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return DEFAULT_PLAN_INFO;

  const planType = (data.plan_type as PlanType) ?? "free";
  const esnafPlan = (data.esnaf_plan as EsnafPlan) ?? "inactive";
  const trialStartedAt = (data.trial_started_at as string | null) ?? null;

  let isInTrial = false;
  let trialDaysLeft = 0;
  if (trialStartedAt) {
    const ageDays = (Date.now() - new Date(trialStartedAt).getTime()) / (1000 * 60 * 60 * 24);
    isInTrial = ageDays < TRIAL_DAYS;
    trialDaysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - ageDays));
  }

  return {
    planType,
    esnafPlan,
    esnafStaffLimit: data.esnaf_staff_limit ?? 5,
    trialStartedAt,
    trialOfferDismissed: (data.trial_offer_dismissed as boolean | null) ?? false,
    isInTrial,
    trialDaysLeft,
    canStartTrial: trialStartedAt === null && !isPersonalPremium(planType) && !isEsnafSubscriber(esnafPlan),
  };
}

/** Kişisel Premium/Aile aboneliği — fiş tarama, AI sohbet, grup limitleri gibi
 * KİŞİSEL finans özelliklerini kapsar. Esnaf Modu ayrı bir üründür, bunu
 * KAPSAMAZ (webhook her iki ödemede de `plan='premium'` yazsa da, tier
 * ayrımı `plan_type` üzerinden yapılmalı — bkz. docs/PROGRESS.md). */
export function isPersonalPremium(planType: PlanType): boolean {
  return planType === "premium" || planType === "family";
}

/** `isPersonalPremium` + aktif 7 günlük deneme — kişisel premium'a özel
 * limitleri kontrol eden HER yer bunu kullanmalı (mobildeki
 * GroupService._isPremiumOrTrial / ScanService._isPremium ile aynı desen).
 * Salt `isPersonalPremium` bilerek "sadece ödemesi olan" anlamında saf
 * bırakıldı, deneme kontrolü ayrı bir fonksiyonda birleştiriliyor. */
export function isPersonalPremiumOrTrial(planInfo: Pick<UserPlanInfo, "planType" | "isInTrial">): boolean {
  return isPersonalPremium(planInfo.planType) || planInfo.isInTrial;
}

export function isEsnafSubscriber(esnafPlan: EsnafPlan): boolean {
  return esnafPlan === "esnaf_premium";
}
