"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import type { InstallmentPlansRow } from "@/lib/types/database";
import {
  autoAdvance,
  autoPaidStates,
  installmentAmount,
  paymentDate,
  remainingAmount,
} from "@/lib/expenses/installment";

const monthLabelFmt = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" });

export function InstallmentScheduleCard({
  expenseId,
  installment,
}: {
  expenseId: string;
  installment: InstallmentPlansRow;
}) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(installment.start_date);
  const [editingStart, setEditingStart] = useState(false);
  // Initial state already includes the auto-advance (any installment whose
  // due date has passed is marked paid, mirroring mobile's
  // _autoAdvanceAndSave) so the very first render is already correct.
  const [paidStates, setPaidStates] = useState<boolean[]>(() => {
    const advanced = autoAdvance(installment);
    if (advanced) return advanced;
    return installment.paid_states && installment.paid_states.length === installment.total_count
      ? installment.paid_states
      : autoPaidStates(installment.start_date, installment.total_count);
  });

  // Persist that same auto-advance to the server once, if it changed
  // anything — this only talks to Supabase, it never calls setState.
  useEffect(() => {
    const advanced = autoAdvance(installment);
    if (advanced) persist(startDate, advanced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function persist(nextStart: string, nextStates: boolean[]) {
    const supabase = createClient();
    await supabase
      .from("installment_plans")
      .update({
        start_date: nextStart,
        paid_states: nextStates,
        paid_count: nextStates.filter(Boolean).length,
        updated_at: new Date().toISOString(),
      })
      .eq("expense_id", expenseId);
    router.refresh();
  }

  function togglePayment(index: number) {
    const next = paidStates.map((v, i) => (i === index ? !v : v));
    setPaidStates(next);
    persist(startDate, next);
  }

  function handleStartDateChange(value: string) {
    if (!value) return;
    const nextStates = autoPaidStates(value, installment.total_count);
    setStartDate(value);
    setPaidStates(nextStates);
    setEditingStart(false);
    persist(value, nextStates);
  }

  const total = installment.total_count;
  const paidCount = paidStates.filter(Boolean).length;
  const remaining = remainingAmount(installment, paidStates);
  const endDate = paymentDate(startDate, total - 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ödeme Takvimi</CardTitle>
      </CardHeader>

      <p className="text-sm text-text-secondary">
        {paidCount}/{total} taksit ödendi
        {remaining > 0 ? (
          <> · Kalan: <span className="font-medium text-text-primary">{formatCurrency(remaining)}</span></>
        ) : (
          <span className="font-medium text-success"> · Tamamlandı ✓</span>
        )}
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${total > 0 ? (paidCount / total) * 100 : 0}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-text-secondary">Başlangıç Tarihi</span>
        {editingStart ? (
          <Input
            type="date"
            autoFocus
            className="h-8 w-40"
            defaultValue={startDate}
            onBlur={(e) => handleStartDateChange(e.target.value)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingStart(true)}
            className="flex items-center gap-1.5 font-medium text-text-primary hover:text-accent"
          >
            {monthLabelFmt.format(new Date(`${startDate}T00:00:00`)).replace(/^\w/, (c) => c.toUpperCase())}{" "}
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between py-1.5 text-sm">
        <span className="text-text-secondary">Bitiş Tarihi</span>
        <span className="font-medium text-text-primary">
          {monthLabelFmt.format(endDate).replace(/^\w/, (c) => c.toUpperCase())}
        </span>
      </div>

      <ul className="mt-2 divide-y divide-border border-t border-border">
        {Array.from({ length: total }, (_, i) => {
          const isPaid = paidStates[i];
          const date = paymentDate(startDate, i);
          const amount = installmentAmount(installment, i);
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => togglePayment(i)}
                className="flex w-full items-center gap-3 py-3 text-left"
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px]",
                    isPaid ? "border-success bg-success" : "border-border bg-transparent",
                  )}
                >
                  {isPaid && <Check className="h-3.5 w-3.5 text-white" />}
                </span>
                <span className={cn("flex-1 capitalize", isPaid ? "text-text-secondary" : "text-text-primary")}>
                  {monthLabelFmt.format(date)}
                </span>
                <span
                  className={cn(
                    "font-medium",
                    isPaid ? "text-text-secondary line-through" : "text-text-primary",
                  )}
                >
                  {formatCurrency(amount)}
                </span>
                <span className={cn("w-16 text-right text-xs font-medium", isPaid ? "text-success" : "text-text-secondary")}>
                  {isPaid ? "Ödendi" : "Bekliyor"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
