import { estadoDaChave, type EstadoChave } from "@/lib/github-store";
import { redisAtivo } from "@/lib/redis";
import { doisFatoresAtivo, historico, reservasRestantes, type Entrada } from "@/lib/seguranca";
import { desativarDoisFatoresAction, logoutTodosAction } from "../../actions";
import { AdminForm, Card, Field, SaveButton } from "../../_ui";
import { btnSecondary, inputClass } from "../../_classes";
import { AtivarDoisFatores } from "./ativar";
import { NovosCodigos } from "./novos-codigos";

function quando(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

/** Wrong attempts in the last 24 hours. */
function falhasRecentes(entradas: Entrada[]) {
  const desde = Date.now() - 86_400_000;
  return entradas.filter((e) => !e.ok && new Date(e.em).getTime() > desde).length;
}

export default async function Seguranca() {
  if (!redisAtivo()) {
    return (
      <Card titulo="Segurança">
        <p className="text-sm text-ink-soft">O banco do painel não está ligado, então o código no celular e o histórico não estão disponíveis.</p>
      </Card>
    );
  }
  const [ativo, entradas, chave] = await Promise.all([doisFatoresAtivo(), historico(60), estadoDaChave()]);
  const reservas = ativo ? await reservasRestantes() : 0;
  const falhas24h = falhasRecentes(entradas);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Segurança</h1>
        <p className="mt-2 max-w-prose text-ink-soft">Quem pode entrar no painel e quem tentou.</p>
      </div>

      <Card
        titulo="Código no celular"
        descricao="Além da senha, o painel pede um código de 6 números que muda a cada 30 segundos no seu celular. Quem descobrir a senha não entra sem ele."
        acao={
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ativo ? "bg-verde/10 text-verde-escuro" : "bg-clay/10 text-clay-dark"}`}>
            {ativo ? "● Ligado" : "● Desligado"}
          </span>
        }
      >
        <AtivarDoisFatores ativo={ativo}>
          <div className="space-y-5">
            <p className="text-sm text-ink">
              Você tem <strong>{reservas}</strong> {reservas === 1 ? "código reserva sobrando" : "códigos reserva sobrando"}.
              {reservas <= 3 ? " Estão acabando: gere novos." : ""}
            </p>
            <NovosCodigos />
            <details className="rounded-xl border border-line/70 bg-canvas/60 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-ink-soft hover:text-ink">Trocou de celular ou quer desligar?</summary>
              <AdminForm action={desativarDoisFatoresAction} className="mt-4 flex flex-wrap items-end gap-3">
                <Field label="Código do app (ou um código reserva)" dica="Depois de desligar, você pode ligar de novo no celular novo.">
                  <input name="codigo" required inputMode="text" autoCapitalize="characters" autoCorrect="off" spellCheck={false} autoComplete="off" maxLength={12} className={`w-48 uppercase ${inputClass}`} />
                </Field>
                <SaveButton className={btnSecondary}>Desligar o código</SaveButton>
              </AdminForm>
            </details>
          </div>
        </AtivarDoisFatores>
      </Card>

      <ChaveGithub c={chave} />

      <Card
        titulo="Histórico de entradas"
        descricao={
          falhas24h > 0
            ? `${falhas24h} ${falhas24h === 1 ? "tentativa errada" : "tentativas erradas"} nas últimas 24 horas. Se não foi você, clique em "Sair de todos os aparelhos" e ligue o código no celular.`
            : "Cada entrada no painel e cada tentativa errada. Cidade e IP são aproximados."
        }
      >
        {entradas.length === 0 ? (
          <p className="text-sm text-ink-soft">Nenhuma entrada registrada ainda. O histórico começa a partir de agora.</p>
        ) : (
          <div className="-mx-5 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-ink-soft">
                  <th className="px-5 py-2 font-medium sm:pl-0">Quando</th>
                  <th className="py-2 pr-4 font-medium">O que aconteceu</th>
                  <th className="py-2 pr-4 font-medium">Onde</th>
                  <th className="py-2 pr-5 font-medium sm:pr-0">Aparelho</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map((e: Entrada, i) => (
                  <tr key={`${e.em}-${i}`} className="border-b border-line/50 last:border-0">
                    <td className="whitespace-nowrap px-5 py-2.5 tabular-nums text-ink-soft sm:pl-0">{quando(e.em)}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex items-center gap-1.5 font-medium ${e.ok ? "text-ink" : "text-clay-dark"}`}>
                        <span aria-hidden>{e.ok ? "✓" : "✕"}</span>
                        {e.evento}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-ink-soft">
                      {e.local ?? "?"}
                      {e.ip ? <span className="block text-xs text-ink-soft/70">{e.ip}</span> : null}
                    </td>
                    <td className="py-2.5 pr-5 text-ink-soft sm:pr-0">{e.aparelho}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card titulo="Aparelhos conectados" descricao="Desconecta o painel de todos os celulares e computadores, inclusive este. Use se perdeu um aparelho ou viu uma entrada estranha.">
        <form action={logoutTodosAction}>
          <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-paper hover:bg-clay-dark">
            Sair de todos os aparelhos
          </button>
        </form>
      </Card>
    </div>
  );
}

const dataLonga = (ms: number) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(ms));

/** When the GitHub key the panel saves with (GITHUB_TOKEN) expires. */
function ChaveGithub({ c }: { c: EstadoChave }) {
  const etiqueta =
    c.estado === "vencida"
      ? { t: "● Vencida", c: "bg-clay/10 text-clay-dark" }
      : c.estado === "vence"
        ? { t: `● Vence em ${c.dias} ${c.dias === 1 ? "dia" : "dias"}`, c: "bg-rattan/20 text-wood-dark" }
        : c.estado === "ok"
          ? { t: "● Funcionando", c: "bg-verde/10 text-verde-escuro" }
          : { t: "● Sem resposta", c: "bg-canvas-deep text-ink-soft" };
  return (
    <Card
      titulo="Chave do GitHub"
      descricao="É com ela que o painel salva fotos, cadeiras e textos no site. Ela tem data para vencer; 15 dias antes aparece um aviso no topo do painel."
      acao={<span className={`rounded-full px-3 py-1 text-xs font-semibold ${etiqueta.c}`}>{etiqueta.t}</span>}
    >
      <p className="text-sm text-ink">
        {c.estado === "vencida" ? (
          <>Venceu: salvar no painel não funciona até trocar.</>
        ) : c.estado === "vence" || (c.estado === "ok" && c.venceEm) ? (
          <>
            Vence em <strong>{dataLonga((c as { venceEm: number }).venceEm)}</strong>.
          </>
        ) : c.estado === "ok" ? (
          <>Essa chave não tem data para vencer.</>
        ) : (
          <>Não consegui falar com o GitHub agora. Recarregue a página daqui a pouco.</>
        )}
      </p>
      <details className="mt-4 rounded-xl border border-line/70 bg-canvas/60 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink-soft hover:text-ink">Como trocar a chave</summary>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink">
          <li>No GitHub: Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.</li>
          <li>Validade (Expiration): 1 ano. Repositório: só o sentarte. Permissão Contents: Read and write.</li>
          <li>Na Vercel: Settings → Environment Variables → GITHUB_TOKEN, cole a chave nova no lugar da antiga.</li>
          <li>Publique o site de novo (Deployments → Redeploy) para a chave nova valer.</li>
        </ol>
      </details>
    </Card>
  );
}
