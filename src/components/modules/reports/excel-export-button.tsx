"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportBudgetToExcel } from "@/lib/income/export";
import { formatShortDateTR } from "@/lib/utils/date";
import type { ReportData } from "@/lib/data/reports";

/** Reuses the same 5-sheet workbook as /income's export — mobile's
 * summary_dashboard_screen.dart calls the identical ExportService().exportToExcel()
 * with the report's own date range instead of the current month. */
export function ExcelExportButton({ data }: { data: ReportData }) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await exportBudgetToExcel({
        periodLabel: `${formatShortDateTR(data.start)} - ${formatShortDateTR(data.end)}`,
        incomes: data.incomes,
        fixedExpenses: data.fixedExpenses,
        expenses: data.expenses,
        incomeCategoryMap: data.incomeCategoryMap,
        fixedCategoryMap: data.fixedCategoryMap,
        itemCategoryNamesById: data.categoryNamesByItemCategoryId,
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleExport} disabled={exporting} className="gap-1.5 print:hidden">
      <FileSpreadsheet className="h-4 w-4" /> {exporting ? "Hazırlanıyor…" : "Excel'e Aktar"}
    </Button>
  );
}
