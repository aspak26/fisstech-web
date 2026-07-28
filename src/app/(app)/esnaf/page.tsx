import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/utils/admin";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { EsnafEntryTabs } from "@/components/modules/esnaf/esnaf-entry-tabs";
import { EsnafLockedPage } from "@/components/ui/esnaf-locked-page";

export default async function EsnafEntryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!(await isAdminUser(supabase, user!.id))) {
    return <EsnafLockedPage />;
  }

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
