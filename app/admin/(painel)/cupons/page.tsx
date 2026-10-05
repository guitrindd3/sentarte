import { rotuloDesconto, type Cupom } from "@/lib/cupom";
import { listarCupons, motivoInvalido, type CupomComUsos } from "@/lib/cupons-store";
import { redisAtivo } from "@/lib/redis";
import { alternarCupomAction, excluirCupomAction, salvarCupomAction } from "../../actions";
import { AdminForm, BotaoExcluir, Card, Field, SaveButton, btnSecondary, inputClass } from "../../_ui";
import { CopiarTexto } from "./copiar";

const dataBR = (iso: string) => iso.split("-").reverse().join("/");

function condicoes(c: Cupom) {
  const partes = [c.minCadeiras > 1 ? `a partir de ${c.minCadeiras} cadeiras` : "em qualquer pedido"];
  if (c.validoAte) partes.push(`até ${dataBR(c.validoAte)}`);
  if (c.limiteUsos) partes.push(`no máximo ${c.limiteUsos} ${c.limiteUsos === 1 ? "uso" : "usos"}`);
  return partes.join(", ");
}

function mensagemDivulgacao(c: Cupom) {
  const quando = c.minCadeiras > 1 ? ` levando ${c.minCadeiras} cadeiras ou mais` : "";
  const ate = c.validoAte ? ` Válido até ${dataBR(c.validoAte)}.` : "";
  return c.automatico
    ? `Ganhe ${rotuloDesconto(c)} de desconto${quando} no site do Ateliê SentArte: o desconto entra sozinho no carrinho!${ate} sentarte.vercel.app`
    : `Use o cupom ${c.codigo} no carrinho do site e ganhe ${rotuloDesconto(c)} de desconto${quando}!${ate} sentarte.vercel.app`;
}

/** Create/edit form (the same fields both ways). */
function FormCupom({ c }: { c?: CupomComUsos }) {
  return (
    <AdminForm action={salvarCupomAction} className="space-y-4">
      <input type="hidden" name="original" value={c?.codigo ?? ""} />
      <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <Field label="Código" dica="Letras e números, sem espaço. Ex.: VERAO10">
          <input name="codigo" required defaultValue={c?.codigo} maxLength={20} autoCapitalize="characters" className={`uppercase ${inputClass}`} />
        </Field>
        <Field label="Desconto">
          <input name="valor" required inputMode="decimal" defaultValue={c?.valor} placeholder="10" className={inputClass} />
        </Field>
        <Field label="Em">
          <select name="tipo" defaultValue={c?.tipo ?? "percentual"} className={inputClass}>
            <option value="percentual">% do pedido</option>
            <option value="valor">R$ (reais)</option>
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Mínimo de cadeiras" dica="1 = vale para qualquer pedido.">
          <input name="minCadeiras" type="number" min={1} max={50} defaultValue={c?.minCadeiras ?? 1} className={inputClass} />
        </Field>
        <Field label="Vale até (opcional)" dica="Último dia que funciona.">
          <input name="validoAte" type="date" defaultValue={c?.validoAte} className={inputClass} />
        </Field>
        <Field label="Limite de usos (opcional)" dica="Conta só compras pagas no site.">
          <input name="limiteUsos" type="number" min={1} defaultValue={c?.limiteUsos} placeholder="sem limite" className={inputClass} />
        </Field>
      </div>
      <Field label="Anotação (opcional)" dica="Só você vê. Ex.: promoção do Dia das Mães, influencer Fulana.">
        <input name="descricao" maxLength={120} defaultValue={c?.descricao} className={inputClass} />
      </Field>
      <label className="flex items-start gap-3 rounded-xl bg-canvas px-4 py-3 text-sm">
        <input type="checkbox" name="automatico" defaultChecked={c?.automatico} className="mt-0.5 h-4 w-4 accent-[var(--wood)]" />
        <span>
          <span className="font-semibold text-ink">Entrar sozinho no carrinho</span>
          <span className="block text-ink-soft">
            O cliente não precisa digitar: o desconto aparece quando o carrinho chega no mínimo. Aparece também na faixa de ofertas do site.
          </span>
        </span>
      </label>
      <SaveButton>{c ? "Salvar cupom" : "Criar cupom"}</SaveButton>
    </AdminForm>
  );
}

