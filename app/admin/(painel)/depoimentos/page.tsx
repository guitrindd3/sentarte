import { getAdminContent } from "@/lib/content-store";
import { addDepoimentoAction, deleteDepoimentoAction } from "../../actions";
import { AdminForm, BotaoExcluir, Card, CampoTexto, Field, FotoSlot, SaveButton, inputClass } from "../../_ui";

export default async function Depoimentos() {
  const { depoimentos } = await getAdminContent();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Depoimentos de clientes</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Aparecem na página inicial assim que tiver pelo menos um. Use só mensagens reais, e peça licença ao cliente antes.
        </p>
      </div>

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
                    <p className="font-serif text-lg leading-snug text-ink">&ldquo;{d.texto}&rdquo;</p>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {d.nome}
                      {d.cidade ? <span className="font-normal text-ink-soft">, {d.cidade}</span> : null}
                    </p>
                  </div>
                </div>
                <div className="mt-4 border-t border-line/60 pt-3">
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
