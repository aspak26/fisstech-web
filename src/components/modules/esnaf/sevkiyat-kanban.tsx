"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import { advanceOrderStatus } from "@/lib/data/toptan";
import type { B2bCustomerRow, WholesaleOrderRow, WholesaleOrderStatus } from "@/lib/types/esnaf";

const COLUMNS: { status: WholesaleOrderStatus; title: string; nextLabel: string | null; next: WholesaleOrderStatus | null }[] = [
  { status: "pending", title: "Bekliyor", nextLabel: "Hazırlanıyor", next: "preparing" },
  { status: "preparing", title: "Hazırlanıyor", nextLabel: "Yola Çıktı", next: "shipped" },
  { status: "shipped", title: "Yolda", nextLabel: "Teslim Edildi", next: "delivered" },
];

export function SevkiyatKanban({ orders, customers }: { orders: WholesaleOrderRow[]; customers: B2bCustomerRow[] }) {
  const router = useRouter();
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  async function advance(order: WholesaleOrderRow, next: WholesaleOrderStatus) {
    await advanceOrderStatus(createClient(), order, next);
    router.refresh();
  }

  const totalOrders = orders.length;
  const totalAmount = orders.reduce((s, o) => s + Number(o.total_amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
        <span>
          Toplam sipariş: <span className="font-medium text-text-primary">{totalOrders}</span>
        </span>
        <span>
          Toplam tutar: <span className="font-medium text-text-primary">{formatCurrency(totalAmount)}</span>
        </span>
      </div>

      {orders.length === 0 ? (
        <Card>
          <EmptyState icon={Truck} title="Aktif sevkiyat yok" description="Toplu Sipariş sekmesinden yeni bir sipariş oluştur." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const columnOrders = orders.filter((o) => o.status === col.status);
            return (
              <div key={col.status} className="space-y-3">
                <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-text-primary">
                  {col.title} <span className="text-text-secondary">({columnOrders.length})</span>
                </h2>
                <div className="space-y-2">
                  {columnOrders.length === 0 ? (
                    <Card className="p-4 text-center text-sm text-text-secondary">Boş</Card>
                  ) : (
                    columnOrders.map((order) => {
                      const customer = customerMap.get(order.customer_id);
                      return (
                        <Card key={order.id} className="space-y-2 p-3">
                          <p className="font-medium text-text-primary">{customer?.company_name ?? "Bilinmeyen bayi"}</p>
                          {order.delivery_address && <p className="text-sm text-text-secondary">{order.delivery_address}</p>}
                          <p className="font-medium text-text-primary">{formatCurrency(Number(order.total_amount))}</p>
                          {col.next && (
                            <Button variant="secondary" size="sm" className="w-full gap-1.5" onClick={() => advance(order, col.next!)}>
                              {col.nextLabel} <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
