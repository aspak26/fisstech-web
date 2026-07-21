import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PerakendeCustomerRow,
  PerakendeDebtRow,
  PerakendeTransactionRow,
  PerakendeTransactionItemRow,
  ProductCategoryRow,
  QuickProductWithVariations,
} from "@/lib/types/esnaf";

// ─── Kategoriler ────────────────────────────────────────────────────────────

export async function getProductCategories(
  supabase: SupabaseClient,
  businessId: string,
): Promise<ProductCategoryRow[]> {
  try {
    const { data } = await supabase
      .from("product_categories")
      .select("*")
      .eq("business_id", businessId)
      .order("sort_order");
    return (data ?? []) as ProductCategoryRow[];
  } catch {
    return [];
  }
}

export async function createProductCategory(
  supabase: SupabaseClient,
  businessId: string,
  userId: string,
  name: string,
  emoji: string,
): Promise<void> {
  await supabase.from("product_categories").insert({ business_id: businessId, user_id: userId, name, emoji });
}

export async function deleteProductCategory(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("product_categories").delete().eq("id", id);
}

// ─── Ürünler ────────────────────────────────────────────────────────────────

export async function getQuickProducts(
  supabase: SupabaseClient,
  businessId: string,
): Promise<QuickProductWithVariations[]> {
  try {
    const { data } = await supabase
      .from("quick_products")
      .select("*, product_variations(*)")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("sale_count", { ascending: false });
    return (data ?? []) as unknown as QuickProductWithVariations[];
  } catch {
    return [];
  }
}

/** Ported from mobile's QuickProductService.searchByCode — exact PLU match,
 * used by the POS's auto-add-on-scan input. */
export async function searchProductByCode(
  supabase: SupabaseClient,
  businessId: string,
  code: string,
): Promise<QuickProductWithVariations | null> {
  try {
    const { data } = await supabase
      .from("quick_products")
      .select("*, product_variations(*)")
      .eq("business_id", businessId)
      .eq("product_code", code)
      .eq("is_active", true)
      .maybeSingle();
    return (data as unknown as QuickProductWithVariations) ?? null;
  } catch {
    return null;
  }
}

export async function createQuickProduct(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    userId: string;
    categoryId: string | null;
    name: string;
    price: number;
    unitType: string;
    productCode?: string | null;
    hasVariations?: boolean;
    variations?: { label: string; price: number }[];
  },
): Promise<void> {
  const { data, error } = await supabase
    .from("quick_products")
    .insert({
      business_id: payload.businessId,
      user_id: payload.userId,
      category_id: payload.categoryId,
      name: payload.name,
      price: payload.price,
      unit_type: payload.unitType,
      product_code: payload.productCode || null,
      has_variations: payload.hasVariations ?? false,
    })
    .select("id")
    .single();
  if (error || !data) return;

  if (payload.hasVariations && payload.variations && payload.variations.length > 0) {
    await supabase.from("product_variations").insert(
      payload.variations.map((v) => ({
        product_id: data.id,
        business_id: payload.businessId,
        user_id: payload.userId,
        label: v.label,
        price: v.price,
      })),
    );
  }
}

