"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, CheckCheck, MessageCircle, Pencil, Send, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useRealtimeRefresh } from "@/lib/utils/useRealtimeRefresh";
import {
  clearGroupChat,
  deleteMessage,
  editMessage,
  markGroupAsRead,
  sendMessage,
  type GroupMemberRow,
  type GroupMessageRow,
} from "@/lib/data/groups";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

/** Ported from mobile's group_chat_tab.dart — sender names are resolved
 * from the already-fetched member list (local _nameMap), not from the
 * realtime payload, matching mobile exactly (Realtime rows don't carry the
 * joined users() data). New messages/read-receipts arrive via
 * useRealtimeRefresh, which re-fetches this Server Component's props. */
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useRealtimeRefresh(["group_messages", "group_members"]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    markGroupAsRead(createClient(), groupId, currentUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const nameMap = new Map(members.map((m) => [m.userId, m.name]));

  // Mobile'daki _isReadByAll ile aynı mantık: kendi mesajım, gönderen hariç
  // gruptaki TÜM aktif üyeler tarafından okunduysa (last_read_at mesajın
  // created_at'inden sonraysa) çift mavi tik gösterilir.
  const otherMembers = useMemo(() => members.filter((m) => m.userId !== currentUserId), [members, currentUserId]);

  function isReadByAll(messageCreatedAt: string): boolean {
    if (otherMembers.length === 0) return false;
    const createdAt = new Date(messageCreatedAt).getTime();
    return otherMembers.every((m) => m.lastReadAt !== null && new Date(m.lastReadAt).getTime() >= createdAt);
  }

  function readers(messageCreatedAt: string): GroupMemberRow[] {
    const createdAt = new Date(messageCreatedAt).getTime();
    return otherMembers.filter((m) => m.lastReadAt !== null && new Date(m.lastReadAt).getTime() >= createdAt);
  }

  function startEdit(m: GroupMessageRow) {
    setEditingId(m.id);
    setText(m.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setText("");
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      if (editingId) {
        await editMessage(createClient(), editingId, currentUserId, trimmed);
        setEditingId(null);
      } else {
        await sendMessage(createClient(), groupId, currentUserId, trimmed);
      }
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
            const read = mine && !m.is_deleted ? isReadByAll(m.created_at) : false;
            const readerNames = mine && !m.is_deleted ? readers(m.created_at).map((r) => r.name) : [];
            return (
              <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div className={`group max-w-[75%] rounded-card px-3 py-2 ${mine ? "bg-accent text-on-accent" : "bg-bg text-text-primary"}`}>
                  {!mine && <p className="mb-0.5 text-xs font-semibold opacity-70">{nameMap.get(m.user_id) ?? "Üye"}</p>}
                  {m.is_deleted ? (
                    <p className="flex items-center gap-1.5 text-sm italic opacity-70">
                      <Ban className="h-3.5 w-3.5" />
                      {mine ? "Bu mesajı sildiniz" : "Bu mesaj silindi"}
                    </p>
                  ) : (
                    <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
                  )}
                  <div className="mt-0.5 flex items-center justify-end gap-1.5">
                    {m.is_edited && !m.is_deleted && <span className="text-[10px] italic opacity-60">düzenlendi</span>}
                    <span className="text-[10px] opacity-60">{formatTime(m.created_at)}</span>
                    {mine && !m.is_deleted && (
                      <span title={read ? `Görüntüledi: ${readerNames.join(", ")}` : "Henüz görülmedi"}>
                        {read ? <CheckCheck className="h-3.5 w-3.5 opacity-90" /> : <Check className="h-3.5 w-3.5 opacity-60" />}
                      </span>
                    )}
                    {mine && !m.is_deleted && (
                      <button
                        type="button"
                        aria-label="Mesajı düzenle"
                        onClick={() => startEdit(m)}
                        className="opacity-0 group-hover:opacity-70 hover:opacity-100"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                    {mine && !m.is_deleted && (
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

      {editingId && (
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-accent">
          <Pencil className="h-3.5 w-3.5" />
          Mesajı Düzenle
          <button type="button" onClick={cancelEdit} className="ml-auto opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
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
          {editingId ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </Card>
  );
}
