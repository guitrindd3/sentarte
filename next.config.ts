import type { NextConfig } from "next";

// Browser-side protections (2026-09-30). 'unsafe-inline' scripts are needed
// for Next's inline bootstrapping and the JSON-LD blocks; everything else is
// same-origin except ViaCEP (address lookup). `blob:` images = the admin's
// photo previews. (Vercel Blob hosts removed 2026-10-05: photos live in the repo.)
// Mercado Pago (2026-10-06): the card form inside the site is Mercado Pago's
// Card Payment Brick — its SDK, secure-field iframes, fonts and API calls.
const MP = "https://*.mercadopago.com https://*.mercadopago.com.br https://*.mercadolibre.com https://*.mercadolivre.com https://*.mlstatic.com";
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://sdk.mercadopago.com ${MP}`,
  `style-src 'self' 'unsafe-inline' ${MP}`,
  `img-src 'self' data: blob: ${MP}`,
  `font-src 'self' data: ${MP}`,
  "media-src 'self'",
  `connect-src 'self' https://viacep.com.br ${MP}`,
  `frame-src ${MP}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ],
      },
    ];
  },
  // Default Server Action body limit is 1MB, too small for real photo
  // uploads from the admin's modelo Foto field (see updateModeloAction in
  // app/admin/actions.ts) -- a phone/export photo easily clears a few MB.
  // Browsers still request /favicon.ico directly; serve the generated app/icon.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
