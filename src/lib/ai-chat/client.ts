import { FunctionsHttpError } from "@supabase/functions-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface AiChatResponse {
  reply?: string;
  error?: string;
}

/** Calls the existing, already-deployed `fisle-ai-chat` Supabase Edge Function —
 * server-side Gemini call, JWT-authenticated, no client-exposed API key.
 * See AGENTS.md rule 7: AI features must never hold the Gemini key client-side. */
export async function invokeAiChat(
  supabase: SupabaseClient,
  message: string,
  history: ChatMessage[],
  periodLabel: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke<AiChatResponse>("fisle-ai-chat", {
    body: {
      message,
      history: history.map((m) => ({ role: m.role, content: m.content })),
      period_label: periodLabel,
    },
  });

  if (error) {
    // FunctionsHttpError.context is the raw Response — read it for the real
    // jsonError({error: "..."}) body the edge function sent, instead of
    // supabase-js's generic "non-2xx status code" message.
    if (error instanceof FunctionsHttpError) {
      let message = `AI Sohbet hata döndürdü (${error.context.status})`;
      try {
        const body = await error.context.json();
        if (body?.error) message = body.error;
      } catch {
        // no JSON body — keep the fallback status message
      }
      throw new Error(message);
    }
    throw new Error("AI Sohbet'e ulaşılamadı, bağlantınızı kontrol edin.");
  }

  if (!data || data.error) {
    throw new Error(data?.error || "AI Sohbet şu anda yanıt veremiyor, lütfen tekrar deneyin.");
  }
  return data.reply ?? "";
}
