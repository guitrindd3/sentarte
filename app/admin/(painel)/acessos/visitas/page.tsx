import Link from "next/link";
import { getAdminContent } from "@/lib/content-store";
import { estatisticasAtivas, visita, visitasRecentes, type Passo, type Visita } from "@/lib/estatisticas";
import { nomeDaPagina } from "@/lib/paginas";
import { Card } from "../../../_ui";
import { AbasAcessos } from "../abas";
import { Explicacao } from "../graficos";

const FILTROS = [
  { id: "", rotulo: "Todas" },
  { id: "carrinho", rotulo: "Colocou no carrinho" },
  { id: "whatsapp", rotulo: "Clicou no WhatsApp" },
  { id: "pagar", rotulo: "Foi pagar" },
  { id: "lista", rotulo: "Entrou na lista" },
] as const;

const EXPLICA_FILTRO: Record<string, string> = {
  "": "Todas as visitas, da mais recente para a mais antiga.",
  carrinho: "Só as visitas em que a pessoa colocou alguma cadeira no carrinho.",
  whatsapp: "Só as visitas em que a pessoa tocou num botão de WhatsApp para falar com você.",
  pagar: "Só as visitas em que a pessoa preencheu os dados e foi para o pagamento (pagando ou não).",
  lista: "Só as visitas em que a pessoa se cadastrou na lista de novidades.",
};

const hora = (t: number) =>
  new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(t));
const diaBR = (t: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(t));

function diasDeReferencia() {
  const agora = Date.now();
  return { hoje: diaBR(agora), ontem: diaBR(agora - 86400000) };
}

function quando(t: number, hoje: string, ontem: string) {
  const d = diaBR(t);
  const dia =
    d === hoje
      ? "Hoje"
      : d === ontem
        ? "Ontem"
        : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(t));
  return `${dia}, ${hora(t)}`;
}

function textoDoPasso(p: Passo, nomePagina: (s: string) => string): string | null {
  switch (p.k) {
    case "v":
      return `Abriu ${nomePagina(p.x)}${p.q ? ` e buscou “${p.q}”` : ""}`;
    case "c":
      if (/^(Adicionar ao carrinho|Adicionado)$/i.test(p.x)) return null; // the cart step says it better
      return /^whatsapp$/i.test(p.x) ? "Clicou no WhatsApp" : `Clicou em “${p.x}”`;
    case "b":
      return `Buscou “${p.x}”${p.q === "trama" ? " no Monte a sua trama" : ""}`;
    case "a":
      return `Colocou “${p.x}” no carrinho`;
    case "$":
      return `Foi pagar (${p.x})`;
    case "p":
      return `Pagou ${p.x} ✓`;
    case "i":
      return `Entrou na lista de novidades (${p.x})`;
  }
}

