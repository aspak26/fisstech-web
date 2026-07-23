import type { SupabaseClient } from "@supabase/supabase-js";
import { calculatePeriodRange } from "@/lib/utils/period";
import { requireUserId } from "@/lib/utils/auth";

// ─── Şema ────────────────────────────────────────────────────────────────────
// Ported from fisle_app's 031_kafe_restoran.sql + 034_menu_extras.sql +
// 035_guest_count.sql. No DB triggers exist for status transitions or total
// recalculation — mobile does both client-side (RestaurantOrderService),
// replicated the same way here.

export type TableStatus = "empty" | "occupied" | "bill_requested";
export type OrderType = "dine_in" | "takeaway" | "delivery";
export type OrderStatus = "open" | "closed" | "cancelled";
export type RestaurantPaymentMethod = "cash" | "card" | "mixed";

export interface RestaurantTableRow {
  id: string;
  business_id: string;
  user_id: string;
  name: string;
  section: string;
  capacity: number;
  status: TableStatus;
  created_at: string;
}

export interface RestaurantOrderRow {
  id: string;
  business_id: string;
  user_id: string;
  table_id: string | null;
  order_type: OrderType;
  status: OrderStatus;
  total_amount: number;
  paid_amount: number;
  customer_name: string | null;
  notes: string | null;
  guest_count: number | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  business_id: string;
  user_id: string;
  menu_item_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  notes: string | null;
  created_at: string;
}

export interface MenuItemExtraRow {
  id: string;
  menu_item_id: string;
  business_id: string;
  user_id: string;
  name: string;
  price_addition: number;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

// ─── Salon (Masa Planı) ──────────────────────────────────────────────────────

export async function getTables(supabase: SupabaseClient, businessId: string): Promise<RestaurantTableRow[]> {
  try {
    const { data } = await supabase
      .from("restaurant_tables")
      .select("*")
      .eq("business_id", businessId)
      .order("section")
      .order("name");
    return (data ?? []) as RestaurantTableRow[];
  } catch {
    return [];
  }
}

export async function createTable(
  supabase: SupabaseClient,
  payload: { businessId: string; userId: string; name: string; section: string; capacity: number },
): Promise<void> {
  await supabase.from("restaurant_tables").insert({
    business_id: payload.businessId,
    user_id: payload.userId,
    name: payload.name,
    section: payload.section,
    capacity: payload.capacity,
  });
}

export async function updateTable(
  supabase: SupabaseClient,
  id: string,
  patch: { name?: string; capacity?: number },
): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("restaurant_tables").update(patch).eq("id", id).eq("user_id", userId);
}

export async function deleteTable(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("restaurant_tables").delete().eq("id", id).eq("user_id", userId);
}

async function updateTableStatus(supabase: SupabaseClient, tableId: string, status: TableStatus): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("restaurant_tables").update({ status }).eq("id", tableId).eq("user_id", userId);
}

// ─── Siparişler (Adisyon / Paket Servis) ────────────────────────────────────

export async function getOpenOrderForTable(
  supabase: SupabaseClient,
  tableId: string,
): Promise<RestaurantOrderRow | null> {
  try {
    const { data } = await supabase
      .from("restaurant_orders")
      .select("*")
      .eq("table_id", tableId)
      .eq("status", "open")
      .maybeSingle();
    return (data as RestaurantOrderRow) ?? null;
  } catch {
    return null;
  }
}

export async function getOrder(supabase: SupabaseClient, orderId: string): Promise<RestaurantOrderRow | null> {
  const { data } = await supabase.from("restaurant_orders").select("*").eq("id", orderId).maybeSingle();
  return (data as RestaurantOrderRow) ?? null;
}

export interface OrderWithItems extends RestaurantOrderRow {
  order_items: OrderItemRow[];
}

