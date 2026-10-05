import { Estrelas } from "@/components/estrelas";
import { avaliacoesPendentes, type AvaliacaoPendente } from "@/lib/avaliacoes";
import { getAdminContent } from "@/lib/content-store";
import { redisAtivo } from "@/lib/redis";
import { addDepoimentoAction, aprovarAvaliacaoAction, deleteDepoimentoAction, estrelasDepoimentoAction, recusarAvaliacaoAction } from "../../actions";
import { AdminForm, BotaoExcluir, Card, CampoTexto, Field, FotoSlot, SaveButton, btnSecondary, inputClass } from "../../_ui";

function SeletorEstrelas({ valor }: { valor?: number }) {
  return (
    <select name="estrelas" defaultValue={valor === undefined ? "" : String(valor)} className={inputClass}>
      <option value="5">★★★★★ 5 estrelas</option>
      <option value="4">★★★★☆ 4 estrelas</option>
      <option value="3">★★★☆☆ 3 estrelas</option>
      <option value="2">★★☆☆☆ 2 estrelas</option>
      <option value="1">★☆☆☆☆ 1 estrela</option>
      <option value="">Sem estrelas</option>
    </select>
  );
}

const quando = (t: number) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(t));

export default async function Depoimentos() {
  const { depoimentos } = await getAdminContent();
  let pendentes: AvaliacaoPendente[] = [];
  if (redisAtivo()) {
    try {
      pendentes = await avaliacoesPendentes();
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Depoimentos de clientes</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Aparecem na página inicial, com as estrelas. Os clientes também podem avaliar pelo site (botão &ldquo;Já tem a sua? Avalie&rdquo;): essas avaliações
          esperam a sua aprovação aqui antes de aparecer.
        </p>
      </div>

      {pendentes.length ? (
        <Card
          titulo={`Esperando aprovação (${pendentes.length})`}
          descricao="Avaliações mandadas pelo site. Você pode corrigir o texto e pôr uma foto antes de aprovar. Recuse spam ou o que não for de cliente."
          className="border-2 border-rattan/50"
        >
          <ul className="space-y-4">
            {pendentes.map((a) => (
              <li key={a.id} className="rounded-xl border border-line/70 bg-canvas/50 p-4">
                <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
                  <Estrelas valor={a.estrelas} />
                  <span>{quando(a.em)}</span>
                </div>
                <AdminForm action={aprovarAvaliacaoAction.bind(null, a.id)} className="grid gap-4 sm:grid-cols-[8rem_1fr]">
                  <FotoSlot name="foto" rotulo="Foto (opcional)" vazio="Pôr foto" formato="quadrada" />
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Nome">
                        <input name="nome" defaultValue={a.nome} maxLength={80} className={inputClass} />
                      </Field>
                      <Field label="Cidade">
                        <input name="cidade" defaultValue={a.cidade} maxLength={80} className={inputClass} />
                      </Field>
                      <Field label="Estrelas">
                        <SeletorEstrelas valor={a.estrelas} />
                      </Field>
                    </div>
                    <Field label="Comentário">
                      <CampoTexto name="texto" defaultValue={a.texto} max={600} linhas={3} />
                    </Field>
                    <div className="flex flex-wrap items-center gap-2">
                      <SaveButton>Aprovar e publicar</SaveButton>
                    </div>
                  </div>
                </AdminForm>
                <div className="mt-2">
                  <BotaoExcluir action={recusarAvaliacaoAction.bind(null, a.id)} rotulo="Recusar" pergunta={`Recusar a avaliação de ${a.nome}? Ela não vai aparecer no site.`} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card titulo="Novo depoimento" descricao="Dica: copie a mensagem do WhatsApp do cliente e cole aqui.">
        <AdminForm action={addDepoimentoAction} className="grid gap-5 sm:grid-cols-[10rem_1fr]">
          <FotoSlot name="foto" rotulo="Foto (opcional)" vazio="Foto do cliente com a cadeira" />
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do cliente">
                <input name="nome" required maxLength={80} placeholder="Ex.: Juliana" className={inputClass} />
              </Field>
              <Field label="Cidade (opcional)">
                <input name="cidade" maxLength={80} placeholder="Ex.: Vila Velha, ES" className={inputClass} />
              </Field>
            </div>
            <Field label="O que o cliente disse">
              <CampoTexto name="texto" required max={600} linhas={4} placeholder="Amei a cadeira, ficou perfeita na praia…" />
            </Field>
            <div className="max-w-xs">
              <Field label="Estrelas">
                <SeletorEstrelas valor={5} />
              </Field>
            </div>
            <SaveButton>Publicar depoimento</SaveButton>
          </div>
        </AdminForm>
      </Card>

      <div>
        <h2 className="font-serif text-xl font-medium tracking-tight text-ink sm:text-2xl">
          No site agora <span className="text-base text-ink-soft">({depoimentos.length})</span>
        </h2>
        {depoimentos.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-line bg-paper/60 px-5 py-8 text-center text-sm text-ink-soft">
            Nenhum depoimento ainda. O primeiro que você publicar já faz a seção aparecer na página inicial.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {depoimentos.map((d) => (
              <li key={d.id} className="flex flex-col rounded-2xl border border-line/70 bg-paper p-5">
                <div className="flex items-start gap-4">
                  {d.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.fotoUrl} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                  ) : null}
                  <div className="min-w-0">
                    {d.estrelas ? <Estrelas valor={d.estrelas} /> : null}
                    <p className="font-serif text-lg leading-snug text-ink">&ldquo;{d.texto}&rdquo;</p>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {d.nome}
                      {d.cidade ? <span className="font-normal text-ink-soft">, {d.cidade}</span> : null}
                    </p>
                  </div>
                </div>
                <AdminForm action={estrelasDepoimentoAction.bind(null, d.id)} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line/60 pt-3">
                  <div className="min-w-[11rem] flex-1">
                    <SeletorEstrelas valor={d.estrelas} />
                  </div>
                  <SaveButton className={btnSecondary}>Salvar estrelas</SaveButton>
                </AdminForm>
                <div className="mt-2">
                  <BotaoExcluir
                    action={deleteDepoimentoAction.bind(null, d.id)}
                    rotulo="Excluir"
                    pergunta={`Tirar o depoimento de ${d.nome} do site?`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
