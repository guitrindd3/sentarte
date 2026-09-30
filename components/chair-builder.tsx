"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { VIDEO_MONTE_SUA_CADEIRA } from "@/components/cover-link-card";
import { useCart } from "@/lib/cart-context";
import { IMG_H, IMG_W, pintarCadeira, posicaoNoEncosto, type Forma, type NomePosicao } from "@/lib/chair-render";
import { formatBRL, PARCELAS_MAX, precoCadeira, precoPix } from "@/lib/offer";
import { FIOS, type Fio } from "@/lib/palette";
import { whatsappUrl } from "@/lib/urls";

// Step-by-step "Monte a sua trama" builder (2026-09-29). Instead of a drawn
// illustration it starts from the real empty chair frame of the user's
// weaving clip, plays the clip up to the woven frame, and from then on
// repaints that real photo (lib/chair-render.ts) as the customer picks the
// weave shape, the two thread colors and the name.

const FOTO_VAZIA = "/monte/cadeira-vazia.jpg";
const FOTO_TRANCADA = "/monte/cadeira-trancada.jpg";
/** Clip time of the fully woven, still-unnamed frame the photo was taken from. */
const FIM_DA_TRAMA = 1.72;
/** Visible crop of the tall 480x848 frame (just the chair). */
const CORTE_Y0 = 170;
const CORTE_H = 560;

type Grupo = "basicos" | "time" | "boho" | "divertidos";

const GRUPOS: { valor: Grupo; rotulo: string }[] = [
  { valor: "basicos", rotulo: "Básicos" },
  { valor: "time", rotulo: "Estilo time" },
  { valor: "boho", rotulo: "Estilo boho" },
  { valor: "divertidos", rotulo: "Divertidos" },
];

const FORMAS: { valor: Forma; rotulo: string; grupo: Grupo }[] = [
  { valor: "lisa", rotulo: "Lisa", grupo: "basicos" },
  { valor: "listras", rotulo: "Listras", grupo: "basicos" },
  { valor: "faixas", rotulo: "Faixas", grupo: "basicos" },
  { valor: "xadrez", rotulo: "Xadrez", grupo: "basicos" },
  { valor: "bolinhas", rotulo: "Bolinhas", grupo: "basicos" },
  { valor: "moldura", rotulo: "Moldura", grupo: "basicos" },
  { valor: "diagonais", rotulo: "Diagonais", grupo: "basicos" },
  { valor: "quadriculado", rotulo: "Quadriculado", grupo: "basicos" },
  { valor: "meio-a-meio", rotulo: "Meio a meio", grupo: "time" },
  { valor: "faixa-diagonal", rotulo: "Faixa diagonal", grupo: "time" },
  { valor: "faixa-central", rotulo: "Faixa no meio", grupo: "time" },
  { valor: "listras-largas", rotulo: "Listras largas", grupo: "time" },
  { valor: "escudo", rotulo: "Escudo", grupo: "time" },
  { valor: "duas-faixas", rotulo: "Duas faixas", grupo: "time" },
  { valor: "faixa-vertical", rotulo: "Faixa em pé", grupo: "time" },
  { valor: "cruz", rotulo: "Cruz", grupo: "time" },
  { valor: "coroa", rotulo: "Coroa", grupo: "time" },
  { valor: "diamante", rotulo: "Diamante", grupo: "boho" },
  { valor: "ziguezague", rotulo: "Ziguezague", grupo: "boho" },
  { valor: "espiral", rotulo: "Caracol", grupo: "boho" },
  { valor: "sol", rotulo: "Sol", grupo: "boho" },
  { valor: "losangos", rotulo: "Losangos", grupo: "boho" },
  { valor: "setas", rotulo: "Setas", grupo: "boho" },
  { valor: "ondas", rotulo: "Ondas", grupo: "boho" },
  { valor: "triangulos", rotulo: "Triângulos", grupo: "boho" },
  { valor: "totem", rotulo: "Totem", grupo: "boho" },
  { valor: "mandala", rotulo: "Mandala", grupo: "boho" },
  { valor: "escamas", rotulo: "Escamas", grupo: "boho" },
  { valor: "flechas", rotulo: "Flechas", grupo: "boho" },
  { valor: "bandeirinhas", rotulo: "Bandeirinhas", grupo: "boho" },
  { valor: "coracao", rotulo: "Coração", grupo: "divertidos" },
  { valor: "estrela", rotulo: "Estrela", grupo: "divertidos" },
  { valor: "ancora", rotulo: "Âncora", grupo: "divertidos" },
  { valor: "flor", rotulo: "Flor", grupo: "divertidos" },
  { valor: "lua", rotulo: "Lua", grupo: "divertidos" },
  { valor: "sorriso", rotulo: "Sorriso", grupo: "divertidos" },
];


