// Printable cards for the atelier (/admin/cartoes, 2026-11-10, user: "quero
// uma parte de cartões: cartão de visita, cartão de quem para quem, cartão de
// presente de aniversário... modelos e que eu possa editar tamanho, formas,
// redondo ou quadrado, a letra, a fonte... a logo do Ateliê em todas").
// Shared by the server (validation, Redis) and the editor in the browser.
// Sizes are millimetres, font sizes points: what comes out of the printer.

export type LogoCor = "linha" | "preta" | "colorida";
export const LOGOS: Record<LogoCor, { src: string; nome: string }> = {
  linha: { src: "/brand/logo-linha.png", nome: "Preta, só o contorno" },
  preta: { src: "/brand/logo-preto.png", nome: "Preta, carimbo" },
  colorida: { src: "/brand/logo.png", nome: "Colorida" },
};

export type FormaCartao = "retangulo" | "arredondado" | "redondo" | "etiqueta";
export type TipoCartao = "visita" | "depara" | "aniversario" | "obrigado" | "cuidados" | "livre";

/** Care icons (drawn in the editor, components in cartao-visual.tsx). */
export const ICONES_CUIDADO = ["pano", "mao", "alvejante", "sol", "chuva", "secadora", "ferro", "arrastar", "coracao"] as const;
export type IconeCuidado = (typeof ICONES_CUIDADO)[number];
export const NOMES_ICONES: Record<IconeCuidado, string> = {
  pano: "Pano úmido",
  mao: "Lavar à mão",
  alvejante: "Sem alvejante",
  sol: "Evitar sol",
  chuva: "Evitar chuva",
  secadora: "Sem secadora",
  ferro: "Sem ferro",
  arrastar: "Não arrastar",
  coracao: "Coração",
};
export type ItemCuidado = { icone: IconeCuidado; texto: string };

/** Pieces of a card that can be dragged around in the editor. */
export const PARTES = ["logo", "titulo", "subtitulo", "texto", "cuidados", "depara", "rodape"] as const;
export type Parte = (typeof PARTES)[number];
export const NOMES_PARTES: Record<Parte, string> = {
  logo: "Logo",
  titulo: "Título",
  subtitulo: "Linha pequena",
  texto: "Texto",
  cuidados: "Cuidados",
  depara: "De / Para",
  rodape: "Rodapé",
};
/** mm moved from the automatic place */
export type Posicoes = Partial<Record<Parte, { x: number; y: number }>>;

export const FONTES = ["bodoni", "playfair", "cormorant", "archivo", "montserrat", "greatvibes", "dancing", "parisienne"] as const;
export type FonteCartao = (typeof FONTES)[number];

export const NOMES_FONTES: Record<FonteCartao, string> = {
  bodoni: "Bodoni (a do site)",
  playfair: "Playfair (elegante)",
  cormorant: "Cormorant (clássica)",
  archivo: "Archivo (simples)",
  montserrat: "Montserrat (moderna)",
  greatvibes: "Great Vibes (cursiva)",
  dancing: "Dancing Script (cursiva)",
  parisienne: "Parisienne (cursiva fina)",
};

export const NOMES_FORMAS: Record<FormaCartao, string> = {
  retangulo: "Retângulo / quadrado",
  arredondado: "Cantos arredondados",
  redondo: "Redondo",
  etiqueta: "Etiqueta com furo",
};

export type Cartao = {
  id: string;
  nome: string;
  tipo: TipoCartao;
  forma: FormaCartao;
  /** mm */
  largura: number;
  altura: number;
  fundo: string;
  cor: string;
  destaque: string;
  fonteTitulo: FonteCartao;
  fonteTexto: FonteCartao;
  /** pt */
  tamTitulo: number;
  tamTexto: number;
  alinhar: "centro" | "esquerda";
  logo: "topo" | "lado";
  /** linha: black outline (light on ink) · preta: solid black stamp · colorida: the original */
  logoCor: LogoCor;
  /** mm */
  logoTam: number;
  moldura: boolean;
  titulo: string;
  subtitulo: string;
  texto: string;
  dePara: boolean;
  para: string;
  de: string;
  /** small line at the bottom; starting with @ it gets the Instagram icon */
  rodape: string;
  /** hole at the top, to tie with a string */
  furo: boolean;
  /** false: print without the background colour (on kraft or coloured paper) */
  imprimirFundo: boolean;
  cuidados: ItemCuidado[];
  /** where the atelier dragged each piece (missing = automatic place) */
  pos: Posicoes;
};

