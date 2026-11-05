import { after } from "next/server";
import { limiteDeCadastro } from "@/lib/clientes";
import { anotarNoCaminho, vidValido } from "@/lib/estatisticas";
import { estadoAvisos, mandarEmailAoCliente } from "@/lib/avisos";
import { emailBoasVindas } from "@/lib/campanhas";
import { cupomDaJanela, emailValido, inscreverEmail, situacaoJanela } from "@/lib/lista-email";
import { redisAtivo } from "@/lib/redis";
import { ipDe } from "@/lib/seguranca";

export const dynamic = "force-dynamic";
const sem = { headers: { "Cache-Control": "no-store" } };

/** GET → whether the welcome-coupon window may show now, and what it offers (in words). */
export async function GET() {
  if (!redisAtivo()) return Response.json({ ligado: false }, sem);
  try {
    const { oferta } = await situacaoJanela();
    return Response.json(oferta ? { ligado: true, rotulo: oferta.rotulo, condicao: oferta.condicao, validade: oferta.validade } : { ligado: false }, sem);
  } catch {
    return Response.json({ ligado: false }, sem);
  }
}

/** POST {nome, email, aceito} → joins the e-mail list and gets the coupon. */
export async function POST(req: Request) {
  if (!redisAtivo()) return Response.json({ erro: "Indisponível agora." }, { status: 503 });
  let corpo: { nome?: string; email?: string; aceito?: boolean; site?: string; vid?: string };
  try {
    corpo = await req.json();
  } catch {
    return Response.json({ erro: "Dados inválidos." }, { status: 400 });
  }
  if (corpo.site) return Response.json({ ok: true, codigo: "" }); // honeypot
  const nome = String(corpo.nome ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  const email = emailValido(corpo.email);
  if (!email) return Response.json({ erro: "Confira o e-mail." }, { status: 400 });
  if (corpo.aceito !== true) return Response.json({ erro: "Marque que aceita receber os e-mails." }, { status: 400 });
  try {
    const s = await situacaoJanela();
    if (!s.oferta) return Response.json({ erro: "Essa promoção não está valendo agora." }, { status: 409 });
    if (await limiteDeCadastro(ipDe(req.headers))) return Response.json({ erro: "Muitos cadastros daqui. Tente mais tarde." }, { status: 429 });
    const cupom = await cupomDaJanela(email, { ...s, oferta: s.oferta });
    await inscreverEmail({ email, nome, origem: "janela" });
    await anotarNoCaminho(vidValido(corpo.vid) ? corpo.vid : undefined, { k: "i", x: `cupom ${cupom.codigo}` });
    const porEmail = cupom.novo && !!(await estadoAvisos()).email;
    if (porEmail) {
      // the code also by e-mail, so it isn't lost if the customer closes the tab
      after(async () => {
        try {
          const m = emailBoasVindas(nome, email, cupom);
          await mandarEmailAoCliente(email, m.assunto, m.texto, m.html);
        } catch (err) {
          console.error("boas-vindas e-mail", err);
        }
      });
    }
    return Response.json(
      { ok: true, codigo: cupom.codigo, rotulo: cupom.rotulo, condicao: cupom.condicao, validoAte: cupom.validoAte, porEmail, jaTinha: !cupom.novo },
      sem
    );
  } catch (err) {
    console.error("boas-vindas", err);
    return Response.json({ erro: "Não deu agora. Tente de novo." }, { status: 500 });
  }
}
