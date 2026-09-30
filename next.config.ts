import type { NextConfig } from "next";

// Browser-side protections (2026-09-30). 'unsafe-inline' scripts are needed
// for Next's inline bootstrapping and the JSON-LD blocks; everything else is
// same-origin except Blob images (catalog photos) and ViaCEP (address lookup).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  "media-src 'self'",
  "connect-src 'self' https://viacep.com.br https://*.public.blob.vercel-storage.com",
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
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
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