export const TAMANHOS: { nome: string; largura: number; altura: number }[] = [
  { nome: "Cartão de visita (9 × 5 cm)", largura: 90, altura: 50 },
  { nome: "Mini (7 × 5 cm)", largura: 70, altura: 50 },
  { nome: "Quadrado pequeno (6 × 6 cm)", largura: 60, altura: 60 },
  { nome: "Quadrado (8 × 8 cm)", largura: 80, altura: 80 },
  { nome: "Quadrado grande (10 × 10 cm)", largura: 100, altura: 100 },
  { nome: "Etiqueta (5,5 × 9 cm)", largura: 55, altura: 90 },
  { nome: "Cartão (10 × 7 cm)", largura: 100, altura: 70 },
  { nome: "Postal (15 × 10 cm)", largura: 150, altura: 100 },
  { nome: "A6 (14,8 × 10,5 cm)", largura: 148, altura: 105 },
];

/**
 * Colour sets. The atelier prints on KRAFT paper with black ink (2026-11-10,
 * user: "todos os modelos estilo preto e branco... a folha que sempre vamos
 * imprimir é de papel craft"), so Kraft is the default: the preview shows the
 * paper colour and the background is not printed. The others stay for
 * when another paper is used.
 */
export const CORES: { nome: string; fundo: string; cor: string; destaque: string }[] = [
  { nome: "Kraft (papel)", fundo: "#c9a47a", cor: "#1c1714", destaque: "#1c1714" },
  { nome: "Kraft escuro", fundo: "#a9804f", cor: "#1c1714", destaque: "#1c1714" },
  { nome: "Papel branco", fundo: "#ffffff", cor: "#1c1714", destaque: "#1c1714" },
  { nome: "Marinho da logo", fundo: "#13234a", cor: "#fbf6ee", destaque: "#e07b39" },
  { nome: "Creme", fundo: "#fbf6ee", cor: "#13234a", destaque: "#c1622f" },
  { nome: "Branco", fundo: "#ffffff", cor: "#241f1a", destaque: "#8a5636" },
  { nome: "Terracota", fundo: "#c1622f", cor: "#fffaf3", destaque: "#13234a" },
  { nome: "Madeira", fundo: "#6b4126", cor: "#fbf3e6", destaque: "#e0b45c" },
  { nome: "Rosé", fundo: "#f6e4dc", cor: "#5a2e1d", destaque: "#c1622f" },
];

export const LIMITES = {
  largura: [30, 200],
  altura: [30, 200],
  tamTitulo: [8, 48],
  tamTexto: [6, 18],
  logoTam: [8, 50],
} as const;

export type Contato = { whatsapp: string; instagram: string; site: string };

export function telefoneBonito(numero: string) {
  const d = numero.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return numero;
}

const base: Omit<Cartao, "id" | "nome" | "tipo"> = {
  forma: "retangulo",
  largura: 90,
  altura: 50,
  fundo: CORES[0].fundo,
  cor: CORES[0].cor,
  destaque: CORES[0].destaque,
  fonteTitulo: "bodoni",
  fonteTexto: "archivo",
  tamTitulo: 16,
  tamTexto: 8,
  alinhar: "centro",
  logo: "topo",
  logoCor: "linha",
  logoTam: 16,
  moldura: false,
  titulo: "",
  subtitulo: "",
  texto: "",
  dePara: false,
  para: "",
  de: "",
  rodape: "",
  furo: false,
  imprimirFundo: false,
  cuidados: [],
  pos: {},
};

