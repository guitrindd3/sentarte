import Link from "next/link";
import { TIPOS_CADEIRA, type TipoCadeira } from "@/lib/offer";
import { codigoDoPassaporte, lerConfigPassaporte, numeroBonito, passaportesRecentes } from "@/lib/passaporte";
import { redisAtivo } from "@/lib/redis";
import { salvarConfigPassaporteAction } from "../../actions";
import { AdminForm, btnSecondary, Card, Field, inputClass, SaveButton } from "../../_ui";

// "Passaporte da cadeira" (lib/passaporte.ts, 2026-11-06): defaults shown on
// every passport + the latest ones, with their QR tags.

const dia = (t: number) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(t));

export default async function Passaportes() {
  if (!redisAtivo()) {
    return <Card titulo="Passaportes"><p className="text-sm text-ink-soft">O banco do painel não está ligado.</p></Card>;
  }
  const [cfg, lista] = await Promise.all([lerConfigPassaporte(), passaportesRecentes(60)]);
  const tipos = Object.keys(TIPOS_CADEIRA) as TipoCadeira[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Passaporte da cadeira</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Toda cadeira paga ganha um número e uma página com a história dela. Você imprime a etiqueta com o QR code (no pedido) e amarra na cadeira: quem aponta o
          celular vê o modelo, as cores, o nome trançado, quem fez, quanto tempo levou e as fotos da produção.
        </p>
      </div>

      <Card titulo="O que aparece em todos" descricao="Vale para os passaportes que não têm um valor próprio (dá para mudar um por um no pedido). Em branco, a informação não aparece.">
        <AdminForm action={salvarConfigPassaporteAction} className="space-y-5">
          <Field label="Quem trança" dica="Ex.: Ana, ou Ana e Cláudia. Em branco aparece “no Ateliê SentArte”.">
            <input name="artesa" defaultValue={cfg.artesa} maxLength={60} className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            {tipos.map((t) => (
              <fieldset key={t} className="rounded-xl border border-line/70 p-4">
                <legend className="px-1 text-sm font-semibold text-ink">{TIPOS_CADEIRA[t].curto}</legend>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Horas">
                    <input name={`horas_${t}`} inputMode="decimal" defaultValue={cfg.porTipo[t]?.horas ?? ""} className={inputClass} placeholder="Ex.: 6" />
                  </Field>
                  <Field label="Metros de fio">
                    <input name={`metros_${t}`} inputMode="decimal" defaultValue={cfg.porTipo[t]?.metros ?? ""} className={inputClass} placeholder="Ex.: 180" />
                  </Field>
                </div>
              </fieldset>
            ))}
          </div>
          <SaveButton>Salvar</SaveButton>
        </AdminForm>
      </Card>

      <Card
        titulo="Últimos passaportes"
        acao={
          lista.length ? (
            <a href={`/admin/etiquetas?n=${lista.slice(0, 9).map((p) => p.n).join(",")}`} target="_blank" rel="noreferrer" className={btnSecondary}>
              Imprimir os últimos {Math.min(9, lista.length)}
            </a>
          ) : null
        }
      >
        {lista.length ? (
          <ul className="divide-y divide-line/70">
            {lista.map((p) => (
              <li key={p.n} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">
                    Nº {numeroBonito(p.n)} · {p.modelo}
                    {p.nome ? ` · “${p.nome}”` : ""}
                  </p>
                  <p className="text-ink-soft">
                    {dia(p.criadoEm)}
                    {p.colecao ? ` · ${p.colecao.nome} ${String(p.colecao.numero).padStart(2, "0")}/${p.colecao.total}` : ""}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link href={`/admin/clientes/${p.ref}`} className="text-wood-dark underline">
                    Pedido
                  </Link>
                  <a href={`/p/${codigoDoPassaporte(p.n)}`} target="_blank" rel="noreferrer" className="text-wood-dark underline">
                    Ver
                  </a>
                  <a href={`/admin/etiquetas?n=${p.n}`} target="_blank" rel="noreferrer" className="text-wood-dark underline">
                    Etiqueta
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft">Ainda nenhum. O próximo pedido pago já ganha o seu. Para pedidos antigos, abra o pedido e toque em “Gerar passaportes”.</p>
        )}
      </Card>
    </div>
  );
}
