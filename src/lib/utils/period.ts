/** Ported from fisle_app's PeriodHelper.calculateRange — same period keys,
 * same range math, so web and mobile agree on what "Bu Ay" etc. mean. */

export interface PeriodRange {
  start: string | null; // YYYY-MM-DD, inclusive
  end: string | null; // YYYY-MM-DD, inclusive
  label: string;
}

const TR_MONTHS_LONG = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Last day of the given 1-indexed month. */
function lastDayOfMonth(year: number, month1to12: number): Date {
  return new Date(year, month1to12, 0);
}

export const DEFAULT_EXPENSE_PERIOD = "all";
export const DEFAULT_BUDGET_PERIOD = "month";

export function calculatePeriodRange(periodKey: string): PeriodRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (periodKey === "week") {
    const weekday = today.getDay() === 0 ? 7 : today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (weekday - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: toISO(monday), end: toISO(sunday), label: "Bu Hafta" };
  }
  if (periodKey === "month") {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = lastDayOfMonth(today.getFullYear(), today.getMonth() + 1);
    return { start: toISO(first), end: toISO(last), label: "Bu Ay" };
  }
  if (periodKey === "last_month") {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const last = lastDayOfMonth(first.getFullYear(), first.getMonth() + 1);
    return { start: toISO(first), end: toISO(last), label: `${TR_MONTHS_LONG[first.getMonth()]} ${first.getFullYear()}` };
  }
  if (periodKey === "last3months" || periodKey === "month3") {
    const first = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const last = lastDayOfMonth(today.getFullYear(), today.getMonth() + 1);
    return { start: toISO(first), end: toISO(last), label: "Son 3 Ay" };
  }
  if (periodKey === "last6months" || periodKey === "month6") {
    const first = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const last = lastDayOfMonth(today.getFullYear(), today.getMonth() + 1);
    return { start: toISO(first), end: toISO(last), label: "Son 6 Ay" };
  }
  if (periodKey === "year" || periodKey === "year_cur") {
    return { start: `${today.getFullYear()}-01-01`, end: `${today.getFullYear()}-12-31`, label: "Bu Yıl" };
  }
  if (periodKey === "last_year") {
    const first = new Date(today);
    first.setDate(first.getDate() - 365);
    return { start: toISO(first), end: toISO(today), label: "Son 1 Yıl" };
  }
  if (periodKey.startsWith("year_")) {
    const year = Number(periodKey.slice(5));
    return { start: `${year}-01-01`, end: `${year}-12-31`, label: `${year} Yılı` };
  }
  if (periodKey.startsWith("month_")) {
    const [y, m] = periodKey.slice(6).split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const last = lastDayOfMonth(y, m);
    return { start: toISO(first), end: toISO(last), label: `${TR_MONTHS_LONG[m - 1]} ${y}` };
  }
  if (periodKey.startsWith("range_")) {
    const [start, end] = periodKey.slice(6).split("_");
    const s = new Date(start);
    const e = new Date(end);
    const label =
      s.getFullYear() === e.getFullYear()
        ? `${s.getDate()} ${TR_MONTHS_LONG[s.getMonth()].slice(0, 3)} - ${e.getDate()} ${TR_MONTHS_LONG[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`
        : `${toISO(s)} - ${toISO(e)}`;
    return { start, end, label };
  }
  if (periodKey === "all") {
    return { start: null, end: null, label: "Tüm Zamanlar" };
  }
  return calculatePeriodRange("month");
}

export const QUICK_PERIOD_PRESETS: { key: string; label: string }[] = [
  { key: "week", label: "Bu Hafta" },
  { key: "month", label: "Bu Ay" },
  { key: "last_month", label: "Geçen Ay" },
  { key: "last3months", label: "Son 3 Ay" },
  { key: "last6months", label: "Son 6 Ay" },
  { key: "year", label: "Bu Yıl" },
  { key: "last_year", label: "Son 1 Yıl" },
  { key: "all", label: "Tüm Zamanlar" },
];

/** Most recent [count] calendar months, newest first, as selectable period keys. */
export function recentMonthOptions(count = 12): { key: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `month_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: `${TR_MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}` };
  });
}
