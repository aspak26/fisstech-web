/** Ported verbatim from fisle_app investment_model.dart's AssetType enum
 * so `asset_type` values stay compatible with mobile. `color` is the same
 * per-type accent mobile's AddInvestmentScreen chip selector uses (kept as
 * fixed category colors rather than the site's single accent — 9 asset
 * types need to stay visually distinguishable at a glance, same reasoning
 * as analytics.ts's CHART_COLORS). */
export const ASSET_TYPES = [
  { key: "gram_altin", label: "Gram Altın", symbol: "gr", emoji: "🥇", color: "#F9A825" },
  { key: "ceyrek_altin", label: "Çeyrek Altın", symbol: "adet", emoji: "🥇", color: "#F9A825" },
  { key: "yarim_altin", label: "Yarım Altın", symbol: "adet", emoji: "🥇", color: "#F9A825" },
  { key: "cumhuriyet_altin", label: "Cumhuriyet Altını", symbol: "adet", emoji: "🥇", color: "#F9A825" },
  { key: "bitcoin", label: "Bitcoin", symbol: "BTC", emoji: "₿", color: "#FF9800" },
  { key: "ethereum", label: "Ethereum", symbol: "ETH", emoji: "Ξ", color: "#627EEA" },
  { key: "dolar", label: "Dolar", symbol: "USD", emoji: "$", color: "#2E7D32" },
  { key: "euro", label: "Euro", symbol: "EUR", emoji: "€", color: "#1565C0" },
  { key: "gumus", label: "Gümüş", symbol: "gr", emoji: "🥈", color: "#9E9E9E" },
] as const;

export function assetTypeLabel(key: string): string {
  return ASSET_TYPES.find((a) => a.key === key)?.label ?? key;
}

export function assetTypeSymbol(key: string): string {
  return ASSET_TYPES.find((a) => a.key === key)?.symbol ?? "";
}

export function assetTypeEmoji(key: string): string {
  return ASSET_TYPES.find((a) => a.key === key)?.emoji ?? "💰";
}
