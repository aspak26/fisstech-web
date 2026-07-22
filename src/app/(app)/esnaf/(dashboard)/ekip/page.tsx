import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getActiveStaff, getPendingInvites, getActiveStaffCount } from "@/lib/data/esnaf-team";
import { TeamRoster } from "@/components/modules/esnaf/team-roster";
import { Card } from "@/components/ui/card";

export default async function EsnafEkipPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const isOwner = business.user_id === user.id;

  if (!isOwner) {
    return (
      <div>
        <h1 className="mb-4 font-display text-xl font-semibold text-text-primary">Ekip</h1>
        <Card>
          <p className="text-sm text-text-secondary">
            Bu işletmenin ekip yönetimi sadece işletme sahibine açıktır. Siz bu işletmeye personel olarak
            bağlısınız.
          </p>
        </Card>
      </div>
    );
  }

  const [staff, invites, staffCount, profile] = await Promise.all([
    getActiveStaff(supabase, business.id),
    getPendingInvites(supabase, business.id),
    getActiveStaffCount(supabase, business.id),
    supabase.from("users").select("esnaf_staff_limit").eq("id", user.id).single(),
  ]);
  const staffLimit = (profile.data?.esnaf_staff_limit as number | null) ?? 0;

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold text-text-primary">Ekip</h1>
      <TeamRoster
        businessId={business.id}
        staff={staff}
        pendingInvites={invites}
        staffCount={staffCount}
        staffLimit={staffLimit}
      />
    </div>
  );
}
