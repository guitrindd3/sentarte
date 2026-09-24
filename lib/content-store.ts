import "server-only";
import { cache } from "react";
import { list, put } from "@vercel/blob";
import { DEFAULT_CONTENT, type SiteContent } from "./content-schema";

const CONTENT_PATH = "content/site-content.json";

async function fetchContent(): Promise<SiteContent | null> {
  const { blobs } = await list({ prefix: CONTENT_PATH, limit: 1 });
  const match = blobs.find((b) => b.pathname === CONTENT_PATH);
  if (!match) return null;

  // Vercel Blob's public URL sits behind a CDN that can serve a stale
  // cached copy for tens of seconds after put() — cache:"no-store" only
  // stops Next's own Data Cache, not that CDN edge cache. Busting with
  // list()'s own `uploadedAt` isn't enough (that metadata can itself lag
  // behind the write), so use Date.now() — a guaranteed-unique query on
  // every single read forces a real origin fetch every time.
  //
  // NOTE: forcing an uncached origin fetch on every single read is exactly
  // what caused a 403 storm (and a full site outage) on 2026-09-24 under
  // concurrent admin automation — the Blob origin started rejecting the
  // uncached burst. If that recurs, throttle/cache this instead of removing
  // the busting entirely (stale CDN reads are the other failure mode).
  const res = await fetch(`${match.url}?v=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetchContent: failed to fetch site content (${res.status})`);

  const data = (await res.json()) as Partial<SiteContent>;
  return {
    site: { ...DEFAULT_CONTENT.site, ...data.site },
    hero: { ...DEFAULT_CONTENT.hero, ...data.hero },
    categorias: data.categorias ?? DEFAULT_CONTENT.categorias,
  };
}

/**
 * Cached per request (React cache()) so layout/page/components that each
 * need site content only trigger one Blob read per request.
 *
 * Used for READING/rendering (public pages, the admin page's own display).
 * Resilient by design: falls back to DEFAULT_CONTENT on any read failure so
 * a Blob hiccup degrades to a stale/default-looking page instead of taking
 * the whole site down. NEVER use this as the read half of a
 * read-modify-write — use getContentForWrite() instead, see the note there.
 */
export const getContent = cache(async (): Promise<SiteContent> => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return DEFAULT_CONTENT;
  try {
    return (await fetchContent()) ?? DEFAULT_CONTENT;
  } catch (err) {
    console.error("getContent: read failed, falling back to default content", err);
    return DEFAULT_CONTENT;
  }
});

/**
 * Used ONLY at the start of an admin Server Action that reads, mutates, and
 * saves content back. Throws instead of silently falling back to
 * DEFAULT_CONTENT — a failed read here must abort the save, never persist
 * empty/default content over real data. This is the fix for the 2026-09-24
 * incident, where a swallowed transient read failure got the empty default
 * content written back to Blob, wiping out times/boho/Vasco/desenhos.
 */
export async function getContentForWrite(): Promise<SiteContent> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("getContentForWrite: Blob not configured — refusing to save");
  }
  const content = await fetchContent();
  return content ?? DEFAULT_CONTENT; // null only means genuinely no content saved yet — safe to start from defaults
}

export async function saveContent(content: SiteContent): Promise<void> {
  await put(CONTENT_PATH, JSON.stringify(content, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}