export async function getOrderWithItems(supabase: SupabaseClient, orderId: string): Promise<OrderWithItems | null> {
  const { data } = await supabase
    .from("restaurant_orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .maybeSingle();
  return (data as unknown as OrderWithItems) ?? null;
}

/** Ported from mobile's SiparisEkleScreen._confirm() — opens a new tab on a
 * table (flips it to occupied) or a takeaway/delivery order (table_id null). */
export async function createOrder(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    userId: string;
    tableId: string | null;
    orderType: OrderType;
    guestCount: number | null;
    customerName: string | null;
  },
): Promise<string> {
  const { data, error } = await supabase
    .from("restaurant_orders")
    .insert({
      business_id: payload.businessId,
      user_id: payload.userId,
      table_id: payload.tableId,
      order_type: payload.orderType,
      guest_count: payload.guestCount,
      customer_name: payload.customerName,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Sipariş oluşturulamadı");

  if (payload.tableId) await updateTableStatus(supabase, payload.tableId, "occupied");
  return data.id as string;
}

async function recalcTotal(supabase: SupabaseClient, orderId: string): Promise<void> {
  const userId = await requireUserId(supabase);
  const { data } = await supabase.from("order_items").select("unit_price, quantity").eq("order_id", orderId);
  const total = ((data ?? []) as { unit_price: number; quantity: number }[]).reduce(
    (s, i) => s + Number(i.unit_price) * i.quantity,
    0,
  );
  await supabase.from("restaurant_orders").update({ total_amount: total }).eq("id", orderId).eq("user_id", userId);
}

export interface NewOrderItem {
  menuItemId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  notes: string | null;
}

/** Batch insert then recalc once — mobile does this per-line sequentially
 * (N round-trips for N cart lines), this is a safe, low-risk improvement. */
export async function addOrderItems(
  supabase: SupabaseClient,
  businessId: string,
  userId: string,
  orderId: string,
  items: NewOrderItem[],
): Promise<void> {
  if (items.length === 0) return;
  await supabase.from("order_items").insert(
    items.map((i) => ({
      order_id: orderId,
      business_id: businessId,
      user_id: userId,
      menu_item_id: i.menuItemId,
      name: i.name,
      unit_price: i.unitPrice,
      quantity: i.quantity,
      notes: i.notes,
    })),
  );
  await recalcTotal(supabase, orderId);
}

export async function removeOrderItem(supabase: SupabaseClient, orderItemId: string, orderId: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("order_items").delete().eq("id", orderItemId).eq("user_id", userId);
  await recalcTotal(supabase, orderId);
}

/** Ported from mobile's requestBill — despite the name, doesn't touch order
 * status; only flags the table for staff attention. */
export async function requestBill(supabase: SupabaseClient, tableId: string): Promise<void> {
  await updateTableStatus(supabase, tableId, "bill_requested");
}

export async function getOpenDeliveryOrders(supabase: SupabaseClient, businessId: string): Promise<RestaurantOrderRow[]> {
  try {
    const { data } = await supabase
      .from("restaurant_orders")
      .select("*")
      .eq("business_id", businessId)
      .eq("status", "open")
      .neq("order_type", "dine_in")
      .order("created_at", { ascending: false });
    return (data ?? []) as RestaurantOrderRow[];
  } catch {
    return [];
  }
}

// ─── Ödeme ───────────────────────────────────────────────────────────────────

/** Ported from mobile's RestaurantOrderService.payPartial — records
 * restaurant_payments row(s) + mirrors into the generic business_incomes
 * ledger (same table every other sector's Kasa Defteri uses). Closes the
 * order + frees the table once fully paid.
 *
 * Deliberate correction vs. mobile: a mixed cash+card payment writes TWO
 * business_incomes rows (one per method) instead of mobile's single row
 * collapsed to 'cash' (a real data-fidelity bug — see PROGRESS.md) — same
 * insert pattern, just accurate, no new behavior invented. */
export async function payOrder(
  supabase: SupabaseClient,
  businessId: string,
  userId: string,
  order: RestaurantOrderRow,
  payload: { cashAmount: number; cardAmount: number },
): Promise<void> {
  const paymentRows: { business_id: string; user_id: string; order_id: string; amount: number; payment_method: "cash" | "card" }[] = [];
  if (payload.cashAmount > 0) {
    paymentRows.push({ business_id: businessId, user_id: userId, order_id: order.id, amount: payload.cashAmount, payment_method: "cash" });
  }
  if (payload.cardAmount > 0) {
    paymentRows.push({ business_id: businessId, user_id: userId, order_id: order.id, amount: payload.cardAmount, payment_method: "card" });
  }
  if (paymentRows.length === 0) return;

  await supabase.from("restaurant_payments").insert(paymentRows);

  const tableLabel = order.table_id ? "Masa" : order.order_type === "delivery" ? "Paket (Kurye)" : "Paket (Gel-Al)";
  await supabase.from("business_incomes").insert(
    paymentRows.map((p) => ({
      business_id: businessId,
      user_id: userId,
      amount: p.amount,
      description: `${tableLabel} - Tahsilat`,
      payment_method: p.payment_method,
      vat_rate: 0,
      vat_amount: 0,
      transaction_date: new Date().toISOString().slice(0, 10),
    })),
  );

  const newPaid = Number(order.paid_amount) + payload.cashAmount + payload.cardAmount;
  const isFullyPaid = newPaid >= Number(order.total_amount);

  await supabase
    .from("restaurant_orders")
    .update({
      paid_amount: newPaid,
      ...(isFullyPaid ? { status: "closed", closed_at: new Date().toISOString() } : {}),
    })
    .eq("id", order.id)
    .eq("user_id", userId);

  if (isFullyPaid && order.table_id) await updateTableStatus(supabase, order.table_id, "empty");
}

// ─── Kafe Kasa (kapanan masalar/siparişler) ─────────────────────────────────

export interface ClosedOrderWithItems extends RestaurantOrderRow {
  order_items: OrderItemRow[];
  table_name: string | null;
}

export async function getClosedOrders(
  supabase: SupabaseClient,
  businessId: string,
  dayStartISO: string,
  dayEndISO: string,
): Promise<ClosedOrderWithItems[]> {
  try {
    const { data } = await supabase
      .from("restaurant_orders")
      .select("*, order_items(*), restaurant_tables(name)")
      .eq("business_id", businessId)
      .eq("status", "closed")
      .gte("closed_at", dayStartISO)
      .lte("closed_at", dayEndISO)
      .order("closed_at", { ascending: false });

    interface Row extends RestaurantOrderRow {
      order_items: OrderItemRow[];
      restaurant_tables: { name: string } | { name: string }[] | null;
    }
    return ((data ?? []) as unknown as Row[]).map((r) => {
      const table = Array.isArray(r.restaurant_tables) ? (r.restaurant_tables[0] ?? null) : r.restaurant_tables;
      return { ...r, table_name: table?.name ?? null };
    });
  } catch {
    return [];
  }
}

// ─── Menü Ekstraları ─────────────────────────────────────────────────────────

export async function getMenuItemExtras(supabase: SupabaseClient, businessId: string): Promise<MenuItemExtraRow[]> {
  try {
    const { data } = await supabase
      .from("menu_item_extras")
      .select("*")
      .eq("business_id", businessId)
      .order("sort_order");
    return (data ?? []) as MenuItemExtraRow[];
  } catch {
    return [];
  }
}

export interface MenuSaleDatePoint {
  date: string;
  qty: number;
  revenue: number;
}

export interface MenuSalesPoint {
  name: string;
  totalQty: number;
  totalRevenue: number;
  byDate: MenuSaleDatePoint[];
}

/** New (not on mobile, requested by user 21 Temmuz 2026): "which menu item
 * sold how much, on which dates" — groups order_items (already carries its
 * own business_id/created_at, no join needed) by item name, then by day. */
export async function getMenuSalesBreakdown(
  supabase: SupabaseClient,
  businessId: string,
  periodKey: string,
): Promise<MenuSalesPoint[]> {
  try {
    const range = calculatePeriodRange(periodKey);
    let query = supabase
      .from("order_items")
      .select("name, unit_price, quantity, created_at")
      .eq("business_id", businessId);
    if (range.start) query = query.gte("created_at", `${range.start}T00:00:00`);
    if (range.end) query = query.lte("created_at", `${range.end}T23:59:59`);
    const { data } = await query;

    const byName = new Map<string, Map<string, MenuSaleDatePoint>>();
    for (const item of (data ?? []) as { name: string; unit_price: number; quantity: number; created_at: string }[]) {
      const date = item.created_at.slice(0, 10);
      const revenue = Number(item.unit_price) * item.quantity;
      const dateMap = byName.get(item.name) ?? new Map<string, MenuSaleDatePoint>();
      const existing = dateMap.get(date);
      dateMap.set(date, { date, qty: (existing?.qty ?? 0) + item.quantity, revenue: (existing?.revenue ?? 0) + revenue });
      byName.set(item.name, dateMap);
    }

    return [...byName.entries()]
      .map(([name, dateMap]) => {
        const byDate = [...dateMap.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
        return {
          name,
          totalQty: byDate.reduce((s, d) => s + d.qty, 0),
          totalRevenue: byDate.reduce((s, d) => s + d.revenue, 0),
          byDate,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  } catch {
    return [];
  }
}

/** Correctly implemented (mobile's equivalent — MenuItemService.getTopSellerIds
 * — queries a nonexistent `restaurant_order_items` table and always silently
 * fails/returns empty; see PROGRESS.md). Groups the real `order_items` table
 * by menu_item_id. */
export async function getTopSellingMenuItemIds(
  supabase: SupabaseClient,
  businessId: string,
  limit = 10,
): Promise<string[]> {
  try {
    const { data } = await supabase.from("order_items").select("menu_item_id").eq("business_id", businessId);
    const counts = new Map<string, number>();
    for (const row of (data ?? []) as { menu_item_id: string | null }[]) {
      if (!row.menu_item_id) continue;
      counts.set(row.menu_item_id, (counts.get(row.menu_item_id) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
  } catch {
    return [];
  }
}
