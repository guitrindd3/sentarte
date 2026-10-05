"use client";

import { useState, useTransition, type ReactNode } from "react";
import { confirmarDoisFatoresAction, iniciarDoisFatoresAction } from "../../actions";
import { avisar, btnPrimary, btnSecondary, inputClass } from "../../_ui";

type Dados = Awaited<ReturnType<typeof iniciarDoisFatoresAction>>;

/**
 * Turn-on flow: QR code → first code → recovery codes (shown once). Rendered
 * in both states (`children` = the "it's on" panel) so the recovery codes
 * survive the page refresh that confirming triggers (new session cookie).
 */
export function AtivarDoisFatores({ ativo, children }: { ativo: boolean; children: ReactNode }) {
  const [dados, setDados] = useState<Dados | null>(null);
  const [reservas, setReservas] = useState<string[] | null>(null);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, iniciar] = useTransition();

  if (reservas) {
    return (
      <div className="rounded-xl border-2 border-verde/40 bg-verde/5 p-5">
        <p className="font-semibold text-verde-escuro">✓ Código no celular ativado!</p>
        <p className="mt-2 text-sm text-ink">
          Estes são os seus <strong>códigos reserva</strong>. Cada um funciona <strong>uma vez só</strong>, no lugar do código do app, se você perder ou trocar de
          celular. <strong>Tire um print ou anote num papel agora</strong> e guarde num lugar seguro. Eles não aparecem de novo.
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {reservas.map((r) => (
            <li key={r} className="rounded-lg bg-paper px-3 py-2 text-center font-mono text-sm font-semibold tracking-wider text-ink ring-1 ring-line">
              {r}
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => { setReservas(null); setDados(null); }} className={`${btnPrimary} mt-5`}>
          Já guardei os códigos
        </button>
      </div>
    );
  }

  // Already on: the "it's on" panel, plus re-pairing the phone (new QR code) —
  // user 2026-10-05 preferred codes from the app over recovery codes.
  if (ativo && !dados) {
    return (
      <div className="space-y-5">
        {children}
        <div className="rounded-xl border border-line/70 bg-canvas/60 p-4">
          <p className="text-sm font-semibold text-ink">O app do celular não está mostrando o código do SentArte?</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Escaneie um QR code novo no Google Authenticator. O código antigo para de valer e você ganha 8 códigos reserva novos.
          </p>
          <button
            type="button"
            disabled={pendente}
            className={`${btnSecondary} mt-3`}
            onClick={() =>
              iniciar(async () => {
                try {
                  setDados(await iniciarDoisFatoresAction());
                } catch {
                  avisar("erro", "Não deu para começar agora. Tente de novo.");
                }
              })
            }
          >
            {pendente ? "Preparando…" : "Escanear de novo no celular"}
          </button>
        </div>
      </div>
    );
  }

  if (!dados) {
    return (
      <button
        type="button"
        disabled={pendente}
        className={btnPrimary}
        onClick={() =>
          iniciar(async () => {
            try {
              setDados(await iniciarDoisFatoresAction());
            } catch {
              avisar("erro", "Não deu para começar agora. Tente de novo.");
            }
          })
        }
      >
        {pendente ? "Preparando…" : "Ativar código no celular"}
      </button>
    );
  }

  return (
    <div className="space-y-5">
      <ol className="space-y-5">
        <li>
          <p className="font-semibold text-ink">1. Instale um app autenticador no celular</p>
          <p className="mt-1 text-sm text-ink-soft">Google Authenticator ou Microsoft Authenticator (grátis na Play Store e na App Store).</p>
        </li>
        <li>
          <p className="font-semibold text-ink">2. No app, toque em &ldquo;+&rdquo; e escaneie este QR code</p>
          <div className="mt-3 flex flex-wrap items-start gap-5">
            <div className="w-48 rounded-xl bg-paper p-2 ring-1 ring-line" dangerouslySetInnerHTML={{ __html: dados.qrSvg }} />
            <div className="min-w-0 max-w-xs text-sm text-ink-soft">
              <p>Está no celular e não dá para escanear?</p>
              <a href={dados.otpauth} className="mt-1 inline-block font-semibold text-wood-dark underline">
                Abrir direto no app
              </a>
              <p className="mt-3">Ou digite esta chave no app:</p>
              <p className="mt-1 break-all rounded-lg bg-canvas-deep px-3 py-2 font-mono text-xs text-ink">{dados.segredo.match(/.{1,4}/g)?.join(" ")}</p>
            </div>
          </div>
        </li>
        <li>
          <p className="font-semibold text-ink">3. Digite o código de 6 números que apareceu no app</p>
          <form
            className="mt-2 flex flex-wrap items-center gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setErro("");
              iniciar(async () => {
                const r = await confirmarDoisFatoresAction(codigo);
                if (r.reservas) setReservas(r.reservas);
                else setErro(r.erro ?? "Não deu certo. Tente de novo.");
              });
            }}
          >
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              placeholder="000000"
              required
              className={`w-40 text-center font-mono text-xl tracking-[0.25em] ${inputClass}`}
            />
            <button type="submit" disabled={pendente} className={btnPrimary}>
              {pendente ? "Conferindo…" : "Confirmar e ativar"}
            </button>
            <button type="button" onClick={() => setDados(null)} className={btnSecondary}>
              Cancelar
            </button>
          </form>
          {erro ? <p className="mt-2 text-sm text-clay-dark">{erro}</p> : null}
        </li>
      </ol>
    </div>
  );
}
