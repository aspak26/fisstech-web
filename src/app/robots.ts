import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Giriş gerektiren panel ve API dizine girmesin.
      disallow: ["/api/", "/dashboard", "/auth/"],
    },
    sitemap: "https://fisstech.co/sitemap.xml",
  };
}
