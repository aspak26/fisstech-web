import Link from "next/link";
import { ExternalLink, CreditCard } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import {
  buildSubscriptionTrend,
  cancelledMonthlySavings,
  subscriptionMonthlyAmount,
  ytdSubscriptionTotal,
} from "@/lib/subscriptions/analytics";
import { TrendLineChart } from "./trend-line-chart";
import { SubscriptionTimeline } from "./subscription-timeline";
import type { SubscriptionsRow } from "@/lib/types/database";

export function SubscriptionsAnalyticsTab({ subscriptions }: { subscriptions: SubscriptionsRow[] }) {
  if (subscriptions.length === 0) {
    return (
      <Card>
        <EmptyState icon={CreditCard} title="Henüz abonelik eklenmedi" />
      </Card>
    );
  }

  const active = subscriptions.filter((s) => s.status === "active");
  const monthlyTotal = active.reduce((s, sub) => s + subscriptionMonthlyAmount(sub), 0);
  const yearlyTotal = active.reduce(
    (s, sub) => s + (sub.frequency === "yearly" ? Number(sub.amount) : Number(sub.amount) * 12),
    0,
  );
  const ytdTotal = ytdSubscriptionTotal(subscriptions);
  const cancelledSavings = cancelledMonthlySavings(subscriptions);
  const trend = buildSubscriptionTrend(subscriptions, 6);

  return (
    <div className="space-y-6">
      <Card className="flex items-center justify-between">
        <div>
          <p className="font-medium text-text-primary">{active.length} aktif abonelik</p>
          <p className="text-sm text-text-secondary">Yıllık: {formatCurrency(yearlyTotal)}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-bold text-text-primary">{formatCurrency(monthlyTotal)}</p>
          <p className="text-sm text-text-secondary">/ ay</p>
        </div>
      </Card>

      {(ytdTotal > 0 || cancelledSavings > 0) && (
        <div className="rounded-control border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
          {ytdTotal > 0 && <p>💡 Bu yıl aboneliklere toplam {formatCurrency(ytdTotal)} harcandı.</p>}
          {cancelledSavings > 0 && (
            <p className="mt-1">İptal edilen aboneliklerle aylık {formatCurrency(cancelledSavings)} tasarruf sağlandı.</p>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Aylık Maliyet Trendi</CardTitle>
        </CardHeader>
        <TrendLineChart data={trend} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zaman Çizelgesi</CardTitle>
        </CardHeader>
        <SubscriptionTimeline subscriptions={subscriptions} />
      </Card>

      <Link
        href="/subscriptions"
        className="flex items-center justify-center gap-2 rounded-control border border-border py-3 text-sm font-medium text-text-primary hover:border-accent hover:text-accent"
      >
        <ExternalLink className="h-4 w-4" /> Tüm Abonelikleri Yönet
      </Link>
    </div>
  );
}
