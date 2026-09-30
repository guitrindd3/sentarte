import "server-only";
import { scryptSync, timingSafeEqual } from "crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { list, put } from "@vercel/blob";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "sentarte_admin";
/** Admin sessions last 7 days (was 30, shortened 2026-09-30). */
const DURACAO_DIAS = 7;
/** Sessions issued before this timestamp are rejected ("Sair de todos os aparelhos"). */
const REVOGACAO_PATH = "admin/sessoes-revogadas.json";

const revogadoEm = cache(async (): Promise<number> => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return 0;
  try {
    const { blobs } = await list({ prefix: REVOGACAO_PATH, limit: 1 });
    const b = blobs.find((x) => x.pathname === REVOGACAO_PATH);
    if (!b) return 0;
    const r = await fetch(`${b.url}?v=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return 0;
    const j = (await r.json()) as { revogadoEm?: number };
    return Number(j.revogadoEm) || 0;
  } catch {
    return 0;
  }
});

/** Invalidates every admin session issued until now, on every device. */
export async function revogarTodasAsSessoes() {
  await put(REVOGACAO_PATH, JSON.stringify({ revogadoEm: Math.floor(Date.now() / 1000) }), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
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

export async function createSession() {
  const expiresAt = new Date(Date.now() + DURACAO_DIAS * 24 * 60 * 60 * 1000);
  const token = await new SignJWT({ role: "admin" })
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
    return true;
  } catch {
    return false;
  }
}
