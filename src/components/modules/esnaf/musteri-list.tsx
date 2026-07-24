"use client";

import { Contact } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import type { UniversalCustomerRow } from "@/lib/data/customers";
import type { BusinessRow } from "@/lib/types/esnaf";

export function MusteriList({
  business,
  customers,
}: {
  business: BusinessRow;
  customers: UniversalCustomerRow[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Tüm müşterileriniz burada listelenir. Sektörünüze özel detaylar dahil edilmiştir.
        </p>
      </div>

      <Card>
        {customers.length === 0 ? (
          <EmptyState
            icon={Contact}
            title="Henüz müşteri kaydı yok"
            description="Bu işletmeye ait müşteri kaydı bulunamadı."
          />
        ) : (
          <ul className="divide-y divide-border">
            {customers.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">{c.name}</p>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    {c.phone && <span>{c.phone}</span>}
                    {c.notes && <span className="truncate max-w-[200px]">| {c.notes}</span>}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {c.type_specific_data?.vehicle_plate && (
                    <Badge tone="accent">Plaka: {c.type_specific_data.vehicle_plate}</Badge>
                  )}
                  {c.type_specific_data?.current_debt !== undefined && (
                    <Badge tone={c.type_specific_data.current_debt > 0 ? "danger" : "neutral"}>
                      Bakiye: {Number(c.type_specific_data.current_debt)} TL
                    </Badge>
                  )}
                  {c.type_specific_data?.credit_limit !== undefined && (
                    <Badge tone="neutral">Limit: {Number(c.type_specific_data.credit_limit)} TL</Badge>
                  )}
                  {c.type_specific_data?.company && (
                    <Badge tone="neutral">{c.type_specific_data.company}</Badge>
                  )}
                  {c.type_specific_data?.email && (
                    <Badge tone="neutral">{c.type_specific_data.email}</Badge>
                  )}
                  {c.type_specific_data?.budget !== undefined && (
                    <Badge tone="success">Bütçe: {Number(c.type_specific_data.budget)} TL</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
