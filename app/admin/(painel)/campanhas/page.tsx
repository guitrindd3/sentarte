import { estadoAvisos } from "@/lib/avisos";
import { enviadosHoje, LIMITE_DIA, listarCampanhas, type Campanha } from "@/lib/campanhas";
import { lerConfigBoasVindas, listarAssinantes, numerosBoasVindas, type Assinante } from "@/lib/lista-email";
import { redisAtivo } from "@/lib/redis";
import { hojeBR, naBlackFriday } from "@/lib/black-friday";
import { configBlackFriday } from "@/lib/cupons-store";
import { mandarCampanhaAction, removerAssinanteAction, salvarBoasVindasAction } from "../../actions";
import { AdminForm, BotaoExcluir, Card, Field, inputClass, SaveButton } from "../../_ui";

// "Campanhas" (2026-11-05): the welcome-coupon window (components/janela-cupom.tsx)
// and e-mails to the list (lib/campanhas.ts, lib/lista-email.ts).

const quando = (t: number) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(t));

function Progresso({ c }: { c: Campanha }) {
  const feitos = c.enviados + c.falhas;
  const pct = c.total ? Math.round((feitos / c.total) * 100) : 100;
  return (
    <li className="rounded-xl border border-line/70 bg-canvas px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-ink">{c.assunto}</p>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.fim ? "bg-verde/10 text-verde-escuro" : "bg-rattan/15 text-wood-dark"}`}>
          {c.fim ? "Concluída" : "Enviando…"}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        {quando(c.em)} · {c.enviados} de {c.total} enviados{c.falhas ? ` · ${c.falhas} não foram (e-mail errado?)` : ""}
      </p>
      {!c.fim ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/60">
          <div className="h-full bg-verde" style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </li>
  );
}

const ORIGEM: Record<Assinante["origem"], string> = { janela: "cupom de boas-vindas", compra: "marcou na compra" };

export default async function Campanhas() {
  if (!redisAtivo()) {
    return <Card titulo="Campanhas"><p className="text-sm text-ink-soft">O banco do painel não está ligado.</p></Card>;
  }
  const [cfg, numeros, lista, campanhas, hoje, avisos, bf] = await Promise.all([
    lerConfigBoasVindas(),
    numerosBoasVindas(),
    listarAssinantes(),
    listarCampanhas(),
    enviadosHoje(),
    estadoAvisos(),
    configBlackFriday(),
  ]);
  const n = lista.length;
  // Black Friday week: typed coupons don't work, so the window waits (lib/lista-email.ts janelaValendo)
  const semanaBf = bf.ligado ? naBlackFriday(hojeBR(), bf.inicioAntecipado) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Campanhas</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Junte e-mails de quem visita o site com um cupom de boas-vindas e mande novidades para essa lista. Só entra na lista quem marcou que aceita receber.
        </p>
      </div>

      <Card
        titulo="Cupom para quem vai sair do site"
        descricao="Quando a pessoa vai embora sem comprar, aparece uma janela uma vez só: ela deixa o e-mail e ganha um cupom para a primeira compra, que já entra no carrinho. Cada cupom vale um uso."
        acao={
          cfg.ligado && semanaBf ? (
            <span className="rounded-full bg-rattan/20 px-3 py-1 text-xs font-semibold text-wood-dark">Pausado na Black Friday</span>
          ) : cfg.ligado ? (
            <span className="rounded-full bg-verde px-3 py-1 text-xs font-semibold text-paper">Ligado</span>
          ) : (
            <span className="rounded-full bg-canvas-deep px-3 py-1 text-xs font-semibold text-ink">Desligado</span>
          )
        }
      >
        {cfg.ligado && semanaBf ? (
          <p className="mb-4 rounded-xl bg-rattan/15 px-4 py-3 text-sm text-wood-dark">
            A Black Friday está valendo até {semanaBf.fim.split("-").reverse().join("/")} e, enquanto ela vale, nenhum outro cupom funciona. Por isso a janela
            fica escondida e volta sozinha no dia seguinte.
          </p>
        ) : null}
        <AdminForm action={salvarBoasVindasAction} className="space-y-4">
          <label className="flex items-start gap-3">
            <input name="ligado" type="checkbox" defaultChecked={cfg.ligado} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--wood)]" />
            <span className="text-sm text-ink">
              <strong className="font-semibold">Mostrar a janela no site.</strong> No computador, aparece quando o mouse vai para fechar a aba. No celular, quando a
              pessoa volta rápido para o topo ou depois de 1 minuto no site. Não aparece na semana da Black Friday.
            </span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Desconto (%)">
              <input name="percentual" inputMode="decimal" required defaultValue={cfg.percentual} className={inputClass} />
            </Field>
            <Field label="Vale por quantos dias">
              <input name="dias" type="number" min={3} max={365} required defaultValue={cfg.dias} className={inputClass} />
            </Field>
          </div>
          <SaveButton>Salvar</SaveButton>
        </AdminForm>
        <p className="mt-4 text-sm text-ink-soft">
          {numeros.dados
            ? `${numeros.dados} ${numeros.dados === 1 ? "cupom dado" : "cupons dados"} até agora, ${numeros.usados} ${numeros.usados === 1 ? "virou compra paga" : "viraram compra paga"}.`
            : "Nenhum cupom dado ainda."}{" "}
          Se tiver outro cupom no carrinho (como o de 2 cadeiras), vale o que der mais desconto.
        </p>
      </Card>

      <Card titulo="Mandar um e-mail para a lista" descricao={`${n} ${n === 1 ? "pessoa está" : "pessoas estão"} na lista. Cada uma recebe o e-mail separado, com o nome dela e um link para sair da lista.`}>
        {!avisos.email ? (
          <p className="mb-4 rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay-dark">
            Os e-mails saem do seu Gmail: ligue o &ldquo;Aviso de venda por e-mail&rdquo; em Avisos e envio primeiro.
          </p>
        ) : null}
        <AdminForm action={mandarCampanhaAction} className="space-y-4">
          <Field label="Assunto" dica="Ex.: Chegou modelo novo, {nome}!">
            <input name="assunto" required maxLength={120} className={inputClass} />
          </Field>
          <Field label="Texto" dica="Escreva {nome} onde quer o primeiro nome da pessoa. Deixe uma linha em branco entre um parágrafo e outro.">
            <textarea name="texto" required rows={8} maxLength={5000} placeholder={"Oi, {nome}!\n\nAcabou de sair do ateliê..."} className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Texto do botão" dica="Se deixar vazio: Ver as cadeiras.">
              <input name="botaoTexto" maxLength={40} placeholder="Ver as cadeiras" className={inputClass} />
            </Field>
            <Field label="Link do botão (opcional)" dica="Copie o endereço da página da cadeira. Vazio = página inicial.">
              <input name="botaoLink" maxLength={300} placeholder="https://sentarte.com.br/cadeira/..." className={inputClass} />
            </Field>
          </div>
          <fieldset className="space-y-2 rounded-xl bg-canvas px-4 py-3 text-sm">
            <legend className="sr-only">Para quem</legend>
            <label className="flex items-start gap-3">
              <input type="radio" name="para" value="teste" defaultChecked className="mt-0.5 h-4 w-4 accent-[var(--wood)]" />
              <span>
                <strong className="font-semibold text-ink">Só um teste para o meu e-mail</strong>
                <span className="block text-ink-soft">Para ver como fica antes de mandar para todo mundo.</span>
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="radio" name="para" value="todos" disabled={n === 0} className="mt-0.5 h-4 w-4 accent-[var(--wood)]" />
              <span>
                <strong className="font-semibold text-ink">Mandar para as {n} {n === 1 ? "pessoa" : "pessoas"} da lista</strong>
                <span className="block text-ink-soft">No máximo {LIMITE_DIA} por dia (limite do Gmail); o resto sai no dia seguinte sozinho.</span>
              </span>
            </label>
          </fieldset>
          <SaveButton>Mandar</SaveButton>
        </AdminForm>
      </Card>

      {campanhas.length ? (
        <Card titulo="E-mails mandados" descricao={`Hoje já saíram ${hoje} de ${LIMITE_DIA}.`}>
          <ul className="space-y-3">
            {campanhas.map((c) => (
              <Progresso key={c.id} c={c} />
            ))}
          </ul>
        </Card>
      ) : null}

      <Card titulo="Quem está na lista" descricao="Entra quem pegou o cupom de boas-vindas ou marcou “quero receber novidades” na hora de pagar. Clientes antigos não entram porque não deram essa permissão.">
        {n === 0 ? (
          <p className="text-sm text-ink-soft">Ninguém ainda.</p>
        ) : (
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-ink-soft hover:text-ink">Ver as {n} pessoas</summary>
            <ul className="mt-3 divide-y divide-line/60">
              {lista.map((a) => (
                <li key={a.email} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{a.nome ? `${a.nome} · ` : ""}{a.email}</span>
                    <span className="text-xs text-ink-soft">
                      {ORIGEM[a.origem]}, {quando(a.em)}
                    </span>
                  </span>
                  <BotaoExcluir action={removerAssinanteAction.bind(null, a.email)} rotulo="Tirar" pergunta={`Tirar ${a.email} da lista?`} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </Card>
    </div>
  );
}
