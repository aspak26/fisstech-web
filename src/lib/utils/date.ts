const TR_MONTHS = [
  "OCAK",
  "ŞUBAT",
  "MART",
  "NİSAN",
  "MAYIS",
  "HAZİRAN",
  "TEMMUZ",
  "AĞUSTOS",
  "EYLÜL",
  "EKİM",
  "KASIM",
  "ARALIK",
];

/** 'YYYY-MM' for the current month. */
export function currentMonthString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Inclusive [start, end] date-string range (YYYY-MM-DD) for a 'YYYY-MM' month. */
export function getMonthRange(month: string): { start: string; end: string } {
  const [year, m] = month.split("-").map(Number);
  const start = `${year}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(year, m, 0).getDate();
  const end = `${year}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

/** 'TEMMUZ 2026' style label for the MonthSelector. */
export function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return `${TR_MONTHS[m - 1]} ${year}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isCurrentOrFutureMonth(month: string): boolean {
  return month >= currentMonthString();
}

const TR_WEEKDAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const TR_MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

/** "18 Tem 2026" style short date. */
export function formatShortDateTR(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return `${date.getDate()} ${TR_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** "Bugün" / "Dün" / weekday name (<7 days ago) / "18 Tem 2026" — ported from
 * mobile's FormatUtils.dateGroup, used to group list items by date. */
export function dateGroupLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  if (diffDays > 1 && diffDays < 7) return TR_WEEKDAYS[date.getDay()];
  return `${date.getDate()} ${TR_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** Normalizes a receipt date string to YYYY-MM-DD.
 * Ported from scan_service.dart's _normalizeDate — defensive fallback for
 * whatever the edge function/Gemini returns (should already be YYYY-MM-DD,
 * but DD/MM/YYYY or DD.MM.YYYY have shown up in practice). */
export function normalizeDate(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parts = trimmed.split(/[/.\-]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      // DD/MM/YYYY
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    if (parts[0].length === 4) {
      // YYYY/MM/DD
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }
  }
  return new Date().toISOString().slice(0, 10);
}
