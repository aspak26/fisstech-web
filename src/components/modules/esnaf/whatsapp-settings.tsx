"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateBusinessWhatsAppTemplates } from "@/lib/data/esnaf";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { BusinessRow } from "@/lib/types/esnaf";

export function BusinessWhatsappSettings({ business }: { business: BusinessRow }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [atolye, setAtolye] = useState(business.whatsapp_templates?.atolye ?? "Sayın {Müşteri}, {Cihaz} cihazınızın işlemi tamamlanmıştır. Tutar: {Tutar}. Teslim alabilirsiniz.");
  const [veresiye, setVeresiye] = useState(business.whatsapp_templates?.veresiye ?? "Sayın {Müşteri}, veresiye bakiyeniz: {Tutar}. Ödeme için lütfen iletişime geçiniz.");
  const [hatirlatici, setHatirlatici] = useState(business.whatsapp_templates?.hatirlatici ?? "Sayın {Müşteri}{Plaka}, {Hizmet} hizmetinizin üzerinden {Gün} gün geçti. Randevu almak için bizi arayabilirsiniz.");

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      await updateBusinessWhatsAppTemplates(supabase, business.id, {
        atolye,
        veresiye,
        hatirlatici,
      });
      router.refresh();
      alert("WhatsApp şablonları başarıyla güncellendi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">WhatsApp Bildirim Şablonları</h2>
        <p className="text-sm text-text-secondary">
          Müşterilere WhatsApp üzerinden göndereceğiniz bildirim mesajlarını özelleştirin. Küme parantezi içindeki değerler (Örn: {"{Müşteri}"}) sistem tarafından otomatik doldurulur.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Atölye "Hazır" Bildirimi</Label>
          <Input 
            value={atolye} 
            onChange={(e) => setAtolye(e.target.value)} 
            placeholder="Değişkenler: {Müşteri}, {Cihaz}, {Tutar}"
          />
          <p className="text-xs text-text-secondary">Değişkenler: {"{Müşteri}, {Cihaz}, {Tutar}"}</p>
        </div>

        <div className="space-y-1.5">
          <Label>Veresiye Borç Hatırlatması</Label>
          <Input 
            value={veresiye} 
            onChange={(e) => setVeresiye(e.target.value)} 
            placeholder="Değişkenler: {Müşteri}, {Tutar}"
          />
          <p className="text-xs text-text-secondary">Değişkenler: {"{Müşteri}, {Tutar}"}</p>
        </div>

        <div className="space-y-1.5">
          <Label>Bakım/Hizmet Hatırlatıcısı</Label>
          <Input 
            value={hatirlatici} 
            onChange={(e) => setHatirlatici(e.target.value)} 
            placeholder="Değişkenler: {Müşteri}, {Hizmet}, {Gün}, {Plaka}"
          />
          <p className="text-xs text-text-secondary">Değişkenler: {"{Müşteri}, {Hizmet}, {Gün}, {Plaka}"}</p>
        </div>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? "Kaydediliyor..." : "Şablonları Kaydet"}
        </Button>
      </div>
    </Card>
  );
}
