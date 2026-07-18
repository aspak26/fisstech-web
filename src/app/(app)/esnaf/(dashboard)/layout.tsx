import { redirect } from "next/navigation";
import { getActiveBusiness, getUserBusinesses } from "@/lib/esnaf/active-business";
import { EsnafSubNav } from "@/components/modules/esnaf/esnaf-sub-nav";
import { BusinessSwitcher } from "@/components/modules/esnaf/business-switcher";

export default async function EsnafDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await getActiveBusiness();
  if (!business) {
    redirect("/esnaf");
  }
  const businesses = await getUserBusinesses();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4">
        <BusinessSwitcher businesses={businesses} activeId={business.id} />
      </div>
      <EsnafSubNav businessType={business.business_type} />
      {children}
    </div>
  );
}
