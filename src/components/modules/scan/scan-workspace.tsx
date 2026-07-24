"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fileToBase64, invokeScanReceipt, ScanUnreadableError } from "@/lib/scan/scanClient";
import { consumeScanCredit, refundScanCredit } from "@/lib/scan/credits";
import { mergeResults } from "@/lib/scan/mergeResults";
import { uploadReceipts, saveExpense } from "@/lib/scan/saveExpense";
import type { CategoryOption, ScanResult } from "@/lib/scan/types";
import { ScanModeTabs, type ScanMode } from "./scan-mode-tabs";
import { CreditBadge } from "./credit-badge";
import { DropzoneUploader } from "./dropzone-uploader";
import { Switch } from "@/components/ui/switch";
import { FilePreviewGrid } from "./file-preview-grid";
import { ReceiptReviewForm } from "./receipt-review-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CropModal } from "./crop-modal";
import { Dialog } from "@/components/ui/dialog";

export type ScanFileStatus = "pending" | "scanning" | "scanned" | "error";

interface ScanFileItem {
  id: string;
  file: File;
  previewUrl: string;
  status: ScanFileStatus;
  result?: ScanResult;
  errorMessage?: string;
}

interface ReviewState {
  result: ScanResult;
  itemIds: string[];
}

const CREDIT_EXHAUSTED_MESSAGE = "Aylık fiş hakkınız doldu";

