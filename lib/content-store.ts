import "server-only";
import { cache } from "react";
import conteudoDoRepo from "@/content/site-content.json";
import { DEFAULT_CONTENT, type SiteContent } from "./content-schema";
import { githubConfigurado, gravarArquivo, lerArquivo } from "./github-store";
import { CATEGORIAS_OCULTAS } from "./offer";

// Site content lives in the repo (content/site-content.json) since
// 2026-10-02. Before, it was one JSON in Vercel Blob — and the free Blob
// store got "limits-exceeded-suspended" twice (2026-09-24 on the old
// account, 2026-10-01 on this one), taking every photo down. Now the public
// site reads the copy bundled in the deploy (no storage calls at all) and
// the admin panel saves by committing to GitHub (see lib/github-store.ts),
// which redeploys the site.

const CAMINHO = "content/site-content.json";

function normalizar(data: Partial<SiteContent>): SiteContent {
  return {
    site: { ...DEFAULT_CONTENT.site, ...data.site },
    hero: { ...DEFAULT_CONTENT.hero, ...data.hero },
    categorias: data.categorias ?? DEFAULT_CONTENT.categorias,
  };
}

function withoutHiddenCategories(content: SiteContent): SiteContent {
  return {
    ...content,
    categorias: content.categorias.filter((c) => !CATEGORIAS_OCULTAS.has(c.slug)),
  };
}

/** Public-site content: the copy bundled in this deploy, hidden categories removed. */
export const getContent = cache(async (): Promise<SiteContent> =>
  withoutHiddenCategories(normalizar(conteudoDoRepo as Partial<SiteContent>))
);

/**
 * For the /admin page's own display: the latest saved version straight from
 * GitHub (it can be ahead of the deployed site for a minute or two after a
 * save), unfiltered so hidden categories stay editable. Falls back to the
 * bundled copy if GitHub isn't reachable/configured.
 */
export const getAdminContent = cache(async (): Promise<SiteContent> => {
  if (githubConfigurado()) {
    try {
      const arq = await lerArquivo(CAMINHO);
      if (arq) return normalizar(JSON.parse(arq.texto) as Partial<SiteContent>);
    } catch (err) {
      console.error("getAdminContent: GitHub read failed, using bundled copy", err);
    }
  }
  return normalizar(conteudoDoRepo as Partial<SiteContent>);
});

// sha of the file each write started from, so a save made on top of a stale
// read is rejected by GitHub instead of silently overwriting newer edits.
const shaDaLeitura = new WeakMap<SiteContent, string>();

/**
 * Used ONLY at the start of an admin Server Action that reads, mutates, and
 * saves content back. Throws on any failure — never falls back to defaults,
 * so a bad read can't be saved over the real catalog (the 2026-09-24 lesson).
 */
export async function getContentForWrite(): Promise<SiteContent> {
  const arq = await lerArquivo(CAMINHO);
  if (!arq) throw new Error("getContentForWrite: content file missing in the repo — refusing to save");
  const content = normalizar(JSON.parse(arq.texto) as Partial<SiteContent>);
  shaDaLeitura.set(content, arq.sha);
  return content;
}

export async function saveContent(content: SiteContent): Promise<void> {
  const sha = shaDaLeitura.get(content);
  if (!sha) throw new Error("saveContent: content wasn't read with getContentForWrite()");
  await gravarArquivo(CAMINHO, JSON.stringify(content, null, 2) + "\n", "Painel: atualiza conteúdo do site", sha);
}

/** Saves an uploaded photo into public/catalogo and returns its site URL. */
export async function salvarFoto(arquivo: File): Promise<string> {
  const ext = arquivo.type === "image/png" ? "png" : arquivo.type === "image/webp" ? "webp" : "jpg";
  const nome = `${crypto.randomUUID()}.${ext}`;
  await gravarArquivo(`public/catalogo/${nome}`, Buffer.from(await arquivo.arrayBuffer()), "Painel: nova foto");
  return `/catalogo/${nome}`;
}
