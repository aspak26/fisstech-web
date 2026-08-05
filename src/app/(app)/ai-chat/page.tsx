import { redirect } from "next/navigation";
import { calculatePeriodRange, DEFAULT_BUDGET_PERIOD } from "@/lib/utils/period";
import { AiChatClientArea } from "@/components/modules/ai-chat/ai-chat-client-area";
import { createClient } from "@/lib/supabase/server";
import { getAiChatQuotaStatus } from "@/lib/ai-chat/credits";
import { getUserPlanInfo, isPersonalPremiumOrTrial } from "@/lib/utils/entitlements";

export default async function AiChatPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = periodParam ?? DEFAULT_BUDGET_PERIOD;
  const range = calculatePeriodRange(period);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [quota, planInfo] = await Promise.all([
    getAiChatQuotaStatus(supabase, userId),
    getUserPlanInfo(supabase, userId)
  ]);

  if (!isPersonalPremiumOrTrial(planInfo)) {
    redirect("/#pricing");
  }

  return (
    <AiChatClientArea
      period={period}
      periodLabel={range.label}
      startDate={range.start}
      endDate={range.end}
      initialQuota={quota}
    />
  );
}
