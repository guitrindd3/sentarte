import { emailDoLinkSair, removerEmail } from "@/lib/lista-email";
import { redisAtivo } from "@/lib/redis";

export const dynamic = "force-dynamic";

/** One-click unsubscribe (RFC 8058): Gmail's "Cancelar inscrição" POSTs here. */
export async function POST(req: Request) {
  const u = new URL(req.url);
  const email = emailDoLinkSair(u.searchParams.get("e"), u.searchParams.get("t"));
  if (!email || !redisAtivo()) return new Response("link inválido", { status: 400 });
  await removerEmail(email);
  return new Response("ok");
}

/** Opened in a browser: the page with the button. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  return Response.redirect(new URL(`/sair-da-lista${u.search}`, u.origin), 303);
}
