import { Users } from "lucide-react";
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
          title="Henüz bir gruba katılmadınız"
          description="Aile veya arkadaşlarınızla ortak bütçe takibi Gruplarım modülünde geliyor."
        />
      ) : (
        <p className="text-sm text-text-secondary">
          {membershipCount} grup üyeliğiniz var — detaylı görünüm Gruplarım modülünde geliyor.
        </p>
      )}
    </Card>
  );
}
