import { Car, Clock, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { whatsappLink } from "@/lib/esnaf/whatsapp";
import type { MaintenanceReminder } from "@/lib/types/esnaf";

function reminderMessage(r: MaintenanceReminder): string {
  const plate = r.customerVehiclePlate ? ` (${r.customerVehiclePlate})` : "";
  const label = r.intervalLabel.charAt(0).toUpperCase() + r.intervalLabel.slice(1);
  return (
    `Sayın ${r.customerName}${plate}, ${r.lastService} hizmetinizin üzerinden ${r.daysSince} gün geçti. ` +
    `${label} zamanınız yaklaşıyor. Randevu almak için bizi arayabilirsiniz. İyi günler dileriz. 🙏`
  );
}

/** Ported from mobile's hizmet_pano_screen.dart _SmartRemindersSection —
 * sadece Hizmet & Bakım sektöründe, service_jobs geçmişinden türetilen
 * bakım hatırlatmaları. */
export function SmartRemindersSection({ reminders }: { reminders: MaintenanceReminder[] }) {
  if (reminders.length === 0) return null;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-text-primary">Akıllı Bildirimler</h2>
        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
          {reminders.length} müşteri
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {reminders.map((r) => (
          <div
            key={r.customerId}
            className="w-[195px] shrink-0 rounded-card border border-accent/30 bg-accent/5 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-bold text-accent">
                <Clock className="h-3 w-3" /> {r.daysSince} gün önce
              </span>
              <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                {r.intervalLabel}
              </span>
            </div>
            <p className="truncate text-sm font-semibold text-text-primary">{r.customerName}</p>
            <p className="truncate text-xs text-text-secondary">{r.lastService}</p>
            {r.customerVehiclePlate && (
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-text-secondary">
                <Car className="h-3 w-3" /> {r.customerVehiclePlate}
              </p>
            )}
            {r.customerPhone && (
              <a
                href={whatsappLink(r.customerPhone, reminderMessage(r))}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-1.5 rounded-control bg-success py-1.5 text-xs font-semibold text-white hover:bg-success/90"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
