import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCardById, getCardExpenses } from "@/lib/data/cards";
import { CardDetail } from "@/components/modules/cards/card-detail";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const card = await getCardById(supabase, id);
  if (!card || card.user_id !== user.id) notFound();

  const expenses = await getCardExpenses(supabase, id, "month");
  const monthlySpent = expenses.reduce((sum, e) => sum + Number(e.total), 0);

  return (
    <div className="mx-auto max-w-2xl">
      <CardDetail card={card} expenses={expenses} monthlySpent={monthlySpent} />
    </div>
  );
}
