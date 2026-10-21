"use client";

import { useEffect, useRef, useState } from "react";
import { brilhoDasCelulas, codificarGrade, FOTO_COLS, FOTO_ROWS, gradeDaFoto, limiarAutomatico } from "@/lib/trama-foto";
import { rastrear } from "@/lib/rastro";

/**
 * "Sua foto vira trama" in step 1 of Monte a sua trama (user 2026-10-21):
 * pick a photo, it becomes the backrest pattern right away; a slider moves
 * the dark/light cut and a switch swaps which part takes the detail thread.
 */
export function FotoTrama({
  ativo,
  corA,
  corB,
  onUsar,
}: {
  /** the backrest is showing the photo pattern now */
  ativo: boolean;
  corA: string;
  corB: string;
  onUsar: (grade: string) => void;
}) {
  const [brilho, setBrilho] = useState<Float32Array | null>(null);
  const [auto, setAuto] = useState(128);
  const [ajuste, setAjuste] = useState(0);
  const [inverter, setInverter] = useState(false);
  const [erro, setErro] = useState("");
  const tela = useRef<HTMLCanvasElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);

  const abrir = async (f: File | undefined) => {
    setErro("");
    if (!f) return;
    try {
      const url = URL.createObjectURL(f);
      const img = new Image();
      await new Promise<void>((ok, falhou) => {
        img.onload = () => ok();
        img.onerror = () => falhou(new Error("imagem"));
        img.src = url;
      });
      const b = brilhoDasCelulas(img);
      URL.revokeObjectURL(url);
      setBrilho(b);
      setAuto(limiarAutomatico(b));
      setAjuste(0);
      setInverter(false);
      rastrear({ t: "c", l: "Monte a sua trama: usou uma foto" });
    } catch {
      setErro("Não deu para abrir essa foto. Tente outra (JPG ou PNG).");
    }
  };

  // every change goes straight to the chair
  useEffect(() => {
    if (!brilho) return;
    const grade = gradeDaFoto(brilho, Math.max(1, Math.min(254, auto + ajuste)), inverter);
    onUsar(codificarGrade(grade));
    const c = tela.current;
    if (!c) return;
    const cel = 6;
    c.width = FOTO_COLS * cel;
    c.height = FOTO_ROWS * cel;
    const g = c.getContext("2d")!;
    for (let k = 0; k < grade.length; k++) {
      g.fillStyle = grade[k] ? corB : corA;
      g.fillRect((k % FOTO_COLS) * cel, Math.floor(k / FOTO_COLS) * cel, cel, cel);
    }
    // onUsar changes identity every render of the builder; the grid only depends on these
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brilho, auto, ajuste, inverter, corA, corB]);

  return (
    <div className={`mt-4 border-2 p-4 ${ativo ? "border-verde bg-verde/5" : "border-dashed border-line"}`}>
      <p className="font-semibold text-ink">Sua foto vira trama</p>
      <p className="mt-1 text-sm text-ink-soft">
        O pet, o logo da empresa, um desenho do filho. Funciona melhor com fundo liso e bastante contraste. A foto não sai do seu celular: só o
        desenho em trama vai no pedido.
      </p>
      <input ref={arquivo} id="foto-trama" type="file" accept="image/*" className="sr-only" onChange={(e) => abrir(e.target.files?.[0])} />
      {!brilho ? (
        <button
          type="button"
          onClick={() => arquivo.current?.click()}
          className="mt-3 w-full rounded-full border border-ink px-4 py-3 text-sm font-medium text-ink hover:bg-ink hover:text-canvas"
        >
          Escolher uma foto
        </button>
      ) : (
        <div className="mt-3 flex flex-wrap items-start gap-4">
          <canvas ref={tela} className="h-[120px] w-[120px] border border-line [image-rendering:pixelated]" aria-label="O desenho da foto em trama" role="img" />
          <div className="min-w-[10rem] flex-1 space-y-3 text-sm">
            <label className="block">
              <span className="text-ink-soft">Mais claro ou mais escuro</span>
              <input
                id="foto-trama-ajuste"
                type="range"
                min={-90}
                max={90}
                step={3}
                value={ajuste}
                onChange={(e) => setAjuste(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--ink)]"
              />
            </label>
            <label className="flex items-center gap-2">
              <input id="foto-trama-inverter" type="checkbox" checked={inverter} onChange={(e) => setInverter(e.target.checked)} className="h-4 w-4 accent-[var(--ink)]" />
              <span className="text-ink">Trocar as cores do desenho</span>
            </label>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <button type="button" onClick={() => arquivo.current?.click()} className="py-1 text-ink underline underline-offset-2">
                Trocar a foto
              </button>
              {!ativo ? (
                <button
                  type="button"
                  onClick={() => brilho && onUsar(codificarGrade(gradeDaFoto(brilho, auto + ajuste, inverter)))}
                  className="py-1 text-ink underline underline-offset-2"
                >
                  Usar de novo na cadeira
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
      {erro ? <p className="mt-2 text-sm text-clay">{erro}</p> : null}
      {brilho ? (
        <p className="mt-3 text-xs text-ink-soft">
          Toda foto passa por nós antes de trançar: a gente ajusta os detalhes e confirma o desenho com você no WhatsApp.
        </p>
      ) : null}
    </div>
  );
}
