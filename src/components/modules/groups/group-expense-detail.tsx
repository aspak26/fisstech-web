"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDateTR } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  addComment,
  createEqualSplit,
  deleteComment,
  markSplitPaid,
  toggleReaction,
  REACTION_TYPES,
  REACTION_EMOJI,
  type ExpenseCommentRow,
  type ExpenseReactionRow,
  type ExpenseSplitRow,
  type GroupExpenseRow,
  type GroupMemberRow,
  type ReactionType,
} from "@/lib/data/groups";

/** Ported from mobile's group_expense_detail_screen.dart — reactions,
 * equal-split creation + self-attested "Ödedim" marking, comments. */
export function GroupExpenseDetail({
  groupId,
  expense,
  members,
  splits,
  comments,
  reactions,
  currentUserId,
}: {
  groupId: string;
  expense: GroupExpenseRow;
  members: GroupMemberRow[];
  splits: ExpenseSplitRow[];
  comments: ExpenseCommentRow[];
  reactions: ExpenseReactionRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [creatingSplit, setCreatingSplit] = useState(false);

  const reactionCounts = REACTION_TYPES.map((type) => ({
    type,
    entries: reactions.filter((r) => r.reaction === type),
  }));
  const myReaction = reactions.find((r) => r.user_id === currentUserId)?.reaction ?? null;

  async function handleToggleReaction(reaction: ReactionType) {
    await toggleReaction(createClient(), expense.id, currentUserId, reaction);
    router.refresh();
  }

  async function handleCreateSplit() {
    setCreatingSplit(true);
    try {
      await createEqualSplit(
        createClient(),
        expense.id,
        groupId,
        members.map((m) => m.userId),
        Number(expense.total),
      );
      router.refresh();
    } finally {
      setCreatingSplit(false);
    }
  }

  async function handleMarkPaid(splitMemberId: string) {
    await markSplitPaid(createClient(), splitMemberId, currentUserId);
    router.refresh();
  }

  async function handleSendComment() {
    if (!commentText.trim()) return;
    setSending(true);
    try {
      await addComment(createClient(), expense.id, currentUserId, commentText);
      setCommentText("");
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteComment(id: string) {
    await deleteComment(createClient(), id, currentUserId);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Link href={`/groups/${groupId}`} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Gruba dön
      </Link>

      <Card>
        <p className="font-display text-xl font-semibold text-text-primary">{expense.store_name || "Harcama"}</p>
        <p className="text-sm text-text-secondary">{formatShortDateTR(expense.date)}</p>
        <p className="mt-2 font-display text-2xl font-bold text-accent">{formatCurrency(Number(expense.total))}</p>
      </Card>

      <Card>
        <div className="flex flex-wrap gap-2">
          {reactionCounts.map(({ type, entries }) => (
            <button
              key={type}
              type="button"
              onClick={() => handleToggleReaction(type)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
                myReaction === type ? "border-accent bg-accent/10" : "border-border hover:border-accent",
              )}
            >
              <span>{REACTION_EMOJI[type]}</span>
              {entries.length > 0 && <span className="font-medium text-text-secondary">{entries.length}</span>}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-base font-semibold text-text-primary">Paylaştırma</h2>
        {splits.length === 0 ? (
          <div className="text-center">
            <p className="mb-3 text-sm text-text-secondary">Bu harcama henüz üyeler arasında paylaştırılmadı.</p>
            <Button size="sm" disabled={creatingSplit || members.length === 0} onClick={handleCreateSplit}>
              {creatingSplit ? "Oluşturuluyor…" : "Eşit Böl"}
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {splits[0].members.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2.5">
                <span className="text-text-primary">{m.userName}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{formatCurrency(m.amount)}</span>
                  {m.is_paid ? (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">Ödendi</span>
                  ) : m.user_id === currentUserId ? (
                    <button
                      type="button"
                      onClick={() => handleMarkPaid(m.id)}
                      className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/20"
                    >
                      Ödedim
                    </button>
                  ) : (
                    <span className="rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-secondary">Bekliyor</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-base font-semibold text-text-primary">Yorumlar</h2>
        {comments.length === 0 ? (
          <p className="mb-3 text-sm text-text-secondary">Henüz yorum yok.</p>
        ) : (
          <ul className="mb-3 space-y-2">
            {comments.map((c) => (
              <li key={c.id} className="group flex items-start justify-between gap-2 rounded-control bg-bg p-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text-secondary">{c.userName}</p>
                  <p className="whitespace-pre-wrap break-words text-sm text-text-primary">{c.content}</p>
                </div>
                {c.user_id === currentUserId && (
                  <button
                    type="button"
                    aria-label="Yorumu sil"
                    onClick={() => handleDeleteComment(c.id)}
                    className="shrink-0 text-text-secondary opacity-0 group-hover:opacity-100 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
            placeholder="Yorum yaz…"
            maxLength={1000}
            className="flex-1"
          />
          <button
            type="button"
            aria-label="Gönder"
            disabled={sending || !commentText.trim()}
            onClick={handleSendComment}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent text-on-accent disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}
