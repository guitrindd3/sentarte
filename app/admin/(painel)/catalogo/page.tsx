import Link from "next/link";
import { ondeAparece } from "@/lib/admin-grupos";
import { getAdminContent } from "@/lib/content-store";
import { addCategoriaAction, addModeloAction, deleteCategoriaAction, updateCategoriaAction } from "../../actions";
import { AdminForm, BotaoExcluir, Card, CampoTexto, Field, SaveButton, inputClass } from "../../_ui";
import { GradeModelos } from "./grade";

export default async function Catalogo({ searchParams }: PageProps<"/admin/catalogo">) {
  const { cat: catParam, novo } = await searchParams;
  const content = await getAdminContent();
  const cat = content.categorias.find((c) => c.id === catParam) ?? content.categorias[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Cadeiras e produtos</h1>
          <p className="mt-2 text-ink-soft">Clique numa cadeira para trocar a foto, o nome ou a descrição.</p>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2">
          {content.categorias.map((c) => {
            const on = c.id === cat?.id;
            const oculto = ondeAparece("", c.slug).oculto;
            return (
              <Link
                key={c.id}
                href={`/admin/catalogo?cat=${c.id}`}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  on ? "border-espresso bg-espresso text-paper" : "border-line bg-paper text-ink hover:border-wood"
                }`}
              >
                {c.titulo}
                <span className={`rounded-full px-1.5 text-xs ${on ? "bg-paper/15" : "bg-canvas-deep text-ink-soft"}`}>{c.modelos.length}</span>
                {oculto ? <span className={`text-xs ${on ? "text-paper/60" : "text-ink-soft"}`}>(fora do site)</span> : null}
              </Link>
            );
          })}
        </div>
      </div>

      {cat ? (
        <>
          {ondeAparece("", cat.slug).oculto ? (
            <p className="rounded-xl bg-canvas-deep px-4 py-3 text-sm text-ink-soft">
              Essa categoria está escondida do site por enquanto. Você pode deixar tudo pronto aqui; quando quiser mostrar, é só pedir.
            </p>
          ) : null}

          <Card
            titulo={cat.titulo}
            descricao={`${cat.modelos.length} ${cat.modelos.length === 1 ? "modelo" : "modelos"}. A ordem aqui é a mesma do site.`}
          >
            <details open={novo === "1"} className="group mb-6 rounded-xl border-2 border-dashed border-rattan/60 bg-canvas/60 open:bg-canvas">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold text-wood-dark">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-wood text-paper">+</span>
                Cadastrar modelo novo em {cat.titulo}
              </summary>
              <AdminForm action={addModeloAction.bind(null, cat.id)} className="flex flex-wrap items-end gap-3 px-4 pb-4">
                <div className="min-w-[14rem] flex-1">
                  <Field label="Nome do modelo" dica="Depois de criar, você coloca a foto e a descrição.">
                    <input name="nome" required maxLength={80} placeholder="Ex.: Diamante azul" className={inputClass} autoFocus={novo === "1"} />
                  </Field>
                </div>
                <SaveButton>Criar e continuar</SaveButton>
              </AdminForm>
            </details>

            <GradeModelos
              catId={cat.id}
              modelos={cat.modelos.map((m) => {
                const onde = ondeAparece(m.nome, cat.slug);
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
                };
              })}
            />
          </Card>

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
