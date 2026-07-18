import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getInvoices } from "@/lib/data/esnaf";
import { InvoicesList } from "@/components/modules/esnaf/invoices-list";

export default async function EsnafFaturalarPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const invoices = await getInvoices(supabase, business.id);

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold text-text-primary">Faturalar</h1>
      <InvoicesList business={business} invoices={invoices} />
    </div>
  );
}
