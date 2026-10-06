import QRCode from "qrcode";
import { estadoAvisos } from "@/lib/avisos";
import { lerRemetente, remetenteDaConta, type Remetente } from "@/lib/melhor-envio";
import { redisAtivo } from "@/lib/redis";
import { desligarGmailAction, desligarNtfyAction, ligarNtfyAction, salvarGmailAction, salvarRemetenteAction, testarAvisosAction } from "../../actions";
import { AdminForm, btnPrimary, btnSecondary, Card, Field, inputClass, SaveButton } from "../../_ui";
import { CopiarNumeros } from "../clientes/copiar";

// "Avisos e envio" (2026-10-06): sale alerts (phone push via ntfy, e-mail via
// Gmail) and the sender data used on Melhor Envio labels.

export default async function Avisos() {
  if (!redisAtivo()) {
    return <Card titulo="Avisos e envio"><p className="text-sm text-ink-soft">O banco do painel não está ligado.</p></Card>;
  }
  const [estado, salvo] = await Promise.all([estadoAvisos(), lerRemetente()]);
  const remetente: Partial<Remetente> = salvo ?? (await remetenteDaConta());
  const linkApp = estado.ntfy ? `ntfy://ntfy.sh/${estado.ntfy}` : "";
  const qr = estado.ntfy
    ? await QRCode.toString(`https://ntfy.sh/${estado.ntfy}`, { type: "svg", margin: 1, color: { dark: "#241f1a", light: "#fffefb" } })
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Avisos e envio</h1>
        <p className="mt-2 max-w-prose text-ink-soft">Receba um aviso na hora de cada venda e deixe pronto quem envia as cadeiras, para gerar as etiquetas.</p>
      </div>

      <Card
        titulo="Aviso de venda no celular"
        descricao="Grátis, pelo app ntfy (não precisa criar conta). Toda venda paga apita no seu celular, com o valor e a cidade."
        acao={estado.ntfy ? <span className="rounded-full bg-verde px-3 py-1 text-xs font-semibold text-paper">Ligado</span> : null}
      >
        {estado.ntfy ? (
          <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
            <div className="w-40 rounded-xl bg-paper p-2 ring-1 ring-line" dangerouslySetInnerHTML={{ __html: qr }} />
            <ol className="list-decimal space-y-2 pl-5 text-sm text-ink">
              <li>
                Instale o app <strong>ntfy</strong> no celular (
                <a href="https://play.google.com/store/apps/details?id=io.heckel.ntfy" target="_blank" rel="noreferrer" className="underline">Android</a> ou{" "}
                <a href="https://apps.apple.com/app/ntfy/id1625396347" target="_blank" rel="noreferrer" className="underline">iPhone</a>).
              </li>
              <li>
                No celular, toque em{" "}
                <a href={linkApp} className="font-semibold text-wood-dark underline">
                  abrir no app ntfy
                </a>{" "}
                (ou no app toque em <strong>+</strong> e cole o nome do canal abaixo).
              </li>
              <li>Clique em &ldquo;Mandar aviso de teste&rdquo; aqui embaixo para conferir.</li>
              <li className="list-none pt-1">
                <span className="text-ink-soft">Nome do canal (segredo, não espalhe):</span>
                <span className="mt-1 flex flex-wrap items-center gap-2">
                  <code className="rounded bg-canvas px-2 py-1 text-xs">{estado.ntfy}</code>
                  <CopiarNumeros numeros={[]} texto={estado.ntfy} rotulo="Copiar" />
                </span>
              </li>
            </ol>
          </div>
        ) : (
          <AdminForm action={ligarNtfyAction}>
            <SaveButton className={btnPrimary}>Ligar aviso no celular</SaveButton>
          </AdminForm>
        )}
        {estado.ntfy ? (
          <AdminForm action={desligarNtfyAction} className="mt-4">
            <SaveButton className="rounded-full px-3 py-1.5 text-sm font-medium text-clay hover:bg-clay/10">Desligar e trocar o canal</SaveButton>
          </AdminForm>
        ) : null}
      </Card>

      <Card
        titulo="Aviso de venda por e-mail"
        descricao="O site manda um e-mail do seu Gmail para ele mesmo, com tudo do pedido (itens, endereço e WhatsApp do cliente)."
        acao={estado.email ? <span className="rounded-full bg-verde px-3 py-1 text-xs font-semibold text-paper">Ligado: {estado.email}</span> : null}
      >
        <ol className="mb-5 list-decimal space-y-1 pl-5 text-sm text-ink">
          <li>Ative a verificação em duas etapas da conta Google (se ainda não estiver).</li>
          <li>
            Abra{" "}
            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="font-semibold text-wood-dark underline">
              Senhas de app do Google
            </a>
            , crie uma com o nome &ldquo;Site SentArte&rdquo; e copie as 16 letras.
          </li>
          <li>Cole aqui embaixo e salve. Essa senha só serve para mandar e-mail e pode ser apagada no Google quando quiser.</li>
        </ol>
        <AdminForm action={salvarGmailAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Gmail">
            <input name="email" type="email" defaultValue={estado.email ?? "ateliesentarte@gmail.com"} className={inputClass} />
          </Field>
          <Field label="Senha de app (16 letras)" dica={estado.email ? "Já está salva. Só preencha para trocar." : undefined}>
            <input name="senha" type="password" autoComplete="off" className={inputClass} placeholder="abcd efgh ijkl mnop" />
          </Field>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <SaveButton>Salvar e-mail</SaveButton>
          </div>
        </AdminForm>
        {estado.email ? (
          <AdminForm action={desligarGmailAction} className="mt-3">
            <SaveButton className="rounded-full px-3 py-1.5 text-sm font-medium text-clay hover:bg-clay/10">Desligar aviso por e-mail</SaveButton>
          </AdminForm>
        ) : null}
      </Card>

      {estado.ntfy || estado.email ? (
        <AdminForm action={testarAvisosAction}>
          <SaveButton className={btnSecondary}>Mandar aviso de teste</SaveButton>
        </AdminForm>
      ) : null}

      <Card
        titulo="Quem envia (remetente das etiquetas)"
        descricao="Vai impresso nas etiquetas do Melhor Envio. Use os mesmos dados da sua conta no Melhor Envio."
      >
        <AdminForm action={salvarRemetenteAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo">
            <input name="nome" defaultValue={remetente.nome ?? ""} className={inputClass} />
          </Field>
          <Field label="CPF">
            <input name="cpf" defaultValue={remetente.cpf ?? ""} inputMode="numeric" className={inputClass} />
          </Field>
          <Field label="Telefone">
            <input name="telefone" defaultValue={remetente.telefone ?? ""} inputMode="tel" className={inputClass} />
          </Field>
          <Field label="E-mail">
            <input name="email" type="email" defaultValue={remetente.email ?? ""} className={inputClass} />
          </Field>
          <Field label="CEP">
            <input name="cep" defaultValue={remetente.cep ?? ""} inputMode="numeric" className={inputClass} />
          </Field>
          <Field label="Rua / avenida">
            <input name="endereco" defaultValue={remetente.endereco ?? ""} className={inputClass} />
          </Field>
          <Field label="Número">
            <input name="numero" defaultValue={remetente.numero ?? ""} className={inputClass} />
          </Field>
          <Field label="Complemento (opcional)">
            <input name="complemento" defaultValue={remetente.complemento ?? ""} className={inputClass} />
          </Field>
          <Field label="Bairro">
            <input name="bairro" defaultValue={remetente.bairro ?? ""} className={inputClass} />
          </Field>
          <Field label="Cidade">
            <input name="cidade" defaultValue={remetente.cidade ?? ""} className={inputClass} />
          </Field>
          <Field label="UF">
            <input name="uf" defaultValue={remetente.uf ?? ""} maxLength={2} className={`${inputClass} uppercase`} />
          </Field>
          <div className="flex items-end">
            <SaveButton>Salvar remetente</SaveButton>
          </div>
        </AdminForm>
      </Card>
    </div>
  );
}
