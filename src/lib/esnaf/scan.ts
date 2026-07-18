import type { SupabaseClient } from "@supabase/supabase-js";
import { fileToBase64, MAX_RECEIPT_BYTES } from "@/lib/scan/scanClient";
import { normalizeDate } from "@/lib/utils/date";

export { MAX_RECEIPT_BYTES };

export interface DocumentDraft {
  counterparty: string;
  date: string;
  amount: number;
}

interface ScanReceiptRaw {
  store_name?: string;
  date?: string;
  total?: number;
  error?: string;
}

/** Reuses the same `scan-receipt` Supabase Edge Function as Fiş Tara for
 * generic business-document OCR (invoices, receipts, contracts with a
 * total). The function isn't purpose-built for invoices, but Gemini's
 * extraction is general enough that store_name/date/total map reasonably
 * onto counterparty/invoice_date/amount — see PROGRESS.md for the tradeoff.
 * No client-side Gemini key involved (AGENTS.md rule 7). */
export async function scanBusinessDocument(
  supabase: SupabaseClient,
  file: File,
): Promise<DocumentDraft> {
  const base64 = await fileToBase64(file);
  const { data, error } = await supabase.functions.invoke<ScanReceiptRaw>("scan-receipt", {
    body: { image_base64: base64, categories: [] },
  });

  if (error || !data || data.error) {
    throw new Error("Belge okunamadı");
  }

  return {
    counterparty: data.store_name && data.store_name !== "Bilinmiyor" ? data.store_name : "",
    date: normalizeDate(data.date || ""),
    amount: data.total ?? 0,
  };
}