export default async function Cupons() {
  if (!redisAtivo()) {
    return <Card titulo="Cupons"><p className="text-sm text-ink-soft">O banco do painel não está ligado.</p></Card>;
  }
  let cupons: CupomComUsos[] = [];
  try {
    cupons = await listarCupons();
  } catch (err) {
    console.error("cupons", err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Cupons de desconto</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          O cliente digita o código no carrinho (&ldquo;Tem cupom de desconto?&rdquo;) e o desconto já sai no total, no Pix e no cartão. Só vale um cupom por
          pedido: se tiver mais de um, entra o que dá mais desconto. Os 2% do Pix continuam valendo por cima.
        </p>
      </div>

      <details className="rounded-2xl border-2 border-dashed border-rattan/60 bg-paper open:border-solid open:border-line/70" open={cupons.length === 0}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 font-semibold text-wood-dark sm:px-7">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-wood text-paper">+</span>
          Criar cupom novo
        </summary>
        <div className="border-t border-line/70 px-5 py-5 sm:px-7">
          <FormCupom />
        </div>
      </details>

      {cupons.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-soft">Nenhum cupom ainda.</p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {cupons.map((c) => {
            const motivo = motivoInvalido(c);
            const selo = !motivo
              ? { t: "Valendo", cl: "bg-verde/10 text-verde-escuro" }
              : motivo === "desligado"
                ? { t: "Desligado", cl: "bg-canvas-deep text-ink-soft" }
                : motivo === "vencido"
                  ? { t: "Vencido", cl: "bg-clay/10 text-clay-dark" }
                  : { t: "Esgotado", cl: "bg-clay/10 text-clay-dark" };
            return (
              <li key={c.codigo} className={`rounded-2xl border border-line/70 bg-paper p-5 sm:p-6 ${motivo ? "opacity-80" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg border-2 border-dashed border-wood/50 bg-canvas px-3 py-1 font-mono text-lg font-bold tracking-wider text-ink">{c.codigo}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${selo.cl}`}>● {selo.t}</span>
                      {c.automatico ? <span className="rounded-full bg-rattan/15 px-2.5 py-0.5 text-xs font-semibold text-wood-dark">Entra sozinho</span> : null}
                    </div>
                    <p className="mt-2 font-serif text-xl font-medium tracking-tight text-ink">{rotuloDesconto(c)} de desconto</p>
                    <p className="text-sm text-ink-soft">{condicoes(c)}</p>
                    {c.descricao ? <p className="mt-1 text-xs italic text-ink-soft">{c.descricao}</p> : null}
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-3xl font-semibold tracking-tight text-ink">{c.usos}</p>
                    <p className="text-xs text-ink-soft">{c.usos === 1 ? "compra paga" : "compras pagas"}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/60 pt-4">
                  <AdminForm action={alternarCupomAction.bind(null, c.codigo)}>
                    <SaveButton className={btnSecondary}>{c.ativo ? "Desligar" : "Ligar"}</SaveButton>
                  </AdminForm>
                  <CopiarTexto texto={mensagemDivulgacao(c)} rotulo="Copiar texto para divulgar" />
                  <BotaoExcluir action={excluirCupomAction.bind(null, c.codigo)} rotulo="Apagar" pergunta={`Apagar o cupom ${c.codigo}?`} />
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-ink-soft hover:text-ink">Editar</summary>
                  <div className="mt-4">
                    <FormCupom c={c} />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-ink-soft">
        Pedidos fechados pelo WhatsApp não entram na contagem de usos: lá o desconto é combinado na conversa.
      </p>
    </div>
  );
}
