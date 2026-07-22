import type { NextConfig } from "next";

// Güvenlik denetimi bulgusu: next.config.ts hiç güvenlik header'ı
// tanımlamıyordu (CSP, X-Frame-Options, HSTS vb. yok) — clickjacking'e
// karşı ikinci bir savunma katmanı yoktu ve olası gelecekteki bir XSS'i
// sınırlayacak bir CSP hiç yoktu. connect-src/img-src, uygulamanın gerçekten
// konuştuğu tek dış servisleri (paylaşılan Supabase projesi + Gemini API,
// ikisi de sunucu tarafında çağrılıyor ama tarayıcı da doğrudan Supabase'e
// bağlanıyor) yansıtacak şekilde kısıtlı tutuldu — daha sıkı bir script-src
// (unsafe-inline/unsafe-eval olmadan) Next.js'in hydration/HMR mekanizmasını
// kırma riski taşıdığı için bu turda eklenmedi, ayrı bir dikkatli geçiş
// gerektirir.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
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
