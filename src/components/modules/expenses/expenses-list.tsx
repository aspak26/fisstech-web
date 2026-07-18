"use client";

import { useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { deleteExpense, type ExpenseWithItems } from "@/lib/data/expenses";
import type { CategoryOption } from "@/lib/scan/types";
import { ExpenseFormDialog } from "./expense-form-dialog";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Nakit",
  credit_card: "Kredi Kartı",
  debit_card: "Banka Kartı",
  unknown: "Bilinmiyor",
};

export function ExpensesList({
  expenses,
  categories,
  categoryNamesById,
}: {
  expenses: ExpenseWithItems[];
  categories: CategoryOption[];
  categoryNamesById: [string, string][];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseWithItems | undefined>(undefined);
  const categoryMap = new Map(categoryNamesById);

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(expense: ExpenseWithItems) {
    setEditing(expense);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Manuel Ekle
        </Button>
      </div>

      <Card>
        {expenses.length === 0 ? (
          <EmptyState icon={Receipt} title="Henüz harcama yok" description="Manuel ekleyebilir veya Fiş Tara'yı kullanabilirsin." />
        ) : (
          <ul className="divide-y divide-border">
            {expenses.map((expense) => (
              <li key={expense.id} className="flex items-center justify-between gap-3 py-3">
                <button
                  type="button"
                  onClick={() => openEdit(expense)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-medium text-text-primary">
                    {expense.store_name || "Bilinmeyen işyeri"}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {expense.date} · {expense.expense_items.length} kalem ·{" "}
                    {PAYMENT_LABELS[expense.payment_method] ?? expense.payment_method}
                  </p>
                </button>
                <span className="font-medium text-text-primary">
                  {formatCurrency(Number(expense.total))}
                </span>
                <DeleteButton
                  confirmMessage={`"${expense.store_name || "Bu harcama"}" silinsin mi?`}
                  onDelete={() => deleteExpense(createClient(), expense.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ExpenseFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        categories={categories}
        expense={editing}
        categoryNamesById={categoryMap}
      />
    </div>
  );
}
