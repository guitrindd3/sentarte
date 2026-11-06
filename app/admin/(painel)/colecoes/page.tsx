import Link from "next/link";
import { estadoAvisos } from "@/lib/avisos";
import { listarColecoes, numerosDasColecoes, situacaoDe, type Colecao, type Situacao } from "@/lib/colecoes";
import { getAdminContent } from "@/lib/content-store";
import { SITE_URL } from "@/lib/nav";
import { produtosDaLoja } from "@/lib/produtos";
import { redisAtivo } from "@/lib/redis";
import { apagarColecaoAction, mandarCampanhaAction, salvarColecaoAction } from "../../actions";
import { AdminForm, BotaoExcluir, btnSecondary, Card, Field, inputClass, SaveButton } from "../../_ui";

// "Coleções numeradas" (lib/colecoes.ts, 2026-11-06): limited editions of
// chosen chairs, each one numbered (nº 07 de 40), with a waiting list before
// opening and a "restam N" counter on the site.

const ROTULO: Record<Situacao | "rascunho", { t: string; c: string }> = {
  rascunho: { t: "Rascunho (só você vê)", c: "bg-canvas-deep text-ink" },
  espera: { t: "Lista de espera", c: "bg-rattan/20 text-wood-dark" },
  aberta: { t: "À venda", c: "bg-verde text-paper" },
  esgotada: { t: "Esgotada", c: "bg-ink text-paper" },
  encerrada: { t: "Encerrada", c: "bg-canvas-deep text-ink-soft" },
};

/** "2026-12-01T10:00" in Brasília, for the datetime-local field. */
const paraCampo = (ms?: number) => (ms ? new Date(ms - 3 * 3600_000).toISOString().slice(0, 16) : "");
const dataHora = (ms: number) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(ms));

export default async function Colecoes({ searchParams }: PageProps<"/admin/colecoes">) {
  if (!redisAtivo()) {
    return <Card titulo="Coleções"><p className="text-sm text-ink-soft">O banco do painel não está ligado.</p></Card>;
  }
  const sp = await searchParams;
  const [lista, content, avisos] = await Promise.all([listarColecoes(), getAdminContent(), estadoAvisos()]);
  const nums = await numerosDasColecoes(lista.map((c) => c.id));
  // only chairs you can buy (no cover cards, no "<Nome> personalizado" photos)
  const cadeiras = produtosDaLoja(content)
    .map((p) => p.base)
    .filter((m) => m.imagemUrl);
  const editar = typeof sp.editar === "string" ? lista.find((c) => c.id === sp.editar) : undefined;
  const nova = sp.nova === "1" || (!lista.length && !editar);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Coleções numeradas</h1>
          <p className="mt-2 max-w-prose text-ink-soft">
            Uma edição limitada de cadeiras escolhidas (ex.: &ldquo;Coleção Verão 2027, só 40&rdquo;). Cada cadeira vendida ganha o número dela na edição, que vai no
            passaporte. Antes de abrir, junta uma lista de espera; no site aparece quantas restam.
          </p>
        </div>
        {!nova && !editar ? (
          <Link href="/admin/colecoes?nova=1" className={btnSecondary}>
            + Nova coleção
          </Link>
        ) : null}
      </div>

      {lista.map((c) => {
        const n = nums.get(c.id) ?? { vendidos: 0, espera: 0 };
        const sit = situacaoDe(c, n.vendidos) ?? "rascunho";
        const r = ROTULO[sit];
        const aberta = editar?.id === c.id;
        return (
          <Card
            key={c.id}
            titulo={c.nome}
            descricao={
              <>
                {n.vendidos} de {c.total} vendidas · {n.espera} na lista de espera
                {c.estado === "aberta" && sit === "espera" && c.abreEm ? ` · abre ${dataHora(c.abreEm)}` : ""}
              </>
            }
            acao={<span className={`rounded-full px-3 py-1 text-xs font-semibold ${r.c}`}>{r.t}</span>}
          >
            <div className="h-1.5 overflow-hidden rounded-full bg-line/60">
              <div className="h-full bg-verde" style={{ width: `${Math.round((n.vendidos / c.total) * 100)}%` }} />
            </div>
            <p className="mt-3 text-sm text-ink-soft">Cadeiras: {c.modelos.join(", ")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {sit !== "rascunho" ? (
                <a href={`/colecao/${c.id}`} target="_blank" rel="noreferrer" className={btnSecondary}>
                  Ver no site
                </a>
              ) : null}
              {!aberta ? (
                <Link href={`/admin/colecoes?editar=${c.id}`} className={btnSecondary}>
                  Editar
                </Link>
              ) : null}
            </div>
            {aberta ? <Formulario c={c} cadeiras={cadeiras} vendidos={n.vendidos} /> : null}
            {aberta && n.espera ? <AvisarEspera c={c} espera={n.espera} gmail={Boolean(avisos.email)} /> : null}
            {aberta && !n.vendidos ? (
              <BotaoExcluir action={apagarColecaoAction.bind(null, c.id)} rotulo="Apagar coleção" pergunta={`Apagar a ${c.nome}?`} className="mt-5" />
            ) : null}
          </Card>
        );
      })}

      {nova ? (
        <Card titulo="Nova coleção">
          <Formulario cadeiras={cadeiras} vendidos={0} />
        </Card>
      ) : null}
    </div>
  );
}