const PASSOS = ["Trançado", "Cores", "Nome", "Pronto"] as const;
const MAX_LINHAS = 2;
const MAX_CHARS = 14;

function carregarFoto(src: string) {
  return new Promise<ImageData>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = IMG_W;
      c.height = IMG_H;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, 0, 0, IMG_W, IMG_H);
      resolve(ctx.getImageData(0, 0, IMG_W, IMG_H));
    };
    img.onerror = reject;
    img.src = src;
  });
}

function desenhar(
  canvas: HTMLCanvasElement | null,
  foto: ImageData,
  op: Parameters<typeof pintarCadeira>[2],
  corte: { y0: number; h: number; x0?: number; w?: number }
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const saida = new ImageData(IMG_W, IMG_H);
  pintarCadeira(foto, saida, op);
  ctx.putImageData(saida, -(corte.x0 ?? 0), -corte.y0);
}

export function ChairBuilder({ whatsappNumero }: { whatsappNumero: string }) {
  const [passo, setPasso] = useState(0); // 0 = not started yet
  const [animando, setAnimando] = useState(false);
  const [foto, setFoto] = useState<ImageData | null>(null);
  const [forma, setForma] = useState<Forma>("lisa");
  const [grupo, setGrupo] = useState<Grupo>("basicos");
  const [fioA, setFioA] = useState<Fio>(FIOS[0]);
  const [fioB, setFioB] = useState<Fio>(FIOS[1]);
  const [nome, setNome] = useState("");
  const [posicao, setPosicao] = useState<NomePosicao>({ x: 0.5, y: 0.5 });
  const [arrastando, setArrastando] = useState(false);
  const [tamanhoNome, setTamanhoNome] = useState(1);
  const [adicionado, setAdicionado] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const miniaturasRef = useRef<(HTMLCanvasElement | null)[]>([]);
  const { addItem, openCart } = useCart();

  useEffect(() => {
    carregarFoto(FOTO_TRANCADA).then(setFoto).catch(() => setFoto(null));
  }, []);

  const opcoes = { forma, corA: fioA.cor, corB: fioB.cor, nome, posicao, tamanhoNome };

  // Main preview.
  useEffect(() => {
    if (!foto || passo === 0) return;
    desenhar(canvasRef.current, foto, { forma, corA: fioA.cor, corB: fioB.cor, nome, posicao, tamanhoNome }, {
      y0: CORTE_Y0,
      h: CORTE_H,
    });
  }, [foto, passo, forma, fioA, fioB, nome, posicao, tamanhoNome]);

  // Shape thumbnails (just the backrest), in the chosen colors.
  useEffect(() => {
    if (!foto || passo > 1) return;
    FORMAS.forEach((f, i) =>
      f.grupo !== grupo ? null : desenhar(miniaturasRef.current[i], foto, { forma: f.valor, corA: fioA.cor, corB: fioB.cor, nome: "", posicao }, {
        x0: 143,
        y0: 245,
        w: 181,
        h: 267,
      })
    );
  }, [foto, passo, fioA, fioB, posicao, grupo]);

  const fimTimer = useRef<number | undefined>(undefined);
  const terminarAnimacao = useCallback(() => {
    window.clearTimeout(fimTimer.current);
    videoRef.current?.pause();
    setAnimando(false);
    setPasso((p) => (p === 0 ? 1 : p));
  }, []);
  useEffect(() => () => window.clearTimeout(fimTimer.current), []);

  const comecar = useCallback(() => {
    const v = videoRef.current;
    if (!v) return terminarAnimacao();
    setAnimando(true);
    v.currentTime = 0;
    v.play().catch(terminarAnimacao);
    // Safety net: if the clip stalls (slow network, a backgrounded tab),
    // go to step 1 anyway shortly after it should have finished.
    fimTimer.current = window.setTimeout(terminarAnimacao, (FIM_DA_TRAMA + 1.3) * 1000);
  }, [terminarAnimacao]);

  const aoAvancarVideo = () => {
    const v = videoRef.current;
    if (animando && v && v.currentTime >= FIM_DA_TRAMA) terminarAnimacao();
  };

  // Name step: press/drag on the chair to move the name.
  const podeArrastar = passo === 3 && Boolean(nome.trim());
  const moverNome = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const escala = IMG_W / r.width;
    setPosicao(posicaoNoEncosto((e.clientX - r.left) * escala, (e.clientY - r.top) * escala + CORTE_Y0));
  };

  const recomecar = () => {
    setPasso(0);
    setAdicionado(false);
  };

  const handleNome = (valor: string) =>
    setNome(
      valor
        .split("\n")
        .slice(0, MAX_LINHAS)
        .map((l) => l.slice(0, MAX_CHARS))
        .join("\n")
    );

  const nomeLimpo = nome.trim().toUpperCase();
  const temNome = Boolean(nomeLimpo);
  const preco = precoCadeira(temNome);
  const formaRotulo = FORMAS.find((f) => f.valor === forma)?.rotulo ?? "Lisa";
  const tamanhoRotulo = tamanhoNome <= 0.45 ? "Pequeno" : tamanhoNome <= 0.75 ? "Médio" : "Grande";
  const posicaoRotulo = posicao.y < 0.34 ? "Em cima" : posicao.y > 0.66 ? "Embaixo" : "No meio";

  const mensagem = [
    "Oi! Montei a minha cadeira no site e quero pedir:",
    "",
    `Trançado: ${formaRotulo}`,
    `Cor principal: ${fioA.nome}`,
    `Cor dos detalhes: ${fioB.nome}`,
    temNome
      ? `Nome: "${nomeLimpo.replace(/\n/g, " / ")}" (${posicaoRotulo.toLowerCase()}, tamanho ${tamanhoRotulo.toLowerCase()})`
      : "Sem nome",
    `Valor: ${formatBRL(preco)}`,
  ].join("\n");

  const salvarImagem = () => {
    if (!foto) return;
    const c = document.createElement("canvas");
    c.width = IMG_W;
    c.height = CORTE_H;
    desenhar(c, foto, opcoes, { y0: CORTE_Y0, h: CORTE_H });
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "minha-cadeira-sentarte.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  const adicionarAoCarrinho = () => {
    addItem({
      id: `cadeiras:monte:${forma}:${fioA.nome}:${fioB.nome}:${nomeLimpo}:${posicao.x.toFixed(2)},${posicao.y.toFixed(2)}`,
      categoriaSlug: "cadeiras",
      categoriaTitulo: "Cadeiras de praia",
      modeloId: "monte-a-sua-trama",
      modeloNome: `Monte a sua trama: ${formaRotulo}, ${fioA.nome.toLowerCase()} e ${fioB.nome.toLowerCase()}`,
      corA: fioA.cor,
      corB: fioB.cor,
      nomePersonalizado: nomeLimpo ? nomeLimpo.replace(/\n/g, " / ") : undefined,
    });
    setAdicionado(true);
    openCart();
  };

  return (
    <div className="grid gap-8 border border-line bg-paper p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:p-8">
      {/* The chair */}
      <div className="relative mx-auto w-full max-w-md overflow-hidden border border-line bg-canvas">
        <div className="relative aspect-[480/560]">
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed local frame, same crop as the canvas */}
          <img
            src={FOTO_VAZIA}
            alt="Estrutura da cadeira de praia, ainda sem trançado"
            className={`absolute inset-0 h-full w-full object-cover object-[50%_59%] transition-opacity duration-500 ${
              passo === 0 && !animando ? "opacity-100" : "opacity-0"
            }`}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- fallback under the canvas until the first repaint lands */}
          <img
            src={FOTO_TRANCADA}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-cover object-[50%_59%] ${
              passo > 0 && !animando ? "opacity-100" : "opacity-0"
            }`}
          />
          <video
            ref={videoRef}
            src={VIDEO_MONTE_SUA_CADEIRA}
            muted
            playsInline
            preload="auto"
            onTimeUpdate={aoAvancarVideo}
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-cover object-[50%_59%] ${
              animando ? "opacity-100" : "opacity-0"
            }`}
          />
          <canvas
            ref={canvasRef}
            width={IMG_W}
            height={CORTE_H}
            role="img"
            onPointerDown={(e) => {
              if (!podeArrastar) return;
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // capture is a nicety (keeps the drag when leaving the canvas)
              }
              setArrastando(true);
              moverNome(e);
            }}
            onPointerMove={(e) => {
              if (arrastando) moverNome(e);
            }}
            onPointerUp={() => setArrastando(false)}
            onPointerCancel={() => setArrastando(false)}
            aria-label={`Prévia da cadeira: trançado ${formaRotulo.toLowerCase()}, ${fioA.nome} e ${fioB.nome}${
              temNome ? `, com o nome ${nomeLimpo}` : ""
            }`}
            className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
              passo > 0 && !animando ? "opacity-100" : "opacity-0"
            } ${podeArrastar ? (arrastando ? "cursor-grabbing touch-none" : "cursor-grab touch-none") : ""}`}
          />
          {podeArrastar && !arrastando ? (
            <p className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit bg-ink/80 px-3 py-1 text-xs text-canvas">
              Arraste para mover o nome
            </p>
          ) : null}

          {passo === 0 && !animando ? (
            <div className="absolute inset-x-4 bottom-4 border border-line bg-paper/95 p-5 text-center backdrop-blur">
              <p className="font-serif text-xl font-medium tracking-tight text-ink">Vamos montar a sua cadeira?</p>
              <p className="mt-1 text-sm text-ink-soft">São 3 passos: trançado, cores e nome.</p>
              <button
                type="button"
                onClick={comecar}
                disabled={!foto}
                className="mt-4 border border-ink bg-ink px-6 py-3 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink disabled:opacity-50"
              >
                Começar a montar
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* The steps */}
      <div className="flex flex-col">
        <ol className="flex flex-wrap gap-2" aria-label="Passos">
          {PASSOS.map((rotulo, i) => {
            const n = i + 1;
            const ativo = passo === n;
            const feito = passo > n;
            return (
              <li key={rotulo}>
                <button
                  type="button"
                  disabled={passo === 0 || animando}
                  onClick={() => setPasso(n)}
                  aria-current={ativo ? "step" : undefined}
                  className={`inline-flex items-center gap-2 border px-3 py-1.5 text-sm transition-colors disabled:opacity-40 ${
                    ativo ? "border-ink bg-ink text-canvas" : "border-line text-ink-soft hover:border-ink hover:text-ink"
                  }`}
                >
                  <span className="font-serif font-medium">{feito ? <CheckIcon className="h-3.5 w-3.5" /> : n}</span>
                  {rotulo}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 flex-1">
          {passo <= 1 ? (
            <fieldset disabled={passo === 0}>
              <legend className="font-serif text-2xl font-medium tracking-tight text-ink">Escolha o trançado</legend>
              <p className="mt-1 text-sm text-ink-soft">É o desenho que aparece no encosto.</p>
              <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Estilos">
                {GRUPOS.map((g) => (
                  <button
                    key={g.valor}
                    type="button"
                    role="tab"
                    aria-selected={grupo === g.valor}
                    onClick={() => setGrupo(g.valor)}
                    className={`border-b-2 px-1 pb-1 text-sm transition-colors ${
                      grupo === g.valor ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
                    }`}
                  >
                    {g.rotulo}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {FORMAS.map((f, i) => f.grupo !== grupo ? null : (
                  <button
                    key={f.valor}
                    type="button"
                    onClick={() => setForma(f.valor)}
                    aria-pressed={forma === f.valor}
                    className={`flex flex-col items-center gap-1.5 border p-1.5 text-xs transition-colors ${
                      forma === f.valor ? "border-ink text-ink" : "border-line text-ink-soft hover:border-ink"
                    }`}
                  >
                    <canvas
                      ref={(el) => {
                        miniaturasRef.current[i] = el;
                      }}
                      width={181}
                      height={267}
                      className="aspect-[181/267] w-full bg-canvas"
                    />
                    {f.rotulo}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {passo === 2 ? (
            <div className="space-y-7">
              <div>
                <p className="font-serif text-2xl font-medium tracking-tight text-ink">Escolha as cores</p>
                <p className="mt-1 text-sm text-ink-soft">A cor principal cobre quase toda a cadeira; a dos detalhes faz o desenho, as laterais e as faixas do assento.</p>
              </div>
              {[
                { rotulo: "Cor principal", fio: fioA, set: setFioA },
                { rotulo: "Cor dos detalhes", fio: fioB, set: setFioB },
              ].map(({ rotulo, fio, set }) => (
                <fieldset key={rotulo}>
                  <legend className="text-sm text-ink">
                    {rotulo}: <span className="text-ink-soft">{fio.nome}</span>
                  </legend>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {FIOS.map((f) => (
                      <button
                        key={f.nome}
                        type="button"
                        aria-label={f.nome}
                        title={f.nome}
                        aria-pressed={fio.nome === f.nome}
                        onClick={() => set(f)}
                        className={`h-9 w-9 rounded-full transition-shadow ${
                          fio.nome === f.nome
                            ? "ring-2 ring-ink ring-offset-2 ring-offset-paper"
                            : "ring-1 ring-line ring-offset-2 ring-offset-paper hover:ring-ink"
                        }`}
                        style={{ background: f.cor }}
                      />
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          ) : null}

          {passo === 3 ? (
            <div className="space-y-6">
              <div>
                <p className="font-serif text-2xl font-medium tracking-tight text-ink">Quer um nome?</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Opcional. Até {MAX_LINHAS} linhas com {MAX_CHARS} letras cada. Com nome, a cadeira sai por{" "}
                  {formatBRL(precoCadeira(true))}.
                </p>
              </div>
              <label className="block">
                <span className="text-sm text-ink">Nome ou frase</span>
                <textarea
                  value={nome}
                  onChange={(e) => handleNome(e.target.value)}
                  rows={2}
                  placeholder={"Ex: JU\nTRINDADE"}
                  className="mt-2 w-full resize-none border border-line bg-canvas px-3 py-2 text-base uppercase tracking-wide text-ink focus:border-ink focus:outline-none"
                />
              </label>
              {temNome ? (
                <label className="block">
                  <span className="flex justify-between text-sm text-ink">
                    Tamanho do nome
                    <span className="text-ink-soft">{tamanhoRotulo}</span>
                  </span>
                  <input
                    type="range"
                    min={0.3}
                    max={1}
                    step={0.05}
                    value={tamanhoNome}
                    onChange={(e) => setTamanhoNome(Number(e.target.value))}
                    className="mt-2 w-full accent-ink"
                  />
                  <span className="flex justify-between text-xs text-ink-soft">
                    <span>Menor</span>
                    <span>Maior</span>
                  </span>
                </label>
              ) : null}
              {temNome ? (
                <p className="border border-dashed border-line px-3 py-2 text-sm text-ink-soft">
                  Arraste o nome na cadeira para escolher onde ele fica.
                </p>
              ) : null}
            </div>
          ) : null}

          {passo === 4 ? (
            <div>
              <p className="font-serif text-2xl font-medium tracking-tight text-ink">Sua cadeira está pronta</p>
              <dl className="mt-4 divide-y divide-line border-y border-line text-sm">
                {[
                  ["Trançado", formaRotulo],
                  ["Cor principal", fioA.nome],
                  ["Cor dos detalhes", fioB.nome],
                  ["Nome", temNome ? nomeLimpo.replace(/\n/g, " / ") : "Sem nome"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2">
                    <dt className="text-ink-soft">{k}</dt>
                    <dd className="text-right text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-sm text-ink">
                <span className="font-serif text-3xl font-medium tracking-tight">{formatBRL(preco)}</span>
                <span className="text-ink-soft"> ou até {PARCELAS_MAX}x no cartão</span>
                <span className="block text-xs text-ink-soft">
                  {formatBRL(precoPix(preco))} no Pix. Frete grátis para todo o Brasil.
                </span>
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={whatsappUrl(whatsappNumero, mensagem)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-ink bg-ink px-6 py-3 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Pedir pelo WhatsApp
                </a>
                <button
                  type="button"
                  onClick={adicionarAoCarrinho}
                  className="inline-flex items-center justify-center gap-2 border border-ink px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-canvas"
                >
                  {adicionado ? <CheckIcon className="h-4 w-4" /> : null}
                  {adicionado ? "Adicionada ao carrinho" : "Adicionar ao carrinho"}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                <button type="button" onClick={salvarImagem} className="text-ink underline hover:text-ink-soft">
                  Salvar a imagem da minha cadeira
                </button>
                <button type="button" onClick={recomecar} className="text-ink-soft underline hover:text-ink">
                  Montar outra
                </button>
              </div>
              <p className="mt-4 text-xs text-ink-soft">
                A imagem é uma prévia. Antes de trançar, a gente confirma tudo com você pelo WhatsApp.
              </p>
            </div>
          ) : null}
        </div>

        {passo > 0 && passo < 4 ? (
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
            <button
              type="button"
              onClick={() => setPasso((p) => Math.max(1, p - 1))}
              disabled={passo === 1}
              className="text-sm text-ink-soft underline transition-colors hover:text-ink disabled:invisible"
            >
              Voltar
            </button>
            <div className="text-right">
              <p className="text-xs text-ink-soft">{temNome ? "Com nome" : "Sem nome"}</p>
              <p className="font-serif text-lg font-medium text-ink">{formatBRL(preco)}</p>
            </div>
            <button
              type="button"
              onClick={() => setPasso((p) => p + 1)}
              className="border border-ink bg-ink px-6 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink"
            >
              {passo === 3 ? "Ver minha cadeira" : "Próximo"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
