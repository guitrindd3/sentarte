import { redisAtivo } from "@/lib/redis";
import { estadoVagas } from "@/lib/vagas";
import { salvarVagasAction } from "../../actions";
import { AdminForm, Card, Field, inputClass, SaveButton } from "../../_ui";

// "Vagas da semana" (2026-10-19): how many chairs the atelier can make per
// week. The site shows "Restam N vagas" on each chair page and in the cart.

export default async function Vagas() {
  if (!redisAtivo()) {
    return <Card titulo="Vagas da semana"><p className="text-sm text-ink-soft">O banco do painel não está ligado.</p></Card>;
  }
  const v = await estadoVagas();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Vagas da semana</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Quantas cadeiras dá para fazer por semana. O site mostra &ldquo;Restam 4 vagas de produção nesta semana&rdquo; na página de cada
          cadeira e no carrinho. Só vale se for verdade: coloque o número real.
        </p>
      </div>

      <Card
        titulo="Esta semana"
        descricao="Toda venda paga pelo site usa as vagas sozinha. Toda segunda-feira o número volta ao total. Pedidos fechados pelo WhatsApp você desconta aqui."
        acao={
          v.ligado ? (
            <span className="rounded-full bg-verde px-3 py-1 text-xs font-semibold text-paper">Aparecendo no site</span>
          ) : (
            <span className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-ink-soft">Escondido</span>
          )
        }
      >
        {v.total > 0 ? (
          <p className="mb-5 text-ink">
            <span className="font-serif text-4xl font-medium">{v.restantes}</span>
            <span className="text-ink-soft"> de {v.total} vagas sobrando ({v.usadas} {v.usadas === 1 ? "usada" : "usadas"})</span>
          </p>
        ) : null}
        <AdminForm action={salvarVagasAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Cadeiras por semana" dica="O total que o ateliê consegue fazer de segunda a domingo.">
            <input name="total" type="number" min={0} max={200} inputMode="numeric" defaultValue={v.total || ""} required className={inputClass} />
          </Field>
          <Field label="Quantas ainda sobram nesta semana" dica="Deixe em branco para o site contar sozinho pelas vendas.">
            <input name="restantes" type="number" min={0} max={200} inputMode="numeric" placeholder={v.total ? String(v.restantes) : ""} className={inputClass} />
          </Field>
          <label className="flex items-center gap-3 sm:col-span-2">
            <input name="ligado" type="checkbox" defaultChecked={v.ligado || v.total === 0} className="h-5 w-5 accent-[var(--wood)]" />
            <span className="text-sm text-ink">Mostrar as vagas no site</span>
          </label>
          <div className="sm:col-span-2">
            <SaveButton />
          </div>
        </AdminForm>
        <p className="mt-4 text-xs text-ink-soft">
          Quando as vagas acabam, o site não para de vender: ele avisa que os pedidos novos entram na produção da semana seguinte.
        </p>
      </Card>
    </div>
  );
}
