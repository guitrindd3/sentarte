import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/nav";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/pedido", "/acompanhar/", "/retomar/", "/sair-da-lista", "/p/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
