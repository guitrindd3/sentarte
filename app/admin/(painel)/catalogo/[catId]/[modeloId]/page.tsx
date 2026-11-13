import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ondeAparece, OPCOES_COLECAO } from "@/lib/admin-grupos";
import { grupoDoModelo } from "@/lib/grupos";
import { getAdminContent } from "@/lib/content-store";
import { CATEGORIA_COM_PRECO } from "@/lib/offer";
import { deleteModeloAction, moverModeloAction, updateModeloAction } from "../../../../actions";
import { AdminForm, BarraSalvar, BotaoExcluir, Card, CampoTexto, Field, FotoSlot, GaleriaFotos, SaveButton } from "../../../../_ui";
import { btnSecondary, inputClass } from "../../../../_classes";
import { CampoInclui } from "./inclui";
import { PreviaCadeira } from "./previa";

// Chair editor (redesigned 2026-11-03, user: "quero mais detalhado no que eu
// vou fazer… na hora de publicar ainda está confuso… mais tecnológico e mais
// bonito"): numbered sections, "O que vem nesta cadeira" (extras in the
// price), a live site preview beside the form, and "Revisar e publicar" →
// a summary of every change → a publish progress card (app/admin/publicar.tsx).

function Secao({ n, titulo, descricao, children }: { n: number; titulo: string; descricao?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line/70 bg-paper p-5 shadow-[0_1px_2px_rgba(36,31,26,0.05)] sm:p-7">
      <div className="mb-5 flex items-start gap-3.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-wood to-espresso text-sm font-semibold text-paper shadow-[0_6px_14px_-6px_rgba(107,65,38,0.8)]">
          {n}
        </span>
        <div className="min-w-0">
          <h2 className="font-serif text-xl font-medium tracking-tight text-ink">{titulo}</h2>
          {descricao ? <p className="mt-0.5 max-w-prose text-sm text-ink-soft">{descricao}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export default async function EditarModelo({ params }: PageProps<"/admin/catalogo/[catId]/[modeloId]">) {
  const { catId, modeloId } = await params;
  const content = await getAdminContent();
  const cat = content.categorias.find((c) => c.id === catId);
  const i = cat?.modelos.findIndex((m) => m.id === modeloId) ?? -1;
  const m = cat?.modelos[i];
  if (!cat || !m) notFound();
  const onde = ondeAparece(m.nome, cat.slug, m.grupo);
  const anterior = cat.modelos[i - 1];
  const proximo = cat.modelos[i + 1];
  // the original chairs are tied to their collection by name, not by this field
  const presaPeloNome = Boolean(grupoDoModelo({ nome: m.nome }));
  const temPreco = cat.slug === CATEGORIA_COM_PRECO;
  const comExtras = temPreco && !onde.capa;
  const desenho = temPreco && grupoDoModelo(m) === "desenhos";
  let n = 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/catalogo?cat=${cat.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
          <span aria-hidden>‹</span> Todas as cadeiras de {cat.titulo}
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-wood">Editando cadeira</p>
            <h1 className="mt-0.5 font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">{m.nome}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              {onde.grupo ? <span className="rounded-full bg-rattan/15 px-2.5 py-0.5 text-xs font-semibold text-wood-dark">{onde.grupo}</span> : null}
              {onde.oculto ? (
                <span className="rounded-full bg-canvas-deep px-2.5 py-0.5 text-xs font-semibold">Fora do site</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-verde/10 px-2.5 py-0.5 text-xs font-semibold text-verde-escuro">
                  <span className="h-1.5 w-1.5 rounded-full bg-verde" /> No site
                </span>
              )}
              <span>
                Posição {i + 1} de {cat.modelos.length}
              </span>
            </div>
          </div>
          {!onde.oculto ? (
            <a href={onde.href} target="_blank" rel="noreferrer" className={btnSecondary}>
              Ver no site
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-line/70 bg-gradient-to-r from-rattan/10 to-transparent px-4 py-3 text-sm text-ink">
        <span aria-hidden className="mt-0.5 text-wood">ⓘ</span>
        <p>
          Mexa à vontade: <strong className="font-semibold">nada muda no site até você clicar em “Revisar e publicar”</strong>. Antes de publicar,
          aparece a lista de tudo o que mudou para você conferir.
        </p>
      </div>

      <AdminForm action={updateModeloAction.bind(null, cat.id, m.id)} confirmar verNoSite={onde.oculto ? undefined : onde.href} className="block">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="lg:order-2">
            <PreviaCadeira
              inicial={{ nome: m.nome, descricao: m.descricao, foto: m.imagemUrl, inclui: comExtras ? m.inclui : undefined }}
              temPreco={temPreco}
              desenho={desenho}
            />
          </div>

          <div className="min-w-0 space-y-6 lg:order-1">
            <Secao n={++n} titulo="Foto principal" descricao="A primeira foto que o cliente vê. Pode mandar a do celular: o painel diminui o tamanho sozinho.">
              <div className="max-w-[16rem]">
                <FotoSlot name="foto" removerName="removerFoto" atual={m.imagemUrl} rotulo="Foto principal" vazio="Clique ou arraste a foto" destaque />
              </div>
            </Secao>

            <Secao n={++n} titulo="Nome e descrição">
              <div className="space-y-5">
                <Field
                  label="Nome"
                  dica={
                    onde.grupo && !onde.capa && !m.grupo
                      ? `Atenção: esse nome liga a cadeira à página ${onde.grupo}. Se mudar o nome, ela sai de lá.`
                      : onde.capa
                        ? "Atenção: esse nome liga o cartão à página da coleção. Se mudar, o cartão deixa de funcionar como capa."
                        : "Mudar o nome também muda o endereço da página dela."
                  }
                >
                  <CampoTexto name="nome" defaultValue={m.nome} max={80} required />
                </Field>
                {cat.slug === "cadeiras" && !onde.capa ? (
                  <Field
                    label="Coleção"
                    dica={
                      presaPeloNome
                        ? `Esta cadeira já está em ${onde.grupo} pelo nome dela.`
                        : "Onde ela aparece no site. Ex.: Cadeiras de time = entra na página de times."
                    }
                  >
                    <select name="colecao" defaultValue={m.grupo ?? ""} disabled={presaPeloNome} className={inputClass}>
                      {OPCOES_COLECAO.map((o) => (
                        <option key={o.valor} value={o.valor}>
                          {o.rotulo}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}
                <Field label="Descrição" dica="Do que é feita, as cores, para quem combina. Aparece embaixo da foto no site.">
                  <CampoTexto name="descricao" defaultValue={m.descricao} max={500} linhas={5} />
                </Field>
              </div>
            </Secao>

            {comExtras ? (
              <Secao
                n={++n}
                titulo="O que vem nesta cadeira"
                descricao="Marque o que a cadeira da foto tem. O valor de cada item já entra no preço do site, e o cliente vê tudo listado."
              >
                <CampoInclui inicial={m.inclui} />
              </Secao>
            ) : null}

            <Secao
              n={++n}
              titulo="Outras cores do mesmo modelo"
              descricao="A mesma cadeira em outra combinação de cores. O cliente escolhe entre elas, e a escolha vai no pedido."
            >
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {[2, 3, 4, 5, 6].map((c) => (
                  <FotoSlot
                    key={c}
                    name={`fotoVariante${c}`}
                    removerName={`removerVariante${c}`}
                    atual={m.variantes?.[c - 2]}
                    rotulo={`Cor ${c}`}
                    vazio="Adicionar"
                  />
                ))}
              </div>
            </Secao>

            <Secao n={++n} titulo="Mais fotos" descricao="Outros ângulos ou a mesma cadeira com nomes de clientes. Só para mostrar; não vira opção de compra.">
              <GaleriaFotos existentes={m.fotosExtras ?? []} max={8} name="fotosExtrasNovas" removerName="removerExtra" />
              <details className="mt-6 border-t border-line/70 pt-4">
                <summary className="cursor-pointer text-sm font-semibold text-ink-soft hover:text-ink">Cores do desenho (só aparece se a cadeira ficar sem foto)</summary>
                <div className="mt-4 grid max-w-sm grid-cols-2 gap-3">
                  <Field label="Cor 1 do desenho">
                    <input type="color" name="corA" defaultValue={m.corA} className="h-11 w-full cursor-pointer rounded-lg border border-line bg-paper p-1" />
                  </Field>
                  <Field label="Cor 2 do desenho">
                    <input type="color" name="corB" defaultValue={m.corB} className="h-11 w-full cursor-pointer rounded-lg border border-line bg-paper p-1" />
                  </Field>
                </div>
              </details>
            </Secao>

            <BarraSalvar flutuante />
          </div>
        </div>
      </AdminForm>

      <Card titulo="Ordem no site" descricao="Muda a posição desta cadeira na lista. Isso salva na hora (sem a revisão).">
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
