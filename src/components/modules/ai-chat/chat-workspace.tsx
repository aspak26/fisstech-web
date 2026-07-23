"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { invokeAiChat, type ChatMessage } from "@/lib/ai-chat/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const SUGGESTIONS = [
  "Bu ay en çok nereye harcadım?",
  "Bütçemi nasıl iyileştirebilirim?",
  "Geçen aya göre harcamalarım nasıl değişti?",
];

export function ChatWorkspace({ periodLabel, startDate, endDate }: { periodLabel: string, startDate: string | null, endDate: string | null }) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const reply = await invokeAiChat(supabase, text, messages, periodLabel, startDate ?? undefined, endDate ?? undefined);
      setMessages([...nextMessages, { role: "model", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
              <Sparkles className="h-7 w-7 text-accent" />
            </div>
            <p className="text-text-secondary">
              {periodLabel} dönemindeki verilerine göre sorularını yanıtlayabilirim.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-text-primary hover:border-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-card px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-accent text-on-accent"
                  : "border border-border bg-surface text-text-primary",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-card border border-border bg-surface px-4 py-2.5 text-sm text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" /> Düşünüyor…
            </div>
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border pt-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Bir soru sor…"
          className="h-11 flex-1 rounded-control border border-border bg-surface px-3.5 text-base text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <Button type="submit" disabled={loading || !input.trim()} className="gap-1.5">
          <Send className="h-4 w-4" /> Gönder
        </Button>
      </form>
    </div>
  );
}
