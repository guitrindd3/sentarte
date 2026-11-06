import "server-only";
import { CATEGORIA_COM_PRECO } from "./offer";
import { redis, redisAtivo } from "./redis";

// Numbered collections (2026-11-06, user picked "Coleções numeradas por
// temporada"): a limited run of chosen catalog chairs ("Coleção Verão 2027,
// só 40"). Each chair sold gets its own number (nº 07 de 40), written on its
// passport (lib/passaporte.ts). Before it opens, a waiting list collects
// e-mails (they also join the e-mail list, lib/lista-email.ts) and the
// atelier mails them from /admin/colecoes when it opens.
// Redis: hash `colecoes` id → Colecao; `colecao:<id>:vendidos` counter (bumped
// when a paid order's passports are numbered); set `colecao:<id>:espera`.

export type EstadoColecao = "rascunho" | "espera" | "aberta" | "encerrada";

export type Colecao = {
  id: string;
  nome: string;
  descricao: string;
  /** How many chairs the whole edition has. */
  total: number;
  /** Catalog chair NAMES (cart items carry the name) in the `cadeiras` category. */
  modelos: string[];
  estado: EstadoColecao;
  /** With estado "aberta": opens only from this moment (ms); waiting list until then. */
  abreEm?: number;
  criadaEm: number;
};

/** What visitors see. */
export type Situacao = "espera" | "aberta" | "esgotada" | "encerrada";

export type ColecaoPublica = {
  id: string;
  nome: string;
  descricao: string;
  total: number;
  vendidos: number;
  restam: number;
  situacao: Situacao;
  abreEm?: number;
  modelos: string[];
};

const K = { hash: "colecoes", vendidos: (id: string) => `colecao:${id}:vendidos`, espera: (id: string) => `colecao:${id}:espera` };

export const idColecaoValido = (id: unknown): id is string => typeof id === "string" && /^[a-z0-9-]{2,40}$/.test(id);

export async function listarColecoes(): Promise<Colecao[]> {
  if (!redisAtivo()) return [];
  const [bruto] = (await redis([["HGETALL", K.hash]])) as string[][];
  const lista: Colecao[] = [];
  for (let i = 0; i + 1 < (bruto ?? []).length; i += 2) {
    try {
      lista.push(JSON.parse(bruto[i + 1]) as Colecao);
    } catch {}
  }
  return lista.sort((a, b) => b.criadaEm - a.criadaEm);
}

export async function lerColecao(id: string): Promise<Colecao | null> {
  if (!idColecaoValido(id)) return null;
  const [b] = (await redis([["HGET", K.hash, id]])) as (string | null)[];
  try {
    return b ? (JSON.parse(b) as Colecao) : null;
  } catch {
    return null;
  }
}

export async function salvarColecao(c: Colecao) {
  await redis([["HSET", K.hash, c.id, JSON.stringify(c)]]);
}

export async function apagarColecao(id: string) {
  await redis([["HDEL", K.hash, id], ["DEL", K.vendidos(id)], ["DEL", K.espera(id)]]);
}

/** Sold counts and waiting-list sizes, in one round trip. */
export async function numerosDasColecoes(ids: string[]) {
  if (!ids.length) return new Map<string, { vendidos: number; espera: number }>();
  const r = await redis(ids.flatMap((id) => [["GET", K.vendidos(id)], ["SCARD", K.espera(id)]]));
  return new Map(ids.map((id, i) => [id, { vendidos: Number(r[i * 2]) || 0, espera: Number(r[i * 2 + 1]) || 0 }]));
}

export function situacaoDe(c: Colecao, vendidos: number, agora = Date.now()): Situacao | null {
  if (c.estado === "rascunho") return null;
  if (c.estado === "encerrada") return "encerrada";
  if (vendidos >= c.total) return "esgotada";
  if (c.estado === "espera" || (c.abreEm && c.abreEm > agora)) return "espera";
  return "aberta";
}

/** Every collection visitors can see (not drafts), with live numbers. */
export async function colecoesPublicas(): Promise<ColecaoPublica[]> {
  const todas = await listarColecoes();
  const nums = await numerosDasColecoes(todas.map((c) => c.id));
  return todas.flatMap((c) => {
    const vendidos = Math.min(c.total, nums.get(c.id)?.vendidos ?? 0);
    const situacao = situacaoDe(c, vendidos);
    if (!situacao) return [];
    return [{ id: c.id, nome: c.nome, descricao: c.descricao, total: c.total, vendidos, restam: c.total - vendidos, situacao, abreEm: c.abreEm, modelos: c.modelos }];
  });
}

export async function colecaoPublica(id: string) {
  return (await colecoesPublicas()).find((c) => c.id === id) ?? null;
}

export type ItemDeColecao = { id: string; nome: string; modeloNome: string; qtd: number };

/**
 * Checkout check: chairs of a collection can only be bought while it's open
 * and there are enough left. Returns the order's collection lines (saved on
 * the order, numbered on payment) or a message for the customer. If Redis is
 * down it lets the sale through (the atelier settles it by hand).
 */
export async function conferirColecoes(
  itens: { categoriaSlug: string; modeloNome: string; quantidade: number; trama?: string }[]
): Promise<{ ok: true; linhas: ItemDeColecao[] } | { ok: false; erro: string }> {
  if (!redisAtivo()) return { ok: true, linhas: [] };
  let publicas: ColecaoPublica[];
  try {
    publicas = await colecoesPublicas();
  } catch {
    return { ok: true, linhas: [] };
  }
  const ativas = publicas.filter((c) => c.situacao !== "encerrada");
  const linhas: ItemDeColecao[] = [];
  for (const i of itens) {
    if (i.categoriaSlug !== CATEGORIA_COM_PRECO || i.trama) continue;
    // a "<Nome> personalizado" photo is the same chair with a name
    const base = i.modeloNome.replace(/ personalizado$/i, "");
    const c = ativas.find((x) => x.modelos.includes(i.modeloNome) || x.modelos.includes(base));
    if (!c) continue;
    if (c.situacao === "espera") return { ok: false, erro: `A ${c.nome} ainda não abriu. Entre na lista de espera em sentarte.com.br/colecao/${c.id}.` };
    if (c.situacao === "esgotada") return { ok: false, erro: `A ${c.nome} esgotou. Tire a ${i.modeloNome} do carrinho para continuar.` };
    const ja = linhas.filter((l) => l.id === c.id).reduce((s, l) => s + l.qtd, 0);
    if (ja + i.quantidade > c.restam) return { ok: false, erro: `Da ${c.nome} só ${c.restam === 1 ? "resta 1 cadeira" : `restam ${c.restam} cadeiras`}. Diminua a quantidade no carrinho.` };
    linhas.push({ id: c.id, nome: c.nome, modeloNome: i.modeloNome, qtd: i.quantidade });
  }
  return { ok: true, linhas };
}

/** Takes the next `qtd` numbers of a collection (on payment). */
export async function numerar(id: string, qtd: number): Promise<number[]> {
  const [ate] = await redis([["INCRBY", K.vendidos(id), qtd]]);
  const fim = Number(ate);
  return Array.from({ length: qtd }, (_, k) => fim - qtd + 1 + k);
}

export async function entrarNaEspera(id: string, email: string) {
  await redis([["SADD", K.espera(id), email]]);
}

export async function listaDeEspera(id: string): Promise<string[]> {
  const [m] = (await redis([["SMEMBERS", K.espera(id)]])) as string[][];
  return m ?? [];
}
