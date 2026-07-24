"use client";

import { useState } from "react";
import { Plus, Minus, Wallet, Scan } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import {
  deleteBusinessExpense,
  deleteBusinessIncome,
} from "@/lib/data/esnaf";
import type {
  BusinessExpenseRow,
  BusinessIncomeRow,
  BusinessRow,
  BusinessServiceChipRow,
} from "@/lib/types/esnaf";
import { KasaIncomeDialog } from "./kasa-income-dialog";
import { KasaExpenseDialog } from "./kasa-expense-dialog";
import { GlobalBatchScanDialog } from "./global-batch-scan-dialog";

export function KasaList({
  business,
  incomes,
  expenses,
  chips,
}: {
  business: BusinessRow;
  incomes: BusinessIncomeRow[];
  expenses: BusinessExpenseRow[];
  chips: BusinessServiceChipRow[];
}) {
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const rows = [
    ...incomes.map((i) => ({
      id: i.id,
      label: i.chip_label || i.description || "Gelir",
      date: i.transaction_date,
      amount: Number(i.amount),
      type: "income" as const,
      onDelete: () => deleteBusinessIncome(createClient(), i.id),
    })),
    ...expenses.map((e) => ({
      id: e.id,
      label: `${e.description || "Gider"} (${e.category})`,
      date: e.expense_date,
      amount: Number(e.amount),
      type: "expense" as const,
      onDelete: () => deleteBusinessExpense(createClient(), e.id),
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setScanOpen(true)} className="gap-1.5 border-accent text-accent hover:bg-accent/10">
          <Scan className="h-4 w-4" /> Fiş Tara (Toplu)
        </Button>
        <Button variant="secondary" onClick={() => setExpenseOpen(true)} className="gap-1.5">
          <Minus className="h-4 w-4" /> Gider Ekle
        </Button>
        <Button onClick={() => setIncomeOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Gelir Ekle
        </Button>
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={Wallet} title="Henüz kasa hareketi yok" />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={`${r.type}-${r.id}`} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-text-primary">{r.label}</p>
                  <p className="text-sm text-text-secondary">{r.date}</p>
                </div>
                <span className={`font-medium ${r.type === "income" ? "text-success" : "text-danger"}`}>
                  {r.type === "income" ? "+" : "-"}
                  {formatCurrency(r.amount)}
                </span>
                <DeleteButton confirmMessage="Bu kayıt silinsin mi?" onDelete={r.onDelete} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <KasaIncomeDialog
        open={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        business={business}
        chips={chips}
      />
      <KasaExpenseDialog
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        business={business}
      />
      <GlobalBatchScanDialog
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        business={business}
      />
    </div>
  );
}
