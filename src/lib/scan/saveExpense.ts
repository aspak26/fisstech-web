import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeDate } from "@/lib/utils/date";
import { detectImageType } from "@/lib/utils/file-validation";
import type { ScanResult } from "./types";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year, matches mobile

/** Uploads receipt originals to the private `receipts` bucket and returns
 * signed URLs — same path shape and TTL as fisle_app's uploadReceipts().
 * Files whose real content isn't a JPEG/PNG/WebP (checked via magic bytes,
 * not the attacker-controlled name/type) are silently skipped, matching
 * this function's existing silent-skip-on-upload-error behavior. */
export async function uploadReceipts(
  supabase: SupabaseClient,
  userId: string,
  files: File[],
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const detected = await detectImageType(file);
    if (!detected) continue;
    const fileName = `${userId}/${Date.now()}_${i}.${detected.ext}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, file, { contentType: detected.mime });
    if (uploadError) continue;

    const { data } = await supabase.storage
      .from("receipts")
      .createSignedUrl(fileName, SIGNED_URL_TTL_SECONDS);
    if (data?.signedUrl) urls.push(data.signedUrl);
  }

  return urls;
}

/** Inserts expenses + expense_items rows for a confirmed scan result.
 * Mirrors ScanService.saveExpense() field-for-field, including the
 * comma-joined receipt_image_url string (not an array/jsonb) for mobile
 * read-compatibility. Returns the new expense id. */
export async function saveExpense(
  supabase: SupabaseClient,
  userId: string,
  result: ScanResult,
  note?: string,
): Promise<string> {
  const { data: rawCategories } = await supabase.from("categories").select("id, name");
  const categoryMap = new Map<string, string>(
    (rawCategories ?? []).map((c: { id: string; name: string }) => [c.name, c.id]),
  );

  const safeDate = normalizeDate(result.date);

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      store_name: result.storeName || null,
      total: result.total,
      date: safeDate,
      payment_method: result.paymentMethod,
      note: note ?? null,
      receipt_image_url: result.imageUrls.length > 0 ? result.imageUrls.join(",") : null,
    })
    .select("id")
    .single();

  if (error || !expense) {
    throw new Error("Harcama kaydedilemedi");
  }

  const expenseId = expense.id as string;

  if (result.items.length > 0) {
    await supabase.from("expense_items").insert(
      result.items.map((item) => ({
        expense_id: expenseId,
        name: item.name,
        category_id: categoryMap.get(item.category) ?? null,
        price: item.price,
        quantity: item.quantity,
      })),
    );
  }

  return expenseId;
}
