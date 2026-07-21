"use client";

import { useMemo, useState } from "react";
import { Plus, Tags, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { deleteQuickProduct } from "@/lib/data/perakende";
import type { ProductCategoryRow, QuickProductWithVariations } from "@/lib/types/esnaf";
import { PerakendeCategoryDialog } from "./perakende-category-dialog";
import { PerakendeProductDialog } from "./perakende-product-dialog";

const UNIT_LABELS: Record<string, string> = { adet: "adet", gram: "g", kg: "kg", litre: "L" };

export function PerakendeProductsList({
  businessId,
  categories,
  products,
}: {
  businessId: string;
  categories: ProductCategoryRow[];
  products: QuickProductWithVariations[];
}) {
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editing, setEditing] = useState<QuickProductWithVariations | undefined>(undefined);
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">("all");

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const visibleProducts = useMemo(
    () => (activeCategoryId === "all" ? products : products.filter((p) => p.category_id === activeCategoryId)),
    [products, activeCategoryId],
  );

  function openAdd() {
    setEditing(undefined);
    setProductDialogOpen(true);
  }

  function openEdit(product: QuickProductWithVariations) {
    setEditing(product);
    setProductDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
          <button
            type="button"
            onClick={() => setCategoryDialogOpen(true)}
            className="flex items-center gap-1 rounded-full border border-dashed border-border px-3.5 py-1.5 text-sm font-medium text-accent hover:border-accent"
          >
            <Tags className="h-3.5 w-3.5" /> Kategori Ekle
          </button>
        </div>
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Ürün Ekle
        </Button>
      </div>

      <Card>
        {visibleProducts.length === 0 ? (
          <EmptyState icon={Tags} title="Henüz ürün yok" description="Kasada satabilmek için önce ürün ekle." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleProducts.map((product) => {
              const category = categoryMap.get(product.category_id ?? "");
              return (
                <div key={product.id} className="rounded-control border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate font-medium text-text-primary">
                      {category?.emoji ?? "📦"} {product.name}
                    </p>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label="Düzenle"
                        onClick={() => openEdit(product)}
                        className="flex h-7 w-7 items-center justify-center rounded-control text-text-secondary hover:bg-bg hover:text-accent"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <DeleteButton
                        confirmMessage={`"${product.name}" silinsin mi?`}
                        onDelete={() => deleteQuickProduct(createClient(), product.id)}
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    {formatCurrency(Number(product.price))} / {UNIT_LABELS[product.unit_type] ?? product.unit_type}
                  </p>
                  {(product.product_code || product.has_variations) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {product.product_code && (
                        <span className="rounded-full bg-bg px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                          PLU {product.product_code}
                        </span>
                      )}
                      {product.has_variations && (
                        <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                          {product.product_variations.length} varyasyon
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <PerakendeCategoryDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        businessId={businessId}
      />
      <PerakendeProductDialog
        key={editing?.id ?? "new"}
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        businessId={businessId}
        categories={categories}
        product={editing}
      />
    </div>
  );
}
