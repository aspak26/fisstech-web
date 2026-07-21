"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, Banknote, CreditCard, HandCoins, ShoppingCart, ScanLine, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { createTransaction, searchProductByCode, type CartLine } from "@/lib/data/perakende";
import type { PerakendeCustomerRow, ProductCategoryRow, ProductVariationRow, QuickProductWithVariations } from "@/lib/types/esnaf";
import { PerakendeCustomerPickerDialog } from "./perakende-customer-picker-dialog";
import { PerakendeGunSonuDialog } from "./perakende-gun-sonu-dialog";

interface Line extends CartLine {
  key: string;
}

export function PerakendePos({
  businessId,
  categories,
  products,
  customers,
}: {
  businessId: string;
  categories: ProductCategoryRow[];
  products: QuickProductWithVariations[];
  customers: PerakendeCustomerRow[];
}) {
  const router = useRouter();
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">("all");
  const [cart, setCart] = useState<Line[]>([]);
  const [saving, setSaving] = useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [pluCode, setPluCode] = useState("");
  const [variationPicker, setVariationPicker] = useState<QuickProductWithVariations | null>(null);
  const [gunSonuOpen, setGunSonuOpen] = useState(false);

  const visibleProducts = useMemo(() => {
    const byCategory = activeCategoryId === "all" ? products : products.filter((p) => p.category_id === activeCategoryId);
    if (!pluCode.trim()) return byCategory;
    return products.filter((p) => p.product_code?.startsWith(pluCode.trim()));
  }, [products, activeCategoryId, pluCode]);

  const total = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  function addProduct(product: QuickProductWithVariations, variation: ProductVariationRow | null = null) {
    const key = variation ? `${product.id}:${variation.id}` : product.id;
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          productName: product.name,
          variationLabel: variation?.label ?? null,
          quantity: 1,
          unitPrice: variation ? Number(variation.price) : Number(product.price),
        },
      ];
    });
  }

  function handleProductClick(product: QuickProductWithVariations) {
    if (product.has_variations && product.product_variations.length > 0) {
      setVariationPicker(product);
    } else {
      addProduct(product);
    }
  }

  // Ported from mobile's hizli_kasa_screen.dart _onPluChanged — 2+ haneli
  // tam eşleşme bulunca sepete otomatik eklenip alan temizleniyor.
  useEffect(() => {
    const code = pluCode.trim();
    if (code.length < 2) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const product = await searchProductByCode(supabase, businessId, code);
      if (cancelled || !product) return;
      setPluCode("");
      handleProductClick(product);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pluCode, businessId]);

  function changeQuantity(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: Math.max(0, Number((l.quantity + delta).toFixed(3))) } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  async function completeSale(paymentMethod: "nakit" | "kart" | "veresiye", customerId: string | null = null) {
    if (cart.length === 0) return;
    setSaving(true);
    setNotice(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await createTransaction(supabase, {
        businessId,
        userId: user.id,
        customerId,
        paymentMethod,
        lines: cart.map((line) => ({
          productId: line.productId,
          productName: line.productName,
          variationLabel: line.variationLabel,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
      });
      setCart([]);
      setNotice("Satış kaydedildi.");
      router.refresh();
    } catch {
      setNotice("Satış kaydedilemedi, lütfen tekrar dene.");
    } finally {
      setSaving(false);
    }
  }

  function handlePayment(method: "nakit" | "kart" | "veresiye") {
    if (method === "veresiye") {
      setCustomerPickerOpen(true);
      return;
    }
    completeSale(method);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <Input
              placeholder="# PLU kodu gir..."
              value={pluCode}
              onChange={(e) => setPluCode(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => setGunSonuOpen(true)} className="gap-1.5 shrink-0">
            <Camera className="h-4 w-4" /> Gün Sonu Tara
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategoryId("all")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              activeCategoryId === "all"
                ? "border-accent bg-accent text-on-accent"
                : "border-border bg-surface text-text-secondary hover:border-accent",
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
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                activeCategoryId === c.id
                  ? "border-accent bg-accent text-on-accent"
                  : "border-border bg-surface text-text-secondary hover:border-accent",
              )}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>

        <Card>
          {visibleProducts.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="Ürün yok" description="Önce Ürünler sekmesinden ürün ekle." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visibleProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductClick(product)}
                  className="rounded-control border border-border p-3 text-left transition-colors hover:border-accent hover:bg-accent/5"
                >
                  <p className="truncate font-medium text-text-primary">{product.name}</p>
                  <p className="text-sm text-text-secondary">
                    {product.has_variations ? "Varyasyonlu" : formatCurrency(Number(product.price))}
                  </p>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="flex h-fit flex-col gap-3 lg:sticky lg:top-4">
        <h2 className="font-display text-base font-semibold text-text-primary">Sepet</h2>
        {cart.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-secondary">Ürüne tıklayarak sepete ekle</p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {cart.map((line) => (
              <li key={line.key} className="flex items-center gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-text-primary">
                    {line.productName}
                    {line.variationLabel ? ` (${line.variationLabel})` : ""}
                  </p>
                  <p className="text-text-secondary">{formatCurrency(line.unitPrice * line.quantity)}</p>
                </div>
                <button
                  type="button"
                  aria-label="Azalt"
                  onClick={() => changeQuantity(line.key, -1)}
                  className="flex h-7 w-7 items-center justify-center rounded-control border border-border text-text-secondary hover:border-accent"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-text-primary">{line.quantity}</span>
                <button
                  type="button"
                  aria-label="Artır"
                  onClick={() => changeQuantity(line.key, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-control border border-border text-text-secondary hover:border-accent"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Kaldır"
                  onClick={() => removeLine(line.key)}
                  className="flex h-7 w-7 items-center justify-center rounded-control text-text-secondary hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="font-medium text-text-secondary">Toplam</span>
          <span className="font-display text-xl font-bold text-text-primary">{formatCurrency(total)}</span>
        </div>

        {notice && <p className="text-sm text-text-secondary">{notice}</p>}

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={saving || cart.length === 0}
            onClick={() => handlePayment("nakit")}
            className="flex-col gap-1 py-3"
          >
            <Banknote className="h-4 w-4" /> Nakit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={saving || cart.length === 0}
            onClick={() => handlePayment("kart")}
            className="flex-col gap-1 py-3"
          >
            <CreditCard className="h-4 w-4" /> Kart
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={saving || cart.length === 0}
            onClick={() => handlePayment("veresiye")}
            className="flex-col gap-1 py-3"
          >
            <HandCoins className="h-4 w-4" /> Veresiye
          </Button>
        </div>
      </Card>

      <PerakendeCustomerPickerDialog
        open={customerPickerOpen}
        onClose={() => setCustomerPickerOpen(false)}
        businessId={businessId}
        customers={customers}
        onSelect={(customerId) => {
          setCustomerPickerOpen(false);
          completeSale("veresiye", customerId);
        }}
      />

      <Dialog open={!!variationPicker} onClose={() => setVariationPicker(null)} title={variationPicker?.name ?? ""}>
        <div className="space-y-1">
          {variationPicker?.product_variations.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                addProduct(variationPicker, v);
                setVariationPicker(null);
              }}
              className="flex w-full items-center justify-between rounded-control px-3 py-2.5 text-left hover:bg-bg"
            >
              <span className="text-text-primary">{v.label}</span>
              <span className="font-medium text-accent">{formatCurrency(Number(v.price))}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              if (variationPicker) addProduct(variationPicker);
              setVariationPicker(null);
            }}
            className="flex w-full items-center gap-2 rounded-control px-3 py-2.5 text-left text-text-secondary hover:bg-bg"
          >
            <Plus className="h-4 w-4" /> Varyasyonsuz ekle (temel fiyat)
          </button>
        </div>
      </Dialog>

      <PerakendeGunSonuDialog open={gunSonuOpen} onClose={() => setGunSonuOpen(false)} businessId={businessId} />
    </div>
  );
}
