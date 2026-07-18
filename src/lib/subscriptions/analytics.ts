import type { SubscriptionsRow } from "@/lib/types/database";
import { formatMonthLabel } from "@/lib/utils/date";

export function subscriptionMonthlyAmount(sub: Pick<SubscriptionsRow, "amount" | "frequency">): number {
  return sub.frequency === "yearly" ? Number(sub.amount) / 12 : Number(sub.amount);
}

export interface SubscriptionTrendPoint {
  month: string;
  label: string;
  total: number;
}

/** All subscriptions that were active (by start/end date overlap) in each
 * of the last [months] calendar months — includes cancelled/paused ones,
 * only the date window matters. Ported from mobile's `_buildMonthlyTrend`. */
export function buildSubscriptionTrend(subs: SubscriptionsRow[], months = 6): SubscriptionTrendPoint[] {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const monthStart = new Date(m.getFullYear(), m.getMonth(), 1);
    const monthEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0);
    let total = 0;
    for (const sub of subs) {
      const start = new Date(sub.start_date ?? sub.created_at);
      const end = sub.end_date ? new Date(sub.end_date) : null;
      const wasActive = start <= monthEnd && (!end || end >= monthStart);
      if (wasActive) total += subscriptionMonthlyAmount(sub);
    }
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
    return { month: key, label: formatMonthLabel(key), total };
  });
}

export function ytdSubscriptionTotal(subs: SubscriptionsRow[]): number {
  const now = new Date();
  return buildSubscriptionTrend(subs, 12)
    .filter((p) => p.month.startsWith(String(now.getFullYear())))
    .reduce((s, p) => s + p.total, 0);
}

export function cancelledMonthlySavings(subs: SubscriptionsRow[]): number {
  return subs.filter((s) => s.status === "cancelled").reduce((s, sub) => s + subscriptionMonthlyAmount(sub), 0);
}
