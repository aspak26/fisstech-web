import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getBusinessIncomes, getBusinessExpenses, getMonthlyTotals } from "@/lib/data/esnaf";
import { getMaintenanceReminders } from "@/lib/data/hizmet";
import { currentMonthString, getMonthRange } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/currency";
import { Card } from "@/components/ui/card";
import { SmartRemindersSection } from "@/components/modules/esnaf/smart-reminders-section";
import { ArrowDownCircle, ArrowUpCircle, TrendingUp } from "lucide-react";

export default async function EsnafPanoPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const { start, end } = getMonthRange(currentMonthString());
  const isHizmet = business.business_type === "hizmet";
  const [totals, recentIncomes, recentExpenses, reminders] = await Promise.all([
    getMonthlyTotals(supabase, business.id, start, end),
    getBusinessIncomes(supabase, business.id, 5),
    getBusinessExpenses(supabase, business.id, 5),
    isHizmet ? getMaintenanceReminders(supabase, business.id) : Promise.resolve([]),
  ]);
  const profit = totals.income - totals.expense;

  const recent = [
    ...recentIncomes.map((i) => ({
      id: i.id,
      label: i.chip_label || i.description || "Gelir",
      date: i.transaction_date,
      amount: Number(i.amount),
      type: "income" as const,
    })),
    ...recentExpenses.map((e) => ({
      id: e.id,
      label: e.description || e.category,
      date: e.expense_date,
      amount: Number(e.amount),
      type: "expense" as const,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3">
          <ArrowUpCircle className="h-8 w-8 text-success" strokeWidth={1.5} />
          <div>
            <p className="text-sm text-text-secondary">Bu Ay Ciro</p>
            <p className="font-display text-xl font-semibold text-text-primary">
              {formatCurrency(totals.income)}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <ArrowDownCircle className="h-8 w-8 text-danger" strokeWidth={1.5} />
          <div>
            <p className="text-sm text-text-secondary">Bu Ay Gider</p>
            <p className="font-display text-xl font-semibold text-text-primary">
              {formatCurrency(totals.expense)}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-accent" strokeWidth={1.5} />
          <div>
            <p className="text-sm text-text-secondary">Bu Ay Kâr</p>
            <p
              className={`font-display text-xl font-semibold ${profit >= 0 ? "text-success" : "text-danger"}`}
            >
              {formatCurrency(profit)}
            </p>
          </div>
        </Card>
      </div>

      {isHizmet && <SmartRemindersSection reminders={reminders} />}

      <Card>
        <h2 className="mb-3 font-display text-lg font-semibold text-text-primary">
          Son İşlemler
        </h2>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-secondary">Henüz işlem yok</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((r) => (
              <li key={`${r.type}-${r.id}`} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-text-primary">{r.label}</p>
                  <p className="text-sm text-text-secondary">{r.date}</p>
                </div>
                <span className={`font-medium ${r.type === "income" ? "text-success" : "text-danger"}`}>
                  {r.type === "income" ? "+" : "-"}
                  {formatCurrency(r.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
