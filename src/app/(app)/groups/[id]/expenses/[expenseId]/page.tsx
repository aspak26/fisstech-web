import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGroupExpenseById, getMembers, getSplitsForExpense, getComments, getReactions } from "@/lib/data/groups";
import { GroupExpenseDetail } from "@/components/modules/groups/group-expense-detail";

export default async function GroupExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string; expenseId: string }>;
}) {
  const { id, expenseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [expense, members, splits, comments, reactions] = await Promise.all([
    getGroupExpenseById(supabase, expenseId),
    getMembers(supabase, id, userId),
    getSplitsForExpense(supabase, expenseId),
    getComments(supabase, expenseId),
    getReactions(supabase, expenseId),
  ]);
  if (!expense) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <GroupExpenseDetail
        groupId={id}
        expense={expense}
        members={members}
        splits={splits}
        comments={comments}
        reactions={reactions}
        currentUserId={userId}
      />
    </div>
  );
}
