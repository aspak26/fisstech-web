"use client";

import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { generateAiSummaryAction } from "@/lib/actions/ai-rapor";
import ReactMarkdown from "react-markdown";

export function AiSummaryModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setOpen(true);
    if (summary) return; // Already generated
    
    setLoading(true);
    setError(null);
    try {
      const res = await generateAiSummaryAction();
      if (res.success && res.summary) {
        setSummary(res.summary);
      } else {
        setError(res.error || "Rapor oluşturulamadı.");
      }
    } catch (err) {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={handleGenerate} className="gap-2 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70">
        <Sparkles className="h-4 w-4" />
        AI Stratejik Özet
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Yapay Zeka Yönetici Özeti" className="max-w-3xl">
        <div className="flex flex-col space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-accent" />
              <p>İşletme verileriniz analiz ediliyor ve rapor hazırlanıyor...</p>
            </div>
          ) : error ? (
            <div className="rounded-control bg-danger/10 p-4 text-danger">
              <p>{error}</p>
            </div>
          ) : summary ? (
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          ) : null}
          
          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Kapat
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
