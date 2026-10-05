"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon, WhatsAppIcon } from "@/components/icons";
import { VIDEO_MONTE_SUA_CADEIRA } from "@/components/cover-link-card";
import { useCart } from "@/lib/cart-context";
import { desenharMiniatura, IMG_H, IMG_W, pintarCadeira, posicaoNoEncosto, type Forma, type NomePosicao } from "@/lib/chair-render";
import { formatBRL, PARCELAS_MAX, precoCadeira, precoPix } from "@/lib/offer";
import { FAMILIAS, FIOS, type Fio } from "@/lib/palette";
import { ROTULOS_EXTRAS } from "@/lib/formas-extras";
import { ROTULOS_EXTRAS_2 } from "@/lib/formas-extras-2";
import { FORMAS_OCULTAS, ROTULOS_EXTRAS_3 } from "@/lib/formas-extras-3";
import { codificarCadeira } from "@/lib/chair-link";
import { SITE_URL } from "@/lib/nav";
import { rastrear } from "@/lib/rastro";
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
const CORTE_Y0 = 150;
const CORTE_H = 560;

type Grupo = "basicos" | "time" | "boho" | "divertidos";

// `curto` is what phones show, so the four tabs fit on one line.
const GRUPOS: { valor: Grupo; rotulo: string; curto: string }[] = [
  { valor: "basicos", rotulo: "Básicos", curto: "Básicos" },
  { valor: "time", rotulo: "Estilo time", curto: "Time" },
  { valor: "boho", rotulo: "Estilo boho", curto: "Boho" },
  { valor: "divertidos", rotulo: "Divertidos", curto: "Divertidos" },
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
  { valor: "pontilhado", rotulo: "Pontilhado", grupo: "basicos" },
  { valor: "faixas-duplas", rotulo: "Faixas duplas", grupo: "basicos" },
  { valor: "listras-finas", rotulo: "Listras finas", grupo: "basicos" },
  { valor: "faixas-largas", rotulo: "Faixas largas", grupo: "basicos" },
  { valor: "xadrez-grande", rotulo: "Xadrez grande", grupo: "basicos" },
  { valor: "xadrez-miudo", rotulo: "Xadrez miúdo", grupo: "basicos" },
  { valor: "bolinhas-grandes", rotulo: "Bolinhas grandes", grupo: "basicos" },
  { valor: "moldura-dupla", rotulo: "Moldura dupla", grupo: "basicos" },
  { valor: "grade-diagonal", rotulo: "Grade diagonal", grupo: "basicos" },
  { valor: "degraus", rotulo: "Degraus", grupo: "basicos" },
  { valor: "cantos", rotulo: "Cantos", grupo: "basicos" },
  { valor: "duas-colunas", rotulo: "Duas colunas", grupo: "basicos" },
  { valor: "meio-a-meio", rotulo: "Meio a meio", grupo: "time" },
  { valor: "faixa-diagonal", rotulo: "Faixa diagonal", grupo: "time" },
  { valor: "faixa-central", rotulo: "Faixa no meio", grupo: "time" },
  { valor: "listras-largas", rotulo: "Listras largas", grupo: "time" },
  { valor: "escudo", rotulo: "Escudo", grupo: "time" },
  { valor: "duas-faixas", rotulo: "Duas faixas", grupo: "time" },
  { valor: "faixa-vertical", rotulo: "Faixa em pé", grupo: "time" },
  { valor: "cruz", rotulo: "Cruz", grupo: "time" },
  { valor: "coroa", rotulo: "Coroa", grupo: "time" },
  { valor: "estrelas", rotulo: "Estrelas", grupo: "time" },
  { valor: "tricolor-vertical", rotulo: "Tricolor em pé", grupo: "time" },
  { valor: "tricolor-horizontal", rotulo: "Tricolor deitado", grupo: "time" },
  { valor: "aros", rotulo: "Aros", grupo: "time" },
  { valor: "faixa-v", rotulo: "Faixa em V", grupo: "time" },
  { valor: "diagonal-invertida", rotulo: "Diagonal invertida", grupo: "time" },
  { valor: "quadrantes", rotulo: "Quadrantes", grupo: "time" },
  { valor: "numero-10", rotulo: "Número 10", grupo: "time" },
  { valor: "bola", rotulo: "Bola", grupo: "time" },
  { valor: "trofeu", rotulo: "Troféu", grupo: "time" },
  { valor: "escudo-estrela", rotulo: "Escudo com estrela", grupo: "time" },
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
  { valor: "triangulo-grande", rotulo: "Triângulo grande", grupo: "boho" },
  { valor: "arco-iris", rotulo: "Arco-íris", grupo: "boho" },
  { valor: "kilim", rotulo: "Kilim", grupo: "boho" },
  { valor: "ziguezague-duplo", rotulo: "Ziguezague duplo", grupo: "boho" },
  { valor: "espinha-de-peixe", rotulo: "Espinha de peixe", grupo: "boho" },
  { valor: "sol-nascente", rotulo: "Sol nascente", grupo: "boho" },
  { valor: "penas", rotulo: "Penas", grupo: "boho" },
  { valor: "coracao", rotulo: "Coração", grupo: "divertidos" },
  { valor: "estrela", rotulo: "Estrela", grupo: "divertidos" },
  { valor: "ancora", rotulo: "Âncora", grupo: "divertidos" },
  { valor: "flor", rotulo: "Flor", grupo: "divertidos" },
  { valor: "lua", rotulo: "Lua", grupo: "divertidos" },
  { valor: "sorriso", rotulo: "Sorriso", grupo: "divertidos" },
  { valor: "peixe", rotulo: "Peixe", grupo: "divertidos" },
  { valor: "oculos", rotulo: "Óculos", grupo: "divertidos" },
  { valor: "borboleta", rotulo: "Borboleta", grupo: "divertidos" },
  { valor: "coqueiro", rotulo: "Coqueiro", grupo: "divertidos" },
  { valor: "abacaxi", rotulo: "Abacaxi", grupo: "divertidos" },
  { valor: "sorvete", rotulo: "Sorvete", grupo: "divertidos" },
  { valor: "pata", rotulo: "Patinha", grupo: "divertidos" },
  { valor: "nota", rotulo: "Nota musical", grupo: "divertidos" },
  { valor: "raio", rotulo: "Raio", grupo: "divertidos" },
  { valor: "guarda-sol", rotulo: "Guarda-sol", grupo: "divertidos" },
  { valor: "concha", rotulo: "Concha", grupo: "divertidos" },
  { valor: "melancia", rotulo: "Melancia", grupo: "divertidos" },
  { valor: "gatinho", rotulo: "Gatinho", grupo: "divertidos" },
  { valor: "cacto", rotulo: "Cacto", grupo: "divertidos" },
  ...ROTULOS_EXTRAS,
  ...ROTULOS_EXTRAS_2,
  ...ROTULOS_EXTRAS_3,
];
/** What the shape grid shows: near-duplicates stay out (they still render for old links). */
const FORMAS_VISIVEIS = FORMAS.filter((f) => !FORMAS_OCULTAS.has(f.valor));
/** Lowercase, no accents — so "coracao" finds "Coração". */
const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const ROTULOS_BUSCA = FORMAS_VISIVEIS.map((f) => semAcento(f.rotulo));


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
  /** Shape search: while it has text, the grid shows matches from every tab. */
  const [busca, setBusca] = useState("");
  // Count what people look for in the shape search, once they stop typing.
  useEffect(() => {
    const q = busca.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => rastrear({ t: "b", q, onde: "trama" }), 1500);
    return () => clearTimeout(t);
  }, [busca]);
  const [grupo, setGrupo] = useState<Grupo>("basicos");
  const [formaAssento, setFormaAssento] = useState<Forma>("lisa");
  const [escalaAssento, setEscalaAssento] = useState(1);
  // Which part the shape grid edits (user 2026-10-02: tabs Encosto / Assento).
  const [parte, setParte] = useState<"encosto" | "assento">("encosto");
  const formaAtiva = parte === "encosto" ? forma : formaAssento;
  const escolherForma = (f: Forma) => (parte === "encosto" ? setForma(f) : setFormaAssento(f));
  const [fioA, setFioA] = useState<Fio>(FIOS[0]);
  const [fioB, setFioB] = useState<Fio>(FIOS[1]);
  // Optional third color: splits the main (vertical) thread down the middle.
  const [tresCores, setTresCores] = useState(false);
  const [fioC, setFioC] = useState<Fio>(FIOS.find((f) => f.nome === "Mostarda") ?? FIOS[2]);
  const corC = tresCores ? fioC.cor : undefined;
  const [nome, setNome] = useState("");
  const [posicao, setPosicao] = useState<NomePosicao>({ x: 0.5, y: 0.5 });
  const [arrastando, setArrastando] = useState(false);
  const [tamanhoNome, setTamanhoNome] = useState(1);
  /** Where the name goes: backrest (default) or the middle of the seat. */
  const [nomeNoAssento, setNomeNoAssento] = useState(false);
  const [tamanhoNomeAssento, setTamanhoNomeAssento] = useState(1);
  const [escalaForma, setEscalaForma] = useState(1);
  const [posForma, setPosForma] = useState<NomePosicao>({ x: 0.5, y: 0.5 });
  const [adicionado, setAdicionado] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const passosRef = useRef<HTMLDivElement>(null);
  const faixaRef = useRef<HTMLDivElement>(null);
  const passoAnterior = useRef(0);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const [cadeiraFora, setCadeiraFora] = useState(false);

  // Phones: when the big chair scrolls out of view, a small live copy fades
  // in at the top so the customer still sees each choice.
  useEffect(() => {
    const el = faixaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setCadeiraFora(!e.isIntersecting && e.boundingClientRect.top < 0),
      { rootMargin: "-80px 0px 0px 0px", threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // On phones the options sit under the pinned chair band: when the step
  // changes and its top is hidden behind header+band, scroll it into view.
  useEffect(() => {
    const antes = passoAnterior.current;
    passoAnterior.current = passo;
    if (antes === 0 || passo === 0) return;
    const el = passosRef.current;
    if (!el || window.matchMedia("(min-width: 768px)").matches) return;
    const topo =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--altura-topo")) || 64;
    const alvo = el.getBoundingClientRect().top + window.scrollY - topo - 8;
    if (el.getBoundingClientRect().top < topo) window.scrollTo({ top: alvo, behavior: "smooth" });
  }, [passo]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const miniaturasRef = useRef<(HTMLCanvasElement | null)[]>([]);
  const { addItem, openCart } = useCart();

  useEffect(() => {
    carregarFoto(FOTO_TRANCADA).then(setFoto).catch(() => setFoto(null));
  }, []);

  const nomeEncosto = nomeNoAssento ? "" : nome;
  const nomeAssento = nomeNoAssento ? nome : "";
  const opcoes = { forma, formaAssento, corA: fioA.cor, corB: fioB.cor, corC, nome: nomeEncosto, nomeAssento, tamanhoNomeAssento, escalaAssento, posicao, tamanhoNome, escalaForma, posForma };

  // Main preview.
  useEffect(() => {
    if (!foto || passo === 0) return;
    desenhar(canvasRef.current, foto, { forma, formaAssento, corA: fioA.cor, corB: fioB.cor, corC, nome: nomeEncosto, nomeAssento, tamanhoNomeAssento, escalaAssento, posicao, tamanhoNome, escalaForma, posForma }, {
      y0: CORTE_Y0,
      h: CORTE_H,
    });
    const mini = miniRef.current;
    if (mini && canvasRef.current) {
      const ctx = mini.getContext("2d");
      ctx?.clearRect(0, 0, mini.width, mini.height);
      ctx?.drawImage(canvasRef.current, 0, 0, mini.width, mini.height);
    }
  }, [foto, passo, forma, formaAssento, fioA, fioB, corC, nomeEncosto, nomeAssento, tamanhoNomeAssento, escalaAssento, posicao, tamanhoNome, escalaForma, posForma]);

  // Shape thumbnails: flat and straight (just the figure), in the chosen
  // colors — the photo's perspective made them look slanted.
  useEffect(() => {
    if (passo > 1) return;
    const termo = semAcento(busca);
    FORMAS_VISIVEIS.forEach((f, i) => {
      const c = miniaturasRef.current[i];
      const visivel = termo ? ROTULOS_BUSCA[i].includes(termo) : f.grupo === grupo;
      const ctx = visivel ? c?.getContext("2d") : null;
      if (c && ctx) desenharMiniatura(ctx, c.width, c.height, f.valor, fioA.cor, fioB.cor, parte);
    });
  }, [passo, fioA, fioB, grupo, parte, busca]);
  const termoBusca = semAcento(busca);
  const mostrarForma = (i: number) => (termoBusca ? ROTULOS_BUSCA[i].includes(termoBusca) : FORMAS_VISIVEIS[i].grupo === grupo);
  const achadas = termoBusca ? ROTULOS_BUSCA.filter((r) => r.includes(termoBusca)).length : -1;

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
  // Step 1 with a reduced shape: drag moves the shape instead.
  const arrastaForma = passo === 1 && escalaForma < 0.97 && forma !== "meio-a-meio";
  const podeArrastar = arrastaForma || (passo === 3 && !nomeNoAssento && Boolean(nome.trim()));
  const moverNome = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const escala = IMG_W / r.width;
    const p = posicaoNoEncosto((e.clientX - r.left) * escala, (e.clientY - r.top) * escala + CORTE_Y0);
    if (arrastaForma) setPosForma(p);
    else setPosicao(p);
  };

  // The size control next to the chair edits whatever is being worked on:
  // backrest shape / seat figure in step 1, the name in step 3.
  type Controle = { rotulo: string; valor: number; min: number; max: number; set: (v: number) => void };
  const controle: Controle | null =
    passo === 1 && parte === "encosto" && forma !== "lisa" && forma !== "meio-a-meio"
      ? { rotulo: "Tamanho do trançado", valor: escalaForma, min: 0.35, max: 1, set: setEscalaForma }
      : passo === 1 && parte === "assento" && formaAssento !== "lisa" && formaAssento !== "meio-a-meio"
        ? { rotulo: "Tamanho do desenho", valor: escalaAssento, min: 0.4, max: 2, set: setEscalaAssento }
        : passo === 3 && Boolean(nome.trim())
          ? nomeNoAssento
            ? { rotulo: "Tamanho do nome", valor: tamanhoNomeAssento, min: 0.4, max: 2, set: setTamanhoNomeAssento }
            : { rotulo: "Tamanho do nome", valor: tamanhoNome, min: 0.3, max: 1, set: setTamanhoNome }
          : null;
  const ajustar = (delta: number) => {
    if (!controle) return;
    const v = Math.round((controle.valor + delta) * 100) / 100;
    controle.set(Math.max(controle.min, Math.min(controle.max, v)));
  };
  const controleTamanho = (compacto = false) =>
    controle ? (
      <div
        className={`flex items-center gap-2 border border-line bg-paper/95 backdrop-blur ${
          compacto ? "justify-center px-1 py-1" : "px-3 py-2"
        }`}
      >
        {!compacto ? <span className="mr-auto text-xs text-ink-soft">{controle.rotulo}</span> : null}
        <button
          type="button"
          onClick={() => ajustar(-0.1)}
          disabled={controle.valor <= controle.min}
          aria-label={`Diminuir ${controle.rotulo.toLowerCase()}`}
          className={`flex items-center justify-center rounded-full border border-ink font-semibold text-ink disabled:opacity-30 ${
            compacto ? "h-7 w-7 text-base" : "h-9 w-9 text-lg"
          }`}
        >
          −
        </button>
        <span className={`text-center font-medium tabular-nums text-ink ${compacto ? "w-10 text-xs" : "w-12 text-sm"}`}>
          {Math.round(controle.valor * 100)}%
        </span>
        <button
          type="button"
          onClick={() => ajustar(0.1)}
          disabled={controle.valor >= controle.max}
          aria-label={`Aumentar ${controle.rotulo.toLowerCase()}`}
          className={`flex items-center justify-center rounded-full border border-ink font-semibold text-ink disabled:opacity-30 ${
            compacto ? "h-7 w-7 text-base" : "h-9 w-9 text-lg"
          }`}
        >
          +
        </button>
      </div>
    ) : null;

  const recomecar = () => {
    setPasso(0);
    setAdicionado(false);
  };

  const handleNome = (valor: string) => {
    // First letters typed with a reduced shape: start the name on the
    // opposite half of the backrest so the two don't overlap.
    if (!nome.trim() && valor.trim() && escalaForma < 0.97) {
      setPosicao({ x: 0.5, y: posForma.y < 0.5 ? 0.8 : 0.2 });
    }
    setNome(
      valor
        .split("\n")
        .slice(0, MAX_LINHAS)
        .map((l) => l.slice(0, MAX_CHARS))
        .join("\n")
    );
  };

  const nomeLimpo = nome.trim().toUpperCase();
  const temNome = Boolean(nomeLimpo);
  const preco = precoCadeira(temNome);
  const formaRotulo = FORMAS.find((f) => f.valor === forma)?.rotulo ?? "Lisa";
  const tamanhoRotulo = tamanhoNome <= 0.45 ? "Pequeno" : tamanhoNome <= 0.75 ? "Médio" : "Grande";
  const posicaoRotulo = posicao.y < 0.34 ? "Em cima" : posicao.y > 0.66 ? "Embaixo" : "No meio";

  // Link whose WhatsApp preview is the picture of this exact chair (wa.me
  // can't attach images) — see app/c and app/api/cadeira.
  const linkCadeira = `${SITE_URL}/c?${codificarCadeira(opcoes)}`;
  const mensagem = [
    "Oi! Montei a minha cadeira no site e quero pedir:",
    linkCadeira,
    "",
    `Encosto: ${formaRotulo}${escalaForma < 0.97 ? ` (tamanho ${Math.round(escalaForma * 100)}%)` : ""}`,
    tresCores ? `Cor principal: ${fioA.nome} (metade esquerda) e ${fioC.nome} (metade direita)` : `Cor principal: ${fioA.nome}`,
    `Cor dos detalhes: ${fioB.nome}`,
    `Assento: ${
      nomeNoAssento && temNome
        ? "com o nome"
        : formaAssento === "lisa"
          ? "liso"
          : `${FORMAS.find((f) => f.valor === formaAssento)?.rotulo ?? formaAssento}${Math.abs(escalaAssento - 1) > 0.02 ? ` (tamanho ${Math.round(escalaAssento * 100)}%)` : ""}`
    }`,
    temNome
      ? nomeNoAssento
        ? `Nome: "${nomeLimpo.replace(/\n/g, " ")}" (no meio do assento)`
        : `Nome: "${nomeLimpo.replace(/\n/g, " / ")}" (no encosto, ${posicaoRotulo.toLowerCase()}, tamanho ${tamanhoRotulo.toLowerCase()})`
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
      // the whole design is in the link, so two different chairs never merge
      id: `cadeiras:monte:${codificarCadeira(opcoes)}`,
      categoriaSlug: "cadeiras",
      categoriaTitulo: "Cadeiras de praia",
      modeloId: "monte-a-sua-trama",
      modeloNome: `Monte a sua trama: ${formaRotulo}, ${fioA.nome.toLowerCase()}${
        tresCores ? `/${fioC.nome.toLowerCase()}` : ""
      } e ${fioB.nome.toLowerCase()}`,
      // picture of this exact chair (rendered server-side, same as the WhatsApp preview)
      imagemUrl: `/api/cadeira?${codificarCadeira(opcoes)}`,
      corA: fioA.cor,
      corB: fioB.cor,
      nomePersonalizado: nomeLimpo ? nomeLimpo.replace(/\n/g, " / ") : undefined,
    });
    setAdicionado(true);
    openCart();
  };

  return (
    <div className="grid gap-8 border border-line bg-paper p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:p-8">
      {/* The chair — same size before and after the weaving clip (a
          shrinking pinned band felt jumpy on phones, user 2026-09-30). */}
      {/* Desktop: the chair column stays pinned while the options scroll
          (user 2026-10-02) — phones use the floating mini preview instead. */}
      <div ref={faixaRef} className="self-start md:sticky md:top-[calc(var(--altura-topo,4rem)+1rem)]">
      <div className="relative mx-auto w-full max-w-md overflow-hidden border border-line bg-canvas md:max-w-[min(28rem,calc((100vh-var(--altura-topo,4rem)-7.5rem)*0.83))]">
        <div className="relative aspect-[464/560]">
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
              {arrastaForma ? "Arraste para mover o desenho" : "Arraste para mover o nome"}
            </p>
          ) : null}

          {passo === 0 && !animando ? (
            <div className="absolute inset-x-4 bottom-4 border border-line bg-paper/95 p-5 text-center backdrop-blur md:hidden">
              <p className="font-serif text-xl font-medium tracking-tight text-ink">Vamos montar a sua cadeira?</p>
              <p className="mt-1 text-sm text-ink-soft">São 3 passos: trançado, cores e nome.</p>
              <button
                type="button"
                onClick={comecar}
                disabled={!foto}
                className="pulso-verde mt-4 inline-flex items-center gap-2 rounded-full bg-verde px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-verde-escuro disabled:opacity-50"
              >
                Começar a montar
                <ChevronDownIcon className="h-4 w-4 -rotate-90" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

        {passo > 0 && !animando && controle ? (
          <div className="mx-auto mt-3 w-full max-w-md md:max-w-[min(28rem,calc((100vh-var(--altura-topo,4rem)-7.5rem)*0.83))]">
            {controleTamanho()}
          </div>
        ) : null}
      </div>

      {/* Mini preview (shown while the big chair is scrolled away) */}
      <div
        className={`fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] right-3 z-30 w-28 overflow-hidden rounded-md border border-line bg-paper shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-all duration-300 md:hidden ${
          cadeiraFora && passo > 0 && !animando
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => faixaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
          aria-label="Ver a cadeira"
          tabIndex={cadeiraFora && passo > 0 ? 0 : -1}
          className="block w-full p-1"
        >
          <canvas ref={miniRef} width={232} height={280} className="block aspect-[464/560] w-full rounded-sm" />
        </button>
        {controleTamanho(true)}
      </div>

      {/* The steps */}
      <div ref={passosRef} className="flex scroll-mt-4 flex-col">
        {passo === 0 && !animando ? (
          <div className="mb-8 hidden items-center justify-between gap-6 border border-verde/40 bg-verde/5 p-5 md:flex">
            <div>
              <p className="font-serif text-xl font-medium tracking-tight text-ink">Vamos montar a sua cadeira?</p>
              <p className="mt-1 text-sm text-ink-soft">São 3 passos: trançado, cores e nome.</p>
            </div>
            <button
              type="button"
              onClick={comecar}
              disabled={!foto}
              className="pulso-verde inline-flex shrink-0 items-center gap-2 rounded-full bg-verde px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-verde-escuro disabled:opacity-50"
            >
              Começar a montar
              <ChevronDownIcon className="h-4 w-4 -rotate-90" />
            </button>
          </div>
        ) : null}
        <ol className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2" aria-label="Passos">
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
                  className={`inline-flex w-full items-center justify-center gap-1 whitespace-nowrap border px-1 py-1.5 text-[0.8rem] transition-colors disabled:opacity-40 sm:w-auto sm:gap-2 sm:px-3 sm:text-sm ${
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
              <div className="mt-3 grid grid-cols-2 gap-2" role="tablist" aria-label="Parte da cadeira">
                {(["encosto", "assento"] as const).map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    role="tab"
                    aria-selected={parte === pt}
                    onClick={() => setParte(pt)}
                    className={`border-2 px-3 py-2.5 text-left text-sm transition-colors ${
                      parte === pt ? "border-ink bg-ink text-canvas" : "border-line text-ink hover:border-ink"
                    }`}
                  >
                    <span className="block font-semibold">{pt === "encosto" ? "Encosto" : "Assento"}</span>
                    <span className={`block text-xs ${parte === pt ? "text-canvas/80" : "text-ink-soft"}`}>
                      {(pt === "encosto" ? FORMAS.find((f) => f.valor === forma) : FORMAS.find((f) => f.valor === formaAssento))?.rotulo}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-ink-soft">
                {parte === "encosto"
                  ? "É o desenho que aparece no encosto."
                  : "É o desenho do assento, na cor dos detalhes. As faixas da frente e de trás ficam lisas."}
              </p>
              <p className="mt-1 text-sm text-ink" aria-live="polite">
                Escolhido:{" "}
                <strong className="font-semibold text-verde-escuro">
                  {FORMAS.find((f) => f.valor === formaAtiva)?.rotulo}
                </strong>
              </p>
              <label className="mt-4 block">
                <span className="sr-only">Buscar trançado</span>
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar trançado (ex.: escudo, estrela, lhama)"
                  className="w-full border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-ink focus:outline-none"
                />
              </label>
              {achadas >= 0 ? (
                <p className="mt-2 text-sm text-ink-soft" aria-live="polite">
                  {achadas === 0 ? "Nenhum trançado com esse nome." : `${achadas} ${achadas === 1 ? "trançado encontrado" : "trançados encontrados"} em todas as abas.`}{" "}
                  <button type="button" onClick={() => setBusca("")} className="underline underline-offset-2 hover:text-ink">
                    Limpar busca
                  </button>
                </p>
              ) : null}
              {/* Style tabs: the open one is filled; a green dot marks the tab
                  holding the chosen shape when another tab is open. */}
              <div
                className="mt-4 grid grid-cols-4 gap-1 rounded-full border border-line bg-canvas p-1 sm:flex"
                role="tablist"
                aria-label="Estilos"
              >
                {GRUPOS.map((g) => {
                  const aberto = grupo === g.valor;
                  const temEscolhido = FORMAS_VISIVEIS.some((f) => f.grupo === g.valor && f.valor === formaAtiva);
                  return (
                    <button
                      key={g.valor}
                      type="button"
                      role="tab"
                      aria-selected={aberto && !termoBusca}
                      onClick={() => {
                        setGrupo(g.valor);
                        setBusca("");
                      }}
                      aria-label={g.rotulo}
                      className={`relative flex-1 whitespace-nowrap rounded-full px-1 py-1.5 text-[0.8rem] transition-colors sm:px-3 sm:text-sm ${
                        aberto && !termoBusca ? "bg-ink font-medium text-canvas" : "text-ink-soft hover:bg-paper hover:text-ink"
                      }`}
                    >
                      <span className="sm:hidden">{g.curto}</span>
                      <span className="hidden sm:inline">{g.rotulo}</span>
                      {temEscolhido && !aberto ? (
                        <span
                          className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-verde"
                          aria-label="(tem o trançado escolhido)"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {FORMAS_VISIVEIS.map((f, i) => !mostrarForma(i) ? null : (
                  <button
                    key={f.valor}
                    type="button"
                    onClick={() => escolherForma(f.valor)}
                    aria-pressed={formaAtiva === f.valor}
                    className={`relative flex flex-col items-center gap-1.5 border-2 p-1.5 text-xs transition-all ${
                      formaAtiva === f.valor
                        ? "border-verde bg-verde/5 font-semibold text-verde-escuro shadow-[0_0_0_3px_rgb(31_157_85/0.18)]"
                        : "border-line text-ink-soft hover:border-ink"
                    }`}
                  >
                    {formaAtiva === f.valor ? (
                      <span className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-verde text-white shadow">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                    <canvas
                      ref={(el) => {
                        miniaturasRef.current[i] = el;
                      }}
                      width={parte === "encosto" ? 165 : 240}
                      height={parte === "encosto" ? 135 : 108}
                      className={`w-full bg-canvas ${parte === "encosto" ? "aspect-[165/135]" : "aspect-[240/108]"}`}
                    />
                    {f.rotulo}
                  </button>
                ))}
              </div>
              {parte === "encosto" && forma !== "lisa" && forma !== "meio-a-meio" ? (
                <p className="mt-4 text-xs text-ink-soft">
                  Use o − e + embaixo da cadeira para mudar o tamanho. Com o desenho menor, dá para arrastar ele na
                  cadeira e sobra espaço para o nome.
                </p>
              ) : null}
            </fieldset>
          ) : null}

          {passo === 2 ? (
            <div className="space-y-7">
              <div>
                <p className="font-serif text-2xl font-medium tracking-tight text-ink">Escolha as cores</p>
                <p className="mt-1 text-sm text-ink-soft">A cor principal cobre quase toda a cadeira; a dos detalhes faz o desenho, as laterais e as faixas do assento.</p>
              </div>
              <label className="flex cursor-pointer items-center justify-between gap-4 border border-line bg-canvas px-4 py-3">
                <span>
                  <span className="block text-sm font-medium text-ink">Usar 3 cores</span>
                  <span className="block text-xs text-ink-soft">Divide a cor principal ao meio: uma cor em cada metade.</span>
                </span>
                <input
                  type="checkbox"
                  checked={tresCores}
                  onChange={(e) => setTresCores(e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-verde"
                />
              </label>
              {[
                { rotulo: tresCores ? "Cor principal (metade esquerda)" : "Cor principal", fio: fioA, set: setFioA },
                ...(tresCores ? [{ rotulo: "Cor principal (metade direita)", fio: fioC, set: setFioC }] : []),
                { rotulo: "Cor dos detalhes", fio: fioB, set: setFioB },
              ].map(({ rotulo, fio, set }) => {
                const personalizada = !FIOS.some((f) => f.cor === fio.cor);
                return (
                  <fieldset key={rotulo}>
                    <legend className="text-sm text-ink">
                      {rotulo}: <span className="text-ink-soft">{fio.nome}</span>
                    </legend>
                    <div className="mt-3 space-y-2.5">
                      {FAMILIAS.map((familia) => (
                        <div key={familia.nome} className="flex flex-wrap items-center gap-2">
                          <span className="w-full text-[0.7rem] text-ink-soft sm:w-24 sm:shrink-0">{familia.nome}</span>
                          {familia.fios.map((f) => (
                            <button
                              key={f.nome}
                              type="button"
                              aria-label={f.nome}
                              title={f.nome}
                              aria-pressed={fio.cor === f.cor}
                              onClick={() => set(f)}
                              className={`h-7 w-7 rounded-full transition-shadow ${
                                fio.cor === f.cor
                                  ? "ring-2 ring-ink ring-offset-2 ring-offset-paper"
                                  : "ring-1 ring-line ring-offset-1 ring-offset-paper hover:ring-ink"
                              }`}
                              style={{ background: f.cor }}
                            />
                          ))}
                        </div>
                      ))}
                      <label className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="w-full text-[0.7rem] text-ink-soft sm:w-24 sm:shrink-0">Outra cor</span>
                        <input
                          type="color"
                          value={fio.cor}
                          onChange={(e) => set({ nome: `Cor personalizada (${e.target.value.toUpperCase()})`, cor: e.target.value })}
                          className={`h-8 w-12 cursor-pointer border bg-paper p-0.5 ${personalizada ? "border-ink" : "border-line"}`}
                          aria-label={`${rotulo}: escolher qualquer cor`}
                        />
                        <span className="text-xs text-ink-soft">qualquer cor (a gente confirma se tem o fio)</span>
                      </label>
                    </div>
                  </fieldset>
                );
              })}
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
                <fieldset>
                  <legend className="text-sm text-ink">Onde vai o nome</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[
                      { v: false, r: "No encosto" },
                      { v: true, r: "No assento" },
                    ].map((o) => (
                      <button
                        key={o.r}
                        type="button"
                        onClick={() => setNomeNoAssento(o.v)}
                        aria-pressed={nomeNoAssento === o.v}
                        className={`border-2 px-3 py-2 text-sm transition-colors ${
                          nomeNoAssento === o.v
                            ? "border-verde bg-verde/5 font-semibold text-verde-escuro"
                            : "border-line text-ink-soft hover:border-ink"
                        }`}
                      >
                        {o.r}
                      </button>
                    ))}
                  </div>
                  {nomeNoAssento ? (
                    <p className="mt-2 text-xs text-ink-soft">
                      O nome fica centralizado no meio do assento, numa linha só
                      {formaAssento !== "lisa" ? " — e entra no lugar do desenho do assento" : ""}.
                    </p>
                  ) : null}
                </fieldset>
              ) : null}
              {temNome && !nomeNoAssento ? (
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
                  ["Encosto", formaRotulo],
                  ["Cor principal", tresCores ? `${fioA.nome} e ${fioC.nome}` : fioA.nome],
                  ["Cor dos detalhes", fioB.nome],
                  [
                    "Assento",
                    nomeNoAssento && temNome
                      ? "Com o nome"
                      : formaAssento === "lisa"
                        ? "Liso"
                        : FORMAS.find((f) => f.valor === formaAssento)?.rotulo ?? "",
                  ],
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
                  {formatBRL(precoPix(preco))} no Pix. Frete calculado pelo CEP no carrinho.
                </span>
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={whatsappUrl(whatsappNumero, mensagem)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-verde px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-verde-escuro"
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
              className="rounded-full bg-verde px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-verde-escuro"
            >
              {passo === 3 ? "Ver minha cadeira" : "Próximo"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
