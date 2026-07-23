import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  B2bCustomerRow,
  B2bPaymentRow,
  B2bTransactionRow,
  InventoryRow,
  RiskLevel,
  WholesaleOrderRow,
  WholesaleOrderStatus,
} from "@/lib/types/esnaf";
import { requireUserId } from "@/lib/utils/auth";

// ─── Depo / Envanter ────────────────────────────────────────────────────────

export async function getInventory(supabase: SupabaseClient, businessId: string): Promise<InventoryRow[]> {
  try {
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .eq("business_id", businessId)
      .order("name");
    return (data ?? []) as InventoryRow[];
  } catch {
    return [];
  }
}

export async function createInventoryItem(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    userId: string;
    name: string;
    category: string | null;
    unitType: string;
    currentStock: number;
    criticalLevel: number;
    costPrice: number;
    sellingPrice: number;
  },
): Promise<void> {
  await supabase.from("inventory").insert({
    business_id: payload.businessId,
    user_id: payload.userId,
    name: payload.name,
    category: payload.category,
    unit_type: payload.unitType,
    current_stock: payload.currentStock,
    critical_level: payload.criticalLevel,
    cost_price: payload.costPrice,
    selling_price: payload.sellingPrice,
  });
}

export async function updateInventoryItem(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<{
    name: string;
    category: string | null;
    unitType: string;
    criticalLevel: number;
    costPrice: number;
    sellingPrice: number;
  }>,
): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase
    .from("inventory")
    .update({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.unitType !== undefined ? { unit_type: patch.unitType } : {}),
      ...(patch.criticalLevel !== undefined ? { critical_level: patch.criticalLevel } : {}),
      ...(patch.costPrice !== undefined ? { cost_price: patch.costPrice } : {}),
      ...(patch.sellingPrice !== undefined ? { selling_price: patch.sellingPrice } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);
}

export async function adjustStock(supabase: SupabaseClient, item: InventoryRow, delta: number): Promise<void> {
  const userId = await requireUserId(supabase);
  const next = Math.max(0, Number(item.current_stock) + delta);
  await supabase
    .from("inventory")
    .update({ current_stock: next, updated_at: new Date().toISOString() })
    .eq("id", item.id)
    .eq("user_id", userId);
}

export async function deleteInventoryItem(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("inventory").delete().eq("id", id).eq("user_id", userId);
}

// ─── Bayiler (B2B Müşteriler) ───────────────────────────────────────────────

export async function getB2bCustomers(supabase: SupabaseClient, businessId: string): Promise<B2bCustomerRow[]> {
  try {
    const { data } = await supabase
      .from("b2b_customers")
      .select("*")
      .eq("business_id", businessId)
      .order("company_name");
    return (data ?? []) as B2bCustomerRow[];
  } catch {
    return [];
  }
}

