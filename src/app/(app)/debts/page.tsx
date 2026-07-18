import { createClient } from "@/lib/supabase/server";
import { getDebts } from "@/lib/data/debts";
import { DebtsList } from "@/components/modules/debts/debts-list";

export default async function DebtsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const debts = await getDebts(supabase, user!.id);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text-primary">Borçlarım</h1>
      <DebtsList debts={debts} />
    </div>
  );
}
