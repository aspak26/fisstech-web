"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { MessageCircle, Send, X, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const GREETING: ChatMessage = {
  role: "assistant",
  content: "Merhaba! Ben Fişştech asistanıyım. Fiş tarama, Esnaf Modu veya fiyatlandırma hakkında merak ettiğin bir şey var mı?",
};

export function AiWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/landing-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: nextMessages.slice(0, -1) }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.ok ? data.reply : (data.error ?? "Şu anda yanıt veremiyorum.") },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Bağlantı hatası, lütfen tekrar dene." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-accent to-accent-hover px-4 py-3 text-on-accent">
            <span className="flex items-center gap-2 font-display font-semibold">
              <Sparkles className="h-4 w-4" />
              Fişştech Asistanı
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Sohbeti kapat" className="rounded-control p-1 hover:bg-white/15">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-control px-3.5 py-2 text-sm",
                  m.role === "user" ? "ml-auto bg-accent text-on-accent" : "bg-bg text-text-primary",
                )}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 rounded-control bg-bg px-3.5 py-2 text-sm text-text-secondary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Yazıyor…
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Bir soru sor…"
              maxLength={500}
              disabled={loading}
              className="h-10 flex-1 rounded-control border border-border bg-bg px-3 text-sm text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Gönder"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent text-on-accent disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Sohbeti kapat" : "Fişştech asistanıyla sohbet et"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-xl shadow-accent/30 transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
