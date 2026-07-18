"use client";

import Image from "next/image";
import { Loader2, RotateCw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { ScanFileStatus } from "./scan-workspace";

const STATUS_LABEL: Record<ScanFileStatus, string> = {
  pending: "Bekliyor",
  scanning: "Taranıyor",
  scanned: "Tarandı",
  error: "Hata",
};

export interface FilePreviewItem {
  id: string;
  previewUrl: string;
  status: ScanFileStatus;
  errorMessage?: string;
}

export function FilePreviewGrid({
  items,
  onRetry,
  onRemove,
}: {
  items: FilePreviewItem[];
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative aspect-[3/4] overflow-hidden rounded-control border border-border bg-bg"
        >
          <Image
            src={item.previewUrl}
            alt="Fiş önizleme"
            fill
            unoptimized
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2">
            <Badge
              tone={
                item.status === "scanned"
                  ? "success"
                  : item.status === "error"
                    ? "danger"
                    : "neutral"
              }
              className="gap-1"
            >
              {item.status === "scanning" && <Loader2 className="h-3 w-3 animate-spin" />}
              {STATUS_LABEL[item.status]}
            </Badge>
            {item.status === "error" && (
              <button
                type="button"
                aria-label="Tekrar dene"
                onClick={() => onRetry(item.id)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-text-primary"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            aria-label="Kaldır"
            onClick={() => onRemove(item.id)}
            className={cn(
              "absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100",
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
