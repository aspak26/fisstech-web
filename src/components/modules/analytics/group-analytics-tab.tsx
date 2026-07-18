import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { GroupSelector } from "./group-selector";
import { MemberSpendChart } from "./member-spend-chart";
import type { GroupRow, MemberSpendPoint } from "@/lib/data/groups";

export function GroupAnalyticsTab({
  groups,
  groupId,
  totals,
}: {
  groups: GroupRow[];
  groupId: string;
  totals: MemberSpendPoint[];
}) {
  if (groups.length === 0) {
    return (
      <Card>
        <EmptyState icon={Users} title="Henüz bir grubun yok" description="Gruplarım'dan bir grup oluştur." />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <GroupSelector groups={groups} groupId={groupId} />
      <Card>
        {totals.length === 0 ? (
          <EmptyState icon={Users} title="Bu dönemde grup harcaması yok" />
        ) : (
          <>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Üye Bazlı Harcama
            </p>
            <MemberSpendChart totals={totals} />
          </>
        )}
      </Card>
    </div>
  );
}
