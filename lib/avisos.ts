import "server-only";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import type { PedidoCliente } from "./clientes";
import { SITE_URL } from "./nav";
import { formatBRL } from "./offer";
import { redis, redisAtivo } from "./redis";
import { cifrar, decifrar } from "./seguranca";

// Sale alerts (2026-10-06, user: "você receber um aviso na hora de cada
// venda"). Two free channels, both set up by the admin in /admin/avisos (no
// env vars, no domain needed):
// - phone push through ntfy.sh (free app, no account): a random secret topic
//   kept in Redis. The push carries no address/phone/CPF — only value, chairs
//   and city — since anyone who learned the topic could read it.
// - e-mail from the atelier's own Gmail to itself, with a Google "senha de
//   app" (stored AES-GCM encrypted, like the 2FA secret). Full order details.

const K = { ntfy: "avisos:ntfy", gmail: "avisos:gmail" };

type ConfigGmail = { email: string; senha: string };

export type EstadoAvisos = { ntfy: string | null; email: string | null };

export async function estadoAvisos(): Promise<EstadoAvisos> {
  if (!redisAtivo()) return { ntfy: null, email: null };
  const [ntfy, gmail] = (await redis([["GET", K.ntfy], ["GET", K.gmail]])) as (string | null)[];
  let email: string | null = null;
  try {
    email = gmail ? (JSON.parse(decifrar(gmail)) as ConfigGmail).email : null;
  } catch {}
  return { ntfy, email };
}

export async function ligarNtfy() {
  const topico = `sentarte-${randomBytes(12).toString("hex")}`;
  await redis([["SET", K.ntfy, topico]]);
  return topico;
}

export async function desligarNtfy() {
  await redis([["DEL", K.ntfy]]);
}

export async function salvarGmail(email: string, senha: string) {
  await redis([["SET", K.gmail, cifrar(JSON.stringify({ email, senha } satisfies ConfigGmail))]]);
}

export async function desligarGmail() {
  await redis([["DEL", K.gmail]]);
}

async function lerGmail(): Promise<ConfigGmail | null> {
  const [g] = (await redis([["GET", K.gmail]])) as (string | null)[];
  if (!g) return null;
  try {
    return JSON.parse(decifrar(g)) as ConfigGmail;
  } catch {
    return null;
  }
}

async function mandarNtfy(topico: string, titulo: string, texto: string, link: string) {
  const res = await fetch(`https://ntfy.sh/${topico}`, {
    method: "POST",
    // ntfy reads non-ASCII titles only when RFC 2047 encoded
    headers: { Title: `=?UTF-8?B?${Buffer.from(titulo).toString("base64")}?=`, Tags: "moneybag", Priority: "high", Click: link },
    body: texto,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ntfy ${res.status}`);
}

async function mandarEmail(cfg: ConfigGmail, assunto: string, texto: string) {
  const t = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: cfg.email, pass: cfg.senha } });
  await t.sendMail({ from: `Site SentArte <${cfg.email}>`, to: cfg.email, subject: assunto, text: texto });
}

function textoCompleto(p: PedidoCliente) {
  const e = p.entrega;
  return [
    `Venda nova no site! ${formatBRL(p.valor)} no ${p.forma === "pix" ? "Pix" : "cartão"}.`,
    "",
    "Itens:",
    ...p.itens.map((i) => `- ${i}`),
    p.frete ? `Frete: ${p.frete.valor ? formatBRL(p.frete.valor) : "grátis"}${p.frete.servico ? ` (${p.frete.servico})` : ""}` : "",
    p.cupom ? `Cupom: ${p.cupom}` : "",
    "",
    `Cliente: ${p.nome}`,
    `WhatsApp: ${p.whatsapp}`,
    e
      ? `Entrega: ${e.endereco}, ${e.numero}${e.complemento ? ` (${e.complemento})` : ""} - ${e.bairro ? `${e.bairro}, ` : ""}${e.cidade}/${e.uf}, CEP ${e.cep}`
      : `Cidade: ${p.cidade}`,
    "",
    `Abrir o pedido no painel: ${SITE_URL}/admin/clientes/${p.ref}`,
  ]
    .filter((l, i, arr) => l !== "" || arr[i - 1] !== "")
    .join("\n");
}

/** Sends the alert on every configured channel; errors are logged, never thrown. */
export async function avisarVenda(p: PedidoCliente) {
  if (!redisAtivo()) return;
  const [topico, gmail] = await Promise.all([redis([["GET", K.ntfy]]).then((r) => r[0] as string | null), lerGmail()]);
  const qtd = p.itens.length;
  const titulo = `Venda nova: ${formatBRL(p.valor)}`;
  const curto = `${qtd} ${qtd === 1 ? "item" : "itens"} no ${p.forma === "pix" ? "Pix" : "cartão"}, para ${p.cidade}. Toque para abrir o painel.`;
  const link = `${SITE_URL}/admin/clientes/${p.ref}`;
  await Promise.all([
    topico ? mandarNtfy(topico, titulo, curto, link).catch((e) => console.error("aviso ntfy", e)) : null,
    gmail ? mandarEmail(gmail, `${titulo} (${p.nome.split(" ")[0]})`, textoCompleto(p)).catch((e) => console.error("aviso email", e)) : null,
  ]);
}

/** Test from /admin/avisos: says which channel failed. */
export async function testarAvisos(): Promise<string[]> {
  const [topico, gmail] = await Promise.all([redis([["GET", K.ntfy]]).then((r) => r[0] as string | null), lerGmail()]);
  const erros: string[] = [];
  if (topico) {
    await mandarNtfy(topico, "Teste de aviso do site", "Se você viu isso, o aviso de venda no celular está funcionando.", `${SITE_URL}/admin`).catch(() =>
      erros.push("celular (ntfy)")
    );
  }
  if (gmail) {
    await mandarEmail(gmail, "Teste de aviso do site SentArte", "Se você recebeu este e-mail, o aviso de venda por e-mail está funcionando.").catch((e) => {
      console.error("teste email", e);
      erros.push("e-mail (confira a senha de app)");
    });
  }
  return erros;
}