function Selos({ v }: { v: Visita }) {
  const s = [
    v.pagou && { t: "Pagou", c: "bg-verde text-paper" },
    v.pagar && !v.pagou && { t: "Foi pagar", c: "bg-rattan/25 text-wood-dark" },
    v.carrinho && { t: "Carrinho", c: "bg-wood/15 text-wood-dark" },
    v.whatsapp && { t: "WhatsApp", c: "bg-verde/15 text-verde-escuro" },
    v.lista && { t: "Lista", c: "bg-espresso/10 text-ink" },
  ].filter(Boolean) as { t: string; c: string }[];
  return (
    <span className="flex flex-wrap gap-1.5">
      {s.map((x) => (
        <span key={x.t} className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${x.c}`}>
          {x.t}
        </span>
      ))}
    </span>
  );
}

export default async function Visitas({ searchParams }: PageProps<"/admin/acessos/visitas">) {
  const { f, id, d } = await searchParams;
  const filtro = FILTROS.find((x) => x.id === f)?.id ?? "";
  // One day, from the summary chart (`?d=YYYY-MM-DD`).
  const dia = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";

  const cabecalho = (
    <div>
      <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Acessos do site</h1>
      <p className="mt-2 max-w-prose text-ink-soft">Suas próprias visitas, com o painel aberto, não entram na conta.</p>
      <AbasAcessos atual="visitas" />
    </div>
  );
  if (!estatisticasAtivas()) return <div className="space-y-6">{cabecalho}</div>;

  const { categorias } = await getAdminContent();
  const nomePagina = (p: string) => nomeDaPagina(p, categorias);
  let lista: Visita[] = [];
  try {
    if (typeof id === "string") {
      const v = await visita(id);
      lista = v ? [v] : [];
    } else {
      lista = await visitasRecentes(filtro || dia ? 300 : 60);
    }
  } catch (err) {
    console.error("visitas", err);
  }
  if (dia) lista = lista.filter((v) => diaBR(v.inicio) === dia);
  if (filtro) lista = lista.filter((v) => v[filtro as "carrinho" | "whatsapp" | "pagar" | "lista"]);
  lista = lista.slice(0, 60);

  const { hoje, ontem } = diasDeReferencia();

  return (
    <div className="space-y-6">
      {cabecalho}

      {typeof id === "string" ? (
        <Explicacao
          titulo="Uma visita, passo a passo"
          dicas={["A bolinha verde marca pagamento; as marrons, carrinho e ida ao pagamento.", "Os horários são de Brasília."]}
        >
          Tudo o que essa pessoa fez no site, na ordem em que aconteceu: páginas que abriu, onde clicou, o que pesquisou e o que colocou no carrinho.
          Não aparece nome nem telefone, só a cidade aproximada, o aparelho e de onde ela veio.
        </Explicacao>
      ) : (
        <Explicacao
          dicas={[
            "Cada cartão é uma visita: uma pessoa navegando no site, do momento em que entra até sair. Clique no cartão para abrir o passo a passo.",
            "As etiquetas coloridas resumem o que a pessoa fez: Carrinho, WhatsApp, Foi pagar, Pagou, Lista.",
            "Use os botões de filtro para ver só quem fez alguma coisa importante. As visitas ficam guardadas 30 dias.",
          ]}
        >
          {EXPLICA_FILTRO[filtro]}
          {dia ? ` Só do dia ${dia.slice(8, 10)}/${dia.slice(5, 7)}.` : ""}
        </Explicacao>
      )}

      {dia && typeof id !== "string" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-wood/40 bg-paper px-5 py-3 text-sm">
          <p className="text-ink">
            Só as visitas do dia <strong>{`${dia.slice(8, 10)}/${dia.slice(5, 7)}`}</strong>.
          </p>
          <Link href={filtro ? `/admin/acessos/visitas?f=${filtro}` : "/admin/acessos/visitas"} className="font-medium text-ink-soft underline hover:text-ink">
            Ver todos os dias
          </Link>
        </div>
      ) : null}

      {typeof id === "string" ? (
        <Link href="/admin/acessos/visitas" className="inline-block text-sm font-medium text-ink-soft hover:text-ink">
          ‹ Ver todas as visitas
        </Link>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2">
            {FILTROS.map((x) => (
              <Link
                key={x.id}
                href={`/admin/acessos/visitas?${new URLSearchParams({ ...(x.id ? { f: x.id } : {}), ...(dia ? { d: dia } : {}) })}`}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  x.id === filtro ? "border-espresso bg-espresso text-paper" : "border-line bg-paper text-ink hover:border-wood"
                }`}
              >
                {x.rotulo}
              </Link>
            ))}
          </div>
        </div>
      )}

      {lista.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-soft">
            {typeof id === "string" ? "Essa visita já não está mais guardada (ficam 30 dias)." : "Nenhuma visita assim ainda. Elas aparecem aqui conforme as pessoas entram no site."}
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {lista.map((v) => {
            const passos = v.passos
              .map((p) => ({ t: p.t ?? v.inicio, texto: textoDoPasso(p, nomePagina), k: p.k }))
              .filter((p): p is { t: number; texto: string; k: Passo["k"] } => Boolean(p.texto))
              .filter((p, i, arr) => i === 0 || p.texto !== arr[i - 1].texto);
            const min = Math.max(0, Math.round((v.fim - v.inicio) / 60000));
            return (
              <li key={v.id}>
                <details open={typeof id === "string"} className="group rounded-2xl border border-line/70 bg-paper">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4">
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">
                        {v.local ?? "Cidade desconhecida"}
                        <span className="font-normal text-ink-soft">
                          , {v.disp?.toLowerCase() ?? "aparelho?"}, {v.origem ? (v.origem.startsWith("Direto") ? "entrou direto" : `veio do ${v.origem}`) : "entrou direto"}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-soft">
                        {quando(v.inicio, hoje, ontem)}
                        {min > 0 ? `, ficou ${min} min` : ""}, {passos.length} {passos.length === 1 ? "passo" : "passos"}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Selos v={v} />
                      <span className="text-ink-soft transition group-open:rotate-180">▾</span>
                    </span>
                  </summary>
                  <ol className="border-t border-line/70 px-5 py-4">
                    {passos.map((p, i) => (
                      <li key={i} className="relative flex gap-3 pb-3 pl-5 text-sm last:pb-0">
                        <span
                          className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${
                            p.k === "p" ? "bg-verde" : p.k === "a" || p.k === "$" ? "bg-wood" : p.k === "c" ? "bg-rattan" : "bg-line"
                          }`}
                        />
                        {i < passos.length - 1 ? <span className="absolute left-[4.5px] top-4 h-full w-px bg-line" /> : null}
                        <span className="w-11 shrink-0 tabular-nums text-ink-soft">{hora(p.t)}</span>
                        <span className={p.k === "a" || p.k === "$" || p.k === "p" ? "font-semibold text-ink" : "text-ink"}>{p.texto}</span>
                      </li>
                    ))}
                  </ol>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
