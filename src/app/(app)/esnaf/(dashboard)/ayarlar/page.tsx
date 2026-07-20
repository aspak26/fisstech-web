import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { BusinessLogoForm } from "@/components/modules/esnaf/business-logo-form";

export default async function EsnafAyarlarPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 font-display text-xl font-semibold text-text-primary">İşletme Ayarları</h1>
      <BusinessLogoForm business={business} />
    </div>
  );
}