/** The ready-made models (the atelier's own saved ones come from Redis). */
export function modelosProntos(k: Contato): Cartao[] {
  const contato = [k.whatsapp ? `WhatsApp ${telefoneBonito(k.whatsapp)}` : "", k.instagram ? `@${k.instagram.replace(/^@/, "")}` : "", k.site]
    .filter(Boolean)
    .join("\n");
  const ig = k.instagram ? `@${k.instagram.replace(/^@/, "")}` : "";
  return [
    {
      ...base,
      id: "pronto-visita",
      nome: "Cartão de visita",
      tipo: "visita",
      alinhar: "esquerda",
      logo: "lado",
      logoCor: "preta",
      logoTam: 30,
      tamTitulo: 15,
      tamTexto: 7.5,
      titulo: "Ateliê SentArte",
      subtitulo: "Cadeiras trançadas à mão",
      texto: contato,
    },
    {
      ...base,
      id: "pronto-visita-claro",
      nome: "Cartão de visita centralizado",
      tipo: "visita",
      forma: "arredondado",
      moldura: true,
      logoTam: 15,
      tamTitulo: 13,
      tamTexto: 7,
      titulo: "Ateliê SentArte",
      subtitulo: "Cadeiras trançadas à mão",
      texto: contato,
    },
    {
      ...base,
      id: "pronto-depara",
      nome: "Etiqueta De / Para",
      tipo: "depara",
      forma: "etiqueta",
      largura: 55,
      altura: 90,
      fonteTitulo: "greatvibes",
      fonteTexto: "cormorant",
      tamTitulo: 22,
      tamTexto: 10,
      logoTam: 18,
      titulo: "Feito à mão para você",
      dePara: true,
    },
    {
      ...base,
      id: "pronto-depara-redondo",
      nome: "De / Para redondo",
      tipo: "depara",
      forma: "redondo",
      largura: 65,
      altura: 65,
      moldura: true,
      furo: true,
      fonteTitulo: "greatvibes",
      fonteTexto: "dancing",
      tamTitulo: 14,
      tamTexto: 12,
      logoTam: 12,
      dePara: true,
    },
    {
      ...base,
      id: "pronto-cuidados",
      nome: "Cuidados com a cadeira",
      tipo: "cuidados",
      forma: "arredondado",
      largura: 60,
      altura: 100,
      furo: true,
      fonteTitulo: "dancing",
      fonteTexto: "archivo",
      tamTitulo: 15,
      tamTexto: 7.5,
      logoTam: 15,
      titulo: "Cuidados com a sua cadeira:",
      cuidados: [
        { icone: "pano", texto: "Limpe com pano úmido" },
        { icone: "alvejante", texto: "Não use alvejante" },
        { icone: "sol", texto: "Evite sol forte direto" },
        { icone: "chuva", texto: "Não deixe na chuva" },
      ],
      rodape: ig || "Feito à mão com amor",
    },
    {
      ...base,
      id: "pronto-aniversario",
      nome: "Feliz aniversário",
      tipo: "aniversario",
      forma: "arredondado",
      largura: 150,
      altura: 100,
      moldura: true,
      fonteTitulo: "greatvibes",
      fonteTexto: "cormorant",
      tamTitulo: 34,
      tamTexto: 12,
      logoTam: 20,
      titulo: "Feliz aniversário!",
      texto: "Que esta cadeira seja o seu cantinho preferido\npara descansar, sonhar e celebrar a vida.",
      dePara: true,
    },
    {
      ...base,
      id: "pronto-aniversario-quadrado",
      nome: "Aniversário quadrado",
      tipo: "aniversario",
      forma: "retangulo",
      largura: 100,
      altura: 100,
      moldura: true,
      fonteTitulo: "dancing",
      fonteTexto: "cormorant",
      tamTitulo: 28,
      tamTexto: 11,
      logoTam: 18,
      titulo: "Parabéns!",
      texto: "Um presente feito à mão,\nfio por fio, para você.",
      dePara: true,
    },
    {
      ...base,
      id: "pronto-obrigado",
      nome: "Agradecimento",
      tipo: "obrigado",
      forma: "arredondado",
      largura: 80,
      altura: 80,
      moldura: true,
      fonteTitulo: "greatvibes",
      fonteTexto: "cormorant",
      tamTitulo: 26,
      tamTexto: 9.5,
      logoTam: 16,
      titulo: "Muito obrigado!",
      texto: "Cada fio desta cadeira foi trançado\nà mão, com carinho, pensando em você.",
      rodape: ig,
    },
  ];
}

