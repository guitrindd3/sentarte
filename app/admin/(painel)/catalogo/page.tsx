import Link from "next/link";
import { ondeAparece, OPCOES_COLECAO } from "@/lib/admin-grupos";
import { getAdminContent } from "@/lib/content-store";
import type { Modelo } from "@/lib/content-schema";
import { grupoDoModelo } from "@/lib/grupos";
import { caminhoDoModelo } from "@/lib/produtos";
import { addCategoriaAction, addModeloAction, deleteCategoriaAction, updateCategoriaAction } from "../../actions";
import { AdminForm, BotaoExcluir, CampoTexto, Field, SaveButton } from "../../_ui";
import { inputClass } from "../../_classes";
import { GradeModelos } from "./grade";

// 2026-11-14: same look as Clientes — header with the main action, espresso
// segmented category tabs, collection chips (?f=) with counts, cards with a
// bottom action row. Editing, order and delete stay in each chair's editor.

type Filtro = "todas" | "times" | "boho" | "desenhos" | "eventos" | "capas" | "outras" | "semfoto";
const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: "todas", rotulo: "Todas" },
  { id: "times", rotulo: "Times" },
  { id: "boho", rotulo: "Boho" },
  { id: "desenhos", rotulo: "Desenhos" },
  { id: "eventos", rotulo: "Eventos" },
  { id: "capas", rotulo: "Capas" },
  { id: "outras", rotulo: "Outras" },
  { id: "semfoto", rotulo: "Sem foto" },
];

function colecaoDe(m: Modelo, catSlug: string): Exclude<Filtro, "todas" | "semfoto"> {
  if (ondeAparece(m.nome, catSlug, m.grupo).capa) return "capas";
  return grupoDoModelo(m) ?? "outras";
}

function passa(f: Filtro, m: Modelo, catSlug: string) {
  if (f === "todas") return true;
  if (f === "semfoto") return !m.imagemUrl && !ondeAparece(m.nome, catSlug, m.grupo).capa;
  return colecaoDe(m, catSlug) === f;
}

