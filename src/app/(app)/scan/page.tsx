import { createClient } from "@/lib/supabase/server";
import { getCategoriesForScan } from "@/lib/data/categories";
import { getRemainingScanCredits } from "@/lib/scan/credits";
import { getUserPlanInfo, isPersonalPremiumOrTrial } from "@/lib/utils/entitlements";
import { ScanWorkspace } from "@/components/modules/scan/scan-workspace";

export default async function ScanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [categories, remainingCredits, planInfo] = await Promise.all([
    getCategoriesForScan(supabase),
    getRemainingScanCredits(supabase, userId),
    getUserPlanInfo(supabase, userId),
  ]);

  const isPremium = isPersonalPremiumOrTrial(planInfo);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-text-primary">Fiş Tara</h1>
      <ScanWorkspace
        userId={userId}
        categories={categories}
        initialRemainingCredits={remainingCredits}
        isPremium={isPremium}
      />
    </div>
  );
}
