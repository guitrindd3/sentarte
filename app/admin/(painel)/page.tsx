import Image from "next/image";
import Link from "next/link";
import { pedidosRecentes, type PedidoCliente } from "@/lib/clientes";
import { getAdminContent } from "@/lib/content-store";
import { githubConfigurado, ultimosCommits, type CommitResumo } from "@/lib/github-store";
import { ondeAparece } from "@/lib/admin-grupos";
import { CATEGORIAS_OCULTAS } from "@/lib/offer";
import { redisAtivo } from "@/lib/redis";
import { Card } from "../_ui";

function saudacao() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function carrinhosAbandonados(pedidos: PedidoCliente[]) {
  const agora = Date.now();
  return pedidos.filter((p) => p.status === "aguardando" && agora - p.em > 30 * 60000 && agora - p.em < 7 * 86400000);
}

function quando(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}

export default async function VisaoGeral() {
  const content = await getAdminContent();
  let historico: CommitResumo[] = [];
  if (githubConfigurado()) {
    try {
      historico = (await ultimosCommits(40)).filter((c) => c.mensagem.startsWith("Painel:")).slice(0, 6);
    } catch {}
  }

  // Carts that went to Mercado Pago and never got paid, last 7 days.
  let abandonados: PedidoCliente[] = [];
  if (redisAtivo()) {
    try {
      abandonados = carrinhosAbandonados(await pedidosRecentes(30));
    } catch {}
  }

  const visiveis = content.categorias.filter((c) => !CATEGORIAS_OCULTAS.has(c.slug));
  const modelos = visiveis.flatMap((c) => c.modelos.map((m) => ({ ...m, cat: c })));
  // Collection covers like "Monte a sua trama" use a video, not a photo.
  const semFoto = modelos.filter((m) => !m.imagemUrl && !ondeAparece(m.nome, m.cat.slug).capa);
  const fotos = modelos.reduce((n, m) => n + (m.imagemUrl ? 1 : 0) + (m.variantes?.length ?? 0) + (m.fotosExtras?.length ?? 0), 0);
  const cadeiras = content.categorias.find((c) => c.slug === "cadeiras") ?? visiveis[0];

  const numeros = [
    { n: modelos.length, rotulo: "modelos no site", href: "/admin/catalogo" },
    { n: fotos, rotulo: "fotos publicadas", href: "/admin/catalogo" },
    { n: content.depoimentos.length, rotulo: content.depoimentos.length === 1 ? "depoimento" : "depoimentos", href: "/admin/depoimentos" },
  ];

  const atalhos = [
    {
      href: cadeiras ? `/admin/catalogo?cat=${cadeiras.id}&novo=1` : "/admin/catalogo",
      titulo: "Cadastrar cadeira nova",
      texto: "Nome, foto e descrição de um modelo novo.",
    },
    { href: "/admin/catalogo", titulo: "Trocar fotos e textos", texto: "Escolha a cadeira e edite o que quiser." },
    { href: "/admin/depoimentos", titulo: "Adicionar depoimento", texto: "Elogio de cliente com foto da cadeira." },
    { href: "/admin/site", titulo: "Textos de boas-vindas", texto: "Frase da página inicial, WhatsApp e Instagram." },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-wood">{saudacao()}!</p>
        <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">O que vamos mudar hoje?</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Tudo o que você salvar aqui aparece no site em 1 a 2 minutos. O aviso lá em cima mostra quando terminou de atualizar.
        </p>
      </div>

      {abandonados.length ? (
        <Link
          href="/admin/clientes"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-clay/40 bg-[#fbeee8] px-5 py-4 transition hover:border-clay"
        >
          <span>
            <span className="block font-semibold text-clay-dark">
              {abandonados.length} {abandonados.length === 1 ? "pessoa foi pagar e não terminou" : "pessoas foram pagar e não terminaram"} esta semana
            </span>
            <span className="block text-sm text-ink">{abandonados.slice(0, 3).map((p) => p.nome.split(" ")[0]).join(", ")}. Chame no WhatsApp para fechar a venda.</span>
          </span>
          <span className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-paper">Ver clientes</span>
        </Link>
      ) : null}

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {numeros.map((x) => (
          <Link
            key={x.rotulo}
            href={x.href}
            className="rounded-2xl border border-line/70 bg-paper p-4 transition hover:shadow-[5px_5px_0_0_var(--rattan)] sm:p-5"
          >
            <p className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{x.n}</p>
            <p className="mt-1 text-xs text-ink-soft sm:text-sm">{x.rotulo}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {atalhos.map((a, i) => (
          <Link
            key={a.href + i}
            href={a.href}
            className="group flex items-center gap-4 rounded-2xl border border-line/70 bg-paper p-4 transition hover:border-wood hover:shadow-[5px_5px_0_0_var(--rattan)] sm:p-5"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rattan/15 font-serif text-lg font-semibold text-wood-dark">
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-ink group-hover:text-wood-dark">{a.titulo}</span>
              <span className="block text-sm text-ink-soft">{a.texto}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card titulo="Últimas alterações" descricao="O que foi salvo pelo painel, da mais nova para a mais antiga.">
          {historico.length ? (
            <ol className="space-y-3">
              {historico.map((c) => (
                <li key={c.sha} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rattan" />
                  <span className="flex-1 text-ink">
                    {c.mensagem.replace(/^Painel:\s*/, "").replace(/^./, (l) => l.toUpperCase())}
                  </span>
                  <span className="shrink-0 text-xs text-ink-soft">{quando(c.data)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-soft">Nada salvo pelo painel ainda.</p>
          )}
        </Card>

        <Card titulo="Falta foto" descricao={semFoto.length ? "Modelos que aparecem no site só com o desenho do trançado." : undefined}>
          {semFoto.length ? (
            <ul className="space-y-2">
              {semFoto.slice(0, 6).map((m) => (
                <li key={m.id}>
                  <Link href={`/admin/catalogo/${m.cat.id}/${m.id}`} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm hover:bg-canvas">
                    <span className="font-medium text-ink">{m.nome}</span>
                    <span className="text-xs font-semibold text-wood">Colocar foto</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-3 text-sm text-ink-soft">
              <Image src="/brand/logo.png" alt="" width={36} height={36} className="rounded-full" />
              Todas as cadeiras do site têm foto. Capricho!
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
