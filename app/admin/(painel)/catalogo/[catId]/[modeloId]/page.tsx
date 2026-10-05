import Link from "next/link";
import { notFound } from "next/navigation";
import { ondeAparece } from "@/lib/admin-grupos";
import { getAdminContent } from "@/lib/content-store";
import { deleteModeloAction, moverModeloAction, updateModeloAction } from "../../../../actions";
import { AdminForm, BarraSalvar, BotaoExcluir, Card, CampoTexto, Field, FotoSlot, GaleriaFotos, SaveButton, btnSecondary } from "../../../../_ui";

export default async function EditarModelo({ params }: PageProps<"/admin/catalogo/[catId]/[modeloId]">) {
  const { catId, modeloId } = await params;
  const content = await getAdminContent();
  const cat = content.categorias.find((c) => c.id === catId);
  const i = cat?.modelos.findIndex((m) => m.id === modeloId) ?? -1;
  const m = cat?.modelos[i];
  if (!cat || !m) notFound();
  const onde = ondeAparece(m.nome, cat.slug);
  const anterior = cat.modelos[i - 1];
  const proximo = cat.modelos[i + 1];

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/catalogo?cat=${cat.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
          <span aria-hidden>‹</span> Todas as cadeiras de {cat.titulo}
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">{m.nome}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              {onde.grupo ? <span className="rounded-full bg-rattan/15 px-2.5 py-0.5 text-xs font-semibold text-wood-dark">{onde.grupo}</span> : null}
              {onde.oculto ? <span className="rounded-full bg-canvas-deep px-2.5 py-0.5 text-xs font-semibold">Fora do site</span> : null}
              <span>
                Posição {i + 1} de {cat.modelos.length}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!onde.oculto ? (
              <a href={onde.href} target="_blank" rel="noreferrer" className={btnSecondary}>
                Ver no site
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <AdminForm action={updateModeloAction.bind(null, cat.id, m.id)} className="block">
        <Card>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_1fr]">
              <div>
                <FotoSlot name="foto" removerName="removerFoto" atual={m.imagemUrl} rotulo="Foto principal" vazio="Clique ou arraste a foto" destaque />
                <p className="mt-2 text-xs text-ink-soft">É a primeira foto que o cliente vê. Pode mandar a foto do celular: o painel diminui o tamanho sozinho.</p>
              </div>

              <div className="space-y-5">
                <Field
                  label="Nome"
                  dica={
                    onde.grupo && !onde.capa
                      ? `Atenção: esse nome liga a cadeira à página ${onde.grupo}. Se mudar o nome, ela sai de lá.`
                      : onde.capa
                        ? "Atenção: esse nome liga o cartão à página da coleção. Se mudar, o cartão deixa de funcionar como capa."
                        : undefined
                  }
                >
                  <CampoTexto name="nome" defaultValue={m.nome} max={80} required />
                </Field>
                <Field label="Descrição" dica="Conte do que é feita, as cores, para quem combina. Aparece embaixo da foto no site.">
                  <CampoTexto name="descricao" defaultValue={m.descricao} max={500} linhas={5} />
                </Field>
              </div>
            </div>

            <div className="mt-10 border-t border-line/70 pt-6">
              <h2 className="font-serif text-xl font-medium tracking-tight text-ink">Outras cores do mesmo modelo</h2>
              <p className="mt-1 max-w-prose text-sm text-ink-soft">
                Use quando é a mesma cadeira em outra combinação de cores. O cliente escolhe entre elas, e a escolha vai no pedido.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {[2, 3, 4, 5, 6].map((n) => (
                  <FotoSlot
                    key={n}
                    name={`fotoVariante${n}`}
                    removerName={`removerVariante${n}`}
                    atual={m.variantes?.[n - 2]}
                    rotulo={`Cor ${n}`}
                    vazio="Adicionar"
                  />
                ))}
              </div>
            </div>

            <div className="mt-10 border-t border-line/70 pt-6">
              <h2 className="font-serif text-xl font-medium tracking-tight text-ink">Mais fotos</h2>
              <p className="mt-1 mb-4 max-w-prose text-sm text-ink-soft">
                Outros ângulos ou a mesma cadeira com nomes de clientes. Só para mostrar; não vira opção de compra.
              </p>
              <GaleriaFotos existentes={m.fotosExtras ?? []} max={8} name="fotosExtrasNovas" removerName="removerExtra" />
            </div>

            <details className="mt-10 border-t border-line/70 pt-6">
              <summary className="cursor-pointer text-sm font-semibold text-ink-soft hover:text-ink">Cores do desenho (só aparece se a cadeira ficar sem foto)</summary>
              <div className="mt-4 grid max-w-sm grid-cols-2 gap-3">
                <Field label="Cor 1">
                  <input type="color" name="corA" defaultValue={m.corA} className="h-11 w-full cursor-pointer rounded-lg border border-line bg-paper p-1" />
                </Field>
                <Field label="Cor 2">
                  <input type="color" name="corB" defaultValue={m.corB} className="h-11 w-full cursor-pointer rounded-lg border border-line bg-paper p-1" />
                </Field>
              </div>
            </details>

            <BarraSalvar />
          </Card>
      </AdminForm>

      <Card titulo="Ordem no site" descricao="Muda a posição desta cadeira na lista da categoria.">
        <div className="flex flex-wrap items-center gap-3">
          <AdminForm action={moverModeloAction.bind(null, cat.id, m.id, -1)}>
            {i > 0 ? <SaveButton className={btnSecondary}>‹ Mais para o começo</SaveButton> : null}
          </AdminForm>
          <AdminForm action={moverModeloAction.bind(null, cat.id, m.id, 1)}>
            {proximo ? <SaveButton className={btnSecondary}>Mais para o fim ›</SaveButton> : null}
          </AdminForm>
          <span className="text-sm text-ink-soft">
            {anterior ? `Antes dela: ${anterior.nome}. ` : "É a primeira. "}
            {proximo ? `Depois: ${proximo.nome}.` : "É a última."}
          </span>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-clay/25 bg-paper px-5 py-4">
        <p className="text-sm text-ink-soft">Não vende mais este modelo?</p>
        <BotaoExcluir
          action={deleteModeloAction.bind(null, cat.id, m.id)}
          rotulo="Excluir modelo"
          pergunta={`Excluir "${m.nome}" do site? Não dá para desfazer.`}
        />
      </div>
    </div>
  );
}
