import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PieChart, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import {
  expensesByCategory,
  purchasedItems,
  totalExpense,
  totalIncome,
  type ReportData,
} from "@/lib/data/reports";
import { CategoryDonutChart } from "@/components/modules/analytics/category-donut-chart";
import { PrintButton } from "./print-button";
import { ExcelExportButton } from "./excel-export-button";

const PALETTE = ["#B23A65", "#2E7D32", "#F5A623", "#1565C0", "#6A1B9A", "#00838F", "#C0392B", "#546E7A"];

export function ReportView({ data }: { data: ReportData }) {
  const income = totalIncome(data);
  const expense = totalExpense(data);
  const net = income - expense;
  const categories = expensesByCategory(data).map((c, i) => ({
    ...c,
    color: PALETTE[i % PALETTE.length],
  }));
  const items = purchasedItems(data);

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">
            Finansal Özet Raporu
          </h1>
          <p className="text-sm text-text-secondary">
            {data.start} — {data.end}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExcelExportButton data={data} />
          <PrintButton />
        </div>
      </div>

      <div className="hidden print:block">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Finansal Özet Raporu
        </h1>
        <p className="text-sm text-text-secondary">
          {data.start} — {data.end}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-text-secondary">Toplam Gelir</p>
          <p className="font-display text-xl font-semibold text-success">
            {formatCurrency(income)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Toplam Gider</p>
          <p className="font-display text-xl font-semibold text-danger">
            {formatCurrency(expense)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Net Durum</p>
          <p className={`font-display text-xl font-semibold ${net >= 0 ? "text-success" : "text-danger"}`}>
            {formatCurrency(net)}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kategori Bazlı Harcamalar</CardTitle>
        </CardHeader>
        {categories.length === 0 ? (
          <EmptyState icon={PieChart} title="Bu dönemde harcama yok" />
        ) : (
          <CategoryDonutChart data={categories} />
        )}
      </Card>

      {data.debts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Borçlar & Alacaklar</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-border">
            {data.debts.map((debt) => (
              <li key={debt.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-text-primary">{debt.person_name}</span>
                  <Badge tone={debt.type === "borrowed" ? "danger" : "success"}>
                    {debt.type === "borrowed" ? "Borç" : "Alacak"}
                  </Badge>
                </div>
                <span className="font-medium text-text-primary">
                  {formatCurrency(Number(debt.amount))}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {(data.goals.length > 0 || data.subscriptions.length > 0) && (
        <Card>
          {data.goals.length > 0 && (
            <>
              <CardHeader>
                <CardTitle>Hedefler (Bu dönemde eklenen)</CardTitle>
              </CardHeader>
              <ul className="mb-4 divide-y divide-border">
                {data.goals.map((goal) => (
                  <li key={goal.id} className="flex items-center justify-between py-2.5">
                    <span className="text-text-primary">
                      {goal.emoji} {goal.name}
                    </span>
                    <span className="font-medium text-text-primary">
                      {formatCurrency(Number(goal.target_amount))}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {data.subscriptions.length > 0 && (
            <>
              <CardHeader>
                <CardTitle>Aktif Abonelikler</CardTitle>
              </CardHeader>
              <ul className="divide-y divide-border">
                {data.subscriptions.map((sub) => (
                  <li key={sub.id} className="flex items-center justify-between py-2.5">
                    <span className="text-text-primary">{sub.name}</span>
                    <span className="font-medium text-text-primary">
                      {formatCurrency(Number(sub.amount))}
                      <span className="text-text-secondary"> / {sub.frequency === "yearly" ? "yıl" : "ay"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Alınan Ürünler / Fiş Detayları</CardTitle>
        </CardHeader>
        {items.length === 0 ? (
          <EmptyState icon={Receipt} title="Bu dönemde alınan ürün yok" />
        ) : (
          <div className="space-y-5">
            {groupByDate(items).map(([date, group]) => (
              <div key={date}>
                <p className="mb-2 font-display text-sm font-semibold text-accent">{date}</p>
                <div className="divide-y divide-border rounded-control border border-border">
                  {group.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-text-primary">
                          {item.quantity}x {item.name}
                        </p>
                        <p className="text-sm text-text-secondary">{item.storeName}</p>
                      </div>
                      <span className="shrink-0 font-medium text-text-primary">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function groupByDate(
  items: ReturnType<typeof purchasedItems>,
): [string, ReturnType<typeof purchasedItems>][] {
  const map = new Map<string, ReturnType<typeof purchasedItems>>();
  for (const item of items) {
    const group = map.get(item.date) ?? [];
    group.push(item);
    map.set(item.date, group);
  }
  return [...map.entries()];
}
