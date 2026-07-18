"use client";

import { useState } from "react";
import { Plus, UtensilsCrossed } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import {
  deleteMenuCategory,
  deleteMenuItem,
  type MenuCategoryRow,
  type MenuItemRow,
} from "@/lib/data/esnaf";
import type { BusinessRow } from "@/lib/types/esnaf";
import { MenuCategoryDialog } from "./menu-category-dialog";
import { MenuItemDialog } from "./menu-item-dialog";

export function MenuList({
  business,
  categories,
  items,
}: {
  business: BusinessRow;
  categories: MenuCategoryRow[];
  items: MenuItemRow[];
}) {
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);

  const itemsByCategory = new Map<string | null, MenuItemRow[]>();
  for (const item of items) {
    const key = item.category_id;
    itemsByCategory.set(key, [...(itemsByCategory.get(key) ?? []), item]);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setCategoryDialogOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Kategori Ekle
        </Button>
        <Button onClick={() => setItemDialogOpen(true)} disabled={categories.length === 0} className="gap-1.5">
          <Plus className="h-4 w-4" /> Ürün Ekle
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={UtensilsCrossed}
            title="Henüz menü kategorisi yok"
            description="Önce bir kategori oluştur (örn. Sıcak İçecekler), sonra ürün ekleyebilirsin."
          />
        </Card>
      ) : (
        categories.map((cat) => (
          <Card key={cat.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>{cat.name}</CardTitle>
                <Badge tone="neutral">{(itemsByCategory.get(cat.id) ?? []).length} ürün</Badge>
              </div>
              <DeleteButton
                confirmMessage={`"${cat.name}" kategorisi silinsin mi? İçindeki ürünler kategorisiz kalır.`}
                onDelete={() => deleteMenuCategory(createClient(), cat.id)}
              />
            </CardHeader>
            {(itemsByCategory.get(cat.id) ?? []).length === 0 ? (
              <p className="py-2 text-sm text-text-secondary">Bu kategoride ürün yok</p>
            ) : (
              <ul className="divide-y divide-border">
                {(itemsByCategory.get(cat.id) ?? []).map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-text-primary">{item.name}</p>
                      {item.prep_minutes > 0 && (
                        <p className="text-sm text-text-secondary">~{item.prep_minutes} dk</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-text-primary">
                        {formatCurrency(Number(item.price))}
                      </span>
                      <DeleteButton
                        confirmMessage={`"${item.name}" silinsin mi?`}
                        onDelete={() => deleteMenuItem(createClient(), item.id)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))
      )}

      <MenuCategoryDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        business={business}
        sortOrder={categories.length}
      />
      <MenuItemDialog
        open={itemDialogOpen}
        onClose={() => setItemDialogOpen(false)}
        business={business}
        categories={categories}
      />
    </div>
  );
}
