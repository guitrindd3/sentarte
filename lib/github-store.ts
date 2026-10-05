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

const GIT = `https://api.github.com/repos/${REPO}/git`;

async function gh<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...cabecalhos(), ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    cache: "no-store",
  });
  if (res.status === 409 || res.status === 422) {
    throw new Error("O conteúdo mudou enquanto você editava. Recarregue o painel e salve de novo.");
  }
  if (!res.ok) throw new Error(`GitHub: falha (${res.status}) em ${url.replace(/^https:\/\/api\.github\.com/, "")}`);
  return (await res.json()) as T;
}

export type ArquivoNovo = { caminho: string; dados: Buffer | string };

/**
 * Writes several files in ONE commit (Git Data API), so an admin save with
 * photos makes a single redeploy instead of one per photo (2026-10-05).
 * `conferir` = a file the caller read earlier and its sha then: if it changed
 * on main since, the save is refused instead of overwriting newer edits.
 */
export async function gravarCommit(
  arquivos: ArquivoNovo[],
  mensagem: string,
  conferir?: { caminho: string; sha: string }
) {
  const ref = await gh<{ object: { sha: string } }>(`${GIT}/ref/heads/${BRANCH}`);
  const head = ref.object.sha;
  if (conferir) {
    const atual = await gh<{ sha: string }>(`${API}/${encodeURI(conferir.caminho)}?ref=${head}`);
    if (atual.sha !== conferir.sha) {
      throw new Error("O conteúdo mudou enquanto você editava. Recarregue o painel e salve de novo.");
    }
  }
  const commitAtual = await gh<{ tree: { sha: string } }>(`${GIT}/commits/${head}`);
  const tree = [];
  for (const a of arquivos) {
    const blob = await gh<{ sha: string }>(`${GIT}/blobs`, {
      method: "POST",
      body: JSON.stringify({
        content: (typeof a.dados === "string" ? Buffer.from(a.dados, "utf8") : a.dados).toString("base64"),
        encoding: "base64",
      }),
    });
    tree.push({ path: a.caminho, mode: "100644", type: "blob", sha: blob.sha });
  }
  const novaArvore = await gh<{ sha: string }>(`${GIT}/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: commitAtual.tree.sha, tree }),
  });
  const commit = await gh<{ sha: string }>(`${GIT}/commits`, {
    method: "POST",
    body: JSON.stringify({ message: mensagem, tree: novaArvore.sha, parents: [head] }),
  });
  // force: false → if main moved since we read it, GitHub refuses (422).
  await gh(`${GIT}/refs/heads/${BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
  return commit.sha;
}

export type CommitResumo = { sha: string; mensagem: string; data: string };

/** Latest commits on main (newest first), for the admin's status/history. */
export async function ultimosCommits(n = 20): Promise<CommitResumo[]> {
  const lista = await gh<{ sha: string; commit: { message: string; committer: { date: string } } }[]>(
    `https://api.github.com/repos/${REPO}/commits?sha=${BRANCH}&per_page=${n}`
  );
  return lista.map((c) => ({ sha: c.sha, mensagem: c.commit.message.split("\n")[0], data: c.commit.committer.date }));
}