export function ScanWorkspace({
  userId,
  categories,
  initialRemainingCredits,
  isPremium,
}: {
  userId: string;
  categories: CategoryOption[];
  initialRemainingCredits: number;
  isPremium: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [mode, setMode] = useState<ScanMode>("single");
  const [items, setItems] = useState<ScanFileItem[]>([]);
  const [remainingCredits, setRemainingCredits] = useState(initialRemainingCredits);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [reviewQueue, setReviewQueue] = useState<{ id: string; result: ScanResult }[]>([]);
  const [autoSave, setAutoSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [cropItemId, setCropItemId] = useState<string | null>(null);

  const [batchAllowedTemp, setBatchAllowedTemp] = useState(false);
  const [showAdDialog, setShowAdDialog] = useState(false);

  function handleCropComplete(blob: Blob) {
    if (!cropItemId) return;
    const item = items.find(i => i.id === cropItemId);
    if (!item) return;
    const file = new File([blob], item.file.name, { type: "image/jpeg" });
    const previewUrl = URL.createObjectURL(file);
    updateItem(cropItemId, { file, previewUrl });
    setCropItemId(null);
  }

  function updateItem(id: string, patch: Partial<ScanFileItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function spendCreditLocally() {
    if (!isPremium) setRemainingCredits((c) => Math.max(0, c - 1));
  }

  function refundCreditLocally() {
    if (!isPremium) setRemainingCredits((c) => c + 1);
  }

  function advanceQueue(currentQueue: { id: string; result: ScanResult }[]) {
    if (currentQueue.length === 0) {
      setReviewQueue([]);
      setReview(null);
      return;
    }
    const [next, ...rest] = currentQueue;
    setReviewQueue(rest);
    setReview({ result: next.result, itemIds: [next.id] });
  }

  async function runSingleScan(item: ScanFileItem) {
    updateItem(item.id, { status: "scanning" });
    try {
      const credited = await consumeScanCredit(supabase, userId);
      if (!credited) {
        updateItem(item.id, { status: "error", errorMessage: CREDIT_EXHAUSTED_MESSAGE });
        return;
      }
      spendCreditLocally();

      const base64 = await fileToBase64(item.file);
      const result = await invokeScanReceipt(supabase, base64, categories);
      updateItem(item.id, { status: "scanned", result });

      if (autoSave) {
        const imageUrls = await uploadReceipts(supabase, userId, [item.file]);
        await saveExpense(supabase, userId, { ...result, imageUrls });
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setToast("Harcama otomatik kaydedildi");
        router.refresh();
      } else {
        setReview({ result, itemIds: [item.id] });
      }
    } catch (e) {
      updateItem(item.id, {
        status: "error",
        errorMessage: e instanceof ScanUnreadableError ? "Fiş okunamadı" : "Bağlantı veya sunucu hatası",
      });
    }
  }

  async function startMultiScan() {
    const pending = items.filter((i) => i.status === "pending");
    if (pending.length === 0) return;

    setItems((prev) =>
      prev.map((i) => (i.status === "pending" ? { ...i, status: "scanning" } : i)),
    );

    try {
      const credited = await consumeScanCredit(supabase, userId);
      if (!credited) {
        pending.forEach((i) =>
          updateItem(i.id, { status: "error", errorMessage: CREDIT_EXHAUSTED_MESSAGE }),
        );
        return;
      }
      spendCreditLocally();

      const results = await Promise.all(
        pending.map(async (item) => {
          const base64 = await fileToBase64(item.file);
          const result = await invokeScanReceipt(supabase, base64, categories);
          updateItem(item.id, { status: "scanned", result });
          return result;
        }),
      );

      const merged = mergeResults(results);
      if (autoSave) {
        const files = items.filter((i) => pending.find(p => p.id === i.id)).map((i) => i.file);
        const imageUrls = await uploadReceipts(supabase, userId, files);
        await saveExpense(supabase, userId, { ...merged, imageUrls });
        setItems((prev) => prev.filter((i) => !pending.find(p => p.id === i.id)));
        setToast("Uzun Fiş otomatik kaydedildi");
        router.refresh();
      } else {
        setReview({ result: merged, itemIds: pending.map((i) => i.id) });
      }
    } catch {
      pending.forEach((i) =>
        updateItem(i.id, { status: "error", errorMessage: "Sayfalardan biri okunamadı" }),
      );
    }
  }

  async function startBatchScan() {
    const pending = items.filter((i) => i.status === "pending");
    if (pending.length === 0) return;

    setItems((prev) =>
      prev.map((i) => (i.status === "pending" ? { ...i, status: "scanning" } : i)),
    );

    let currentCredits = remainingCredits;
    let successCount = 0;
    const queue: { id: string; result: ScanResult }[] = [];

    for (const item of pending) {
      try {
        if (!isPremium && currentCredits <= 0) {
          updateItem(item.id, { status: "error", errorMessage: CREDIT_EXHAUSTED_MESSAGE });
          continue;
        }

        const credited = await consumeScanCredit(supabase, userId);
        if (!credited) {
          updateItem(item.id, { status: "error", errorMessage: CREDIT_EXHAUSTED_MESSAGE });
          continue;
        }
        currentCredits--;
        spendCreditLocally();

        const base64 = await fileToBase64(item.file);
        const result = await invokeScanReceipt(supabase, base64, categories);
        updateItem(item.id, { status: "scanned", result });

        if (autoSave) {
          const imageUrls = await uploadReceipts(supabase, userId, [item.file]);
          await saveExpense(supabase, userId, { ...result, imageUrls });
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          successCount++;
        } else {
          queue.push({ id: item.id, result });
        }
      } catch {
        updateItem(item.id, { status: "error", errorMessage: "Fiş okunamadı" });
      }
    }

    if (autoSave && successCount > 0) {
      setToast(`${successCount} adet fiş başarıyla otomatik kaydedildi`);
      router.refresh();
    } else if (queue.length > 0) {
      advanceQueue(queue);
    }
  }

  function handleFilesAdded(files: File[]) {
    const newItems: ScanFileItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: mode === "single" ? "scanning" : "pending",
    }));
    setItems((prev) => [...prev, ...newItems]);
    if (mode === "single") {
      newItems.forEach((item) => void runSingleScan(item));
    }
  }

  function handleRetry(id: string) {
    const item = items.find((i) => i.id === id);
    if (item) void runSingleScan(item);
  }

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleConfirm(edited: ScanResult) {
    if (!review) return;
    setSaving(true);
    try {
      const files = items.filter((i) => review.itemIds.includes(i.id)).map((i) => i.file);
      const imageUrls = await uploadReceipts(supabase, userId, files);
      await saveExpense(supabase, userId, { ...edited, imageUrls });

      setItems((prev) => prev.filter((i) => !review.itemIds.includes(i.id)));
      setToast("Harcama kaydedildi");
      router.refresh();

      if (mode === "batch") {
        advanceQueue(reviewQueue);
      } else {
        setReview(null);
      }
    } catch {
      setToast("Kaydedilemedi, lütfen tekrar deneyin");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelReview() {
    if (!review) return;
    await refundScanCredit(supabase, userId);
    refundCreditLocally();
    setItems((prev) => prev.filter((i) => !review.itemIds.includes(i.id)));
    
    if (mode === "batch") {
      advanceQueue(reviewQueue);
    } else {
      setReview(null);
    }
  }

  const pendingMultiCount = items.filter((i) => i.status === "pending").length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {!isPremium && (
        <div className="rounded-control border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-text-primary flex items-center justify-between">
          <p>
            💡 Fiş hakkınız bittiyse veya artırmak isterseniz, <strong>Fişştech Mobil Uygulamasını</strong> indirip reklam izleyerek ücretsiz fiş hakkı kazanabilirsiniz!
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ScanModeTabs
          mode={mode}
          onChange={(m) => {
            if (m === "batch" && !isPremium && !batchAllowedTemp) {
               setShowAdDialog(true);
               return;
            }
            setMode(m);
            setItems([]);
            setReview(null);
            setReviewQueue([]);
          }}
        />
        <CreditBadge remaining={remainingCredits} isPremium={isPremium} />
      </div>

      <div className="flex items-center gap-2 mb-2 p-3 bg-surface border border-border rounded-control">
        <Switch 
          checked={autoSave} 
          onChange={setAutoSave} 
          label="Bana sormadan direkt kaydet (Otomatik Kayıt)" 
          description="Fişler tarandıktan sonra onay formu gösterilmez, doğrudan kaydedilir."
        />
      </div>

      {notice && (
        <div className="rounded-control border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-text-primary">
          {notice}
        </div>
      )}
      {toast && (
        <div className="rounded-control border border-success/40 bg-success/10 px-4 py-3 text-sm text-text-primary">
          {toast}
        </div>
      )}

      {review ? (
        <Card>
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <h3 className="font-semibold text-text-primary">
              {mode === "batch" && reviewQueue.length >= 0 
                ? `Fiş İnceleniyor (Kalan: ${reviewQueue.length})` 
                : "Fiş İnceleme"}
            </h3>
            {mode === "batch" && (
               <span className="text-sm text-text-secondary bg-surface px-2 py-1 rounded-control border border-border">
                  Sıradaki: {reviewQueue.length}
               </span>
            )}
          </div>
          <ReceiptReviewForm
            key={review.itemIds.join("-")}
            result={review.result}
            categories={categories}
            saving={saving}
            onCancel={handleCancelReview}
            onConfirm={handleConfirm}
          />
        </Card>
      ) : (
        <>
          <DropzoneUploader
            multiple={mode === "multi" || mode === "batch"}
            disabled={remainingCredits === 0 && !isPremium}
            onFiles={handleFilesAdded}
            onRejected={setNotice}
            multiSubtitle={
              mode === "batch"
                ? "Birden fazla farklı fişi toplu yükleyebilirsiniz (JPEG/PNG, maks 5 MB)"
                : undefined
            }
          />

          <FilePreviewGrid
            items={items.map((i) => ({
              id: i.id,
              previewUrl: i.previewUrl,
              status: i.status,
              errorMessage: i.errorMessage,
            }))}
            onRetry={handleRetry}
            onRemove={handleRemove}
            onCrop={setCropItemId}
          />

          {mode === "multi" && pendingMultiCount > 0 && (
            <Button onClick={() => void startMultiScan()} className="w-full">
              Uzun Fişi Birleştirerek Tara ({pendingMultiCount} sayfa)
            </Button>
          )}

          {mode === "batch" && pendingMultiCount > 0 && (
            <Button onClick={() => void startBatchScan()} className="w-full">
              Toplu Taramayı Başlat ({pendingMultiCount} fiş)
            </Button>
          )}
        </>
      )}

      {cropItemId && (
        <CropModal
          open={true}
          imageUrl={items.find(i => i.id === cropItemId)?.previewUrl || ""}
          onClose={() => setCropItemId(null)}
          onComplete={handleCropComplete}
        />
      )}

      <Dialog
        open={showAdDialog}
        onClose={() => setShowAdDialog(false)}
        title="Premium Özellik"
      >
        <div className="space-y-4 mt-2">
          <div className="rounded-control border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-text-primary">
            <p>
              Toplu fiş tarama Premium üyelere özel bir özelliktir. 
              Ücretsiz olarak kullanmaya devam etmek için <strong>Fişştech Mobil Uygulamasını</strong> indirip reklam izleyerek toplu tarama hakkı kazanabilirsiniz!
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              className="w-full sm:w-auto"
              onClick={() => router.push("/pricing")}
            >
              Premium'a Geç
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
