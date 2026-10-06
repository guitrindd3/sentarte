import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { pedidoPeloCodigo } from "@/lib/clientes";
import { getContent } from "@/lib/content-store";
import { redis, redisAtivo } from "@/lib/redis";
import { ipDe } from "@/lib/seguranca";
import { whatsappUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acompanhar pedido",
  description: "Veja em que etapa está o seu pedido SentArte: pagamento, produção e entrega.",
  robots: { index: false, follow: true },
};

// Order tracking search (2026-10-06): order number + last 4 digits of the
// WhatsApp used in the order → /acompanhar/<ref>. The 4 digits keep someone
// who guesses a number from seeing another customer's order; tries are capped
// per IP so numbers can't be swept.

async function muitasTentativas(ip: string) {
  const k = `acompanhar:ip:${ip}`;
  const [n] = await redis([["INCR", k]]);
  if (Number(n) === 1) await redis([["EXPIRE", k, 3600]]);
  return Number(n) > 15;
}

export default async function Acompanhar({ searchParams }: PageProps<"/acompanhar">) {
  const q = await searchParams;
  const numero = typeof q.n === "string" ? q.n.trim().slice(0, 20) : "";
  const fim = typeof q.w === "string" ? q.w.replace(/\D/g, "").slice(-4) : "";
  const { site } = await getContent();
  let erro = "";

  if (numero || fim) {
    if (!redisAtivo()) {
      erro = "O acompanhamento está fora do ar agora. Fale com a gente no WhatsApp.";
    } else if (await muitasTentativas(ipDe(await headers()))) {
      erro = "Muitas tentativas. Espere um pouco ou fale com a gente no WhatsApp.";
    } else if (fim.length !== 4) {
      erro = "Digite os 4 últimos números do WhatsApp que você usou no pedido.";
    } else {
      const p = await pedidoPeloCodigo(numero);
      if (p && p.whatsapp.replace(/\D/g, "").endsWith(fim)) redirect(`/acompanhar/${p.ref}`);
      erro = "Não achamos esse pedido. Confira o número (está na tela do pagamento e no resumo do WhatsApp).";
    }
  }

  return (
    <>
      <PageHeader titulo="Acompanhar pedido" resumo="Veja se o seu pedido já foi pago, se está sendo trançado ou se já saiu para entrega." />
      <section className="mx-auto max-w-6xl px-6 py-14">
        <form method="get" className="max-w-md border border-line bg-paper p-6">
          <label className="block text-sm">
            <span className="text-ink-soft">Número do pedido</span>
            <input
              name="n"
              defaultValue={numero}
              required
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="Ex.: 7K3D9Q2A"
              className="mt-1 w-full border border-line bg-canvas px-3 py-2.5 font-mono uppercase tracking-wider text-ink outline-none focus:border-ink"
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="text-ink-soft">4 últimos números do seu WhatsApp</span>
            <input
              name="w"
              defaultValue={fim}
              required
              inputMode="numeric"
              maxLength={4}
              placeholder="Ex.: 8888"
              className="mt-1 w-full border border-line bg-canvas px-3 py-2.5 text-ink outline-none focus:border-ink"
            />
          </label>
          {erro ? <p className="mt-4 border border-clay/40 bg-clay/5 px-3 py-2 text-sm text-clay-dark">{erro}</p> : null}
          <button type="submit" className="mt-5 w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas hover:bg-ink/90">
            Ver meu pedido
          </button>
          <p className="mt-4 text-xs leading-relaxed text-ink-soft">
            O número aparece na tela depois do pagamento e no resumo que você mandou no WhatsApp. Não achou?{" "}
            <a href={whatsappUrl(site.whatsappNumero, "Oi! Quero saber como está o meu pedido.")} target="_blank" rel="noreferrer" className="text-ink underline underline-offset-2">
              Pergunte no WhatsApp
            </a>
            .
          </p>
        </form>
      </section>
    </>
  );
}
