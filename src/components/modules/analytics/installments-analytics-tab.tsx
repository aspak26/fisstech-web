import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InstallmentAnalytics } from "@/lib/data/installments";
import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthLabel } from "@/lib/utils/date";

export function InstallmentsAnalyticsTab({
  data,
}: {
  data: InstallmentAnalytics;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Bu Ayki Taksit Yükü</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">
              {formatCurrency(data.thisMonthTotal)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Toplam Kalan Taksit Borcu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">
              {formatCurrency(data.totalRemaining)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gelecek Aylarýn Taksit Yükü</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.futureLoad.length === 0 ? (
              <p className="text-center text-sm text-text-secondary py-4">Gelecek aylara sarkan taksit bulunmuyor.</p>
            ) : (
              data.futureLoad.map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">{item.label}</span>
                  <span className="text-sm font-semibold text-text-primary">{formatCurrency(item.total)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aktif Taksitler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.activeInstallments.length === 0 ? (
              <p className="text-center text-sm text-text-secondary py-4">Aktif taksitiniz bulunmuyor.</p>
            ) : (
              data.activeInstallments.map((inst) => (
                <div key={inst.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-xl">
                      {inst.categoryIcon}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{inst.storeName}</p>
                      <p className="text-sm text-text-secondary">Taksit {inst.paidCount}/{inst.totalCount}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text-primary">{formatCurrency(inst.monthlyAmount)} / ay</p>
                    <p className="text-xs text-text-secondary">Kalan: {formatCurrency(inst.remainingAmount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

