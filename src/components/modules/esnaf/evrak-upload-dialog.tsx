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
import { scanBusinessDocument } from "@/lib/esnaf/scan";
import type { BusinessRow } from "@/lib/types/esnaf";

interface DraftItem {
  id: string;
  file: File;
  previewUrl: string;
  status: "scanning" | "done" | "error";
  counterparty: string;
  date: string;
  amount: number;
  invoiceType: "giden" | "gelen";
}

export function EvrakUploadDialog({
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

  async function handleFiles(files: File[]) {
    const supabase = createClient();
    const newDrafts: DraftItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "scanning",
      counterparty: "",
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      invoiceType: "gelen",
    }));
    setDrafts((prev) => [...prev, ...newDrafts]);

    for (const draft of newDrafts) {
      try {
        const result = await scanBusinessDocument(supabase, draft.file);
        updateDraft(draft.id, {
          status: "done",
          counterparty: result.counterparty,
          date: result.date,
          amount: result.amount,
        });
      } catch {
        updateDraft(draft.id, { status: "error" });
      }
    }
  }

  function removeDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  async function saveAll() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    try {
      const savable = drafts.filter((d) => d.status !== "scanning");
      for (let i = 0; i < savable.length; i++) {
        const draft = savable[i];
        const ext = draft.file.name.split(".").pop() || "jpg";
        const path = `${user.id}/esnaf/${business.id}/${Date.now()}_${i}.${ext}`;

        let imageUrl: string | null = null;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(path, draft.file);
        if (!uploadError) {
          const { data: signed } = await supabase.storage
            .from("receipts")
            .createSignedUrl(path, 60 * 60 * 24 * 365);
          imageUrl = signed?.signedUrl ?? null;
        }

        const rate = business.vat_enabled ? Number(business.default_vat) : 0;
        const vatAmount = (Number(draft.amount) * rate) / 100;

        await supabase.from("invoices").insert({
          business_id: business.id,
          user_id: user.id,
          invoice_type: draft.invoiceType,
          counterparty: draft.counterparty || null,
          amount: Number(draft.amount),
          vat_rate: rate,
          vat_amount: vatAmount,
          total_with_vat: Number(draft.amount) + vatAmount,
          status: "bekliyor",
          invoice_date: draft.date,
          image_url: imageUrl,
        });
      }

      setDrafts([]);
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const doneOrErrorCount = drafts.filter((d) => d.status !== "scanning").length;

  return (
    <Dialog open={open} onClose={onClose} title="Evrak Tara" className="max-w-2xl">
      <div className="space-y-4">
        <DropzoneUploader
          multiple
          disabled={saving}
          onFiles={handleFiles}
          onRejected={setNotice}
          title="Fatura, makbuz veya belge fotoğrafını buraya sürükle ya da tıkla"
          subtitle="JPEG veya PNG, maks. 5 MB"
          multiSubtitle="Birden fazla belgeyi aynı anda seçip toplu (seri) tarayabilirsin"
        />
        {notice && <p className="text-sm text-danger">{notice}</p>}

        {drafts.length > 0 && (
          <div className="max-h-[45vh] space-y-3 overflow-y-auto">
            {drafts.map((d) => (
              <div key={d.id} className="rounded-control border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Badge tone={d.status === "done" ? "success" : d.status === "error" ? "danger" : "neutral"}>
                    {d.status === "scanning" && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}
                    {d.status === "scanning" ? "Taranıyor" : d.status === "done" ? "Okundu" : "Okunamadı"}
                  </Badge>
                  <button type="button" onClick={() => removeDraft(d.id)} aria-label="Kaldır">
                    <Trash2 className="h-4 w-4 text-text-secondary hover:text-danger" />
                  </button>
                </div>
                {d.status !== "scanning" && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="col-span-2">
                      <Label className="text-xs">Karşı Taraf</Label>
                      <Input
                        value={d.counterparty}
                        onChange={(e) => updateDraft(d.id, { counterparty: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tarih</Label>
                      <Input
                        type="date"
                        value={d.date}
                        onChange={(e) => updateDraft(d.id, { date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tutar</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={d.amount}
                        onChange={(e) => updateDraft(d.id, { amount: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-4">
                      <Label className="text-xs">Tip</Label>
                      <Select
                        value={d.invoiceType}
                        onChange={(e) =>
                          updateDraft(d.id, { invoiceType: e.target.value as "giden" | "gelen" })
                        }
                      >
                        <option value="gelen">Gelen (Aldığım)</option>
                        <option value="giden">Giden (Kestiğim)</option>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Kapat
          </Button>
          <Button onClick={saveAll} disabled={saving || doneOrErrorCount === 0}>
            {saving ? "Kaydediliyor…" : `Tümünü Kaydet (${doneOrErrorCount})`}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
