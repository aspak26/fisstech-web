"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Receipt, CreditCard, Banknote, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { dateGroupLabel } from "@/lib/utils/date";
import { deleteExpense, type ExpenseWithItems } from "@/lib/data/expenses";
import { effectivePaidCount } from "@/lib/expenses/installment";
import type { GroupRow } from "@/lib/data/groups";
import type { CategoryOption } from "@/lib/scan/types";
import { ExpenseFormDialog } from "./expense-form-dialog";
import { cn } from "@/lib/utils/cn";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Nakit",
  credit_card: "Kredi Kartı",
  debit_card: "Banka Kartı",
  unknown: "Bilinmiyor",
};

const PAYMENT_ICONS: Record<string, typeof Banknote> = {
  cash: Banknote,
  credit_card: CreditCard,
  debit_card: CreditCard,
  unknown: HelpCircle,
};

export function ExpensesList({
  expenses,
  categories,
  categoryNamesById,
  groups,
}: {
  expenses: ExpenseWithItems[];
  categories: CategoryOption[];
  categoryNamesById: [string, string][];
  groups: GroupRow[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseWithItems | undefined>(undefined);
  const [installmentOnly, setInstallmentOnly] = useState(false);
  const categoryMap = new Map(categoryNamesById);

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(expense: ExpenseWithItems) {
    setEditing(expense);
    setDialogOpen(true);
  }

  const visibleExpenses = installmentOnly ? expenses.filter((e) => e.installment) : expenses;

  const groupedByDate = useMemo(() => {
    const map = new Map<string, ExpenseWithItems[]>();
    for (const expense of visibleExpenses) {
      const list = map.get(expense.date) ?? [];
      list.push(expense);
      map.set(expense.date, list);
    }
    return [...map.entries()];
  }, [visibleExpenses]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setInstallmentOnly((v) => !v)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            installmentOnly
              ? "border-accent bg-accent text-on-accent"
              : "border-border bg-surface text-text-secondary hover:border-accent",
          )}
        >
          💳 Taksitler
        </button>
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Manuel Ekle
        </Button>
      </div>

      <Card>
        {visibleExpenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Henüz harcama yok"
            description="Manuel ekleyebilir veya Fiş Tara'yı kullanabilirsin."
          />
        ) : (
          <div className="divide-y divide-border">
            {groupedByDate.map(([date, dayExpenses]) => (
              <div key={date} className="py-2">
                <p className="px-1 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {dateGroupLabel(date)}
                </p>
                <ul className="divide-y divide-border">
                  {dayExpenses.map((expense) => {
                    const Icon = PAYMENT_ICONS[expense.payment_method] ?? HelpCircle;
                    const inst = expense.installment;
                    return (
                      <li key={expense.id} className="flex items-center gap-3 py-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                          <Icon className="h-5 w-5" />
                        </div>
                        {inst ? (
                          <Link href={`/expenses/${expense.id}`} className="min-w-0 flex-1 text-left">
                            <p className="truncate font-medium text-text-primary">
                              {expense.store_name || "Manuel Giriş"}
                            </p>
                            <p className="truncate text-sm text-text-secondary">
                              {expense.expense_items.length} kalem ·{" "}
                              {PAYMENT_LABELS[expense.payment_method] ?? expense.payment_method}
                              {expense.note ? ` · ${expense.note}` : ""}
                            </p>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openEdit(expense)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate font-medium text-text-primary">
                              {expense.store_name || "Manuel Giriş"}
                            </p>
                            <p className="truncate text-sm text-text-secondary">
                              {expense.expense_items.length} kalem ·{" "}
                              {PAYMENT_LABELS[expense.payment_method] ?? expense.payment_method}
                              {expense.note ? ` · ${expense.note}` : ""}
                            </p>
                          </button>
                        )}
                        <div className="text-right">
                          <span className="font-medium text-text-primary">
                            {formatCurrency(Number(expense.total))}
                          </span>
                          {inst && (
                            <p className="mt-0.5">
                              <Badge tone="warning" className="text-[11px]">
                                {effectivePaidCount(inst)}/{inst.total_count} taksit
                              </Badge>
                            </p>
                          )}
                        </div>
                        <DeleteButton
                          confirmMessage={`"${expense.store_name || "Bu harcama"}" silinsin mi?`}
                          onDelete={() => deleteExpense(createClient(), expense.id)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ExpenseFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        categories={categories}
        expense={editing}
        categoryNamesById={categoryMap}
        groups={groups}
      />
    </div>
  );
}
