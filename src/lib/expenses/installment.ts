import type { InstallmentPlansRow } from "@/lib/types/database";

/** How many installments count as "paid" so far — mirrors mobile's
 * InstallmentInfo.effectivePaidCount: explicit paid_states win, otherwise
 * fall back to "elapsed months since start" (legacy plans with no per-
 * installment tracking). */
export function effectivePaidCount(inst: InstallmentPlansRow): number {
  if (inst.paid_states && inst.paid_states.length > 0) {
    return inst.paid_states.filter(Boolean).length;
  }
  const start = new Date(inst.start_date);
  const now = new Date();
  const startIdx = start.getFullYear() * 12 + start.getMonth();
  const nowIdx = now.getFullYear() * 12 + now.getMonth();
  const elapsed = nowIdx - startIdx + 1;
  return Math.min(Math.max(elapsed, 0), inst.total_count);
}

/** The i-th installment's due date, clamped to the number of days in that
 * month — ported from InstallmentInfo.paymentDate / DateTimeHelper. */
export function paymentDate(startDate: string, index: number): Date {
  const start = new Date(`${startDate}T00:00:00`);
  const base = new Date(start.getFullYear(), start.getMonth() + index, 1);
  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  return new Date(base.getFullYear(), base.getMonth(), Math.min(start.getDate(), daysInMonth));
}

/** Auto-detected paid/pending state per installment based purely on whether
 * its due date has passed — ported from InstallmentInfo's legacy fallback
 * and from _InstallmentScheduleCard._autoStates. Used both as the initial
 * state when no paid_states are stored yet, and to rebuild the whole
 * schedule when the start date changes. */
export function autoPaidStates(startDate: string, totalCount: number): boolean[] {
  const now = new Date();
  const currentYM = now.getFullYear() * 12 + now.getMonth();
  return Array.from({ length: totalCount }, (_, i) => {
    const d = paymentDate(startDate, i);
    return d.getFullYear() * 12 + d.getMonth() <= currentYM;
  });
}

/** Marks any installment whose due date has already passed as paid, without
 * ever un-marking one the user (or a prior auto-advance) already paid —
 * ported from _autoAdvanceAndSave. Returns null if nothing changed. */
export function autoAdvance(inst: InstallmentPlansRow): boolean[] | null {
  const now = new Date();
  const currentYM = now.getFullYear() * 12 + now.getMonth();
  const current = inst.paid_states && inst.paid_states.length === inst.total_count
    ? [...inst.paid_states]
    : Array(inst.total_count).fill(false);
  let changed = !inst.paid_states || inst.paid_states.length !== inst.total_count;
  for (let i = 0; i < inst.total_count; i++) {
    const d = paymentDate(inst.start_date, i);
    if (!current[i] && d.getFullYear() * 12 + d.getMonth() <= currentYM) {
      current[i] = true;
      changed = true;
    }
  }
  return changed ? current : null;
}

export function installmentAmount(inst: InstallmentPlansRow, index: number): number {
  if (inst.custom_amounts && index < inst.custom_amounts.length) return inst.custom_amounts[index];
  return inst.monthly_amount;
}

export function remainingAmount(inst: InstallmentPlansRow, paidStates: boolean[]): number {
  let total = 0;
  for (let i = 0; i < inst.total_count; i++) {
    if (!paidStates[i]) total += installmentAmount(inst, i);
  }
  return total;
}
