"use server";

import { createClient } from "@/lib/supabase/server";
import { getEsnafRaporlarBundle } from "@/lib/data/esnaf";
import { getActiveBusiness } from "@/lib/esnaf/active-business";

export const maxDuration = 60;

export async function generateAiSummaryAction() {
  try {
    const business = await getActiveBusiness();
    if (!business) return { success: false, error: "İşletme bulunamadı." };

    const supabase = await createClient();
    const bundle = await getEsnafRaporlarBundle(supabase, business.id, 6);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: "AI entegrasyonu (GEMINI_API_KEY) yapılandırılmamış." };
    }

    const systemInstruction = `Sen uzman bir finansal stratejist ve işletme danışmanısın. Kullanıcıya ait esnaf/KOBİ verilerini (son 6 aylık gelir-gider trendi, KDV durumu ve gider kategorileri) inceleyip, işletme sahibi için Türkçe, profesyonel ama anlaşılır bir "Yönetici Özeti" ve "Aksiyon Planı" çıkaracaksın.

- Verileri genel geçer yorumlama, somut sayıları ve trendleri kullan.
- Markdown formatında yanıt ver (başlıklar, kalın yazılar, listeler kullan).
- Gereksiz laf kalabalığı yapma, net ve stratejik tavsiyeler ver. (Örn: "Son 3 ayda giderler gelirlerden hızlı artıyor, stok maliyetini düşürmelisin").
- Yanıtın ortalama 200-300 kelime arası olsun.`;

    const contextJson = JSON.stringify({
      isletme_adi: business.name,
      sektor: business.sector,
      kdv_durumu: business.vat_enabled ? "Aktif" : "Pasif",
      son_6_aylik_trend: bundle.trend,
      bu_ay_kdv_ozeti: bundle.vat,
      bu_ay_gider_kategorileri: bundle.categories,
    }, null, 2);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: `İşletme Verilerim:\n${contextJson}\n\nLütfen bu verilere dayanarak işletmem için stratejik özet raporunu hazırla.` }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.5 },
        }),
      }
    );

    if (!response.ok) {
      return { success: false, error: "AI servisinden yanıt alınamadı." };
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return { success: false, error: "AI rapor oluşturamadı." };
    }

    return { success: true, summary: reply };
  } catch (error) {
    console.error("AI Summary Error:", error);
    return { success: false, error: "Rapor oluşturulurken beklenmeyen bir hata oluştu." };
  }
}
