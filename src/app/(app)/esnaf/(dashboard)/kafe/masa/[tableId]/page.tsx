import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getOpenOrderForTable, getOrderWithItems, getTables } from "@/lib/data/restaurant";
import { getMenuCategories, getMenuItems } from "@/lib/data/esnaf";
import { KafeMasaAdisyon } from "@/components/modules/esnaf/kafe-masa-adisyon";

export default async function KafeMasaPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const [tables, categories, items] = await Promise.all([
    getTables(supabase, business.id),
    getMenuCategories(supabase, business.id),
    getMenuItems(supabase, business.id),
  ]);
  const table = tables.find((t) => t.id === tableId);
  if (!table) notFound();

  const openOrder = await getOpenOrderForTable(supabase, tableId);
  const order = openOrder ? await getOrderWithItems(supabase, openOrder.id) : null;

  return (
    <KafeMasaAdisyon businessId={business.id} table={table} order={order} categories={categories} items={items} />
  );
}
