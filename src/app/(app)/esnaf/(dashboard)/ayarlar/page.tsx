import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { BusinessLogoForm } from "@/components/modules/esnaf/business-logo-form";
import { BusinessWhatsappSettings } from "@/components/modules/esnaf/whatsapp-settings";
import { CloudSyncStatus } from "@/components/modules/esnaf/cloud-sync-status";
import { KritikIslemler } from "@/components/modules/esnaf/kritik-islemler";
import { Card } from "@/components/ui/card";
import { FolderOpen, ScanText, FileBarChart, PlusCircle, MinusCircle, Users, BadgeCheck, Package, Wrench, Trash2 } from "lucide-react";
import Link from "next/link";

export default async function EsnafAyarlarPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="mb-4 font-display text-xl font-semibold text-text-primary">İşletme Ayarları</h1>
        <div className="space-y-4">
          <BusinessLogoForm business={business} />
          <BusinessWhatsappSettings business={business} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-text-primary">İşletme</h2>
        <Card className="divide-y divide-border p-0">
          <Link href="/esnaf/musteri" className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-hover">
            <Users className="h-5 w-5 text-accent" />
            <span className="font-medium text-text-primary">Müşteri Yönetimi</span>
          </Link>
          <Link href="/esnaf/personel" className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-hover">
            <BadgeCheck className="h-5 w-5 text-accent" />
            <span className="font-medium text-text-primary">Personel Yönetimi</span>
          </Link>
          <Link href="/esnaf/stok" className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-hover">
            <Package className="h-5 w-5 text-accent" />
            <span className="font-medium text-text-primary">Stok Takibi</span>
          </Link>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-text-primary">Evraklar & Raporlar</h2>
        <Card className="divide-y divide-border p-0">
          <Link href="/esnaf/evrak" className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-hover">
            <FolderOpen className="h-5 w-5 text-accent" />
            <span className="font-medium text-text-primary">Evrak Arşivi</span>
          </Link>
          <CloudSyncStatus business={business} />
          <Link href="/esnaf/seri-tarama" className="flex items-center justify-between p-4 transition-colors hover:bg-surface-hover">
            <div className="flex items-center gap-3">
              <ScanText className="h-5 w-5 text-accent" />
              <span className="font-medium text-text-primary">Seri Tarama</span>
            </div>
            <span className="text-xs text-text-secondary">Yapay Zeka Destekli</span>
          </Link>
          <Link href="/esnaf/raporlar" className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-hover">
            <FileBarChart className="h-5 w-5 text-accent" />
            <span className="font-medium text-text-primary">Raporlar</span>
          </Link>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-text-primary">Genel</h2>
        <Card className="divide-y divide-border p-0">
          <Link href="/esnaf/fatura/ekle" className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-hover">
            <FileBarChart className="h-5 w-5 text-accent" />
            <span className="font-medium text-text-primary">Faturalar</span>
          </Link>
          <Link href="/esnaf/gelir/ekle" className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-hover">
            <PlusCircle className="h-5 w-5 text-success" />
            <span className="font-medium text-text-primary">Gelir Ekle</span>
          </Link>
          <Link href="/esnaf/gider/ekle" className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-hover">
            <MinusCircle className="h-5 w-5 text-danger" />
            <span className="font-medium text-text-primary">Gider Ekle</span>
          </Link>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-danger">Kritik İşlemler</h2>
        <KritikIslemler businessId={business.id} />
      </div>
    </div>
  );
}

