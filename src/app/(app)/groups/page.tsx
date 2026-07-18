import { createClient } from "@/lib/supabase/server";
import { getGroups } from "@/lib/data/groups";
import { GroupsList } from "@/components/modules/groups/groups-list";

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const groups = await getGroups(supabase);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text-primary">Gruplarım</h1>
      <GroupsList groups={groups} userId={user!.id} />
    </div>
  );
}
