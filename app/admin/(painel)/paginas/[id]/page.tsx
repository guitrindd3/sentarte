import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminContent } from "@/lib/content-store";
import { paginaEditavel, textosDaPagina } from "@/lib/textos-paginas";
import { restaurarPaginaAction, salvarPaginaAction } from "../../../actions";
import { AdminForm, BarraSalvar, BotaoExcluir, Card, CampoTexto, Field, btnSecondary } from "../../../_ui";
import { EditorBlocos } from "../blocos";

export default async function EditarPagina({ params }: PageProps<"/admin/paginas/[id]">) {
  const { id } = await params;
  const pg = paginaEditavel(id);
  if (!pg) notFound();
  const { paginas } = await getAdminContent();
  const t = textosDaPagina(paginas, pg.id);
  const editada = Boolean(paginas[pg.id] && Object.keys(paginas[pg.id]).length);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/paginas" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
          <span aria-hidden>‹</span> Todas as páginas
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">{pg.nome}</h1>
            <p className="mt-1 text-ink-soft">{pg.descricao}</p>
          </div>
          <a href={pg.caminho} target="_blank" rel="noreferrer" className={btnSecondary}>
            Ver no site
          </a>
        </div>
      </div>

      {pg.aviso ? <p className="rounded-xl border border-rattan/40 bg-rattan/10 px-4 py-3 text-sm text-ink">{pg.aviso}</p> : null}

      <details className="rounded-xl border border-line/70 bg-paper px-4 py-3 text-sm">
        <summary className="cursor-pointer font-semibold text-ink-soft hover:text-ink">Dicas para escrever (parágrafos, preços e links)</summary>
        <ul className="mt-3 space-y-2 text-ink-soft">
          <li>
            <strong className="text-ink">Novo parágrafo:</strong> deixe uma linha em branco entre um e outro.
          </li>
          <li>
            <strong className="text-ink">Preços e prazos que se atualizam sozinhos:</strong> escreva <code className="rounded bg-canvas-deep px-1">{"{preco}"}</code>,{" "}
            <code className="rounded bg-canvas-deep px-1">{"{preco_nome}"}</code> (com nome), <code className="rounded bg-canvas-deep px-1">{"{preco_pix}"}</code>,{" "}
            <code className="rounded bg-canvas-deep px-1">{"{pix}"}</code> (desconto do Pix), <code className="rounded bg-canvas-deep px-1">{"{parcelas}"}</code>,{" "}
            <code className="rounded bg-canvas-deep px-1">{"{prazo}"}</code> (dias úteis) ou <code className="rounded bg-canvas-deep px-1">{"{nome}"}</code> (nome do ateliê).
          </li>
          <li>
            <strong className="text-ink">Link:</strong> <code className="rounded bg-canvas-deep px-1">[fale com a gente](whatsapp)</code> abre o WhatsApp;{" "}
            <code className="rounded bg-canvas-deep px-1">[veja os times](/times)</code> leva para uma página do site.
          </li>
        </ul>
      </details>

      <AdminForm action={salvarPaginaAction.bind(null, pg.id)} className="block">
        <Card>
          <div className="space-y-6">
            {pg.campos.map((c) =>
              c.tipo === "blocos" ? (
                <div key={c.id}>
                  <p className="text-sm font-semibold text-ink">{c.rotulo}</p>
                  {c.dica ? <p className="mt-0.5 text-xs text-ink-soft">{c.dica}</p> : null}
                  <div className="mt-2">
                    <EditorBlocos name={c.id} inicial={t.blocos(c.id)} rotulos={c.rotulos} fixo={c.fixo} />
                  </div>
                </div>
              ) : (
                <Field key={c.id} label={c.rotulo} dica={c.dica}>
                  <CampoTexto
                    name={c.id}
                    defaultValue={t.linha(c.id)}
                    max={c.max}
                    linhas={c.tipo === "texto" ? Math.min(14, Math.max(3, Math.ceil(t.linha(c.id).length / 80))) : undefined}
                  />
                </Field>
              )
            )}
          </div>
          <BarraSalvar />
        </Card>
      </AdminForm>

      {editada ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/70 bg-paper px-5 py-4">
          <p className="text-sm text-ink-soft">Quer desfazer tudo o que mudou nesta página?</p>
          <BotaoExcluir
            action={restaurarPaginaAction.bind(null, pg.id)}
            rotulo="Voltar ao texto original"
            pergunta="Voltar esta página ao texto original? O que você escreveu aqui some."
          />
        </div>
      ) : null}
    </div>
  );
}
