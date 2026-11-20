import type { MetadataRoute } from "next";

const BASE = "https://fisstech.co";

// Yalnızca herkese açık sayfalar (proxy.ts PUBLIC_ROUTES ile uyumlu).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/indir`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/yardim`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/gizlilik`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/kvkk`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/kullanim-sartlari`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/veri-guvenligi`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
