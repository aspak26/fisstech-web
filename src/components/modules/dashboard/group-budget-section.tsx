import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export function GroupBudgetSection({ membershipCount }: { membershipCount: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grup Bütçesi</CardTitle>
      </CardHeader>
      {membershipCount === 0 ? (
        <EmptyState
          icon={Users}
          title="Henüz bir gruba üye değilsiniz"
          description="Aile veya arkadaşlarınızla ortak bütçe takibi için Gruplarım'dan bir grup oluşturun veya bir davete katılın."
        />
      ) : (
        <Link
          href="/groups"
          className="flex items-center justify-between text-sm text-text-secondary hover:text-accent"
        >
          <span>{membershipCount} grup üyeliğiniz var</span>
          <span className="flex items-center gap-1 font-medium text-accent">
            Gruplarım&apos;a git <ChevronRight className="h-4 w-4" />
          </span>
        </Link>
      )}
    </Card>
  );
}
