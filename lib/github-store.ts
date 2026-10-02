import "server-only";

// Tiny GitHub "Contents API" client used as the site's free storage
// (2026-10-02): content/site-content.json and public/catalogo/* live in the
// repo, and the admin panel saves by committing to it. Every commit makes
// Vercel redeploy, so a save shows up on the site in ~1-2 minutes.
// Needs GITHUB_TOKEN (fine-grained token with Contents: read & write on the
// repo) and optionally GITHUB_REPO (default guitrindd3/sentarte).

const REPO = process.env.GITHUB_REPO || "guitrindd3/sentarte";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const API = `https://api.github.com/repos/${REPO}/contents`;

export function githubConfigurado() {
  return Boolean(process.env.GITHUB_TOKEN);
}

function cabecalhos() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN não configurado — o painel não consegue salvar.");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "sentarte-admin",
  };
}

/** Reads a repo file. Throws on any failure (callers decide how to degrade). */
export async function lerArquivo(caminho: string): Promise<{ texto: string; sha: string } | null> {
  const res = await fetch(`${API}/${encodeURI(caminho)}?ref=${BRANCH}`, { headers: cabecalhos(), cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub: falha ao ler ${caminho} (${res.status})`);
  const j = (await res.json()) as { content: string; sha: string };
  return { texto: Buffer.from(j.content, "base64").toString("utf8"), sha: j.sha };
}

/** Creates or replaces a repo file in one commit. `sha` is required to replace. */
export async function gravarArquivo(caminho: string, dados: Buffer | string, mensagem: string, sha?: string) {
  const res = await fetch(`${API}/${encodeURI(caminho)}`, {
    method: "PUT",
    headers: { ...cabecalhos(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: mensagem,
      content: (typeof dados === "string" ? Buffer.from(dados, "utf8") : dados).toString("base64"),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
    cache: "no-store",
  });
  if (res.status === 409 || res.status === 422) {
    throw new Error("O conteúdo mudou enquanto você editava. Recarregue o painel e salve de novo.");
  }
  if (!res.ok) throw new Error(`GitHub: falha ao salvar ${caminho} (${res.status})`);
}
