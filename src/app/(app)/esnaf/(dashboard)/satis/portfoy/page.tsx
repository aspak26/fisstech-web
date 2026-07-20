import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getSalePortfolios } from "@/lib/data/satis";
import { PortfolioList } from "@/components/modules/esnaf/portfolio-list";

export default async function SatisPortfoyPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const items = await getSalePortfolios(supabase, business.id);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Portföy</h1>
      <PortfolioList businessId={business.id} items={items} />
    </div>
  );
}
