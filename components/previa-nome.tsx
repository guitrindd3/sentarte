"use client";

import { useEffect, useRef, useState } from "react";
import {
  GLYPH_H,
  GLYPH_W,
  glyphPixel,
  normalizarTexto,
} from "@/lib/pixel-font";

// "Ver o nome na cadeira antes de comprar" (user 2026-10-20). The product
// photos are real photos at all kinds of angles, so the name isn't painted on
// them: it's drawn as a woven panel in the chair's two colors with the same
// 5x7 letters the builder weaves. A chair published from the admin's builder
// (Modelo.trama) shows the real render with the name instead.

const MARGEM = 3;

function hexParaRgb(h: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
  const n = m ? parseInt(m[1], 16) : 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const tom = ([r, g, b]: number[], f: number) =>
  `rgb(${Math.min(255, Math.round(r * f))},${Math.min(255, Math.round(g * f))},${Math.min(255, Math.round(b * f))})`;
const luz = ([r, g, b]: number[]) => 0.299 * r + 0.587 * g + 0.114 * b;

function desenhar(
  c: HTMLCanvasElement,
  nome: string,
  corA: string,
  corB: string,
  largura: number,
) {
  const texto = normalizarTexto(nome).slice(0, 24) || "NOME";
  const cols = texto.length * (GLYPH_W + 1) - 1 + MARGEM * 2;
  const rows = GLYPH_H + MARGEM * 2;
  const cel = Math.max(3, Math.min(16, Math.floor(largura / cols)));
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = cols * cel * dpr;
  c.height = rows * cel * dpr;
  c.style.width = `${cols * cel}px`;
  c.style.height = `${rows * cel}px`;
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  const a = hexParaRgb(corA);
  let b = hexParaRgb(corB);
  // same colors would hide the letters: fall back to a light or dark detail thread
  if (Math.abs(luz(a) - luz(b)) < 40)
    b = luz(a) > 128 ? [36, 31, 26] : [250, 247, 242];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const gx = x - MARGEM,
        gy = y - MARGEM;
      const letra =
        gy >= 0 &&
        gy < GLYPH_H &&
        gx >= 0 &&
        gx % (GLYPH_W + 1) < GLYPH_W &&
        glyphPixel(
          texto[Math.floor(gx / (GLYPH_W + 1))],
          gx % (GLYPH_W + 1),
          gy,
        );
      const cor = letra ? b : a;
      const px = x * cel,
        py = y * cel;
      g.fillStyle = tom(cor, 0.72);
      g.fillRect(px, py, cel, cel);
      // a strand: the main thread runs up and down, the name's thread across
      const grad = letra
        ? g.createLinearGradient(0, py, 0, py + cel)
        : g.createLinearGradient(px, 0, px + cel, 0);
      grad.addColorStop(0, tom(cor, 0.8));
      grad.addColorStop(0.45, tom(cor, 1.12));
      grad.addColorStop(1, tom(cor, 0.78));
      g.fillStyle = grad;
      if (letra) g.fillRect(px, py + cel * 0.08, cel, cel * 0.84);
      else g.fillRect(px + cel * 0.1, py, cel * 0.8, cel);
    }
  }
}

export function PreviaNome({
  nome,
  corA,
  corB,
  trama,
}: {
  nome: string;
  corA: string;
  corB: string;
  trama?: string;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const [largura, setLargura] = useState(320);
  const limpo = nome.trim();

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) =>
      setLargura(Math.floor(e.contentRect.width)),
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!trama && tela.current)
      desenhar(tela.current, limpo, corA, corB, largura);
  }, [trama, limpo, corA, corB, largura]);

  // the real chair render: wait for the typing to pause before asking for a new picture
  const [nomeImagem, setNomeImagem] = useState(limpo);
  useEffect(() => {
    if (!trama) return;
    const t = setTimeout(() => setNomeImagem(limpo), 500);
    return () => clearTimeout(t);
  }, [trama, limpo]);

  // the wrapper is always there so its width can be measured before the first letter
  return (
    <div ref={caixa} className="max-w-sm" aria-live="polite">
      {limpo ? (
        <figure className="mt-3">
          {trama ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/cadeira?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(trama)), n: nomeImagem.slice(0, 24) })}`}
              alt={`Prévia da cadeira com o nome ${limpo}`}
              className="w-full border border-line bg-canvas object-contain"
            />
          ) : (
            <div className="overflow-hidden border border-line bg-canvas p-2">
              <canvas
                ref={tela}
                role="img"
                aria-label={`Prévia do nome ${limpo} trançado`}
                className="mx-auto block"
              />
            </div>
          )}
          <figcaption className="mt-1.5 text-xs text-ink-soft">
            {trama
              ? "Prévia da sua cadeira com o nome. A posição final a gente confirma com você."
              : "Prévia de como as letras ficam trançadas nas cores da cadeira. A posição e o tamanho no encosto a gente confirma com você."}
          </figcaption>
        </figure>
      ) : null}
    </div>
  );
}