function Formulario({ c, cadeiras, vendidos }: { c?: Colecao; cadeiras: { id: string; nome: string; imagemUrl?: string }[]; vendidos: number }) {
  return (
    <AdminForm action={salvarColecaoAction} className={`space-y-5 ${c ? "mt-6 border-t border-line/70 pt-6" : ""}`}>
      {c ? <input type="hidden" name="id" value={c.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <Field label="Nome da coleção">
          <input name="nome" required maxLength={60} defaultValue={c?.nome ?? ""} placeholder="Coleção Verão 2027" className={inputClass} />
        </Field>
        <Field label="Quantas cadeiras" dica={vendidos ? `Já vendeu ${vendidos}.` : "No total da edição."}>
          <input name="total" type="number" min={Math.max(1, vendidos)} max={1000} required defaultValue={c?.total ?? 40} className={inputClass} />
        </Field>
      </div>
      <Field label="Texto da coleção" dica="Aparece no topo da página da coleção. Linha em branco = novo parágrafo.">
        <textarea
          name="descricao"
          rows={4}
          maxLength={1500}
          defaultValue={c?.descricao ?? ""}
          placeholder="Cores do pôr do sol no Espírito Santo, trançadas uma a uma. Quando acabarem, essa edição não volta."
          className={inputClass}
        />
      </Field>
      <fieldset>
        <legend className="text-sm font-medium text-ink">Cadeiras da coleção</legend>
        <p className="text-xs text-ink-soft">Enquanto a coleção não abre ou depois que esgota, essas cadeiras mostram &ldquo;lista de espera&rdquo; no lugar do Comprar.</p>
        <div className="mt-2 grid max-h-80 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-line/70 p-2 sm:grid-cols-3 lg:grid-cols-4">
          {cadeiras.map((m) => (
            <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 text-sm text-ink has-[:checked]:bg-verde/10 has-[:checked]:ring-1 has-[:checked]:ring-verde">
              <input type="checkbox" name="modelos" value={m.nome} defaultChecked={c?.modelos.includes(m.nome)} className="h-4 w-4 shrink-0 accent-[var(--wood)]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.imagemUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
              <span className="min-w-0 truncate">{m.nome}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Situação">
          <select name="estado" defaultValue={c?.estado ?? "espera"} className={inputClass}>
            <option value="rascunho">Rascunho: ainda não aparece no site</option>
            <option value="espera">Lista de espera: aparece, mas ainda não vende</option>
            <option value="aberta">À venda (a partir da data ao lado, se tiver)</option>
            <option value="encerrada">Encerrada: as cadeiras voltam ao normal</option>
          </select>
        </Field>
        <Field label="Abre para venda em (opcional)" dica="Só vale com “À venda”. Até lá o site mostra a contagem regressiva e a lista de espera; na hora, abre sozinha.">
          <input name="abreEm" type="datetime-local" defaultValue={paraCampo(c?.abreEm)} className={inputClass} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SaveButton>{c ? "Salvar coleção" : "Criar coleção"}</SaveButton>
        {c ? (
          <Link href="/admin/colecoes" className="text-sm text-ink-soft underline">
            Fechar
          </Link>
        ) : null}
      </div>
    </AdminForm>
  );
}

function AvisarEspera({ c, espera, gmail }: { c: Colecao; espera: number; gmail: boolean }) {
  return (
    <div className="mt-6 border-t border-line/70 pt-6">
      <h3 className="font-serif text-lg font-medium text-ink">Avisar a lista de espera</h3>
      <p className="text-sm text-ink-soft">
        {espera} {espera === 1 ? "pessoa espera" : "pessoas esperam"}. Cada uma recebe o e-mail com o nome dela e o link para sair da lista.
      </p>
      {!gmail ? <p className="mt-2 rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay-dark">Ligue o e-mail (Gmail) em Avisos e envio primeiro.</p> : null}
      <AdminForm action={mandarCampanhaAction} className="mt-3 space-y-3">
        <input type="hidden" name="colecao" value={c.id} />
        <input type="hidden" name="botaoLink" value={`${SITE_URL}/colecao/${c.id}`} />
        <Field label="Assunto">
          <input name="assunto" required maxLength={120} defaultValue={`{nome}, a ${c.nome} abriu!`} className={inputClass} />
        </Field>
        <Field label="Texto">
          <textarea
            name="texto"
            required
            rows={5}
            maxLength={5000}
            defaultValue={`Oi, {nome}!\n\nVocê pediu para avisar e chegou a hora: a ${c.nome} está à venda. São só ${c.total} cadeiras, cada uma com o seu número e o passaporte com a história dela.\n\nQuando acabarem, essa edição não volta.`}
            className={inputClass}
          />
        </Field>
        <input type="hidden" name="botaoTexto" value="Escolher a minha" />
        <fieldset className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="para" value="teste" defaultChecked className="h-4 w-4 accent-[var(--wood)]" />
            Teste para o meu e-mail
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="para" value="todos" className="h-4 w-4 accent-[var(--wood)]" />
            Mandar para as {espera} {espera === 1 ? "pessoa" : "pessoas"}
          </label>
        </fieldset>
        <SaveButton>Mandar</SaveButton>
      </AdminForm>
    </div>
  );
}
