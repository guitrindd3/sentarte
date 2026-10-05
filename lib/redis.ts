import "server-only";

// Upstash Redis over its REST API (no SDK). Used by the site statistics
// (lib/estatisticas.ts) and the admin security bits (lib/seguranca.ts).
// Free plan, auto-upgrade off — see CLAUDE.md "Site statistics".
const URL_ = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const redisAtivo = () => Boolean(URL_ && TOKEN);

export type Cmd = (string | number)[];

/** Runs several commands in one HTTP request; throws if Redis is missing or fails. */
export async function redis(cmds: Cmd[]): Promise<unknown[]> {
  if (!URL_ || !TOKEN) throw new Error("Redis não configurado");
  if (cmds.length === 0) return [];
  const res = await fetch(`${URL_}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const out = (await res.json()) as { result?: unknown; error?: string }[];
  return out.map((r) => {
    if (r.error) throw new Error(`Upstash: ${r.error}`);
    return r.result;
  });
}
