"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { deleteExpense, type ExpenseWithItems } from "@/lib/data/expenses";
import type { GroupRow } from "@/lib/data/groups";
import type { CategoryOption } from "@/lib/scan/types";
import { ExpenseFormDialog } from "./expense-form-dialog";
import { InstallmentScheduleCard } from "./installment-schedule-card";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Nakit",
  credit_card: "Kredi Kartı",
  debit_card: "Banka Kartı",
  unknown: "Bilinmiyor",
};

export function ExpenseDetail({
  expense,
  categories,
  categoryNamesById,
  groups,
}: {
  expense: ExpenseWithItems;
  categories: CategoryOption[];
  categoryNamesById: [string, string][];
  groups: GroupRow[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`"${expense.store_name || "Bu harcama"}" silinsin mi?`)) return;
    setDeleting(true);
    try {
      await deleteExpense(createClient(), expense.id);
      router.push("/expenses");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/expenses")}
          className="flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Harcamalarım
        </button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Düzenle
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" /> Sil
          </Button>
        </div>
      </div>

      <Card>
        <h1 className="font-display text-xl font-semibold text-text-primary">
          {expense.store_name || "Manuel Giriş"}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
          <span>{expense.date}</span>
          <span>{PAYMENT_LABELS[expense.payment_method] ?? expense.payment_method}</span>
          {expense.card_label && <span>{expense.card_label}</span>}
        </div>
        <p className="mt-3 font-display text-2xl font-bold text-text-primary">
          {formatCurrency(Number(expense.total))}
        </p>
        {expense.note && <p className="mt-2 text-sm italic text-text-secondary">{expense.note}</p>}

        {expense.expense_items.length > 0 && (
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {expense.expense_items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-text-primary">
                  {item.name} {item.quantity > 1 ? `× ${item.quantity}` : ""}
                </span>
                <span className="font-medium text-text-primary">
                  {formatCurrency(Number(item.price) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {expense.installment && <InstallmentScheduleCard expenseId={expense.id} installment={expense.installment} />}

      <ExpenseFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        categories={categories}
        expense={expense}
        categoryNamesById={new Map(categoryNamesById)}
        groups={groups}
      />
    </div>
  );
}
