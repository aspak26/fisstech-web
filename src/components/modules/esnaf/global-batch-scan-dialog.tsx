"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropzoneUploader } from "@/components/modules/scan/dropzone-uploader";
import { fileToBase64 } from "@/lib/scan/scanClient";
import { uploadReceipts } from "@/lib/scan/saveExpense";
import type { BusinessRow } from "@/lib/types/esnaf";

interface DraftItem {
  id: string;
  file: File;
  status: "scanning" | "done" | "error";
  amount: number;
  category: string;
}

const CATEGORIES = ["genel", "kira", "fatura", "malzeme", "personel", "diger"];

export function GlobalBatchScanDialog({
  open,
  onClose,
  business,
}: {
  open: boolean;
  onClose: () => void;
  business: BusinessRow;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateDraft(id: string, patch: Partial<DraftItem>) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }
  function removeDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }
  function handleClose() {
    setDrafts([]);
    setNotice(null);
    onClose();
  }

  async function handleFiles(files: File[]) {
    const supabase = createClient();
    const newDrafts: DraftItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "scanning",
      amount: 0,
      category: "genel",
    }));
    setDrafts((prev) => [...prev, ...newDrafts]);

    for (const draft of newDrafts) {
      try {
        const base64 = await fileToBase64(draft.file);
        const { data, error } = await supabase.functions.invoke<{ total?: number; category?: string; error?: string }>(
          "scan-receipt",
          { body: { image_base64: base64, categories: CATEGORIES } },
        );
        if (error || !data || data.error || !data.total) throw new Error("scan failed");
        
        let cat = "genel";
        if (data.category && CATEGORIES.includes(data.category)) {
          cat = data.category;
        }

        updateDraft(draft.id, { status: "done", amount: data.total, category: cat });
      } catch {
        updateDraft(draft.id, { status: "error" });
      }
    }
  }

  async function saveAll() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    try {
      const savable = drafts.filter((d) => d.status !== "scanning" && d.amount > 0);
      for (const draft of savable) {
        // Upload image
        const urls = await uploadReceipts(supabase, user.id, [draft.file]);
        const imageUrl = urls[0] ?? null;

        // KDV calculation
        const rate = business.vat_enabled ? Number(business.default_vat) : 0;
        const vatAmount = rate > 0 ? (draft.amount * rate) / (100 + rate) : 0;

        // Save to business_expenses
        await supabase.from("business_expenses").insert({
          business_id: business.id,
          user_id: user.id,
          amount: draft.amount,
          category: draft.category,
          description: "Toplu AI Tarama",
          payment_method: "cash",
          vat_rate: rate,
          vat_amount: vatAmount,
          expense_date: new Date().toISOString().slice(0, 10),
        });

        // Also save to evrak/invoices if we have an image
        if (imageUrl) {
          await supabase.from("invoices").insert({
            business_id: business.id,
            user_id: user.id,
            invoice_date: new Date().toISOString().slice(0, 10),
            invoice_type: "giden",
            total_with_vat: draft.amount,
            image_url: imageUrl,
            counterparty: "Toplu Fiş Tarama",
          });
        }
      }
      handleClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const savableCount = drafts.filter((d) => d.status !== "scanning" && d.amount > 0).length;

  return (
    <Dialog open={open} onClose={handleClose} title="Toplu Fiş Tarama (AI)" className="max-w-2xl">
      <div className="space-y-4">
        <DropzoneUploader
          multiple
          disabled={saving}
          onFiles={handleFiles}
          onRejected={setNotice}
          title="Gün içindeki fiş/faturaları buraya sürükle ya da tıkla"
          subtitle="Taranan fişler Kasa Defterine (Gider) ve Evrak Arşivine eklenir."
          multiSubtitle="Birden fazla belge seçip tarayabilirsiniz"
        />
        {notice && <p className="text-sm text-danger">{notice}</p>}

        {drafts.length > 0 && (
          <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {drafts.map((d) => (
              <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-control border border-border p-3">
                <div className="flex items-center gap-2">
                  <Badge tone={d.status === "done" ? "success" : d.status === "error" ? "danger" : "neutral"}>
                    {d.status === "scanning" && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}
                    {d.status === "scanning" ? "Taranıyor" : d.status === "done" ? "Okundu" : "Hata"}
                  </Badge>
                </div>
                {d.status !== "scanning" && (
                  <div className="flex flex-1 items-center gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Tutar</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={d.amount}
                        onChange={(e) => updateDraft(d.id, { amount: Number(e.target.value) })}
                        className="h-8"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Kategori</Label>
                      <Select 
                        value={d.category}
                        onChange={(e) => updateDraft(d.id, { category: e.target.value })}
                        className="h-8"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </Select>
                    </div>
                  </div>
                )}
                <button type="button" onClick={() => removeDraft(d.id)} aria-label="Kaldır" className="mt-2 sm:mt-0 self-end sm:self-auto">
                  <Trash2 className="h-4 w-4 text-text-secondary hover:text-danger" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>
            Kapat
          </Button>
          <Button onClick={saveAll} disabled={saving || savableCount === 0}>
            {saving ? "Kaydediliyor…" : `Tümünü Kaydet (${savableCount})`}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
