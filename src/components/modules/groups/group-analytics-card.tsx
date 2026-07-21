"use client";

import { useState } from "react";
import { PieChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { PeriodSelector } from "@/components/ui/period-selector";
import { EmptyState } from "@/components/ui/empty-state";
import { DonutBreakdown } from "@/components/modules/analytics/donut-breakdown";
import { StoreBreakdownChart } from "@/components/modules/analytics/store-breakdown-chart";
import type { CategoryBreakdownPoint, StoreBreakdownPoint } from "@/lib/data/analytics";

const SECTIONS = [
  { value: "category", label: "Kategori Dağılımı" },
  { value: "parent", label: "Genel Kategoriler" },
  { value: "store", label: "Market Analizi" },
];

/** Grup içi grafikli analiz — kişisel Analiz sayfasındaki aynı grafik
 * bileşenlerini (DonutBreakdown/StoreBreakdownChart) grup harcamalarına
 * uygulıyor. Bu üç kırılım mobil uygulamada da yok — kullanıcı isteğiyle
 * web'e özel eklendi (bkz. PROGRESS.md). */
export function GroupAnalyticsCard({
  period,
  categoryBreakdown,
  parentBreakdown,
  storeBreakdown,
}: {
  period: string;
  categoryBreakdown: CategoryBreakdownPoint[];
  parentBreakdown: CategoryBreakdownPoint[];
  storeBreakdown: StoreBreakdownPoint[];
}) {
  const [section, setSection] = useState("category");
  const data = section === "category" ? categoryBreakdown : section === "parent" ? parentBreakdown : null;

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold text-text-primary">Grup Analizi</h2>
        <PeriodSelector period={period} />
      </div>

      <Tabs options={SECTIONS} value={section} onChange={setSection} className="mb-4" />

      {section === "store" ? (
        storeBreakdown.length === 0 ? (
          <EmptyState icon={PieChart} title="Bu dönem için veri yok" />
        ) : (
          <StoreBreakdownChart stores={storeBreakdown} />
        )
      ) : !data || data.length === 0 ? (
        <EmptyState icon={PieChart} title="Bu dönem için veri yok" />
      ) : (
        <DonutBreakdown data={data} />
      )}
    </Card>
  );
}
