import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGroup, getGroupExpenses } from "@/lib/data/groups";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const group = await getGroup(supabase, id);
  if (!group) notFound();

  const expenses = await getGroupExpenses(supabase, id);
  const total = expenses.reduce((sum, e) => sum + Number(e.total), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">{group.name}</h1>
        <p className="text-sm text-text-secondary">
          Üye davetleri, grup sohbeti ve harcama paylaştırma yakında bu sayfaya geliyor.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ortak Harcamalar</CardTitle>
        </CardHeader>
        {expenses.length === 0 ? (
          <EmptyState icon={Receipt} title="Bu grupta henüz paylaşılan harcama yok" />
        ) : (
          <>
            <ul className="mb-3 divide-y divide-border">
              {expenses.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-text-primary">{e.store_name || "Harcama"}</p>
                    <p className="text-sm text-text-secondary">{e.date}</p>
                  </div>
                  <span className="font-medium text-text-primary">{formatCurrency(Number(e.total))}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border pt-3 text-right">
              <span className="text-sm text-text-secondary">Toplam: </span>
              <span className="font-semibold text-text-primary">{formatCurrency(total)}</span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
