import Link from "next/link";
import { Receipt } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import type { RecentExpense } from "@/lib/data/dashboard";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Nakit",
  credit_card: "Kredi Kartı",
  debit_card: "Banka Kartı",
  unknown: "Bilinmiyor",
};

export function RecentExpensesList({ expenses }: { expenses: RecentExpense[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Son Harcamalar</CardTitle>
      </CardHeader>
      {expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Henüz harcama yok"
          description="Fiş Tara ile ilk harcamanızı ekleyin."
          action={
            <Link href="/scan" className="text-sm font-medium text-accent hover:underline">
              Fiş Tara&apos;ya git
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-border">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-text-primary">
                  {expense.store_name || "Bilinmeyen işyeri"}
                </p>
                <p className="text-sm text-text-secondary">
                  {expense.date} · {expense.item_count} kalem ·{" "}
                  {PAYMENT_LABELS[expense.payment_method] ?? expense.payment_method}
                </p>
              </div>
              <span className="font-medium text-text-primary">
                {formatCurrency(Number(expense.total))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
