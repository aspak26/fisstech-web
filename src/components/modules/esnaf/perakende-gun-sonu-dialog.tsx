"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropzoneUploader } from "@/components/modules/scan/dropzone-uploader";
import { fileToBase64 } from "@/lib/scan/scanClient";
import { uploadReceipts } from "@/lib/scan/saveExpense";
import { createScannedTransaction } from "@/lib/data/perakende";

interface DraftItem {
  id: string;
  file: File;
  status: "scanning" | "done" | "error";
  amount: number;
}

/** Ported from mobile's gece_scan_screen.dart — gün sonunda birikmiş kağıt
 * fişleri toplu tarayıp her birini ayrı, sepetsiz bir perakende_transactions
 * kaydına (manuel toplam + fiş görseli) dönüştürür. Aynı `scan-receipt`
 * fonksiyonunu (Evrak Arşivi'ndeki gibi) boş kategori listesiyle kullanıyor —
 * sadece toplam tutar çıkarımı yeterli. */
export function PerakendeGunSonuDialog({
  open,
  onClose,
  businessId,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
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
    }));
    setDrafts((prev) => [...prev, ...newDrafts]);

    for (const draft of newDrafts) {
      try {
        const base64 = await fileToBase64(draft.file);
        const { data, error } = await supabase.functions.invoke<{ total?: number; error?: string }>(
          "scan-receipt",
          { body: { image_base64: base64, categories: [] } },
        );
        if (error || !data || data.error || !data.total) throw new Error("scan failed");
        updateDraft(draft.id, { status: "done", amount: data.total });
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
        const urls = await uploadReceipts(supabase, user.id, [draft.file]);
        await createScannedTransaction(supabase, {
          businessId,
          userId: user.id,
          amount: draft.amount,
          imageUrl: urls[0] ?? null,
        });
      }
      handleClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const savableCount = drafts.filter((d) => d.status !== "scanning" && d.amount > 0).length;

  return (
    <Dialog open={open} onClose={handleClose} title="Gün Sonu Toplu Fiş Tarama" className="max-w-2xl">
      <div className="space-y-4">
        <DropzoneUploader
          multiple
          disabled={saving}
          onFiles={handleFiles}
          onRejected={setNotice}
          title="Gün içindeki kağıt fişleri buraya sürükle ya da tıkla"
          subtitle="JPEG veya PNG, maks. 5 MB"
          multiSubtitle="Birden fazla fişi aynı anda seçip toplu tarayabilirsin"
        />
        {notice && <p className="text-sm text-danger">{notice}</p>}

        {drafts.length > 0 && (
          <div className="max-h-[45vh] space-y-3 overflow-y-auto">
            {drafts.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-control border border-border p-3">
                <Badge tone={d.status === "done" ? "success" : d.status === "error" ? "danger" : "neutral"}>
                  {d.status === "scanning" && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}
                  {d.status === "scanning" ? "Taranıyor" : d.status === "done" ? "Okundu" : "Okunamadı"}
                </Badge>
                {d.status !== "scanning" && (
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
                )}
                <button type="button" onClick={() => removeDraft(d.id)} aria-label="Kaldır">
                  <Trash2 className="h-4 w-4 text-text-secondary hover:text-danger" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3">
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
