import { createClient } from "@/lib/supabase/server";
import { getInvitePreview } from "@/lib/data/groups";
import { JoinGroupCard } from "@/components/modules/groups/join-group-card";

export default async function JoinGroupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const preview = await getInvitePreview(supabase, token);
  const isActive = !!preview && preview.status === "pending" && new Date(preview.expiresAt) > new Date();

  return (
    <div className="mx-auto flex max-w-md items-center justify-center py-16">
      <JoinGroupCard token={token} preview={isActive ? preview : null} />
    </div>
  );
}
