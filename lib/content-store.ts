import "server-only";
import { cache } from "react";
import { list, put } from "@vercel/blob";
import { DEFAULT_CONTENT, type SiteContent } from "./content-schema";

const CONTENT_PATH = "content/site-content.json";

/**
 * Cached per request (React cache()) so layout/page/components that each
 * need site content only trigger one Blob read per request.
 */
export const getContent = cache(async (): Promise<SiteContent> => {
  try {
    const { blobs } = await list({ prefix: CONTENT_PATH, limit: 1 });
    const match = blobs.find((b) => b.pathname === CONTENT_PATH);
    if (!match) return DEFAULT_CONTENT;

    const res = await fetch(match.url, { cache: "no-store" });
    if (!res.ok) return DEFAULT_CONTENT;

    const data = (await res.json()) as Partial<SiteContent>;
    return {
      site: { ...DEFAULT_CONTENT.site, ...data.site },
      hero: { ...DEFAULT_CONTENT.hero, ...data.hero },
      categorias: data.categorias ?? DEFAULT_CONTENT.categorias,
    };
  } catch {
    return DEFAULT_CONTENT;
  }
});

export async function saveContent(content: SiteContent): Promise<void> {
  await put(CONTENT_PATH, JSON.stringify(content, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}