export default async function Catalogo({ searchParams }: PageProps<"/admin/catalogo">) {
  const { cat: catParam, novo, f: filtroParam } = await searchParams;
  const content = await getAdminContent();
  const cat = content.categorias.find((c) => c.id === catParam) ?? content.categorias[0];
  const comColecoes = cat?.slug === "cadeiras";

  const conta = (id: Filtro) => (cat ? cat.modelos.filter((m) => passa(id, m, cat.slug)).length : 0);
  const filtro: Filtro = (comColecoes || filtroParam === "semfoto") && FILTROS.some((x) => x.id === filtroParam) ? (filtroParam as Filtro) : "todas";
  const chips = FILTROS.filter((x) => (comColecoes || x.id === "todas" || x.id === "semfoto") && (x.id === "todas" || x.id === filtro || conta(x.id) > 0));
  const hrefFiltro = (id: Filtro) => `/admin/catalogo?cat=${cat?.id}${id === "todas" ? "" : `&f=${id}`}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Cadeiras</h1>
          <p className="mt-1.5 max-w-prose text-sm text-ink-soft sm:text-base">Fotos, nomes e coleções. Toque numa cadeira para editar; a ordem aqui é a mesma do site.</p>
        </div>
        {cat ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/catalogo?cat=${cat.id}&novo=1#novo`}
              className="inline-flex items-center gap-1.5 rounded-full bg-espresso px-4 py-2.5 text-sm font-semibold text-paper hover:bg-espresso-soft"
            >
              <span className="text-rattan">+</span> Cadeira nova
            </Link>
            <Link href="/admin/montar" className="inline-flex items-center rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-medium text-ink hover:border-wood">
              Montar trama
            </Link>
          </div>
        ) : null}
      </div>

      {/* Phones: name on top, count below, so 3 categories fit 390px without sideways scroll. */}
      <nav aria-label="Categorias" className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-espresso p-1 sm:inline-grid sm:auto-cols-auto">
        {content.categorias.map((c) => {
          const on = c.id === cat?.id;
          const oculto = ondeAparece("", c.slug).oculto;
          return (
            <Link
              key={c.id}
              href={`/admin/catalogo?cat=${c.id}`}
              aria-current={on ? "page" : undefined}
              title={oculto ? "Fora do site por enquanto" : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-2 text-center text-xs font-semibold leading-tight transition sm:flex-row sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm ${on ? "bg-paper text-ink" : "text-paper/70 hover:text-paper"}`}
            >
              <span className="max-w-full [overflow-wrap:anywhere]">{c.titulo}</span>
              <span className="flex items-center gap-1.5">
                <span className={`rounded-full px-1.5 text-xs ${on ? "bg-rattan/25 text-wood-dark" : "bg-white/10"}`}>{c.modelos.length}</span>
                {oculto ? <span className={`text-xs font-normal ${on ? "text-ink-soft" : "text-paper/50"}`}>oculta</span> : null}
              </span>
            </Link>
          );
        })}
      </nav>

      {cat ? (
        <>
          {ondeAparece("", cat.slug).oculto ? (
            <p className="rounded-2xl border border-line/70 bg-canvas-deep px-4 py-3 text-sm text-ink-soft">
              Essa categoria está escondida do site por enquanto. Você pode deixar tudo pronto aqui; quando quiser mostrar, é só pedir.
            </p>
          ) : null}

          <details id="novo" open={novo === "1"} className="group scroll-mt-24 rounded-2xl border-2 border-dashed border-rattan/60 bg-paper open:border-solid open:border-line/70">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 font-semibold text-ink">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-espresso text-lg text-rattan">+</span>
              <span>
                Cadastrar modelo novo
                <span className="block text-xs font-normal text-ink-soft">Em {cat.titulo}.</span>
              </span>
            </summary>
            <AdminForm action={addModeloAction.bind(null, cat.id)} className="flex flex-wrap items-end gap-3 border-t border-line/60 px-4 pb-4 pt-4">
              <div className="min-w-[14rem] flex-1">
                <Field label="Nome do modelo" dica="Depois de criar, você coloca a foto e a descrição.">
                  <input name="nome" required maxLength={80} placeholder="Ex.: Diamante azul" className={inputClass} autoFocus={novo === "1"} />
                </Field>
              </div>
              {cat.slug === "cadeiras" ? (
                <div className="min-w-[14rem] flex-1">
                  <Field label="Coleção" dica="Escolha onde ela entra no site — ex.: Cadeiras de time vai para a página de times.">
                    <select name="colecao" defaultValue="" className={inputClass}>
                      {OPCOES_COLECAO.map((o) => (
                        <option key={o.valor} value={o.valor}>
                          {o.rotulo}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              ) : null}
              <SaveButton>Criar e continuar</SaveButton>
            </AdminForm>
          </details>

          {chips.length > 1 ? (
            <div className="flex flex-wrap gap-1.5 sm:gap-2" aria-label="Coleções">
              {chips.map((x) => {
                const on = filtro === x.id;
                return (
                  <Link
                    key={x.id}
                    href={hrefFiltro(x.id)}
                    aria-current={on ? "true" : undefined}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition sm:px-3.5 sm:py-2 ${
                      on ? "border-espresso bg-espresso text-paper" : x.id === "semfoto" ? "border-clay/40 bg-clay/10 text-clay-dark hover:border-clay" : "border-line bg-paper text-ink hover:border-wood"
                    }`}
                  >
                    {x.rotulo}
                    <span className={on ? "text-rattan" : "text-ink-soft"}>{conta(x.id)}</span>
                  </Link>
                );
              })}
            </div>
          ) : null}

          <GradeModelos
            key={filtro}
            catId={cat.id}
            modelos={cat.modelos
              .map((m, i) => ({ m, i }))
              .filter(({ m }) => passa(filtro, m, cat.slug))
              .map(({ m, i }) => {
                const onde = ondeAparece(m.nome, cat.slug, m.grupo);
                return {
                  id: m.id,
                  nome: m.nome,
                  descricao: m.descricao,
                  foto: m.imagemUrl,
                  corA: m.corA,
                  corB: m.corB,
                  nFotos: (m.imagemUrl ? 1 : 0) + (m.variantes?.length ?? 0) + (m.fotosExtras?.length ?? 0),
                  grupo: onde.grupo,
                  capa: onde.capa,
                  posicao: i + 1,
                  noSite: onde.oculto ? undefined : (caminhoDoModelo(m.nome, cat.slug) ?? onde.href),
                };
              })}
          />

          <details className="group rounded-2xl border border-line/70 bg-paper">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 sm:px-7">
              <span>
                <span className="block font-serif text-xl font-medium tracking-tight text-ink">Configurar a categoria</span>
                <span className="block text-sm text-ink-soft">Nome, textos e cores da categoria {cat.titulo}.</span>
              </span>
              <span className="text-ink-soft transition group-open:rotate-180">▾</span>
            </summary>
            <div className="border-t border-line/70 px-5 py-5 sm:px-7">
              <AdminForm action={updateCategoriaAction.bind(null, cat.id)} className="space-y-4">
                <Field label="Nome">
                  <CampoTexto name="titulo" defaultValue={cat.titulo} max={60} />
                </Field>
                <Field label="Resumo" dica="Frase curta que aparece na página inicial.">
                  <CampoTexto name="resumo" defaultValue={cat.resumo} max={140} />
                </Field>
                <Field label="Descrição completa" dica="Aparece no topo da página da categoria.">
                  <CampoTexto name="intro" defaultValue={cat.intro} max={600} linhas={3} />
                </Field>
                <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
                  <Field label="Cor 1">
                    <input type="color" name="corA" defaultValue={cat.corA} className="h-11 w-full cursor-pointer rounded-lg border border-line bg-paper p-1" />
                  </Field>
                  <Field label="Cor 2">
                    <input type="color" name="corB" defaultValue={cat.corB} className="h-11 w-full cursor-pointer rounded-lg border border-line bg-paper p-1" />
                  </Field>
                </div>
                <SaveButton />
              </AdminForm>
              <div className="mt-6 border-t border-line/70 pt-4">
                <BotaoExcluir
                  action={deleteCategoriaAction.bind(null, cat.id)}
                  rotulo="Excluir esta categoria"
                  pergunta={`Excluir "${cat.titulo}" e os ${cat.modelos.length} modelos dela? Não dá para desfazer.`}
                />
              </div>
            </div>
          </details>
        </>
      ) : null}

      <details className="rounded-2xl border border-dashed border-line bg-paper/60">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-ink-soft hover:text-ink sm:px-7">+ Criar uma categoria nova</summary>
        <AdminForm action={addCategoriaAction} className="flex flex-wrap items-end gap-3 px-5 pb-5 sm:px-7">
          <div className="min-w-[14rem] flex-1">
            <Field label="Nome da categoria" dica="Para uma categoria nova entrar no menu do site é preciso um ajuste técnico.">
              <input name="titulo" required maxLength={60} className={inputClass} />
            </Field>
          </div>
          <SaveButton>Criar categoria</SaveButton>
        </AdminForm>
      </details>
    </div>
  );
}
