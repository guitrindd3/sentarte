import type { Metadata, Viewport } from "next";

// Keep the admin (login included) out of search engines. The admin is also
// its own installable phone app (2026-11-14): manifest at /painel.webmanifest
// (outside /admin so it loads without a session), iPhone "Adicionar à Tela de
// Início" opens it full screen as "Painel" with the espresso icon.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  manifest: "/painel.webmanifest",
  applicationName: "SentArte Painel",
  appleWebApp: { capable: true, title: "Painel", statusBarStyle: "black-translucent" },
  icons: { apple: "/painel/apple-icon.png", icon: "/painel/icone-192.png" },
  // Older iPhones only open full screen with the legacy tag (Next now emits mobile-web-app-capable).
  other: { "apple-mobile-web-app-capable": "yes" },
};

// Phone: the panel stays at the screen's size, no zooming in or out (user
// 2026-11-03: "não quero que dê zoom sozinho, quero que a tela fique fixa").
// Only here — the public site keeps pinch zoom for accessibility; its inputs
// are ≥16px on phones (globals.css), which is what stops iOS's focus zoom.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#241c14",
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
