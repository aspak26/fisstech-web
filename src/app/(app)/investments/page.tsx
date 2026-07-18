import { createClient } from "@/lib/supabase/server";
import { getInvestments } from "@/lib/data/investments";
import { InvestmentsList } from "@/components/modules/investments/investments-list";

export default async function InvestmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const investments = await getInvestments(supabase, user!.id);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text-primary">Yatırımlarım</h1>
      <InvestmentsList investments={investments} />
    </div>
  );
}
