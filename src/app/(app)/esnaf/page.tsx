import { redirect } from "next/navigation";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { BusinessSetupForm } from "@/components/modules/esnaf/business-setup-form";

export default async function EsnafEntryPage() {
  const business = await getActiveBusiness();
  if (business) {
    redirect("/esnaf/pano");
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <BusinessSetupForm />
    </div>
  );
}