const cor = (v: unknown, padrao: string) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : padrao);
const num = (v: unknown, [min, max]: readonly [number, number], padrao: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 2) / 2)) : padrao;
};
const texto = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").slice(0, max) : "");
const um = <T extends string>(v: unknown, lista: readonly T[], padrao: T): T => (lista.includes(v as T) ? (v as T) : padrao);

function posicoes(v: unknown): Posicoes {
  const out: Posicoes = {};
  if (!v || typeof v !== "object") return out;
  for (const p of PARTES) {
    const d = (v as Record<string, { x?: unknown; y?: unknown }>)[p];
    if (!d || typeof d !== "object") continue;
    const x = Number(d.x);
    const y = Number(d.y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || (x === 0 && y === 0)) continue;
    out[p] = { x: Math.max(-200, Math.min(200, Math.round(x * 10) / 10)), y: Math.max(-200, Math.min(200, Math.round(y * 10) / 10)) };
  }
  return out;
}

/** Anything from the browser becomes a valid card (or null when unusable). */
export function normalizarCartao(v: unknown): Cartao | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const id = typeof o.id === "string" && /^[a-z0-9-]{3,40}$/.test(o.id) ? o.id : null;
  if (!id) return null;
  const forma = um(o.forma, ["retangulo", "arredondado", "redondo", "etiqueta"] as const, "retangulo");
  const largura = num(o.largura, LIMITES.largura, 90);
  return {
    id,
    nome: texto(o.nome, 60).trim() || "Meu cartão",
    tipo: um(o.tipo, ["visita", "depara", "aniversario", "obrigado", "cuidados", "livre"] as const, "livre"),
    forma,
    largura,
    altura: forma === "redondo" ? largura : num(o.altura, LIMITES.altura, 50),
    fundo: cor(o.fundo, "#ffffff"),
    cor: cor(o.cor, "#241f1a"),
    destaque: cor(o.destaque, "#c1622f"),
    fonteTitulo: um(o.fonteTitulo, FONTES, "bodoni"),
    fonteTexto: um(o.fonteTexto, FONTES, "archivo"),
    tamTitulo: num(o.tamTitulo, LIMITES.tamTitulo, 16),
    tamTexto: num(o.tamTexto, LIMITES.tamTexto, 8),
    alinhar: um(o.alinhar, ["centro", "esquerda"] as const, "centro"),
    logo: um(o.logo, ["topo", "lado"] as const, "topo"),
    logoCor: um(o.logoCor, ["linha", "preta", "colorida"] as const, "linha"),
    logoTam: num(o.logoTam, LIMITES.logoTam, 16),
    moldura: o.moldura === true,
    titulo: texto(o.titulo, 80),
    subtitulo: texto(o.subtitulo, 80),
    texto: texto(o.texto, 400),
    dePara: o.dePara === true,
    para: texto(o.para, 40),
    de: texto(o.de, 40),
    rodape: texto(o.rodape, 60),
    furo: o.furo === true,
    imprimirFundo: o.imprimirFundo !== false,
    cuidados: (Array.isArray(o.cuidados) ? o.cuidados : [])
      .slice(0, 8)
      .map((i) => ({ icone: um((i as ItemCuidado)?.icone, ICONES_CUIDADO, "pano"), texto: texto((i as ItemCuidado)?.texto, 40) })),
    pos: posicoes(o.pos),
  };
}

