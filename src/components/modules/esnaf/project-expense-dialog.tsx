"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ScanLine } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { DropzoneUploader } from "@/components/modules/scan/dropzone-uploader";
import { addProjectExpense } from "@/lib/data/freelance";
import { scanProjectExpense } from "@/lib/esnaf/scan";

const CATEGORIES = ["Yol", "Yemek", "Yazılım", "Malzeme", "Diğer"];

interface FormValues {
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
}

export function ProjectExpenseDialog({
  open,
  onClose,
  businessId,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  projectId: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [aiScanned, setAiScanned] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm<FormValues>({
    defaultValues: { category: "Diğer", description: "", amount: 0, expenseDate: new Date().toISOString().slice(0, 10) },
  });

  function handleClose() {
    reset();
    setAiScanned(false);
    setScanError(null);
    onClose();
  }

  async function handleScan(files: File[]) {
    const file = files[0];
    if (!file) return;
    setScanning(true);
    setScanError(null);
    try {
      const supabase = createClient();
      const draft = await scanProjectExpense(supabase, file, CATEGORIES);
      setValue("amount", draft.amount);
      setValue("expenseDate", draft.date);
      setValue("category", draft.category);
      setValue("description", "AI tarama ile eklendi");
      setAiScanned(true);
    } catch {
      setScanError("Fiş okunamadı, lütfen tekrar dene.");
    } finally {
      setScanning(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await addProjectExpense(supabase, {
        businessId,
        userId: user.id,
        projectId,
        category: values.category,
        description: values.description || null,
        amount: Number(values.amount),
        expenseDate: values.expenseDate,
        isAiScanned: aiScanned,
      });
      handleClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Masraf Ekle">
      <div className="space-y-4">
        <div className="rounded-control border border-dashed border-border p-3">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-text-primary">
            <ScanLine className="h-4 w-4 text-accent" /> Akıllı Masraf Tarayıcı
          </div>
          <DropzoneUploader
            multiple={false}
            disabled={scanning}
            onFiles={handleScan}
            onRejected={setScanError}
            title={scanning ? "Fiş taranıyor…" : "Fiş fotoğrafı yükle, tutar/tarih/kategori otomatik doldurulsun"}
          />
          {scanError && <p className="mt-2 text-sm text-danger">{scanError}</p>}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="pe-category">Kategori</Label>
            <Select id="pe-category" {...register("category")}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="pe-desc">Açıklama (isteğe bağlı)</Label>
            <Input id="pe-desc" {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pe-amount">Tutar</Label>
              <Input id="pe-amount" type="number" step="0.01" {...register("amount", { required: true, min: 0.01 })} />
            </div>
            <div>
              <Label htmlFor="pe-date">Tarih</Label>
              <Input id="pe-date" type="date" {...register("expenseDate")} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>
              İptal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
