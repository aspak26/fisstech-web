import { createClient } from "@/lib/supabase/server";
import { getSubscriptions } from "@/lib/data/subscriptions";
import { getCards } from "@/lib/data/cards";
import { SubscriptionsList } from "@/components/modules/subscriptions/subscriptions-list";

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [subscriptions, cards] = await Promise.all([
    getSubscriptions(supabase, user!.id),
    getCards(supabase, user!.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text-primary">Abonelikler</h1>
      <SubscriptionsList subscriptions={subscriptions} cards={cards} />
    </div>
  );
}
