import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroup, getGroupExpenses, getMembers, getMessages } from "@/lib/data/groups";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { MemberList } from "@/components/modules/groups/member-list";
import { GroupDangerZone } from "@/components/modules/groups/group-danger-zone";
import { GroupChatCard } from "@/components/modules/groups/group-chat-card";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [group, expenses, members, messages] = await Promise.all([
    getGroup(supabase, id),
    getGroupExpenses(supabase, id),
    getMembers(supabase, id, userId),
    getMessages(supabase, id),
  ]);
  if (!group) notFound();

  const total = expenses.reduce((sum, e) => sum + Number(e.total), 0);
  const isOwner = group.owner_id === userId;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">{group.name}</h1>
      </div>

      <MemberList groupId={id} members={members} currentUserId={userId} isOwner={isOwner} />

      <GroupChatCard groupId={id} members={members} messages={messages} currentUserId={userId} isOwner={isOwner} />

      <Card>
        <CardHeader>
          <CardTitle>Ortak Harcamalar</CardTitle>
        </CardHeader>
        {expenses.length === 0 ? (
          <EmptyState icon={Receipt} title="Bu grupta henüz paylaşılan harcama yok" />
        ) : (
          <>
            <ul className="mb-3 divide-y divide-border">
              {expenses.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/groups/${id}/expenses/${e.id}`}
                    className="flex items-center justify-between py-3 hover:text-accent"
                  >
                    <div>
                      <p className="font-medium text-text-primary">{e.store_name || "Harcama"}</p>
                      <p className="text-sm text-text-secondary">{e.date}</p>
                    </div>
                    <span className="font-medium text-text-primary">{formatCurrency(Number(e.total))}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-border pt-3 text-right">
              <span className="text-sm text-text-secondary">Toplam: </span>
              <span className="font-semibold text-text-primary">{formatCurrency(total)}</span>
            </div>
          </>
        )}
      </Card>

      <GroupDangerZone groupId={id} isOwner={isOwner} userId={userId} />
    </div>
  );
}
