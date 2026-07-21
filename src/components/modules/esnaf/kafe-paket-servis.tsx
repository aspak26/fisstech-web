"use client";

import { useState } from "react";
import { Plus, ShoppingBag, Banknote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import type { OrderType, RestaurantOrderRow } from "@/lib/data/restaurant";
import { ItemPickerDialog } from "./item-picker-dialog";
import { PaymentDialog } from "./payment-dialog";
import type { MenuCategoryRow, MenuItemRow } from "@/lib/data/esnaf";

/** Ported from mobile's paket_servis_screen.dart — same restaurant_orders
 * table as dine-in (table_id null, order_type takeaway/delivery), bucketed
 * client-side into two headers. No dedicated prep-status field exists in
 * mobile (order_type itself is the only state beyond open/closed) — an
 * order simply disappears from this list once paid/closed. */
export function KafePaketServis({
  businessId,
  orders,
  categories,
  items,
}: {
  businessId: string;
  orders: RestaurantOrderRow[];
  categories: MenuCategoryRow[];
  items: MenuItemRow[];
}) {
  const [pickerOpen, setPickerOpen] = useState<OrderType | null>(null);
  const [payingOrder, setPayingOrder] = useState<RestaurantOrderRow | null>(null);

  const takeaway = orders.filter((o) => o.order_type === "takeaway");
  const delivery = orders.filter((o) => o.order_type === "delivery");

  function renderList(title: string, list: RestaurantOrderRow[]) {
    return (
      <Card>
        <h2 className="mb-3 font-display text-base font-semibold text-text-primary">{title}</h2>
        {list.length === 0 ? (
          <p className="text-sm text-text-secondary">Açık sipariş yok</p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-text-primary">{o.customer_name || "Müşteri"}</p>
                  <p className="text-xs text-text-secondary">{new Date(o.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-medium text-text-primary">{formatCurrency(Number(o.total_amount))}</span>
                  <Button size="sm" variant="secondary" className="gap-1" onClick={() => setPayingOrder(o)}>
                    <Banknote className="h-3.5 w-3.5" /> Tahsil Et
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="secondary" className="gap-1.5" onClick={() => setPickerOpen("takeaway")}>
          <Plus className="h-4 w-4" /> Gel-Al Siparişi
        </Button>
        <Button className="gap-1.5" onClick={() => setPickerOpen("delivery")}>
          <Plus className="h-4 w-4" /> Kurye Siparişi
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <EmptyState icon={ShoppingBag} title="Açık paket sipariş yok" />
        </Card>
      ) : (
        <>
          {renderList("Gel-Al / Hazırlanıyor", takeaway)}
          {renderList("Kurye / Yolda", delivery)}
        </>
      )}

      {pickerOpen && (
        <ItemPickerDialog
          open={!!pickerOpen}
          onClose={() => setPickerOpen(null)}
          businessId={businessId}
          categories={categories}
          items={items}
          target={{ mode: "new", orderType: pickerOpen, tableId: null, defaultGuestCount: 1 }}
          onDone={() => setPickerOpen(null)}
        />
      )}

      {payingOrder && (
        <PaymentDialog
          open={!!payingOrder}
          onClose={() => setPayingOrder(null)}
          businessId={businessId}
          order={payingOrder}
          onDone={() => setPayingOrder(null)}
        />
      )}
    </div>
  );
}
