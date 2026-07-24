import { Suspense } from "react";
import { calculatePeriodRange, DEFAULT_BUDGET_PERIOD } from "@/lib/utils/period";
import { PeriodSelector } from "@/components/ui/period-selector";
import { ChatWorkspace } from "@/components/modules/ai-chat/chat-workspace";
import { AiChatCreditBadge } from "@/components/modules/ai-chat/credit-badge";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, isPersonalPremium } from "@/lib/utils/entitlements";
import { getRemainingAiChatCredits } from "@/lib/ai-chat/credits";

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

  const [planInfo, remainingCredits] = await Promise.all([
    getUserPlanInfo(supabase, userId),
    getRemainingAiChatCredits(supabase, userId),
  ]);

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold text-text-primary">AI Sohbet</h1>
        <div className="flex items-center gap-2">
          <AiChatCreditBadge remaining={remainingCredits} isPremium={isPersonalPremium(planInfo.planType)} />
          <Suspense fallback={<div className="h-10 w-32" />}>
            <PeriodSelector period={period} />
          </Suspense>
        </div>
      </div>
      <ChatWorkspace
        periodLabel={range.label}
        startDate={range.start}
        endDate={range.end}
      />
    </div>
  );
}
