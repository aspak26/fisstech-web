"use client";

import { Suspense, useState } from "react";
import { PeriodSelector } from "@/components/ui/period-selector";
import { AiChatCreditBadge } from "./credit-badge";
import { ChatWorkspace } from "./chat-workspace";
import type { AiChatQuota } from "@/lib/ai-chat/client";

/** Başlık satırı (rozet + dönem seçici) ile sohbet alanını tek bir client
 * bileşende topluyor — rozetin ChatWorkspace'ten dönen güncel kota ile canlı
 * güncellenebilmesi için ikisinin aynı state'i paylaşması gerekiyor. page.tsx
 * (Server Component) yalnızca sayfa ilk yüklendiğindeki başlangıç değerlerini
 * hesaplayıp buraya prop olarak geçiyor. */
export function AiChatClientArea({
  period,
  periodLabel,
  startDate,
  endDate,
  initialQuota,
}: {
  period: string;
  periodLabel: string;
  startDate: string | null;
  endDate: string | null;
  initialQuota: AiChatQuota;
}) {
  const [quota, setQuota] = useState<AiChatQuota>(initialQuota);

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold text-text-primary">AI Sohbet</h1>
        <div className="flex items-center gap-2">
          <AiChatCreditBadge remaining={quota.remaining} limit={quota.limit} />
          <Suspense fallback={<div className="h-10 w-32" />}>
            <PeriodSelector period={period} />
          </Suspense>
        </div>
      </div>
      <ChatWorkspace
        periodLabel={periodLabel}
        startDate={startDate}
        endDate={endDate}
        onQuotaUpdate={setQuota}
      />
    </div>
  );
}
