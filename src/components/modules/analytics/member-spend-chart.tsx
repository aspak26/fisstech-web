import { formatCurrency } from "@/lib/utils/currency";
import type { MemberSpendPoint } from "@/lib/data/groups";

/** "ÜYE BAZLI HARCAMA" — progress bar per member, normalized to the
 * highest spender, mirrors mobile's `_GroupBarChart`. */
export function MemberSpendChart({ totals }: { totals: MemberSpendPoint[] }) {
  const max = totals[0]?.total ?? 1;

  return (
    <ul className="space-y-3">
      {totals.map((m) => (
        <li key={m.userId}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate text-text-primary">
              {m.name.length > 16 ? `${m.name.slice(0, 16)}…` : m.name}
            </span>
            <span className="font-medium text-text-primary">{formatCurrency(m.total)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${max > 0 ? (m.total / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
