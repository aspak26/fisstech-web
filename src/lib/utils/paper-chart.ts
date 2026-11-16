/** Kâğıt görünüm grafik stili — mobil SoftLineChart ile aynı dil
 * (fisle_app/lib/core/widgets/soft_line_chart.dart): kalın mürekkep çizgi,
 * içi kâğıt renginde halkalı noktalar, düz %13 alan dolgusu (gradyan yok),
 * kesik kurşun kalem ızgarası, mürekkep kenarlı not kâğıdı ipucu kutusu.
 * Renkler yalnızca token'dan (styles/tokens.css). */
import type { CSSProperties } from "react";

export const PAPER_LINE_WIDTH = 2.6;
export const PAPER_AREA_OPACITY = 0.13;

export const PAPER_TOOLTIP_STYLE: CSSProperties = {
  background: "var(--color-surface)",
  border: "1.5px solid color-mix(in srgb, var(--color-ink) 75%, transparent)",
  borderRadius: "10px 12px 9px 13px / 12px 9px 13px 10px",
  boxShadow: "2px 3px 0 var(--shadow-ink)",
  color: "var(--color-text-primary)",
};

export const PAPER_TOOLTIP_CURSOR = {
  stroke: "var(--color-ink)",
  strokeOpacity: 0.35,
  strokeDasharray: "4 4",
};

export const PAPER_GRID = {
  strokeDasharray: "4 5",
  stroke: "var(--color-ink)",
  strokeOpacity: 0.14,
};

export const PAPER_AXIS_LINE = {
  stroke: "var(--color-ink)",
  strokeOpacity: 0.45,
  strokeWidth: 1.5,
};

export function paperDot(color: string) {
  return { r: 4.2, fill: "var(--color-surface)", stroke: color, strokeWidth: 2.4 };
}

export function paperActiveDot(color: string) {
  return { r: 6, fill: color, stroke: "var(--color-ink)", strokeWidth: 1.5 };
}

/** Çubuk/dilim kenarı: ince mürekkep çizgisi */
export const PAPER_SHAPE_STROKE = {
  stroke: "var(--color-ink)",
  strokeOpacity: 0.55,
  strokeWidth: 1.2,
};
