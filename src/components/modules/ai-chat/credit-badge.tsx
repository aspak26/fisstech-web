import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Premium de dahil TÜM planlarda aylık bir üst sınır var (bkz. paywall
 * metni: "aylık 50 AI sohbet hakkı") — sınırsız bir plan yok, bu yüzden
 * `limit` her zaman sunucudan gelen gerçek değerdir, burada varsayılan
 * sabitlenmez. `limit < 0`, kota RPC'sinden yanıt alınamadığı (fail-open)
 * anlamına gelir — bu durumda gerçek sayı bilinmediği için sayaç gizlenir. */
export function AiChatCreditBadge({
  remaining,
  limit,
}: {
  remaining: number;
  limit: number;
}) {
  if (limit < 0) return null;
  return (
    <Badge tone={remaining === 0 ? "danger" : "accent"} className="gap-1.5">
      <Sparkles className="h-3.5 w-3.5" />
      {`${remaining}/${limit} sohbet hakkı`}
    </Badge>
  );
}
