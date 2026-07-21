"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Receipt, Trash2, Bell, Banknote } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import { removeOrderItem, requestBill, type OrderWithItems, type RestaurantTableRow } from "@/lib/data/restaurant";
import { ItemPickerDialog } from "./item-picker-dialog";
import { PaymentDialog } from "./payment-dialog";
import type { MenuCategoryRow, MenuItemRow } from "@/lib/data/esnaf";

/** Ported from mobile's masa_adisyon_screen.dart. */
export function KafeMasaAdisyon({
  businessId,
  table,
  order,
  categories,
  items,
}: {
  businessId: string;
  table: RestaurantTableRow;
  order: OrderWithItems | null;
  categories: MenuCategoryRow[];
  items: MenuItemRow[];
}) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  async function handleRemoveItem(orderItemId: string) {
    if (!order) return;
    if (!window.confirm("Bu kalem kaldırılsın mı?")) return;
    await removeOrderItem(createClient(), orderItemId, order.id);
    router.refresh();
  }

  async function handleRequestBill() {
    await requestBill(createClient(), table.id);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/esnaf/kafe/salon" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Salona dön
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">{table.name}</h1>
          <p className="text-sm text-text-secondary">
            {table.section} · {table.capacity} kişilik{order?.guest_count ? ` · ${order.guest_count} misafir` : ""}
          </p>
        </div>
        {order && (
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={handleRequestBill}>
            <Bell className="h-3.5 w-3.5" /> Hesap İste
          </Button>
        )}
      </div>

      <Card>
        {!order || order.order_items.length === 0 ? (
          <EmptyState icon={Receipt} title="Bu masada henüz sipariş yok" />
        ) : (
          <ul className="divide-y divide-border">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-text-primary">
                    {item.quantity}x {item.name}
                  </p>
                  {item.notes && <p className="text-xs text-text-secondary">{item.notes}</p>}
                </div>
                <span className="shrink-0 font-medium text-text-primary">{formatCurrency(Number(item.unit_price) * item.quantity)}</span>
                <button
                  type="button"
                  aria-label={`"${item.name}" kalemini kaldır`}
                  onClick={() => handleRemoveItem(item.id)}
                  className="shrink-0 text-text-secondary hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {order && order.order_items.length > 0 && (
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm text-text-secondary">Toplam</span>
            <span className="font-display text-xl font-bold text-text-primary">{formatCurrency(Number(order.total_amount))}</span>
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1 gap-1.5" onClick={() => setPickerOpen(true)}>
          <Plus className="h-4 w-4" /> Sipariş Ekle
        </Button>
        {order && order.order_items.length > 0 && (
          <Button className="flex-1 gap-1.5" onClick={() => setPaymentOpen(true)}>
            <Banknote className="h-4 w-4" /> Tahsil Et
          </Button>
        )}
      </div>

      <ItemPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        businessId={businessId}
        categories={categories}
        items={items}
        target={
          order
            ? { mode: "existing", orderId: order.id }
            : { mode: "new", orderType: "dine_in", tableId: table.id, defaultGuestCount: table.capacity }
        }
        onDone={() => setPickerOpen(false)}
      />

      {order && (
        <PaymentDialog
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          businessId={businessId}
          order={order}
          onDone={() => setPaymentOpen(false)}
        />
      )}
    </div>
  );
}
