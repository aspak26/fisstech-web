import type { SupabaseClient } from "@supabase/supabase-js";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface AiChatResponse {
  reply?: string;
  error?: string;
}

/** 
 * Eskiden Supabase Edge Function ("fisle-ai-chat") kullanılıyordu ancak
 * o fonksiyon Gemini limitlerine/faturalandırma hatasına takıldığı için (429)
 * yeni yazdığımız Next.js Route Handler (/api/ai-chat) API'sine bağlandı.
 */
export async function invokeAiChat(
  supabase: SupabaseClient,
  message: string,
  history: ChatMessage[],
  periodLabel: string,
  startDate?: string,
  endDate?: string,
): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error("Oturum bulunamadı, lütfen tekrar giriş yapın.");
  }

  const response = await fetch("/api/ai-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      message,
      history,
      periodLabel,
      startDate,
      endDate,
    }),
  });

  if (!response.ok) {
    let errorMsg = `AI Sohbet hata döndürdü (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) errorMsg = body.error;
    } catch {
      // JSON ayrılamazsa standart hatada kal
    }
    throw new Error(errorMsg);
  }

  const data: AiChatResponse = await response.json();
  if (!data || data.error) {
    throw new Error(data?.error || "AI Sohbet şu anda yanıt veremiyor, lütfen tekrar deneyin.");
  }

  return data.reply ?? "";
}
