import { Repeat } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import type { FixedExpensesRow } from "@/lib/types/database";

export function FixedExpensesList({ items }: { items: FixedExpensesRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sabit Giderler</CardTitle>
      </CardHeader>
      {items.length === 0 ? (
        <EmptyState icon={Repeat} title="Sabit gider eklenmedi" />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-text-primary">
                  {item.description || "Sabit gider"}
                </p>
                <p className="text-sm text-text-secondary">Her ayın {item.payment_day}. günü</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={item.is_paid ? "success" : "neutral"}>
                  {item.is_paid ? "Ödendi" : "Bekliyor"}
                </Badge>
                <span className="font-medium text-text-primary">
                  {formatCurrency(Number(item.amount))}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