export async function createB2bCustomer(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    userId: string;
    companyName: string;
    contactName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    taxId: string | null;
    creditLimit: number;
    riskLevel: RiskLevel;
  },
): Promise<string> {
  const { data, error } = await supabase
    .from("b2b_customers")
    .insert({
      business_id: payload.businessId,
      user_id: payload.userId,
      company_name: payload.companyName,
      contact_name: payload.contactName,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      tax_id: payload.taxId,
      credit_limit: payload.creditLimit,
      risk_level: payload.riskLevel,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Bayi eklenemedi");
  return data.id as string;
}

export async function updateB2bCustomer(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<{
    companyName: string;
    contactName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    taxId: string | null;
    creditLimit: number;
    riskLevel: RiskLevel;
  }>,
): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase
    .from("b2b_customers")
    .update({
      ...(patch.companyName !== undefined ? { company_name: patch.companyName } : {}),
      ...(patch.contactName !== undefined ? { contact_name: patch.contactName } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      ...(patch.email !== undefined ? { email: patch.email } : {}),
      ...(patch.address !== undefined ? { address: patch.address } : {}),
      ...(patch.taxId !== undefined ? { tax_id: patch.taxId } : {}),
      ...(patch.creditLimit !== undefined ? { credit_limit: patch.creditLimit } : {}),
      ...(patch.riskLevel !== undefined ? { risk_level: patch.riskLevel } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);
}

export async function deleteB2bCustomer(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("b2b_customers").delete().eq("id", id).eq("user_id", userId);
}

// ─── Cari Hareketler & Tahsilat ─────────────────────────────────────────────

export async function getB2bTransactions(
  supabase: SupabaseClient,
  customerId: string,
  limit = 200,
): Promise<B2bTransactionRow[]> {
  try {
    const { data } = await supabase
      .from("b2b_transactions")
      .select("*")
      .eq("customer_id", customerId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as B2bTransactionRow[];
  } catch {
    return [];
  }
}

/** Bir tahsilat kaydı — hem ödeme yöntemi detayını (b2b_payments) hem cari
 * hareketi (b2b_transactions, type='alacak') oluşturur ve müşterinin
 * current_debt önbelleğini azaltır. */
export async function addB2bPayment(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    userId: string;
    customer: B2bCustomerRow;
    amount: number;
    paymentType: "nakit" | "havale" | "cek";
    referenceNo: string | null;
    dueDate: string | null;
    notes: string | null;
  },
): Promise<void> {
  await supabase.from("b2b_payments").insert({
    business_id: payload.businessId,
    user_id: payload.userId,
    customer_id: payload.customer.id,
    amount: payload.amount,
    payment_type: payload.paymentType,
    reference_no: payload.referenceNo,
    due_date: payload.dueDate,
    notes: payload.notes,
  });
  await supabase.from("b2b_transactions").insert({
    business_id: payload.businessId,
    user_id: payload.userId,
    customer_id: payload.customer.id,
    type: "alacak",
    amount: payload.amount,
    description: `Tahsilat (${payload.paymentType})`,
  });
  await supabase
    .from("b2b_customers")
    .update({ current_debt: Math.max(0, Number(payload.customer.current_debt) - payload.amount) })
    .eq("id", payload.customer.id)
    .eq("user_id", payload.userId);
}

// ─── Toplu Sipariş ──────────────────────────────────────────────────────────

export interface OrderLine {
  inventoryId: string | null;
  name: string;
  unitType: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
}

export async function createWholesaleOrder(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    userId: string;
    customerId: string;
    deliveryAddress: string | null;
    notes: string | null;
    lines: OrderLine[];
  },
): Promise<string> {
  const total = payload.lines.reduce(
    (s, l) => s + l.quantity * l.unitPrice * (1 - l.discountRate / 100),
    0,
  );

  const { data: created, error } = await supabase
    .from("wholesale_orders")
    .insert({
      business_id: payload.businessId,
      user_id: payload.userId,
      customer_id: payload.customerId,
      total_amount: total,
      delivery_address: payload.deliveryAddress,
      notes: payload.notes,
    })
    .select("id")
    .single();
  if (error || !created) throw error ?? new Error("Sipariş oluşturulamadı");

  const orderId = created.id as string;
  await supabase.from("wholesale_order_items").insert(
    payload.lines.map((l) => ({
      order_id: orderId,
      business_id: payload.businessId,
      user_id: payload.userId,
      inventory_id: l.inventoryId,
      name: l.name,
      unit_type: l.unitType,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      discount_rate: l.discountRate,
      total_amount: l.quantity * l.unitPrice * (1 - l.discountRate / 100),
    })),
  );
  return orderId;
}

// ─── Sevkiyat ───────────────────────────────────────────────────────────────

export async function getActiveWholesaleOrders(
  supabase: SupabaseClient,
  businessId: string,
): Promise<WholesaleOrderRow[]> {
  try {
    const { data } = await supabase
      .from("wholesale_orders")
      .select("*")
      .eq("business_id", businessId)
      .in("status", ["pending", "preparing", "shipped"])
      .order("created_at", { ascending: false });
    return (data ?? []) as WholesaleOrderRow[];
  } catch {
    return [];
  }
}

/** Sipariş durumunu ilerletir. 'delivered' olunca teslim tarihi damgalanır,
 * sipariş tutarı kadar bir 'borc' cari hareketi eklenir ve bayinin
 * current_debt önbelleği artırılır — mobildeki doğrulanmış davranış. */
export async function advanceOrderStatus(
  supabase: SupabaseClient,
  order: WholesaleOrderRow,
  next: WholesaleOrderStatus,
): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase
    .from("wholesale_orders")
    .update({
      status: next,
      ...(next === "shipped" ? { shipped_at: new Date().toISOString() } : {}),
      ...(next === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
    })
    .eq("id", order.id)
    .eq("user_id", userId);

  if (next === "delivered") {
    await supabase.from("b2b_transactions").insert({
      business_id: order.business_id,
      user_id: order.user_id,
      customer_id: order.customer_id,
      order_id: order.id,
      type: "borc",
      amount: order.total_amount,
      description: "Sipariş teslimatı",
    });
    const { data: customer } = await supabase
      .from("b2b_customers")
      .select("current_debt")
      .eq("id", order.customer_id)
      .maybeSingle();
    if (customer) {
      await supabase
        .from("b2b_customers")
        .update({ current_debt: Number(customer.current_debt) + Number(order.total_amount) })
        .eq("id", order.customer_id)
        .eq("user_id", userId);
    }
  }
}

export async function getB2bPayments(supabase: SupabaseClient, customerId: string): Promise<B2bPaymentRow[]> {
  try {
    const { data } = await supabase
      .from("b2b_payments")
      .select("*")
      .eq("customer_id", customerId)
      .order("payment_date", { ascending: false });
    return (data ?? []) as B2bPaymentRow[];
  } catch {
    return [];
  }
}
