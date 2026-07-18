"use client";

import { useState } from "react";
import { Plus, Wallet, Repeat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import {
  deleteFixedExpense,
  deleteIncome,
  toggleFixedExpensePaid,
} from "@/lib/data/income";
import type {
  FixedExpenseCategoriesRow,
  FixedExpensesRow,
  IncomeCategoriesRow,
  IncomesRow,
} from "@/lib/types/database";
import { IncomeFormDialog } from "./income-form-dialog";
import { FixedExpenseFormDialog } from "./fixed-expense-form-dialog";

export function IncomePanel({
  incomes,
  fixedExpenses,
  incomeCategories,
  fixedExpenseCategories,
}: {
  incomes: IncomesRow[];
  fixedExpenses: FixedExpensesRow[];
  incomeCategories: IncomeCategoriesRow[];
  fixedExpenseCategories: FixedExpenseCategoriesRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"income" | "fixed">("income");
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [fixedDialogOpen, setFixedDialogOpen] = useState(false);

  const incomeCategoryMap = new Map(incomeCategories.map((c) => [c.id, c]));
  const fixedCategoryMap = new Map(fixedExpenseCategories.map((c) => [c.id, c]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={(v) => setTab(v as "income" | "fixed")}
          options={[
            { value: "income", label: "Gelirler" },
            { value: "fixed", label: "Sabit Giderler" },
          ]}
        />
        {tab === "income" ? (
          <Button onClick={() => setIncomeDialogOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Gelir Ekle
          </Button>
        ) : (
          <Button onClick={() => setFixedDialogOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Sabit Gider Ekle
          </Button>
        )}
      </div>

      {tab === "income" ? (
        <Card>
          {incomes.length === 0 ? (
            <EmptyState icon={Wallet} title="Henüz gelir eklenmedi" />
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
      ) : (
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
                      <p className="truncate font-medium text-text-primary">
                        {category ? `${category.icon} ${category.name}` : "Sabit gider"}
                        {fe.description ? ` — ${fe.description}` : ""}
                      </p>
                      <p className="text-sm text-text-secondary">Her ayın {fe.payment_day}. günü</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await toggleFixedExpensePaid(createClient(), fe.id, !fe.is_paid);
                        router.refresh();
                      }}
                    >
                      <Badge tone={fe.is_paid ? "success" : "neutral"}>
                        {fe.is_paid ? "Ödendi" : "Bekliyor"}
                      </Badge>
                    </button>
                    <span className="font-medium text-text-primary">
                      {formatCurrency(Number(fe.amount))}
                    </span>
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
