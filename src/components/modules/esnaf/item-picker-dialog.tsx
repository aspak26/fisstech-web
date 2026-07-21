"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { addOrderItems, createOrder, type NewOrderItem, type OrderType } from "@/lib/data/restaurant";
import type { MenuCategoryRow, MenuItemRow } from "@/lib/data/esnaf";

interface CartLine {
  key: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes: string;
}

/** Ported from mobile's siparis_ekle_screen.dart (item-picker/cart portion —
 * extras/top-sellers not ported, see PROGRESS.md). Handles both opening a
 * brand-new order (dine-in/takeaway/delivery) and adding items to an
 * already-open tab. */
export function ItemPickerDialog({
  open,
  onClose,
  businessId,
  categories,
  items,
  target,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  categories: MenuCategoryRow[];
  items: MenuItemRow[];
  target:
    | { mode: "existing"; orderId: string }
    | { mode: "new"; orderType: OrderType; tableId: string | null; defaultGuestCount: number };
  onDone: () => void;
}) {
  const router = useRouter();
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [guestCount, setGuestCount] = useState(target.mode === "new" ? target.defaultGuestCount : 1);
  const [customerName, setCustomerName] = useState("");
  const [saving, setSaving] = useState(false);

  const visibleItems = useMemo(() => {
    let list = items.filter((i) => i.is_active && i.is_available);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    } else if (activeCategoryId !== "all") {
      list = list.filter((i) => i.category_id === activeCategoryId);
    }
    return list;
  }, [items, search, activeCategoryId]);

  function addToCart(item: MenuItemRow) {
    setCart((prev) => {
      const existing = prev.find((l) => l.menuItemId === item.id && !l.notes);
      if (existing) return prev.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));
      return [
        ...prev,
        { key: crypto.randomUUID(), menuItemId: item.id, name: item.name, unitPrice: Number(item.price), quantity: 1, notes: "" },
      ];
    });
  }
  function updateLine(key: string, patch: Partial<CartLine>) {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function removeLine(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  function handleClose() {
    setCart([]);
    setSearch("");
    setCustomerName("");
    onClose();
  }

  const total = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  async function handleConfirm() {
    if (cart.length === 0) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const orderItems: NewOrderItem[] = cart.map((l) => ({
        menuItemId: l.menuItemId,
        name: l.name,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        notes: l.notes || null,
      }));

      let orderId: string;
      if (target.mode === "existing") {
        orderId = target.orderId;
      } else {
        orderId = await createOrder(supabase, {
          businessId,
          userId: user.id,
          tableId: target.tableId,
          orderType: target.orderType,
          guestCount: target.orderType === "dine_in" ? guestCount : null,
          customerName: target.orderType === "dine_in" ? null : customerName.trim() || null,
        });
      }
      await addOrderItems(supabase, businessId, user.id, orderId, orderItems);
      handleClose();
      onDone();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Sipariş Ekle" className="max-w-2xl">
      <div className="space-y-4">
        {target.mode === "new" && target.orderType === "dine_in" && (
          <div>
            <Label htmlFor="guest-count">Kişi Sayısı</Label>
            <Input
              id="guest-count"
              type="number"
              min={1}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-24"
            />
          </div>
        )}
        {target.mode === "new" && target.orderType !== "dine_in" && (
          <div>
            <Label htmlFor="customer-name">
              {target.orderType === "delivery" ? "Müşteri adı / adres notu" : "Müşteri adı (isteğe bağlı)"}
            </Label>
            <Input id="customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
        )}

        <Input placeholder="Ürün ara…" value={search} onChange={(e) => setSearch(e.target.value)} />

        {!search.trim() && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategoryId("all")}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium",
                activeCategoryId === "all" ? "border-accent bg-accent text-on-accent" : "border-border text-text-secondary",
              )}
            >
              Tümü
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategoryId(c.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm font-medium",
                  activeCategoryId === c.id ? "border-accent bg-accent text-on-accent" : "border-border text-text-secondary",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {visibleItems.length === 0 ? (
          <EmptyState icon={UtensilsCrossed} title="Ürün bulunamadı" />
        ) : (
          <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addToCart(item)}
                className="rounded-control border border-border p-2 text-left hover:border-accent hover:bg-accent/5"
              >
                <p className="truncate text-sm font-medium text-text-primary">{item.name}</p>
                <p className="text-xs text-text-secondary">{formatCurrency(Number(item.price))}</p>
              </button>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            {cart.map((line) => (
              <div key={line.key} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{line.name}</span>
                <button
                  type="button"
                  aria-label="Azalt"
                  onClick={() => (line.quantity > 1 ? updateLine(line.key, { quantity: line.quantity - 1 }) : removeLine(line.key))}
                  className="flex h-7 w-7 items-center justify-center rounded-control border border-border text-text-secondary"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-sm">{line.quantity}</span>
                <button
                  type="button"
                  aria-label="Artır"
                  onClick={() => updateLine(line.key, { quantity: line.quantity + 1 })}
                  className="flex h-7 w-7 items-center justify-center rounded-control border border-border text-text-secondary"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <span className="w-16 shrink-0 text-right text-sm font-medium text-text-primary">
                  {formatCurrency(line.unitPrice * line.quantity)}
                </span>
                <button
                  type="button"
                  aria-label={`"${line.name}" satırını kaldır`}
                  onClick={() => removeLine(line.key)}
                  className="text-text-secondary hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="font-medium text-text-secondary">Toplam</span>
          <span className="font-display text-lg font-bold text-text-primary">{formatCurrency(total)}</span>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>
            İptal
          </Button>
          <Button type="button" disabled={saving || cart.length === 0} onClick={handleConfirm}>
            {saving ? "Kaydediliyor…" : "Ekle"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
