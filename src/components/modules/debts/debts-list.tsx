"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, HandCoins, ArrowUp, ArrowDown, History, Bell, Calendar, CheckCircle2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDateTR } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { deleteDebt, toggleDebtPaid, type UserDebtRow } from "@/lib/data/debts";
import { DebtFormDialog } from "./debt-form-dialog";

type FilterTab = "all" | "borrowed" | "lent" | "unpaid";
type ArchivePeriodKey = "all" | "week" | "month" | "month3" | "month6" | "year" | "prevYear";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "borrowed", label: "Alınan" },
  { key: "lent", label: "Verilen" },
  { key: "unpaid", label: "Ödenmedi" },
];

const ARCHIVE_PERIODS: { key: ArchivePeriodKey; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "week", label: "Bu Hafta" },
  { key: "month", label: "Bu Ay" },
  { key: "month3", label: "Son 3 Ay" },
  { key: "month6", label: "Son 6 Ay" },
  { key: "year", label: "Bu Yıl" },
  { key: "prevYear", label: "Geçen Yıl" },
];

function matchesArchivePeriod(dateStr: string, key: ArchivePeriodKey): boolean {
  if (key === "all") return true;
  const date = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  if (key === "week") {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
    return date >= cutoff;
  }
  if (key === "month") return date >= new Date(now.getFullYear(), now.getMonth(), 1);
  if (key === "month3") return date >= new Date(now.getFullYear(), now.getMonth() - 2, 1);
  if (key === "month6") return date >= new Date(now.getFullYear(), now.getMonth() - 5, 1);
  if (key === "year") return date >= new Date(now.getFullYear(), 0, 1);
  return date.getFullYear() === now.getFullYear() - 1; // prevYear
}

function formatDueDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Yarın";
  if (diffDays === -1) return "Dün";
  return formatShortDateTR(dateStr);
}

