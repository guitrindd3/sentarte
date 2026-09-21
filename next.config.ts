import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  // Default Server Action body limit is 1MB, too small for real photo
  // uploads from the admin's modelo Foto field (see updateModeloAction in
  // app/admin/actions.ts) -- a phone/export photo easily clears a few MB.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
