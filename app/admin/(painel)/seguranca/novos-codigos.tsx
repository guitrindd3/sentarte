"use client";

import { useState, useTransition } from "react";
import { novosCodigosReservaAction } from "../../actions";
import { btnPrimary, btnSecondary, inputClass } from "../../_ui";

/** "Gerar novos códigos reserva": confirm with the app code, show the 8 new codes once. */
export function NovosCodigos() {
  const [aberto, setAberto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [reservas, setReservas] = useState<string[] | null>(null);
  const [pendente, iniciar] = useTransition();

  if (reservas) {
    return (
      <div className="rounded-xl border-2 border-verde/40 bg-verde/5 p-5">
        <p className="font-semibold text-verde-escuro">✓ Códigos reserva novos</p>
        <p className="mt-2 text-sm text-ink">
          Os antigos <strong>pararam de funcionar</strong>. Cada um destes funciona <strong>uma vez só</strong>.{" "}
          <strong>Tire um print ou anote num papel agora</strong>: eles não aparecem de novo.
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {reservas.map((r) => (
            <li key={r} className="rounded-lg bg-paper px-3 py-2 text-center font-mono text-sm font-semibold tracking-wider text-ink ring-1 ring-line">
              {r}
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setReservas(null)} className={`${btnPrimary} mt-5`}>
          Já guardei os códigos
        </button>
      </div>
    );
  }

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className={btnSecondary}>
        Gerar novos códigos reserva
      </button>
    );
  }

  return (
    <form
      className="rounded-xl border border-line/70 bg-canvas/60 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setErro("");
        iniciar(async () => {
          const r = await novosCodigosReservaAction(codigo);
          if (r.reservas) {
            setReservas(r.reservas);
            setAberto(false);
            setCodigo("");
          } else setErro(r.erro ?? "Não deu certo. Tente de novo.");
        });
      }}
    >
      <p className="text-sm font-semibold text-ink">Digite o código que está aparecendo agora no app</p>
      <p className="mt-0.5 text-xs text-ink-soft">Os códigos reserva antigos vão parar de funcionar e você recebe 8 novos.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={12}
          placeholder="000000"
          required
          className={`w-40 text-center font-mono text-xl tracking-[0.25em] ${inputClass}`}
        />
        <button type="submit" disabled={pendente} className={btnPrimary}>
          {pendente ? "Gerando…" : "Gerar códigos"}
        </button>
        <button type="button" onClick={() => setAberto(false)} className="px-3 py-2 text-sm text-ink-soft hover:text-ink">
          Cancelar
        </button>
      </div>
      {erro ? <p className="mt-2 text-sm text-clay-dark">{erro}</p> : null}
    </form>
  );
}
