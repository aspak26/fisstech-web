import { ArrowDownCircle, ArrowUpCircle, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

interface Item {
  label: string;
  amount: number;
  icon: typeof ArrowUpCircle;
  tone: "success" | "danger" | "neutral";
}

export function SummaryTriple({ income, expense }: { income: number; expense: number }) {
  const items: Item[] = [
    { label: "Gelir", amount: income, icon: ArrowUpCircle, tone: "success" },
    { label: "Gider", amount: expense, icon: ArrowDownCircle, tone: "danger" },
    { label: "Net Bakiye", amount: income - expense, icon: Scale, tone: "neutral" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="flex items-center gap-3">
          <item.icon
            className={cn(
              "h-8 w-8 shrink-0",
              item.tone === "success" && "text-success",
              item.tone === "danger" && "text-danger",
              item.tone === "neutral" && "text-text-secondary",
            )}
            strokeWidth={1.5}
          />
          <div>
            <p className="text-sm text-text-secondary">{item.label}</p>
            <p className="font-display text-xl font-semibold text-text-primary">
              {formatCurrency(item.amount)}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
