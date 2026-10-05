import "server-only";
import { scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import revogacao from "@/content/admin.json";
import { gravarArquivo, lerArquivo } from "./github-store";
import { redisAtivo } from "./redis";
import { doisFatoresAtivo, revogadoEmRedis, revogarAgora } from "./seguranca";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "sentarte_admin";
/** Admin sessions last 7 days (was 30, shortened 2026-09-30). */
const DURACAO_DIAS = 7;
/** Sessions issued at or before `revogadoEm` (unix seconds) are rejected —
 * "Sair de todos os aparelhos". Since 2026-10-05 the time lives in Redis
 * (instant); content/admin.json is the older repo copy (took a deploy) and
 * still counts, whichever is later. */
async function revogadoEm() {
  const doRepo = Number((revogacao as { revogadoEm?: number }).revogadoEm) || 0;
  return redisAtivo() ? Math.max(doRepo, await revogadoEmRedis()) : doRepo;
}

/** Invalidates every admin session issued until now, on every device. */
export async function revogarTodasAsSessoes() {
  if (redisAtivo()) return revogarAgora();
  const atual = await lerArquivo("content/admin.json");
  await gravarArquivo(
    "content/admin.json",
    `${JSON.stringify({ revogadoEm: Math.floor(Date.now() / 1000) }, null, 2)}\n`,
    "Painel: sair de todos os aparelhos",
    atual?.sha
  );
}

function getEncodedKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export function verifyPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

/** `mfa`: the login passed the phone code too (required once it's turned on). */
export async function createSession({ mfa = false }: { mfa?: boolean } = {}) {
  const expiresAt = new Date(Date.now() + DURACAO_DIAS * 24 * 60 * 60 * 1000);
  const token = await new SignJWT({ role: "admin", mfa })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_DIAS}d`)
    .sign(getEncodedKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), { algorithms: ["HS256"] });
    // iat is in whole seconds; a session issued in the same second as the
    // revocation (the "sair de todos" click itself) is also rejected.
    if ((payload.iat ?? 0) <= (await revogadoEm())) return false;
    // Once the phone code is on, sessions from before it (password only) stop working.
    if (payload.mfa !== true && redisAtivo() && (await doisFatoresAtivo())) return false;
    return payload.role === "admin";
  } catch {
    // Bad/expired token — or Redis unreachable: fail closed.
    return false;
  }
}

// Short-lived "password OK, now the code" marker between the two login steps.
const PRE_COOKIE = "sentarte_pre";

export async function criarPreSessao() {
  const token = await new SignJWT({ role: "pre" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(getEncodedKey());
  (await cookies()).set(PRE_COOKIE, token, { httpOnly: true, secure: true, sameSite: "strict", path: "/admin", maxAge: 300 });
}

export async function preSessaoValida() {
  const token = (await cookies()).get(PRE_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), { algorithms: ["HS256"] });
    return payload.role === "pre";
  } catch {
    return false;
  }
}

export async function apagarPreSessao() {
  (await cookies()).delete({ name: PRE_COOKIE, path: "/admin" });
}
