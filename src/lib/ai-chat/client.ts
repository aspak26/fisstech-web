import type { SupabaseClient } from "@supabase/supabase-js";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface AiChatQuota {
  limit: number;
  used: number;
  remaining: number;
}

/** /api/ai-chat 402 (kota doldu) veya diğer hatalarda fırlatılır — `quota`
 * doluysa (limit >= 0) sohbet ekranındaki sayaç, hata mesajıyla birlikte
 * güncel kalan hakkı da göstermeye devam edebilsin diye taşınır. */
export class AiChatQuotaError extends Error {
  quota?: AiChatQuota;
  constructor(message: string, quota?: AiChatQuota) {
    super(message);
    this.name = "AiChatQuotaError";
    this.quota = quota;
  }
}

interface AiChatResponse {
  reply?: string;
  error?: string;
  quota?: AiChatQuota;
}

export interface AiChatResult {
  reply: string;
  quota?: AiChatQuota;
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
): Promise<AiChatResult> {
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
    let quota: AiChatQuota | undefined;
    try {
      const body = await response.json();
      if (body?.error) errorMsg = body.error;
      if (body?.quota) quota = body.quota;
    } catch {
      // JSON ayrılamazsa standart hatada kal
    }
    throw new AiChatQuotaError(errorMsg, quota);
  }

  const data: AiChatResponse = await response.json();
  if (!data || data.error) {
    throw new AiChatQuotaError(
      data?.error || "AI Sohbet şu anda yanıt veremiyor, lütfen tekrar deneyin.",
      data?.quota,
    );
  }

  return { reply: data.reply ?? "", quota: data.quota };
}
