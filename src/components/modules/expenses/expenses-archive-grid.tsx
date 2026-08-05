"use client";

import Link from "next/link";
import { Copy, ImageIcon } from "lucide-react";
import type { ExpenseWithItems } from "@/lib/data/expenses";
import { EmptyState } from "@/components/ui/empty-state";
import { dateGroupLabel } from "@/lib/utils/date";

export function ExpensesArchiveGrid({ expenses }: { expenses: ExpenseWithItems[] }) {
  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="Bu dönemde fotoğraflı fişiniz yok"
        description="Henüz fiş okutmadınız veya dönemi değiştirerek eski fişlerinize bakabilirsiniz."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {expenses.map((expense) => {
        // receipt_image_url virgülle ayrılmış birden fazla URL içerebilir
        const urls = expense.receipt_image_url?.split(",") ?? [];
        if (urls.length === 0) return null;
        
        const firstUrl = urls[0].trim();
        if (!firstUrl) return null;

        return (
          <Link
            key={expense.id}
            href={`/expenses/${expense.id}`}
            className="group relative flex aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:ring-2 hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={firstUrl}
              alt={expense.store_name || "Fiş Fotoğrafı"}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />

            {urls.length > 1 && (
              <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                <Copy className="h-3 w-3" />
                <span>{urls.length}</span>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
              <p className="truncate text-sm font-semibold text-white">
                {expense.store_name || "Manuel Giriş"}
              </p>
              <p className="text-xs text-white/80">
                {dateGroupLabel(expense.date)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
