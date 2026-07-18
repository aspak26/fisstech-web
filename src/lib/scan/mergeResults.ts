import type { ScanResult, ScanResultItem } from "./types";

/** Ported verbatim from fisle_app scan_service.dart to keep merge behavior
 * identical between mobile and web for "Uzun Fiş (Çoklu)" scans. */

function normalizeItemKey(name: string, price: number): string {
  return `${name.trim().toLowerCase().replace(/[^\w]/g, "")}_${price.toFixed(2)}`;
}

function isSimilarPrice(a: number, b: number): boolean {
  return Math.abs(a - b) <= 0.06;
}

function isSimilarName(a: string, b: string): boolean {
  const na = a.trim().toLowerCase().replace(/[^\w\s]/g, "");
  const nb = b.trim().toLowerCase().replace(/[^\w\s]/g, "");
  if (na === nb) return true;
  if (na === "" || nb === "") return false;
  if (na.includes(nb) || nb.includes(na)) return true;

  const wordsA = new Set(na.split(/\s+/).filter((w) => w.length > 2));
  const wordsB = new Set(nb.split(/\s+/).filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return false;

  const shared = [...wordsA].filter((w) => wordsB.has(w)).length;
  const total = new Set([...wordsA, ...wordsB]).size;
  return total > 0 && shared / total >= 0.6;
}

export function mergeResults(results: ScanResult[]): ScanResult {
  if (results.length === 0) {
    return {
      storeName: "Bilinmiyor",
      date: "",
      total: 0,
      paymentMethod: "unknown",
      items: [],
      isInstallment: false,
      installmentOptions: [],
      imageUrls: [],
    };
  }

  const storeName =
    results.find((r) => r.storeName && r.storeName !== "Bilinmiyor")?.storeName ??
    "Bilinmiyor";

  const date =
    results.find((r) => r.date)?.date ?? new Date().toISOString().slice(0, 10);

  const paymentMethod =
    results.find((r) => r.paymentMethod && r.paymentMethod !== "unknown")
      ?.paymentMethod ?? "unknown";

  // Sequential merge with fuzzy boundary-overlap detection.
  let mergedItems: ScanResultItem[] = [...results[0].items];
  for (let i = 1; i < results.length; i++) {
    const currentList = results[i].items;
    let maxOverlap = 0;
    const limit = Math.min(mergedItems.length, currentList.length);

    for (let k = 1; k <= limit; k++) {
      let isMatch = true;
      for (let j = 0; j < k; j++) {
        const mergedItem = mergedItems[mergedItems.length - k + j];
        const currentItem = currentList[j];
        if (
          !isSimilarName(mergedItem.name, currentItem.name) ||
          !isSimilarPrice(mergedItem.price, currentItem.price)
        ) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) maxOverlap = k;
    }
    mergedItems = mergedItems.concat(currentList.slice(maxOverlap));
  }

  // Boundary-aware dedup: keep first occurrence, don't sum quantities.
  const uniqueItems: ScanResultItem[] = [];
  const seenKeys = new Set<string>();
  for (const item of mergedItems) {
    const key = normalizeItemKey(item.name, item.price);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueItems.push(item);
    }
  }

  const total = uniqueItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    storeName,
    date,
    total,
    paymentMethod,
    items: uniqueItems,
    isInstallment: false,
    installmentOptions: [],
    imageUrls: [],
  };
}
