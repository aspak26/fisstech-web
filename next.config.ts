import type { NextConfig } from "next";

// Güvenlik denetimi bulgusu: next.config.ts hiç güvenlik header'ı
// tanımlamıyordu (CSP, X-Frame-Options, HSTS vb. yok) — clickjacking'e
// karşı ikinci bir savunma katmanı yoktu ve olası gelecekteki bir XSS'i
// sınırlayacak bir CSP hiç yoktu. connect-src/img-src, uygulamanın gerçekten
// konuştuğu tek dış servisleri (paylaşılan Supabase projesi + Gemini API,
// ikisi de sunucu tarafında çağrılıyor ama tarayıcı da doğrudan Supabase'e
// bağlanıyor) yansıtacak şekilde kısıtlı tutuldu.
//
// script-src SADECE development'ta 'unsafe-eval' içeriyor — Next.js'in
// Fast Refresh/webpack HMR mekanizması dev modda eval() kullanıyor, ama
// production build'de buna ihtiyaç yok (gerçek kullanıcıların göreceği
// ortam zaten production). Bu, canlıya çıkan CSP'yi elle test edip
// (npm run build + npm start + Playwright konsol hatası kontrolü)
// doğrulanmış bir şekilde sıkılaştırıyor — dev deneyimini kırmadan.
const isDev = process.env.NODE_ENV !== "production";
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
