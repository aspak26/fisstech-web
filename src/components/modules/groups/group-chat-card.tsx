"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useRealtimeRefresh } from "@/lib/utils/useRealtimeRefresh";
import { clearGroupChat, deleteMessage, sendMessage, type GroupMemberRow, type GroupMessageRow } from "@/lib/data/groups";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

/** Ported from mobile's group_chat_tab.dart — sender names are resolved
 * from the already-fetched member list (local _nameMap), not from the
 * realtime payload, matching mobile exactly (Realtime rows don't carry the
 * joined users() data). New messages arrive via useRealtimeRefresh, which
 * re-fetches this Server Component's messages prop. */
export function GroupChatCard({
  groupId,
  members,
  messages,
  currentUserId,
  isOwner,
}: {
  groupId: string;
  members: GroupMemberRow[];
  messages: GroupMessageRow[];
  currentUserId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useRealtimeRefresh([`group_messages`]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const nameMap = new Map(members.map((m) => [m.userId, m.name]));

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await sendMessage(createClient(), groupId, currentUserId, trimmed);
      setText("");
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteMessage(createClient(), id, currentUserId);
    router.refresh();
  }

  async function handleClear() {
    if (!window.confirm("Tüm sohbet geçmişi silinsin mi? Bu işlem geri alınamaz.")) return;
    await clearGroupChat(createClient(), groupId);
    router.refresh();
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-text-primary">Sohbet</h2>
        {isOwner && messages.length > 0 && (
          <button type="button" onClick={handleClear} className="text-xs font-medium text-danger hover:underline">
            Sohbeti Temizle
          </button>
        )}
      </div>

      <div ref={listRef} className="mb-3 max-h-72 space-y-2 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState icon={MessageCircle} title="Henüz mesaj yok" />
        ) : (
          messages.map((m) => {
            const mine = m.user_id === currentUserId;
            return (
              <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div className={`group max-w-[75%] rounded-card px-3 py-2 ${mine ? "bg-accent text-on-accent" : "bg-bg text-text-primary"}`}>
                  {!mine && <p className="mb-0.5 text-xs font-semibold opacity-70">{nameMap.get(m.user_id) ?? "Üye"}</p>}
                  <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
                  <div className="mt-0.5 flex items-center justify-end gap-1.5">
                    <span className="text-[10px] opacity-60">{formatTime(m.created_at)}</span>
                    {mine && (
                      <button
                        type="button"
                        aria-label="Mesajı sil"
                        onClick={() => handleDelete(m.id)}
                        className="opacity-0 group-hover:opacity-70 hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Mesaj yaz…"
          maxLength={2000}
          className="flex-1"
        />
        <button
          type="button"
          aria-label="Gönder"
          disabled={sending || !text.trim()}
          onClick={handleSend}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent text-on-accent disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