export function DebtsList({ debts }: { debts: UserDebtRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserDebtRow | undefined>(undefined);
  const [filter, setFilter] = useState<FilterTab>("unpaid");
  const [showArchive, setShowArchive] = useState(false);
  const [archivePeriod, setArchivePeriod] = useState<ArchivePeriodKey>("all");

  const unpaid = useMemo(() => debts.filter((d) => !d.is_paid), [debts]);
  const paid = useMemo(
    () => debts.filter((d) => d.is_paid).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [debts],
  );

  const totalBorrowed = unpaid.filter((d) => d.type === "borrowed").reduce((s, d) => s + Number(d.amount), 0);
  const totalLent = unpaid.filter((d) => d.type === "lent").reduce((s, d) => s + Number(d.amount), 0);

  const visibleMain = useMemo(() => {
    if (filter === "borrowed") return unpaid.filter((d) => d.type === "borrowed");
    if (filter === "lent") return unpaid.filter((d) => d.type === "lent");
    return unpaid; // "all" and "unpaid" both show every open record
  }, [filter, unpaid]);

  const visibleArchive = useMemo(
    () => paid.filter((d) => matchesArchivePeriod(d.date, archivePeriod)),
    [paid, archivePeriod],
  );

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(debt: UserDebtRow) {
    setEditing(debt);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-success/30 bg-success/5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/15">
              <ArrowUp className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Alacaklarım</p>
              <p className="text-xs text-text-secondary">(Borç verdim)</p>
            </div>
          </div>
          <p className="mt-2 font-display text-xl font-semibold text-success">{formatCurrency(totalLent)}</p>
        </Card>
        <Card className="border-danger/30 bg-danger/5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-danger/15">
              <ArrowDown className="h-4 w-4 text-danger" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Borçlarım</p>
              <p className="text-xs text-text-secondary">(Borç aldım)</p>
            </div>
          </div>
          <p className="mt-2 font-display text-xl font-semibold text-danger">{formatCurrency(totalBorrowed)}</p>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Borç/Alacak Ekle
        </Button>
      </div>

      {!showArchive ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {FILTER_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilter(t.key)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    filter === t.key
                      ? "border-accent bg-accent text-on-accent"
                      : "border-border bg-surface text-text-secondary hover:border-accent",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              title="Borç Geçmişi"
              onClick={() => setShowArchive(true)}
              className="flex h-9 w-9 items-center justify-center rounded-control border border-border text-text-secondary hover:border-accent hover:text-accent"
            >
              <History className="h-4 w-4" />
            </button>
          </div>

          <Card>
            {visibleMain.length === 0 ? (
              <EmptyState icon={HandCoins} title="Açık borç/alacak kaydı yok" />
            ) : (
              <ul className="divide-y divide-border">
                {visibleMain.map((debt) => (
                  <DebtCard key={debt.id} debt={debt} onEdit={() => openEdit(debt)} />
                ))}
              </ul>
            )}
          </Card>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowArchive(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Geri
            </button>
            <h2 className="font-display text-base font-semibold text-text-primary">Borç Geçmişi</h2>
            <History className="h-4 w-4 text-text-secondary" />
          </div>

          <div className="flex flex-wrap gap-2">
            {ARCHIVE_PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setArchivePeriod(p.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  archivePeriod === p.key
                    ? "border-accent bg-accent text-on-accent"
                    : "border-border bg-surface text-text-secondary hover:border-accent",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Card>
            {visibleArchive.length === 0 ? (
              <EmptyState icon={HandCoins} title="Bu dönemde kapanmış kayıt yok" />
            ) : (
              <ul className="divide-y divide-border">
                {visibleArchive.map((debt) => (
                  <DebtCard key={debt.id} debt={debt} onEdit={() => openEdit(debt)} />
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      <DebtFormDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(undefined);
        }}
        debt={editing}
      />
    </div>
  );
}

function DebtCard({ debt, onEdit }: { debt: UserDebtRow; onEdit: () => void }) {
  const router = useRouter();
  const isLent = debt.type === "lent";
  const showReminder = debt.is_reminder_active && debt.due_date && !debt.is_paid;

  return (
    <li
      className={cn(
        "flex items-stretch gap-3 py-3 pl-3 border-l-4",
        isLent ? "border-success" : "border-danger",
      )}
    >
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              isLent ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
            )}
          >
            {isLent ? "Borç Verdim" : "Borç Aldım"}
          </span>
          <p
            className={cn(
              "truncate font-medium",
              debt.is_paid ? "text-text-secondary line-through" : "text-text-primary",
            )}
          >
            {debt.person_name}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span
            className={cn(
              "font-semibold",
              debt.is_paid ? "text-text-secondary line-through" : isLent ? "text-success" : "text-danger",
            )}
          >
            {formatCurrency(Number(debt.amount))}
          </span>
          <span className="flex items-center gap-1 text-text-secondary">
            <Calendar className="h-3.5 w-3.5" /> {formatShortDateTR(debt.date)}
          </span>
        </div>
        {debt.note && <p className="mt-1 line-clamp-2 text-sm italic text-text-secondary">{debt.note}</p>}
        {showReminder && (
          <p className="mt-1 flex items-center gap-1 text-xs text-accent">
            <Bell className="h-3.5 w-3.5" /> {formatDueDate(debt.due_date!)}
          </p>
        )}
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={debt.is_paid ? "Ödenmedi olarak işaretle" : "Ödendi olarak işaretle"}
          onClick={async () => {
            await toggleDebtPaid(createClient(), debt.id, !debt.is_paid);
            router.refresh();
          }}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-control",
            debt.is_paid ? "text-success" : "text-text-secondary hover:text-success",
          )}
        >
          <CheckCircle2 className={cn("h-4.5 w-4.5", debt.is_paid && "fill-success/20")} />
        </button>
        <DeleteButton
          confirmMessage={`"${debt.person_name}" kaydı silinsin mi?`}
          onDelete={() => deleteDebt(createClient(), debt.id)}
        />
      </div>
    </li>
  );
}
