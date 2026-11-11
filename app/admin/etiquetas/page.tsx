import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { lerCartoes } from "@/lib/cartoes";
import { alturaDaPagina, cartaoDoPassaporte, estiloPassaporte, montarFolhas } from "@/lib/cartoes-modelo";
import { lerPedido } from "@/lib/clientes";
import { TIPOS_CADEIRA } from "@/lib/offer";
import { codigoDoPedido } from "@/lib/pedido";
import { linkDoPassaporte, lerPassaportes, numeroBonito } from "@/lib/passaporte";
import { redisAtivo } from "@/lib/redis";
import { PaginaA4 } from "../(painel)/cartoes/folha";
import { Imprimir } from "./imprimir";

// Printable QR tags for chair passports (lib/passaporte.ts), opened from
// Passaportes and from each order. Since 2026-11-10 they are the same card as
// "Etiqueta do passaporte" in /admin/cartoes (kraft paper, black ink — the
// atelier's own saved style when there is one), so both places print alike.
// Outside the (painel) group so the admin shell doesn't print; proxy.ts gates
// /admin and the page checks the session itself.

export const dynamic = "force-dynamic";

export default async function Etiquetas({ searchParams }: PageProps<"/admin/etiquetas">) {
  if (!(await verifySession())) redirect("/admin/login");
  const sp = await searchParams;
  const ref = typeof sp.ref === "string" ? sp.ref : "";
  const ns =
    typeof sp.n === "string"
      ? sp.n
          .split(",")
          .map(Number)
          .filter((x) => Number.isInteger(x) && x > 0)
          .slice(0, 60)
      : [];
  let titulo = "Etiquetas do passaporte";
  let numeros = ns;
  if (ref && redisAtivo()) {
    const p = await lerPedido(ref);
    numeros = p?.passaportes ?? [];
    if (p) titulo = `Etiquetas do pedido ${codigoDoPedido(p.ref)}`;
  }
  const [lista, salvos] = redisAtivo() ? await Promise.all([lerPassaportes(numeros), lerCartoes().catch(() => [])]) : [[], []];
  const estilo = estiloPassaporte(salvos);
  const { paginas } = montarFolhas(
    lista.map((p) =>
      cartaoDoPassaporte(estilo, {
        n: p.n,
        numero: numeroBonito(p.n),
        link: linkDoPassaporte(p.n),
        colecao: p.colecao ? `${p.colecao.nome} · ${String(p.colecao.numero).padStart(2, "0")}/${p.colecao.total}` : undefined,
      }),
    ),
  );

  return (
    <main className="min-h-screen bg-canvas-deep px-6 py-8 print:bg-white print:p-0">
      <style>{`@page { size: A4; margin: 8mm } @media print { .sem-imprimir { display: none !important } .pagina-etiquetas + .pagina-etiquetas { break-before: page } .pagina-etiquetas { break-after: auto; break-inside: avoid; margin: 0 !important; box-shadow: none !important; background: none !important; padding: 0 !important } }`}</style>
      <div className="sem-imprimir mx-auto mb-6 flex max-w-[194mm] flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-ink">{titulo}</h1>
          <p className="max-w-prose text-sm text-ink-soft">
            Imprima no papel kraft (só a tinta preta sai), recorte na linha cinza, fure o círculo e amarre na cadeira com um cordão. Para mudar o visual, edite
            o modelo “Etiqueta do passaporte” em Cartões e salve em Meus modelos.
          </p>
        </div>
        <Imprimir />
      </div>
      {lista.length ? (
        <div className="sem-imprimir mx-auto mb-6 max-w-[194mm] rounded-2xl bg-paper p-4 shadow-sm">
          <p className="text-sm font-semibold text-ink">Qual etiqueta vai em qual cadeira</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {lista.map((p) => (
              <li key={p.n} className="flex items-center gap-3 text-sm">
                {p.imagem?.startsWith("/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imagem} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : null}
                <span className="text-ink">
                  <strong>Nº {numeroBonito(p.n)}</strong> · {p.modelo}
                  {p.nome ? ` · “${p.nome}”` : ""} · {TIPOS_CADEIRA[p.tipo]?.curto}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {paginas.length ? (
        paginas.map((p, n) => (
          <div key={n} className="pagina-etiquetas mx-auto mb-6 w-[194mm] bg-[#c9a47a] shadow-lg print:bg-none">
            <PaginaA4 cartoes={p} corte altura={alturaDaPagina(p)} />
          </div>
        ))
      ) : (
        <p className="sem-imprimir text-center text-sm text-ink-soft">Nenhum passaporte para imprimir.</p>
      )}
    </main>
  );
}
