// The admin panel as its own phone app (2026-11-14): "SentArte Painel", opens
// /admin full screen. Lives OUTSIDE /admin on purpose — proxy.ts sends every
// /admin/* request without a session to the login page, and the browser
// fetches the manifest and icons (public/painel/) without cookies, which would
// break the install prompt. Nothing private here. No service worker / offline
// cache: admin pages hold customer data.

export const dynamic = "force-static";

export function GET() {
  const manifest = {
    id: "/admin",
    name: "SentArte Painel",
    short_name: "Painel",
    description: "Painel do ateliê SentArte: pedidos, cadeiras, orçamentos e envios.",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#241c14",
    theme_color: "#241c14",
    lang: "pt-BR",
    icons: [
      { src: "/painel/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/painel/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/painel/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
