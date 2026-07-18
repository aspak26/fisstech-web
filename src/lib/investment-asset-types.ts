/** Ported verbatim from fisle_app investment_model.dart's AssetType enum
 * so `asset_type` values stay compatible with mobile. */
export const ASSET_TYPES = [
  { key: "gram_altin", label: "Gram Altın", symbol: "gr", emoji: "🥇" },
  { key: "ceyrek_altin", label: "Çeyrek Altın", symbol: "adet", emoji: "🥇" },
  { key: "yarim_altin", label: "Yarım Altın", symbol: "adet", emoji: "🥇" },
  { key: "cumhuriyet_altin", label: "Cumhuriyet Altını", symbol: "adet", emoji: "🥇" },
  { key: "bitcoin", label: "Bitcoin", symbol: "BTC", emoji: "₿" },
  { key: "ethereum", label: "Ethereum", symbol: "ETH", emoji: "Ξ" },
  { key: "dolar", label: "Dolar", symbol: "USD", emoji: "$" },
  { key: "euro", label: "Euro", symbol: "EUR", emoji: "€" },
  { key: "gumus", label: "Gümüş", symbol: "gr", emoji: "🥈" },
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
