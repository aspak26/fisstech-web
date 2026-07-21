import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getRecentTransactions } from "@/lib/data/perakende";
import { PerakendeSatisGecmisi } from "@/components/modules/esnaf/perakende-satis-gecmisi";

const FILTER_DAYS: Record<string, number> = { Bugün: 0, "Bu Hafta": 7, "Bu Ay": 30 };

export default async function PerakendeGecmisPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const business = await getActiveBusiness();
  if (!business) return null;

  const { filter } = await searchParams;
  let startDate: string | undefined;
  if (filter && filter in FILTER_DAYS) {
    const days = FILTER_DAYS[filter];
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    startDate = d.toISOString();
  }

  const supabase = await createClient();
  const transactions = await getRecentTransactions(supabase, business.id, { startDate });

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold text-text-primary">Satış Geçmişi</h1>
      <PerakendeSatisGecmisi transactions={transactions} />
    </div>
  );
}