export async function updateQuickProduct(
  supabase: SupabaseClient,
  id: string,
  patch: {
    name?: string;
    price?: number;
    categoryId?: string | null;
    unitType?: string;
    productCode?: string | null;
    hasVariations?: boolean;
  },
): Promise<void> {
  await supabase
    .from("quick_products")
    .update({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.price !== undefined ? { price: patch.price } : {}),
      ...(patch.categoryId !== undefined ? { category_id: patch.categoryId } : {}),
      ...(patch.unitType !== undefined ? { unit_type: patch.unitType } : {}),
      ...(patch.productCode !== undefined ? { product_code: patch.productCode } : {}),
      ...(patch.hasVariations !== undefined ? { has_variations: patch.hasVariations } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function deleteQuickProduct(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("quick_products").delete().eq("id", id);
}

// ─── Ürün Varyasyonları ─────────────────────────────────────────────────────
// Mobildeki add_quick_product_screen.dart sadece ürün OLUŞTURULURKEN
// varyasyon eklemeye izin veriyordu (düzenlemede yok) — web'de bu, tam bir
// CRUD'a genişletildi (daha doğru/kullanışlı, aynı tablo/kolonlar).

export async function createProductVariation(
  supabase: SupabaseClient,
  payload: { productId: string; businessId: string; userId: string; label: string; price: number },
): Promise<void> {
  await supabase.from("product_variations").insert({
    product_id: payload.productId,
    business_id: payload.businessId,
    user_id: payload.userId,
    label: payload.label,
    price: payload.price,
  });
}

export async function updateProductVariation(
  supabase: SupabaseClient,
  id: string,
  patch: { label?: string; price?: number },
): Promise<void> {
  await supabase.from("product_variations").update(patch).eq("id", id);
}

export async function deleteProductVariation(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("product_variations").delete().eq("id", id);
}

// ─── Veresiye Müşterileri ───────────────────────────────────────────────────

export async function getPerakendeCustomers(
  supabase: SupabaseClient,
  businessId: string,
): Promise<PerakendeCustomerRow[]> {
  try {
    const { data } = await supabase
      .from("perakende_customers")
      .select("*")
      .eq("business_id", businessId)
      .order("name");
    return (data ?? []) as PerakendeCustomerRow[];
  } catch {
    return [];
  }
}

export async function createPerakendeCustomer(
  supabase: SupabaseClient,
  businessId: string,
  userId: string,
  name: string,
  phone: string | null,
): Promise<string> {
  const { data, error } = await supabase
    .from("perakende_customers")
    .insert({ business_id: businessId, user_id: userId, name, phone })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Müşteri eklenemedi");
  return data.id as string;
}

/** customer_id -> açık bakiye (Σ perakende_debts.amount — pozitif = borç). */
export async function getCustomerBalances(
  supabase: SupabaseClient,
  businessId: string,
): Promise<Map<string, number>> {
  try {
    const { data } = await supabase
      .from("perakende_debts")
      .select("customer_id, amount")
      .eq("business_id", businessId);
    const balances = new Map<string, number>();
    for (const row of (data ?? []) as { customer_id: string; amount: number }[]) {
      balances.set(row.customer_id, (balances.get(row.customer_id) ?? 0) + Number(row.amount));
    }
    return balances;
  } catch {
    return new Map();
  }
}

export async function getCustomerDebtHistory(
  supabase: SupabaseClient,
  customerId: string,
): Promise<PerakendeDebtRow[]> {
  try {
    const { data } = await supabase
      .from("perakende_debts")
      .select("*")
      .eq("customer_id", customerId)
      .order("debt_date", { ascending: false })
      .order("created_at", { ascending: false });
    return (data ?? []) as PerakendeDebtRow[];
  } catch {
    return [];
  }
}

/** Tahsilat kaydı — negatif tutarla perakende_debts'e yazılır. */
export async function addDebtPayment(
  supabase: SupabaseClient,
  businessId: string,
  userId: string,
  customerId: string,
  amount: number,
  description: string | null,
): Promise<void> {
  await supabase.from("perakende_debts").insert({
    business_id: businessId,
    user_id: userId,
    customer_id: customerId,
    amount: -Math.abs(amount),
    description,
  });
}

// ─── Kasa (POS) ─────────────────────────────────────────────────────────────

export interface CartLine {
  productId: string | null;
  productName: string;
  variationLabel?: string | null;
  quantity: number;
  unitPrice: number;
}

/** Bir POS satışını kaydeder: transaction + items, satılan ürünlerin
 * sale_count'unu artırır, veresiye ise borç hareketi ekler. */
export async function createTransaction(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    userId: string;
    customerId: string | null;
    paymentMethod: "nakit" | "kart" | "veresiye";
    lines: CartLine[];
    notes?: string | null;
  },
): Promise<string> {
  const total = payload.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const { data: created, error } = await supabase
    .from("perakende_transactions")
    .insert({
      business_id: payload.businessId,
      user_id: payload.userId,
      customer_id: payload.customerId,
      total_amount: total,
      payment_method: payload.paymentMethod,
      notes: payload.notes ?? null,
    })
    .select("id")
    .single();
  if (error || !created) throw error ?? new Error("Satış kaydedilemedi");

  const transactionId = created.id as string;

  await supabase.from("perakende_transaction_items").insert(
    payload.lines.map((line) => ({
      transaction_id: transactionId,
      business_id: payload.businessId,
      user_id: payload.userId,
      product_id: line.productId,
      product_name: line.productName,
      variation_label: line.variationLabel ?? null,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      total_price: line.unitPrice * line.quantity,
    })),
  );

  // Bump sale_count for "Sık Satanlar" sorting — best-effort, read-then-write
  // (fine for a single-user POS; no concurrent-write contention in practice).
  for (const line of payload.lines) {
    if (!line.productId) continue;
    const { data: product } = await supabase
      .from("quick_products")
      .select("sale_count")
      .eq("id", line.productId)
      .maybeSingle();
    if (product) {
      await supabase
        .from("quick_products")
        .update({ sale_count: Number(product.sale_count) + Math.max(1, Math.round(line.quantity)) })
        .eq("id", line.productId);
    }
  }

  if (payload.paymentMethod === "veresiye" && payload.customerId) {
    await supabase.from("perakende_debts").insert({
      business_id: payload.businessId,
      user_id: payload.userId,
      customer_id: payload.customerId,
      amount: total,
      description: "Veresiye satış",
    });
  }

  return transactionId;
}

/** Ported from mobile's PerakendeTransactionService.create (manualTotal
 * branch, used by gece_scan_screen.dart's day-end batch scan) — no cart
 * items, just a scanned total + receipt image. */
export async function createScannedTransaction(
  supabase: SupabaseClient,
  payload: { businessId: string; userId: string; amount: number; imageUrl: string | null },
): Promise<void> {
  await supabase.from("perakende_transactions").insert({
    business_id: payload.businessId,
    user_id: payload.userId,
    total_amount: payload.amount,
    payment_method: "nakit",
    is_ai_scanned: true,
    image_url: payload.imageUrl,
  });
}

export interface PerakendeTransactionWithItems extends PerakendeTransactionRow {
  perakende_transaction_items: PerakendeTransactionItemRow[];
}

/** Ported from mobile's PerakendeTransactionService.getRecentTransactions —
 * optional date range (used by the Satış Geçmişi period filter). */
export async function getRecentTransactions(
  supabase: SupabaseClient,
  businessId: string,
  options: { limit?: number; startDate?: string; endDate?: string } = {},
): Promise<PerakendeTransactionWithItems[]> {
  try {
    let query = supabase
      .from("perakende_transactions")
      .select("*, perakende_transaction_items(*)")
      .eq("business_id", businessId);
    if (options.startDate) query = query.gte("created_at", options.startDate);
    if (options.endDate) query = query.lte("created_at", options.endDate);

    const { data } = await query
      .order("created_at", { ascending: false })
      .limit(options.limit ?? 100);
    return (data ?? []) as unknown as PerakendeTransactionWithItems[];
  } catch {
    return [];
  }
}
