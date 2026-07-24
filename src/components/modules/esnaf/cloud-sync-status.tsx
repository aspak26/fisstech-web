"use client";

import { Cloud, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BusinessRow } from "@/lib/types/esnaf";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function CloudSyncStatus({ business }: { business: BusinessRow }) {
  const [downloading, setDownloading] = useState(false);

  async function handleExport() {
    setDownloading(true);
    try {
      const supabase = createClient();
      
      const { data: incomes } = await supabase
        .from("business_incomes")
        .select("amount, description, transaction_date")
        .eq("business_id", business.id)
        .order("transaction_date", { ascending: false });

      const { data: expenses } = await supabase
        .from("business_expenses")
        .select("amount, category, description, expense_date")
        .eq("business_id", business.id)
        .order("expense_date", { ascending: false });

      let csv = "Tarih,Tur,Tutar,Kategori,Aciklama\n";
      
      if (incomes) {
        for (const inc of incomes) {
          csv += `${inc.transaction_date},Gelir,${inc.amount},-,${inc.description || ""}\n`;
        }
      }
      if (expenses) {
        for (const exp of expenses) {
          csv += `${exp.expense_date},Gider,${exp.amount},${exp.category},${exp.description || ""}\n`;
        }
      }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${business.name.replace(/\s+/g, '_')}_finansal_veriler.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 transition-colors hover:bg-surface-hover gap-4">
      <div className="flex items-center gap-3">
        <Cloud className="h-5 w-5 text-accent" />
        <div>
          <span className="font-medium text-text-primary block">Bulut Yedekleme & Dışa Aktarım</span>
          <span className="text-xs text-text-secondary flex items-center gap-1 mt-1">
            <CheckCircle2 className="h-3 w-3 text-success" /> Gerçek zamanlı senkronize edildi
          </span>
        </div>
      </div>
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={handleExport} 
        disabled={downloading}
        className="gap-2 shrink-0"
      >
        <Download className="h-4 w-4" />
        {downloading ? "İndiriliyor..." : "CSV Olarak İndir"}
      </Button>
    </div>
  );
}
