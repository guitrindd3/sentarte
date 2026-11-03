import type { Metadata, Viewport } from "next";

// Keep the admin (login included) out of search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

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
