import { CreditCard } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import { cardColorToHex, cardDisplayLabel } from "@/lib/data/cards";
import { CHART_COLORS } from "@/lib/data/analytics";
import { ChartCarousel } from "./chart-carousel";
import { DonutBreakdown } from "./donut-breakdown";
import type { CardCategoryPoint } from "@/lib/data/cards";
import type { CardsRow } from "@/lib/types/database";

function CardComparisonChart({ cards, totals }: { cards: CardsRow[]; totals: Map<string, number> }) {
  const rows = cards
    .map((c) => ({ card: c, total: totals.get(c.id) ?? 0 }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);
  const max = rows[0]?.total ?? 1;

  if (rows.length === 0) {
    return <EmptyState icon={CreditCard} title="Bu dönemde kart harcaması yok" />;
  }

  return (
    <ul className="space-y-3">
      {rows.map(({ card, total }) => {
        const accent = cardColorToHex(card.color) ?? "var(--color-accent)";
        return (
          <li key={card.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="truncate text-text-primary">{cardDisplayLabel(card)}</span>
              <span className="font-medium text-text-primary">{formatCurrency(total)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
              <div
                className="h-full rounded-full"
                style={{ width: `${max > 0 ? (total / max) * 100 : 0}%`, backgroundColor: accent }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Ported from mobile's "Kart Bazlı Analiz" bölümü (analytics_screen.dart) —
 * Bütçe Limitleri kartının altında, kartlar arası karşılaştırma +
 * kaydırılabilir kart bazlı kategori donut'ları. */
export function CardAnalyticsSection({
  cards,
  cardTotals,
  cardCategoryBreakdowns,
}: {
  cards: CardsRow[];
  cardTotals: Map<string, number>;
  cardCategoryBreakdowns: Map<string, CardCategoryPoint[]>;
}) {
  if (cards.length === 0) return null;

  const cardsWithSpend = cards.filter((c) => (cardTotals.get(c.id) ?? 0) > 0);

  const pages = [
    { title: "Kartlar Arası Karşılaştırma", content: <CardComparisonChart cards={cards} totals={cardTotals} /> },
    ...cardsWithSpend.map((c) => {
      const points = (cardCategoryBreakdowns.get(c.id) ?? []).map((p, i) => ({
        name: p.name,
        color: CHART_COLORS[i % CHART_COLORS.length],
        total: p.total,
      }));
      return {
        title: cardDisplayLabel(c),
        content:
          points.length === 0 ? (
            <EmptyState title="Bu dönemde veri yok" />
          ) : (
            <DonutBreakdown data={points} />
          ),
      };
    }),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kart Bazlı Analiz</CardTitle>
      </CardHeader>
      <ChartCarousel pages={pages} />
    </Card>
  );
}
