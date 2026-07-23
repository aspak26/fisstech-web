import { Suspense } from "react";
import { calculatePeriodRange, DEFAULT_BUDGET_PERIOD } from "@/lib/utils/period";
import { PeriodSelector } from "@/components/ui/period-selector";
import { ChatWorkspace } from "@/components/modules/ai-chat/chat-workspace";

export default async function AiChatPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = periodParam ?? DEFAULT_BUDGET_PERIOD;
  const range = calculatePeriodRange(period);

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-text-primary">AI Sohbet</h1>
        <Suspense fallback={<div className="h-10 w-32" />}>
          <PeriodSelector period={period} />
        </Suspense>
      </div>
      <ChatWorkspace 
        periodLabel={range.label} 
        startDate={range.start} 
        endDate={range.end} 
      />
    </div>
  );
}
