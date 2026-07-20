import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getB2bCustomers, getInventory } from "@/lib/data/toptan";
import { TopluSiparis } from "@/components/modules/esnaf/toplu-siparis";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default async function ToptanSiparisPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const [customers, inventory] = await Promise.all([
    getB2bCustomers(supabase, business.id),
    getInventory(supabase, business.id),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Toplu Sipariş</h1>
      {customers.length === 0 ? (
        <Card>
          <EmptyState icon={Building2} title="Önce bir bayi ekle" description="Sipariş oluşturmak için Bayiler sekmesinden bir bayi ekle." />
        </Card>
      ) : (
        <TopluSiparis businessId={business.id} customers={customers} inventory={inventory} />
      )}
    </div>
  );
}
