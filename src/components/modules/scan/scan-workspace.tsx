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
import { FilePreviewGrid } from "./file-preview-grid";
import { ReceiptReviewForm } from "./receipt-review-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function updateItem(id: string, patch: Partial<ScanFileItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function spendCreditLocally() {
    if (!isPremium) setRemainingCredits((c) => Math.max(0, c - 1));
  }

  function refundCreditLocally() {
    if (!isPremium) setRemainingCredits((c) => c + 1);
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
      setReview({ result, itemIds: [item.id] });
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
      setReview({ result: merged, itemIds: pending.map((i) => i.id) });
    } catch {
      pending.forEach((i) =>
        updateItem(i.id, { status: "error", errorMessage: "Sayfalardan biri okunamadı" }),
      );
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
      setReview(null);
      setToast("Harcama kaydedildi");
      router.refresh();
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
    setReview(null);
  }

  const pendingMultiCount = items.filter((i) => i.status === "pending").length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ScanModeTabs
          mode={mode}
          onChange={(m) => {
            setMode(m);
            setItems([]);
            setReview(null);
          }}
        />
        <CreditBadge remaining={remainingCredits} isPremium={isPremium} />
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
          <ReceiptReviewForm
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
            multiple={mode === "multi"}
            disabled={remainingCredits === 0 && !isPremium}
            onFiles={handleFilesAdded}
            onRejected={setNotice}
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
          />

          {mode === "multi" && pendingMultiCount > 0 && (
            <Button onClick={() => void startMultiScan()} className="w-full">
              Taramayı Başlat ({pendingMultiCount} sayfa)
            </Button>
          )}
        </>
      )}
    </div>
  );
}
