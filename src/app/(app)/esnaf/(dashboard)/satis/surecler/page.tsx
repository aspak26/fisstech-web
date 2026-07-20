import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getSaleCustomers, getSaleInstallments, getSalePortfolios, getSaleTransactions } from "@/lib/data/satis";
import { getEmployees } from "@/lib/data/esnaf";
import { SatisSurecler } from "@/components/modules/esnaf/satis-surecler";

export default async function SatisSureclerPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const [transactions, installments, portfolios, customers, employees] = await Promise.all([
    getSaleTransactions(supabase, business.id),
    getSaleInstallments(supabase, business.id),
    getSalePortfolios(supabase, business.id),
    getSaleCustomers(supabase, business.id),
    getEmployees(supabase, business.id),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Süreçler</h1>
      <SatisSurecler
        businessId={business.id}
        businessName={business.name}
        transactions={transactions}
        installments={installments}
        portfolios={portfolios}
        customers={customers}
        employees={employees}
      />
    </div>
  );
}
