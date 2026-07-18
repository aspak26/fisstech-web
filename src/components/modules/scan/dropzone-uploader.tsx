"use client";

import { useRef, useState } from "react";
import { Receipt, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { MAX_RECEIPT_BYTES } from "@/lib/scan/scanClient";

interface DropzoneUploaderProps {
  multiple: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  onRejected: (message: string) => void;
  /** Defaults to the receipt-scan copy (Fiş Tara). Override for other
   * document-scanning contexts (e.g. Evrak Arşivi). */
  title?: string;
  subtitle?: string;
  multiSubtitle?: string;
}

export function DropzoneUploader({
  multiple,
  disabled,
  onFiles,
  onRejected,
  title = "Fiş fotoğrafını buraya sürükle veya tıkla",
  subtitle = "JPEG veya PNG, maks. 5 MB",
  multiSubtitle = "Uzun fişin tüm sayfalarını seçebilirsin (JPEG/PNG, sayfa başına maks. 5 MB)",
}: DropzoneUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const oversized = files.filter((f) => f.size > MAX_RECEIPT_BYTES);
    const valid = files.filter((f) => f.size <= MAX_RECEIPT_BYTES);

    if (oversized.length > 0) {
      onRejected(
        `${oversized.length} dosya 5 MB sınırını aşıyor ve yüklenmedi: ${oversized
          .map((f) => f.name)
          .join(", ")}`,
      );
    }
    if (valid.length > 0) onFiles(valid);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-card border-2 border-dashed border-border bg-surface px-6 py-14 text-center transition-colors",
        isDragging && "border-accent bg-accent/5",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {/* TODO: replace with a custom-illustrated receipt-upload mockup per
          Fisstech_Web_Blueprint.md §5.4 (signature element) — this layered
          icon composition is a placeholder, not a generic upload icon. */}
      <div className="relative">
        <Receipt
          className="absolute -left-3 -top-2 h-14 w-14 rotate-[-8deg] text-border"
          strokeWidth={1.25}
        />
        <Receipt className="relative h-14 w-14 text-accent" strokeWidth={1.25} />
        <ImagePlus className="absolute -bottom-1 -right-2 h-6 w-6 rounded-full bg-accent p-1 text-on-accent" />
      </div>
      <div>
        <p className="font-medium text-text-primary">{title}</p>
        <p className="mt-1 text-sm text-text-secondary">
          {multiple ? multiSubtitle : subtitle}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
