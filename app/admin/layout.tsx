import type { Metadata } from "next";

// Keep the admin (login included) out of search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
