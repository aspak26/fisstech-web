"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import { createWholesaleOrder, type OrderLine } from "@/lib/data/toptan";
import type { B2bCustomerRow, InventoryRow } from "@/lib/types/esnaf";

interface Line extends OrderLine {
  key: string;
}

export function TopluSiparis({
  businessId,
  customers,
  inventory,
}: {
  businessId: string;
  customers: B2bCustomerRow[];
  inventory: InventoryRow[];
}) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<Line[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const total = cart.reduce((s, l) => s + l.quantity * l.unitPrice * (1 - l.discountRate / 100), 0);

  function addProduct(item: InventoryRow) {
    setCart((prev) => {
      const existing = prev.find((l) => l.inventoryId === item.id);
      if (existing) return prev.map((l) => (l.inventoryId === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [
        ...prev,
        {
          key: item.id,
          inventoryId: item.id,
          name: item.name,
          unitType: item.unit_type,
          quantity: 1,
          unitPrice: Number(item.selling_price),
          discountRate: 0,
        },
      ];
    });
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  async function handleSubmit() {
    if (!customerId || cart.length === 0) return;
    setSaving(true);
    setNotice(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await createWholesaleOrder(supabase, {
        businessId,
        userId: user.id,
        customerId,
        deliveryAddress: deliveryAddress || null,
        notes: notes || null,
        lines: cart.map((l) => ({
          inventoryId: l.inventoryId,
          name: l.name,
          unitType: l.unitType,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountRate: l.discountRate,
        })),
      });
      setCart([]);
      setDeliveryAddress("");
      setNotes("");
      setNotice("Sipariş oluşturuldu — Sevkiyat sekmesinden takip edebilirsin.");
      router.refresh();
    } catch {
      setNotice("Sipariş oluşturulamadı, lütfen tekrar dene.");
    } finally {
      setSaving(false);
    }
  }

  const usedItemIds = useMemo(() => new Set(cart.map((l) => l.inventoryId)), [cart]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
      <Card>
        {inventory.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Depoda ürün yok" description="Önce Depo sekmesinden ürün ekle." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {inventory.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addProduct(item)}
                className="rounded-control border border-border p-3 text-left transition-colors hover:border-accent hover:bg-accent/5 disabled:opacity-50"
                disabled={Number(item.current_stock) <= 0}
              >
                <p className="truncate font-medium text-text-primary">{item.name}</p>
                <p className="text-sm text-text-secondary">
                  {formatCurrency(Number(item.selling_price))} · {Number(item.current_stock)} {item.unit_type} mevcut
                </p>
                {usedItemIds.has(item.id) && <p className="mt-1 text-xs font-medium text-accent">Sepette</p>}
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="flex h-fit flex-col gap-3 lg:sticky lg:top-4">
        <h2 className="font-display text-base font-semibold text-text-primary">Sipariş</h2>
        <div>
          <Label htmlFor="order-customer">Bayi</Label>
          <Select id="order-customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </Select>
        </div>

        {cart.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-secondary">Ürüne tıklayarak sepete ekle</p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {cart.map((line) => (
              <li key={line.key} className="space-y-1.5 border-b border-border pb-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-text-primary">{line.name}</p>
                  <button type="button" onClick={() => removeLine(line.key)} className="text-text-secondary hover:text-danger">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateLine(line.key, { quantity: Math.max(0.001, line.quantity - 1) })}
                    className="flex h-6 w-6 items-center justify-center rounded-control border border-border text-text-secondary"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-10 text-center">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateLine(line.key, { quantity: line.quantity + 1 })}
                    className="flex h-6 w-6 items-center justify-center rounded-control border border-border text-text-secondary"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <Input
                    type="number"
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(line.key, { unitPrice: Number(e.target.value) })}
                    className="h-8 w-20"
                  />
                  <Input
                    type="number"
                    step="1"
                    placeholder="%İsk."
                    value={line.discountRate}
                    onChange={(e) => updateLine(line.key, { discountRate: Number(e.target.value) })}
                    className="h-8 w-16"
                  />
                </div>
                <p className="text-right font-medium text-text-primary">
                  {formatCurrency(line.quantity * line.unitPrice * (1 - line.discountRate / 100))}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div>
          <Label htmlFor="delivery-address">Teslimat Adresi (isteğe bağlı)</Label>
          <Input id="delivery-address" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="order-notes">Not (isteğe bağlı)</Label>
          <Input id="order-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="font-medium text-text-secondary">Toplam</span>
          <span className="font-display text-xl font-bold text-text-primary">{formatCurrency(total)}</span>
        </div>

        {notice && <p className="text-sm text-text-secondary">{notice}</p>}

        <Button disabled={saving || cart.length === 0 || !customerId} onClick={handleSubmit}>
          {saving ? "Kaydediliyor…" : "Siparişi Oluştur"}
        </Button>
      </Card>
    </div>
  );
}
