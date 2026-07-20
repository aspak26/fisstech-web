"use client";

import { useMemo, useState } from "react";
import { Plus, Wallet, Repeat, ShoppingBag, Download, Landmark, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { exportBudgetToExcel } from "@/lib/income/export";
import {
  deleteFixedExpense,
  deleteIncome,
  toggleFixedExpensePaid,
} from "@/lib/data/income";
import type {
  CategoriesRow,
  FixedExpenseCategoriesRow,
  FixedExpensesRow,
  IncomeCategoriesRow,
  IncomesRow,
} from "@/lib/types/database";
import type { ExpenseWithItems } from "@/lib/data/expenses";
import { IncomeFormDialog } from "./income-form-dialog";
import { FixedExpenseFormDialog } from "./fixed-expense-form-dialog";

const PAYMENT_EMOJI: Record<string, string> = {
  cash: "💵",
  credit_card: "💳",
  debit_card: "💳",
  unknown: "💸",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Nakit",
  credit_card: "Kredi Kartı",
  debit_card: "Banka Kartı",
  auto_payment: "Otomatik Ödeme",
  bank_transfer: "Havale/EFT",
};

export function IncomePanel({
  incomes,
  fixedExpenses,
  expenses,
  incomeCategories,
  fixedExpenseCategories,
  itemCategories,
  periodLabel,
}: {
  incomes: IncomesRow[];
  fixedExpenses: FixedExpensesRow[];
  expenses: ExpenseWithItems[];
  incomeCategories: IncomeCategoriesRow[];
  fixedExpenseCategories: FixedExpenseCategoriesRow[];
  itemCategories: CategoriesRow[];
  periodLabel: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"income" | "fixed" | "variable">("income");
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [fixedDialogOpen, setFixedDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const incomeCategoryMap = new Map(incomeCategories.map((c) => [c.id, c]));
  const fixedCategoryMap = new Map(fixedExpenseCategories.map((c) => [c.id, c]));
  const itemCategoryNamesById = useMemo(
    () => new Map(itemCategories.map((c) => [c.id, c.name])),
    [itemCategories],
  );

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalFixed = fixedExpenses.reduce((s, f) => s + Number(f.amount), 0);
  const totalVariable = expenses.reduce((s, e) => s + Number(e.total), 0);
  const netBalance = totalIncome - totalFixed - totalVariable;

  const expenseCategoryLabel = useMemo(
    () => (expense: ExpenseWithItems) => {
      const names = [
        ...new Set(expense.expense_items.map((i) => itemCategoryNamesById.get(i.category_id ?? "") ?? "Diğer")),
      ];
      return names.slice(0, 2).join(", ");
    },
    [itemCategoryNamesById],
  );

  async function handleExport() {
    setExporting(true);
    try {
      await exportBudgetToExcel({
        periodLabel,
        incomes,
        fixedExpenses,
        expenses,
        incomeCategoryMap,
        fixedCategoryMap,
        itemCategoryNamesById,
      });
    } finally {
      setExporting(false);
    }
  }

  const netBalanceCard = (
    <Card
      className={cn(
        "flex items-center justify-between",
        netBalance >= 0 ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5",
      )}
    >
      <div className="flex items-center gap-2">
        {netBalance >= 0 ? (
          <Landmark className="h-5 w-5 text-success" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-danger" />
        )}
        <p className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Net Bakiye</p>
      </div>
      <span className={cn("font-display text-xl font-bold", netBalance >= 0 ? "text-success" : "text-danger")}>
        {netBalance < 0 && "⚠️ "}
        {formatCurrency(netBalance)}
      </span>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={(v) => setTab(v as "income" | "fixed" | "variable")}
          options={[
            { value: "income", label: "Gelirler" },
            { value: "fixed", label: "Sabit Giderler" },
            { value: "variable", label: "Değişken Giderler" },
          ]}
        />
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={exporting} className="gap-1.5">
            <Download className="h-4 w-4" /> {exporting ? "Hazırlanıyor…" : "Excel'e Aktar"}
          </Button>
          {tab === "income" && (
            <Button size="sm" onClick={() => setIncomeDialogOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Gelir Ekle
            </Button>
          )}
          {tab === "fixed" && (
            <Button size="sm" onClick={() => setFixedDialogOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Sabit Gider Ekle
            </Button>
          )}
        </div>
      </div>

      {tab === "income" && (
        <>
          <Card>
            {incomes.length === 0 ? (
              <EmptyState icon={Wallet} title="Bu dönemde gelir kaydı yok" />
            ) : (
              <ul className="divide-y divide-border">
                {incomes.map((income) => {
                  const category = incomeCategoryMap.get(income.category_id ?? "");
                  return (
                    <li key={income.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-text-primary">
                          {category ? `${category.icon} ${category.name}` : "Gelir"}
                          {income.description ? ` — ${income.description}` : ""}
                        </p>
                        <p className="text-sm text-text-secondary">{income.date}</p>
                      </div>
                      <span className="font-medium text-success">
                        +{formatCurrency(Number(income.amount))}
                      </span>
                      <DeleteButton
                        confirmMessage="Bu gelir kaydı silinsin mi?"
                        onDelete={() => deleteIncome(createClient(), income.id)}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          {netBalanceCard}
        </>
      )}

      {tab === "fixed" && (
        <>
          <Card>
            {fixedExpenses.length === 0 ? (
              <EmptyState icon={Repeat} title="Henüz sabit gider eklenmedi" />
            ) : (
              <ul className="divide-y divide-border">
                {fixedExpenses.map((fe) => {
                  const category = fixedCategoryMap.get(fe.category_id ?? "");
                  return (
                    <li key={fe.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate font-medium",
                            fe.is_paid ? "text-text-secondary line-through" : "text-text-primary",
                          )}
                        >
                          {category ? `${category.icon} ${category.name}` : "Sabit gider"}
                          {fe.description ? ` — ${fe.description}` : ""}
                        </p>
                        <p className="text-sm text-text-secondary">
                          Her ayın {fe.payment_day}. günü · {PAYMENT_METHOD_LABELS[fe.payment_method] ?? fe.payment_method}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "font-medium",
                          fe.is_paid ? "text-text-secondary line-through" : "text-danger",
                        )}
                      >
                        {formatCurrency(Number(fe.amount))}
                      </span>
                      <button
                        type="button"
                        aria-label={fe.is_paid ? "Ödenmedi olarak işaretle" : "Ödendi olarak işaretle"}
                        onClick={async () => {
                          await toggleFixedExpensePaid(createClient(), fe.id, !fe.is_paid);
                          router.refresh();
                        }}
                      >
                        <Badge tone={fe.is_paid ? "success" : "neutral"}>
                          {fe.is_paid ? "Ödendi" : "Bekliyor"}
                        </Badge>
                      </button>
                      <DeleteButton
                        confirmMessage="Bu sabit gider silinsin mi?"
                        onDelete={() => deleteFixedExpense(createClient(), fe.id)}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          {netBalanceCard}
        </>
      )}

      {tab === "variable" && (
        <>
          <Card>
            {expenses.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="Bu dönemde harcama kaydı yok" />
            ) : (
              <ul className="divide-y divide-border">
                {expenses.map((expense) => (
                  <li key={expense.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-text-primary">
                        {PAYMENT_EMOJI[expense.payment_method] ?? "💸"} {expense.store_name || "Manuel Giriş"}
                      </p>
                      <p className="truncate text-sm text-text-secondary">
                        {expense.date}
                        {expenseCategoryLabel(expense) ? ` · ${expenseCategoryLabel(expense)}` : ""}
                      </p>
                    </div>
                    <span className="font-medium text-accent">{formatCurrency(Number(expense.total))}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {netBalanceCard}
        </>
      )}

      <IncomeFormDialog
        open={incomeDialogOpen}
        onClose={() => setIncomeDialogOpen(false)}
        categories={incomeCategories}
      />
      <FixedExpenseFormDialog
        open={fixedDialogOpen}
        onClose={() => setFixedDialogOpen(false)}
        categories={fixedExpenseCategories}
      />
    </div>
  );
}
