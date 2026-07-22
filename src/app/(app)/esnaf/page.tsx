import { redirect } from "next/navigation";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { EsnafEntryTabs } from "@/components/modules/esnaf/esnaf-entry-tabs";

export default async function EsnafEntryPage() {
  const business = await getActiveBusiness();
  if (business) {
    redirect("/esnaf/pano");
  }

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center px-4">
      <div className="w-full">
        <EsnafEntryTabs />
      </div>
    </div>
  );
}
