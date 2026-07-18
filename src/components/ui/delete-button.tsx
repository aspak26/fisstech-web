"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteButton({
  confirmMessage,
  onDelete,
}: {
  confirmMessage: string;
  onDelete: () => Promise<void>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setPending(true);
    try {
      await onDelete();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      aria-label="Sil"
      onClick={handleClick}
      disabled={pending}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-text-secondary hover:bg-danger/10 hover:text-danger disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}
