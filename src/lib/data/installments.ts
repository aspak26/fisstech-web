import type { SupabaseClient } from "@supabase/supabase-js";
import type { InstallmentPlansRow, ExpensesRow, CategoriesRow } from "@/lib/types/database";
import { paymentDate, effectivePaidCount, remainingAmount, autoPaidStates } from "@/lib/expenses/installment";
import { formatMonthLabel } from "@/lib/utils/date";

export interface ActiveInstallmentDetail {
  id: string;
  storeName: string;
  categoryName: string;
  categoryIcon: string;
  totalAmount: number;
  monthlyAmount: number;
  paidCount: number;
  totalCount: number;
  remainingAmount: number;
  startDate: string;
  nextPaymentDate: Date;
}

export interface FutureInstallmentLoad {
  month: string;
  label: string;
  total: number;
}

export interface InstallmentAnalytics {
  activeInstallments: ActiveInstallmentDetail[];
  futureLoad: FutureInstallmentLoad[];
  totalRemaining: number;
  thisMonthTotal: number;
}

export async function getInstallmentAnalytics(
  supabase: SupabaseClient,
  userId: string,
): Promise<InstallmentAnalytics> {
  const { data: instData } = await supabase.from("installment_plans").select("*, expenses(store_name, expense_items(categories(name, icon)))").eq("user_id", userId);
  const installments = (instData ?? []) as any[];

  const activeInstallments: ActiveInstallmentDetail[] = [];
  const futureLoadMap = new Map<string, number>();
  let totalRemaining = 0;
  let thisMonthTotal = 0;
  
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  for (const row of installments) {
    const inst = row as InstallmentPlansRow;
    const paidCount = effectivePaidCount(inst);
    
    if (paidCount >= inst.total_count) continue;
    
    const paidStates = inst.paid_states ?? autoPaidStates(inst.start_date, inst.total_count);
    const remAmount = remainingAmount(inst, paidStates);
    totalRemaining += remAmount;
    
    let nextDate: Date | null = null;
    
    for (let i = 0; i < inst.total_count; i++) {
      if (!paidStates[i]) {
        const d = paymentDate(inst.start_date, i);
        if (!nextDate) nextDate = d;
        
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        futureLoadMap.set(ym, (futureLoadMap.get(ym) ?? 0) + inst.monthly_amount);
        
        if (ym === currentYM) {
          thisMonthTotal += inst.monthly_amount;
        }
      }
    }
    
    const expense = row.expenses;
    const category = expense?.expense_items?.[0]?.categories;
    
    activeInstallments.push({
      id: inst.id,
      storeName: expense?.store_name || "Bilinmeyen Maðaza",
      categoryName: category?.name || "Diðer",
      categoryIcon: category?.icon || "??",
      totalAmount: inst.total_amount,
      monthlyAmount: inst.monthly_amount,
      paidCount,
      totalCount: inst.total_count,
      remainingAmount: remAmount,
      startDate: inst.start_date,
      nextPaymentDate: nextDate || new Date(),
    });
  }

  const futureLoad: FutureInstallmentLoad[] = Array.from(futureLoadMap.entries())
    .map(([month, total]) => ({ month, label: formatMonthLabel(month), total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  activeInstallments.sort((a, b) => a.nextPaymentDate.getTime() - b.nextPaymentDate.getTime());

  return {
    activeInstallments,
    futureLoad,
    totalRemaining,
    thisMonthTotal,
  };
}
