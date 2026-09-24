import "server-only";
import { cache } from "react";
import { list, put } from "@vercel/blob";
import { DEFAULT_CONTENT, type SiteContent } from "./content-schema";

const CONTENT_PATH = "content/site-content.json";

/**
 * Cached per request (React cache()) so layout/page/components that each
 * need site content only trigger one Blob read per request.
 */
// IMPORTANT: this must never silently return DEFAULT_CONTENT for a read that
// merely *failed* — every admin Server Action does getContent() then
// saveContent(), so a swallowed transient error here used to get the empty
// default content written back to Blob as if it were real, wiping out
// everything (2026-09-24 incident: torched times/boho/Vasco/desenhos after a
// single flaky read). DEFAULT_CONTENT is only a legitimate result when Blob
// genuinely has no content saved yet (list() finds nothing) — any other
// failure must throw so the Server Action fails loudly and nothing gets
// persisted, instead of failing silently and persisting garbage.
export const getContent = cache(async (): Promise<SiteContent> => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Blob isn't configured at all (local dev/build without the token) —
    // a legitimate, harmless case since no save can happen either. Once the
    // token exists, never fall back silently again — see the note above.
    return DEFAULT_CONTENT;
  }

  const { blobs } = await list({ prefix: CONTENT_PATH, limit: 1 });
  const match = blobs.find((b) => b.pathname === CONTENT_PATH);
  if (!match) return DEFAULT_CONTENT;

  // Vercel Blob's public URL sits behind a CDN that can serve a stale
  // cached copy for tens of seconds after put() — cache:"no-store" only
  // stops Next's own Data Cache, not that CDN edge cache. Busting with
  // list()'s own `uploadedAt` isn't enough (that metadata can itself lag
  // behind the write), so use Date.now() — a guaranteed-unique query on
  // every single read forces a real origin fetch every time.
  const res = await fetch(`${match.url}?v=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`getContent: failed to fetch site content (${res.status})`);

  const data = (await res.json()) as Partial<SiteContent>;
  return {
    site: { ...DEFAULT_CONTENT.site, ...data.site },
    hero: { ...DEFAULT_CONTENT.hero, ...data.hero },
    categorias: data.categorias ?? DEFAULT_CONTENT.categorias,
  };
});

export async function saveContent(content: SiteContent): Promise<void> {
  await put(CONTENT_PATH, JSON.stringify(content, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}
