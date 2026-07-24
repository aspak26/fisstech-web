"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench, Trash2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { resetBusinessDataAction, deleteBusinessAction } from "@/lib/actions/esnaf-settings";

export function KritikIslemler({ businessId }: { businessId: string }) {
  const router = useRouter();
  
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleReset() {
    setIsLoading(true);
    const result = await resetBusinessDataAction(businessId);
    setIsLoading(false);

    if (result.success) {
      setResetDialogOpen(false);
      alert("Mağaza verileri başarıyla sıfırlandı.");
      router.refresh();
    } else {
      alert(result.error);
    }
  }

  async function handleDelete() {
    setIsLoading(true);
    const result = await deleteBusinessAction(businessId);
    setIsLoading(false);

    if (result.success) {
      setDeleteDialogOpen(false);
      alert("Mağaza başarıyla silindi.");
      router.push("/esnaf/kurulum");
    } else {
      alert(result.error);
    }
  }

  return (
    <>
      <Card className="divide-y divide-border p-0 border-danger/20">
        <button 
          onClick={() => setResetDialogOpen(true)}
          className="flex w-full items-center gap-3 p-4 transition-colors hover:bg-surface-hover text-left"
        >
          <div className="rounded-full bg-accent/10 p-2">
            <Wrench className="h-5 w-5 text-accent" />
          </div>
          <div>
            <span className="block font-medium text-text-primary">Mağaza Verilerini Sıfırla</span>
            <span className="block text-xs text-text-secondary">Kurulumu silmeden tüm fişleri/kayıtları temizler</span>
          </div>
        </button>
        <button 
          onClick={() => setDeleteDialogOpen(true)}
          className="flex w-full items-center gap-3 p-4 transition-colors hover:bg-danger/5 text-left"
        >
          <div className="rounded-full bg-danger/10 p-2">
            <Trash2 className="h-5 w-5 text-danger" />
          </div>
          <div>
            <span className="block font-medium text-danger">Mağazayı Tamamen Sil</span>
            <span className="block text-xs text-text-secondary">Bu mağazayı kökten siler (Geri alınamaz)</span>
          </div>
        </button>
      </Card>

      {/* Sıfırlama Onay Dialog */}
      <Dialog 
        open={resetDialogOpen} 
        onClose={() => !isLoading && setResetDialogOpen(false)} 
        title="Verileri Sıfırla"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            İşletmenizin tüm kasa, personel, stok ve gelir/gider verileri kalıcı olarak silinecektir. Sektör ayarlarınız ve çipleriniz korunacaktır. Bu işlem geri alınamaz!
            <br/><br/>
            Onaylıyor musunuz?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={isLoading}
              onClick={() => setResetDialogOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isLoading}
              onClick={handleReset}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sıfırla"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Silme Onay Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => !isLoading && setDeleteDialogOpen(false)} 
        title="Mağazayı Tamamen Sil"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Bu mağaza ve içindeki tüm veriler (çipler dahil) kalıcı olarak silinecektir. Bu işlem geri alınamaz!
            <br/><br/>
            Devam etmek istiyor musunuz?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={isLoading}
              onClick={() => setDeleteDialogOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={isLoading}
              onClick={handleDelete}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mağazayı Sil"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