/** How many fit on an A4 sheet (8 mm margins, 3 mm between cards). */
export function porFolha(c: Pick<Cartao, "largura" | "altura">) {
  const GAP = 3;
  const colunas = Math.floor((194 + GAP) / (c.largura + GAP));
  const linhas = Math.floor((281 + GAP) / (c.altura + GAP));
  return { colunas, linhas, total: colunas * linhas };
}

/** `girado`: printed turned sideways (90°) because that way it fit. */
export type Colocado = { c: Cartao; x: number; y: number; girado?: boolean };

/**
 * Several different cards on as few A4 sheets as possible: biggest first,
 * each in the highest-then-leftmost free spot of the first sheet where it
 * fits, turned sideways if only that way it fits. Cards bigger than the
 * printable area come back in `grandes`.
 */
export function montarFolhas(cartoes: Cartao[]): { paginas: Colocado[][]; grandes: Cartao[] } {
  const GAP = 3;
  const L = 194;
  const A = 281;
  const cabe = (w: number, h: number) => w <= L && h <= A;
  const giravel = (c: Cartao) => c.forma !== "redondo" && c.largura !== c.altura;
  const grandes = cartoes.filter((c) => !cabe(c.largura, c.altura) && !(giravel(c) && cabe(c.altura, c.largura)));
  const cabem = cartoes.filter((c) => !grandes.includes(c));
  const tam = (k: Colocado) => (k.girado ? { w: k.c.altura, h: k.c.largura } : { w: k.c.largura, h: k.c.altura });

  function lugar(pag: Colocado[], w: number, h: number) {
    const xs = [...new Set([0, ...pag.map((k) => k.x + tam(k).w + GAP)])].sort((a, b) => a - b);
    const ys = [...new Set([0, ...pag.map((k) => k.y + tam(k).h + GAP)])].sort((a, b) => a - b);
    for (const y of ys) {
      if (y + h > A) break;
      for (const x of xs) {
        if (x + w > L) break;
        const bate = pag.some((k) => {
          const t = tam(k);
          return x < k.x + t.w + GAP && x + w + GAP > k.x && y < k.y + t.h + GAP && y + h + GAP > k.y;
        });
        if (!bate) return { x, y };
      }
    }
    return null;
  }

  /** livre: also turn a card when that spot is higher up (not only when it is the only way it fits) */
  function montar(fila: Cartao[], livre: boolean) {
    const paginas: Colocado[][] = [];
    for (const c of fila) {
      let posto = false;
      for (const pag of paginas) {
        const p = cabe(c.largura, c.altura) ? lugar(pag, c.largura, c.altura) : null;
        const g = (!p || livre) && giravel(c) && cabe(c.altura, c.largura) ? lugar(pag, c.altura, c.largura) : null;
        const girar = !!g && (!p || g.y < p.y || (g.y === p.y && g.x < p.x));
        if (p || g) {
          pag.push({ c, ...(girar ? g! : p!), girado: girar });
          posto = true;
          break;
        }
      }
      if (!posto) paginas.push([{ c, x: 0, y: 0, girado: !cabe(c.largura, c.altura) }]);
    }
    return paginas;
  }

  // a few orders, keep the one with fewest sheets (then the fullest first sheet)
  const ordens: ((a: Cartao, b: Cartao) => number)[] = [
    (a, b) => b.largura * b.altura - a.largura * a.altura || b.altura - a.altura,
    (a, b) => b.altura - a.altura || b.largura - a.largura,
    (a, b) => b.largura - a.largura || b.altura - a.altura,
    (a, b) => Math.max(b.largura, b.altura) - Math.max(a.largura, a.altura),
  ];
  let paginas: Colocado[][] = [];
  for (const o of ordens)
    for (const livre of [false, true]) {
      const p = montar([...cabem].sort(o), livre);
      if (!paginas.length || p.length < paginas.length || (p.length === paginas.length && p[0].length > paginas[0].length)) paginas = p;
    }
  return { paginas, grandes };
}
