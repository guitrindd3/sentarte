import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { redis } from "./redis";

// Admin login security (2026-10-05, user asked for "segurança"):
// - two-step login with an authenticator app (TOTP, RFC 6238) + one-time
//   recovery codes, set up from /admin/seguranca;
// - login history (successes and failures, city/device, masked IP);
// - wrong-attempt lockout kept in Redis (shared by every server instance);
// - instant "sair de todos os aparelhos" (revocation time in Redis).
// The TOTP secret is stored encrypted with a key derived from SESSION_SECRET,
// so the Redis data alone doesn't reveal it. Lost phone AND recovery codes:
// delete the Redis key `admin:totp` (see CLAUDE.md) to turn the code off.

const K = {
  totp: "admin:totp",
  totpPendente: "admin:totp:pendente",
  ultimoPasso: "admin:totp:ultimo",
  reserva: "admin:reserva",
  log: "admin:log",
  revogado: "admin:revogadoEm",
  falhas: (ip: string) => `admin:falhas:${ip}`,
};

// --- encryption of the secret ------------------------------------------------

function chave() {
  return createHash("sha256").update(`totp|${process.env.SESSION_SECRET ?? ""}`).digest();
}
function cifrar(texto: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chave(), iv);
  const enc = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}
function decifrar(dado: string) {
  const [iv, tag, enc] = dado.split(".").map((p) => Buffer.from(p, "base64"));
  const d = createDecipheriv("aes-256-gcm", chave(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}

// --- TOTP ------------------------------------------------------------------------

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32(buf: Buffer) {
  let bits = 0, valor = 0, out = "";
  for (const byte of buf) {
    valor = (valor << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(valor << (5 - bits)) & 31];
  return out;
}
function deBase32(s: string) {
  let bits = 0, valor = 0;
  const out: number[] = [];
  for (const ch of s.replace(/=+$/, "").toUpperCase()) {
    const i = B32.indexOf(ch);
    if (i < 0) continue;
    valor = (valor << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((valor >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
function codigoDoPasso(segredo: string, passo: number) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(passo));
  const h = createHmac("sha1", deBase32(segredo)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}
const passoAtual = () => Math.floor(Date.now() / 30_000);
/** Returns the matching 30-second step (±1 for clock drift), or null. */
function conferirCodigo(segredo: string, codigo: string): number | null {
  const c = codigo.replace(/\D/g, "");
  if (c.length !== 6) return null;
  const agora = passoAtual();
  for (const p of [agora - 1, agora, agora + 1]) {
    if (timingSafeEqual(Buffer.from(codigoDoPasso(segredo, p)), Buffer.from(c))) return p;
  }
  return null;
}

const hashReserva = (c: string) =>
  createHash("sha256").update(`reserva|${process.env.SESSION_SECRET ?? ""}|${c.toUpperCase().replace(/[^A-Z0-9]/g, "")}`).digest("hex");

export async function doisFatoresAtivo(): Promise<boolean> {
  const [v] = await redis([["EXISTS", K.totp]]);
  return Number(v) === 1;
}

/** Starts setup: a fresh secret kept for 10 minutes until confirmed. */
export async function iniciarDoisFatores() {
  const segredo = base32(randomBytes(20));
  await redis([["SET", K.totpPendente, cifrar(segredo), "EX", 600]]);
  const rotulo = encodeURIComponent("SentArte Painel");
  const otpauth = `otpauth://totp/${rotulo}?secret=${segredo}&issuer=${encodeURIComponent("SentArte")}&algorithm=SHA1&digits=6&period=30`;
  return { segredo, otpauth };
}

/** Confirms setup with a code from the app; returns the one-time recovery codes. */
export async function confirmarDoisFatores(codigo: string): Promise<string[] | null> {
  const [pend] = (await redis([["GET", K.totpPendente]])) as (string | null)[];
  if (!pend) return null;
  const segredo = decifrar(pend);
  const passo = conferirCodigo(segredo, codigo);
  if (passo === null) return null;
  const reservas = Array.from({ length: 8 }, () => {
    const s = base32(randomBytes(5)).slice(0, 8);
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
  await redis([
    ["SET", K.totp, cifrar(segredo)],
    ["SET", K.ultimoPasso, passo],
    ["DEL", K.totpPendente, K.reserva],
    ["SADD", K.reserva, ...reservas.map(hashReserva)],
  ]);
  return reservas;
}

/**
 * Checks a login code: a 6-digit app code (each one usable once) or a
 * recovery code (burned on use). Returns how it matched, or null.
 */
export async function conferirSegundoFator(codigo: string): Promise<"app" | "reserva" | null> {
  const [enc, ultimo] = (await redis([["GET", K.totp], ["GET", K.ultimoPasso]])) as (string | null)[];
  if (!enc) return null;
  const limpo = codigo.trim();
  if (/^\d{3}\s?\d{3}$/.test(limpo)) {
    const passo = conferirCodigo(decifrar(enc), limpo);
    if (passo === null || passo <= Number(ultimo ?? 0)) return null; // no replays
    await redis([["SET", K.ultimoPasso, passo]]);
    return "app";
  }
  const [removido] = await redis([["SREM", K.reserva, hashReserva(limpo)]]);
  return Number(removido) === 1 ? "reserva" : null;
}

export async function reservasRestantes() {
  const [n] = await redis([["SCARD", K.reserva]]);
  return Number(n) || 0;
}

export async function desativarDoisFatores() {
  await redis([["DEL", K.totp, K.ultimoPasso, K.reserva, K.totpPendente]]);
}

// --- lockout ---------------------------------------------------------------------

const MAX_FALHAS = 5;
const JANELA_S = 15 * 60;

/** Minutes left on this IP's lockout, or 0. */
export async function minutosBloqueado(ip: string) {
  const [n, ttl] = (await redis([["GET", K.falhas(ip)], ["TTL", K.falhas(ip)]])) as (string | number | null)[];
  return Number(n) >= MAX_FALHAS ? Math.max(1, Math.ceil(Number(ttl) / 60)) : 0;
}
export async function contarFalha(ip: string) {
  const [n] = await redis([["INCR", K.falhas(ip)]]);
  if (Number(n) === 1) await redis([["EXPIRE", K.falhas(ip), JANELA_S]]);
}
export async function limparFalhas(ip: string) {
  await redis([["DEL", K.falhas(ip)]]);
}

// --- revocation --------------------------------------------------------------------

export async function revogadoEmRedis() {
  const [v] = await redis([["GET", K.revogado]]);
  return Number(v) || 0;
}
export async function revogarAgora() {
  await redis([["SET", K.revogado, Math.floor(Date.now() / 1000)]]);
}

// --- history ---------------------------------------------------------------------

export type Entrada = {
  em: string;
  evento: string;
  ok: boolean;
  local?: string;
  aparelho?: string;
  ip?: string;
};

function aparelho(ua: string) {
  const sistema = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Outro";
  const nav = /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "navegador";
  return `${sistema}, ${nav}`;
}
function ipMascarado(ip: string) {
  if (ip.includes(".")) return ip.split(".").slice(0, 2).join(".") + ".x.x";
  if (ip.includes(":")) return ip.split(":").slice(0, 3).join(":") + ":…";
  return "";
}

export function ipDe(h: Headers) {
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "desconhecido";
}

export async function registrarEntrada(evento: string, ok: boolean, h: Headers) {
  const cidade = decodeURIComponent(h.get("x-vercel-ip-city") ?? "");
  const uf = h.get("x-vercel-ip-country-region") ?? "";
  const pais = h.get("x-vercel-ip-country") ?? "";
  const e: Entrada = {
    em: new Date().toISOString(),
    evento,
    ok,
    local: cidade ? (pais && pais !== "BR" ? `${cidade} (${pais})` : uf ? `${cidade} - ${uf}` : cidade) : undefined,
    aparelho: aparelho(h.get("user-agent") ?? ""),
    ip: ipMascarado(ipDe(h)),
  };
  try {
    await redis([["LPUSH", K.log, JSON.stringify(e)], ["LTRIM", K.log, 0, 199]]);
  } catch (err) {
    console.error("registrarEntrada", err);
  }
}

export async function historico(n = 50): Promise<Entrada[]> {
  const [lista] = (await redis([["LRANGE", K.log, 0, n - 1]])) as string[][];
  return (lista ?? []).flatMap((s) => {
    try {
      return [JSON.parse(s) as Entrada];
    } catch {
      return [];
    }
  });
}
