import { createClient } from "@/lib/supabase/server";
import { getCards, getCardMonthlySpent } from "@/lib/data/cards";
import { CardsList } from "@/components/modules/cards/cards-list";

export default async function CardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const cards = await getCards(supabase, userId);
  const spentEntries = await Promise.all(cards.map(async (c) => [c.id, await getCardMonthlySpent(supabase, c.id)] as const));
  const monthlySpentByCard = new Map(spentEntries);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text-primary">Kartlarım</h1>
      <CardsList cards={cards} monthlySpentByCard={monthlySpentByCard} />
    </div>
  );
}
