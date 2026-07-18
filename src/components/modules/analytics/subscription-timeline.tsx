import type { SubscriptionsRow } from "@/lib/types/database";

const STATUS_COLOR: Record<string, string> = {
  active: "#2E7D32",
  paused: "#F9A825",
  cancelled: "#C62828",
};

const MONTH_ABBR_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

/** "Zaman Çizelgesi" — a horizontal Gantt-style bar per subscription
 * spanning its active window, clamped to at most the last 12 months.
 * Ported from mobile's `_SubTimeline`. */
export function SubscriptionTimeline({ subscriptions }: { subscriptions: SubscriptionsRow[] }) {
  if (subscriptions.length === 0) return null;
  const now = new Date();

  const earliest = subscriptions.reduce<Date>((min, s) => {
    const d = new Date(s.start_date ?? s.created_at);
    return d < min ? d : min;
  }, new Date(subscriptions[0].start_date ?? subscriptions[0].created_at));

  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const clampedStart = earliest < oneYearAgo ? oneYearAgo : earliest;
  const rangeDays = Math.max(1, (now.getTime() - clampedStart.getTime()) / 86400000);

  return (
    <div>
      <div className="mb-2 flex justify-between text-xs text-text-secondary">
        <span>{MONTH_ABBR_TR[clampedStart.getMonth()]}</span>
        <span>{MONTH_ABBR_TR[now.getMonth()]}</span>
      </div>
      <ul className="space-y-3">
        {subscriptions.map((s) => {
          const rawStart = new Date(s.start_date ?? s.created_at);
          const rawEnd = s.end_date ? new Date(s.end_date) : now;
          const start = rawStart < clampedStart ? clampedStart : rawStart;
          const end = rawEnd > now ? now : rawEnd;
          const leftFrac = clamp((start.getTime() - clampedStart.getTime()) / (rangeDays * 86400000), 0, 1);
          const endFrac = clamp((end.getTime() - clampedStart.getTime()) / (rangeDays * 86400000), 0, 1);
          const barFrac = clamp(endFrac - leftFrac, 0.02, 1);
          const durationMonths = Math.round((end.getTime() - start.getTime()) / 86400000 / 30);
          const color = STATUS_COLOR[s.status] ?? STATUS_COLOR.active;

          return (
            <li key={s.id}>
              <p className="mb-1 truncate text-sm text-text-primary">{s.name}</p>
              <div className="relative h-6 w-full rounded-full bg-bg">
                <div
                  className="absolute top-0 flex h-6 items-center justify-center rounded-full text-[10px] font-medium text-white"
                  style={{
                    left: `${leftFrac * 100}%`,
                    width: `${barFrac * 100}%`,
                    minWidth: 6,
                    backgroundColor: `${color}BF`,
                  }}
                >
                  {barFrac > 0.12 && `${durationMonths} ay`}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-secondary">
        <LegendDot color={STATUS_COLOR.active} label="Aktif" />
        <LegendDot color={STATUS_COLOR.paused} label="Duraklatıldı" />
        <LegendDot color={STATUS_COLOR.cancelled} label="İptal" />
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
