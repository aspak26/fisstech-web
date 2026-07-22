import { Check } from "lucide-react";
import { COMPARISON_ROWS, type ComparisonValue } from "@/lib/landing/comparison-data";
import { Reveal } from "./reveal";

function Cell({ value }: { value: ComparisonValue }) {
  if (value === true) {
    return (
      <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (value === false) {
    return <span className="text-text-secondary/50">—</span>;
  }
  return <span className="text-sm text-text-primary">{value}</span>;
}

export function ComparisonTable() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-bold text-text-primary">Planları Karşılaştırın</h2>
        <p className="mt-3 text-sm text-text-secondary">Tüm planların sunduğu özellikleri detaylı karşılaştırın</p>
      </Reveal>

      <Reveal delay={100} className="mt-10 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Özellik
              </th>
              <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-accent">
                Premium
              </th>
              <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-accent">
                Esnaf Modu
              </th>
              <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-accent">
                Aile Planı
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.feature} className="border-b border-border transition-colors last:border-0 hover:bg-bg">
                <td className="px-6 py-3.5 text-text-primary">{row.feature}</td>
                <td className="px-4 py-3.5 text-center">
                  <Cell value={row.premium} />
                </td>
                <td className="px-4 py-3.5 text-center">
                  <Cell value={row.esnaf} />
                </td>
                <td className="px-4 py-3.5 text-center">
                  <Cell value={row.family} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
    </section>
  );
}
