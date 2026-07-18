import type { SupabaseClient } from "@supabase/supabase-js";
import { scanResultFromResponse, type CategoryOption, type ScanReceiptResponse, type ScanResult } from "./types";

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

export class ScanUnreadableError extends Error {
  constructor() {
    super("receipt_unreadable");
  }
}

/** Strips the `data:image/...;base64,` prefix FileReader adds. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function invokeScanReceipt(
  supabase: SupabaseClient,
  imageBase64: string,
  categories: CategoryOption[],
): Promise<ScanResult> {
  const { data, error } = await supabase.functions.invoke<ScanReceiptResponse>(
    "scan-receipt",
    { body: { image_base64: imageBase64, categories } },
  );

  if (error) {
    throw new Error("Fiş taranırken bir hata oluştu");
  }
  if (!data || data.error) {
    throw new ScanUnreadableError();
  }
  return scanResultFromResponse(data);
}
