import { createClient } from "@/lib/supabase/server";
import { getFamilyInvitePreview } from "@/lib/data/family";
import { JoinFamilyCard } from "@/components/modules/settings/join-family-card";

export default async function JoinFamilyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const preview = await getFamilyInvitePreview(supabase, token);
  const isActive = !!preview && preview.status === "pending" && new Date(preview.expiresAt) > new Date();

  return (
    <div className="mx-auto flex max-w-md items-center justify-center py-16">
      <JoinFamilyCard token={token} preview={isActive ? preview : null} />
    </div>
  );
}
