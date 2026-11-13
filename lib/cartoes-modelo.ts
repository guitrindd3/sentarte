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

export const FORMAS = ["retangulo", "arredondado", "redondo", "etiqueta", "arvore", "estrela", "bola", "sino", "coracao"] as const;
export type FormaCartao = (typeof FORMAS)[number];
export type TipoCartao = "visita" | "depara" | "aniversario" | "obrigado" | "cuidados" | "passaporte" | "livre";

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

/** Checklist lines (2026-11-10, model "Cuidados – cadeiras de praia"): marks drawn in black, they print well on kraft. */
export const MARCAS = ["sim", "nao", "dica", "ponto"] as const;
export type Marca = (typeof MARCAS)[number];
export const NOMES_MARCAS: Record<Marca, string> = { sim: "✔ Pode / faça", nao: "✖ Não faça", dica: "➜ Dica", ponto: "• Item" };
export type ItemLista = { marca: Marca; texto: string };

/** Pieces of a card that can be dragged around in the editor. */
export const PARTES = ["logo", "titulo", "subtitulo", "qr", "texto", "cuidados", "lista", "depara", "rodape"] as const;
export type Parte = (typeof PARTES)[number];
export const NOMES_PARTES: Record<Parte, string> = {
  logo: "Logo",
  titulo: "Título",
  subtitulo: "Linha pequena",
  texto: "Texto",
  cuidados: "Cuidados",
  qr: "QR code",
  lista: "Lista ✔ / ✖",
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
  arvore: "Árvore de Natal",
  estrela: "Estrela",
  bola: "Bola de Natal",
  sino: "Sino",
  coracao: "Coração",
};

/**
 * Seasonal card shapes (2026-11-12, user: "formas sazonais, ex.: Natal uma
 * árvore de Natal"). The card itself is cut in this outline. `d` is drawn in
 * a 100 × 100 box (absolute M/L/C/Q/A/Z only) and stretched to the card's
 * width × height; `seguro` = the inner rectangle (fractions x0, y0, x1, y1)
 * where text/logo always fit (useEncaixar measures against it); `furoY` =
 * centre of the hole (fraction of the height); largura/altura = size when
 * the shape is picked. All are left-right symmetric, so a mirrored back
 * lands right; they never turn on the sheet and can't be folded.
 */
export type Figura = { d: string; seguro: readonly [number, number, number, number]; furoY: number; largura: number; altura: number };

function pontasDeEstrela(cx: number, cy: number, R: number, r: number) {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180;
    const k = i % 2 ? r : R;
    p.push(`${(cx + k * Math.cos(a)).toFixed(2)} ${(cy + k * Math.sin(a)).toFixed(2)}`);
  }
  return `M${p[0]} ${p
    .slice(1)
    .map((x) => "L" + x)
    .join(" ")} Z`;
}

export const FIGURAS: Partial<Record<FormaCartao, Figura>> = {
  arvore: {
    d: "M50 2 L72 30 L62 30 L84 58 L72 58 L95 86 L58 86 L58 98 L42 98 L42 86 L5 86 L28 58 L16 58 L38 30 L28 30 Z",
    seguro: [0.31, 0.4, 0.69, 0.83],
    furoY: 0.16,
    largura: 80,
    altura: 100,
  },
  estrela: { d: pontasDeEstrela(50, 52.6, 50, 27.5), seguro: [0.3, 0.37, 0.7, 0.69], furoY: 0.19, largura: 90, altura: 90 },
  bola: {
    d: "M41 23.1 L41 12 Q41 8 45 8 L55 8 Q59 8 59 12 L59 23.1 A38 38 0 1 1 41 23.1 Z",
    seguro: [0.25, 0.38, 0.75, 0.82],
    furoY: 0.15,
    largura: 80,
    altura: 80,
  },
  sino: {
    d: "M44 13 Q44 3 50 3 Q56 3 56 13 C72 15 77 30 77 50 C77 66 83 75 95 81 L95 86 L59 86 A9 9 0 0 1 41 86 L5 86 L5 81 C17 75 23 66 23 50 C23 30 28 15 44 13 Z",
    seguro: [0.27, 0.3, 0.73, 0.8],
    furoY: 0.085,
    largura: 80,
    altura: 85,
  },
  coracao: {
    d: "M50 95 C22 74 3 54 3 31 C3 15 14 5 28 5 C39 5 46 12 50 21 C54 12 61 5 72 5 C86 5 97 15 97 31 C97 54 78 74 50 95 Z",
    seguro: [0.2, 0.27, 0.8, 0.62],
    furoY: 0.3,
    largura: 90,
    altura: 80,
  },
};
export const ehFigura = (f: FormaCartao) => !!FIGURAS[f];

const ARGS: Record<string, number> = { M: 2, L: 2, C: 6, Q: 4, A: 7, Z: 0 };

/**
 * A shape's outline in mm for a card of `largura` × `altura`. `folga` (mm)
 * pulls it inward (frame inside the card) or, negative, outward (bleed).
 */
export function caminhoDaFigura(forma: FormaCartao, largura: number, altura: number, folga = 0): string {
  const f = FIGURAS[forma];
  if (!f) return "";
  const kx = (largura - 2 * folga) / largura;
  const ky = (altura - 2 * folga) / altura;
  const X = (v: number) => +(largura / 2 + ((v * largura) / 100 - largura / 2) * kx).toFixed(3);
  const Y = (v: number) => +(altura / 2 + ((v * altura) / 100 - altura / 2) * ky).toFixed(3);
  const t = f.d.match(/[MLCQAZ]|-?\d*\.?\d+/g) ?? [];
  const out: string[] = [];
  let i = 0;
  while (i < t.length) {
    const cmd = t[i++];
    const n = t.slice(i, i + ARGS[cmd]).map(Number);
    i += ARGS[cmd];
    if (cmd === "A") out.push(`A${+((n[0] * largura * kx) / 100).toFixed(3)} ${+((n[1] * altura * ky) / 100).toFixed(3)} ${n[2]} ${n[3]} ${n[4]} ${X(n[5])} ${Y(n[6])}`);
    else if (cmd === "Z") out.push("Z");
    else out.push(cmd + n.map((v, j) => (j % 2 ? Y(v) : X(v))).join(" "));
  }
  return out.join(" ");
}

/**
 * Drawings that go on top of any card (2026-11-12, "Desenhos"): clean line
 * art printed in the card's ink colour as SVG (cartoes/desenhos.tsx). Each
 * is square; `x`/`y` = its centre in mm from the card's top-left corner,
 * `tam` = its side in mm.
 */
export const DESENHOS = {
  arvore: "Árvore",
  estrela: "Estrela",
  sino: "Sino",
  bola: "Bola",
  laco: "Laço",
  floco: "Floco de neve",
  presente: "Presente",
  guirlanda: "Guirlanda",
  gorro: "Gorro",
  tacas: "Taças brindando",
  fogos: "Fogos",
  relogio: "Relógio",
  estrelinhas: "Estrelinhas",
  concha: "Concha",
  "estrela-do-mar": "Estrela-do-mar",
  onda: "Onda",
  coracao: "Coração",
  gaivota: "Gaivotas",
} as const;
export type DesenhoId = keyof typeof DESENHOS;
export const GRUPOS_DESENHOS: { nome: string; ids: DesenhoId[] }[] = [
  { nome: "Natal", ids: ["arvore", "estrela", "sino", "bola", "laco", "floco", "presente", "guirlanda", "gorro"] },
  { nome: "Ano Novo", ids: ["tacas", "fogos", "relogio", "estrelinhas"] },
  { nome: "Praia e outros", ids: ["concha", "estrela-do-mar", "onda", "coracao", "gaivota"] },
];
export type Desenho = { id: DesenhoId; x: number; y: number; tam: number; espelhar: boolean };
export const MAX_DESENHOS = 12;

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
  /** link turned into a QR code (passport tags, or the site on a business card); empty = none */
  qr: string;
  /** mm */
  qrTam: number;
  /** back side (2026-11-10, "frente e verso"): its own texts/fonts/logo; size, shape and hole always follow the front */
  verso: Cartao | null;
  /** hole at the top, to tie with a string */
  furo: boolean;
  /** false: print without the background colour (on kraft or coloured paper) */
  imprimirFundo: boolean;
  cuidados: ItemCuidado[];
  lista: ItemLista[];
  /** two L-shaped corners (top right, bottom left) */
  cantos: boolean;
  /** where the atelier dragged each piece (missing = automatic place) */
  pos: Posicoes;
  /** drawings on top (max MAX_DESENHOS) */
  desenhos: Desenho[];
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
  qrTam: [12, 80],
  desenho: [5, 80],
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
  qr: "",
  qrTam: 30,
  verso: null,
  furo: false,
  imprimirFundo: false,
  cuidados: [],
  lista: [],
  cantos: false,
  pos: {},
  desenhos: [],
};

/**
 * Chair passport tag (2026-11-10, user: "o passaporte quero que fique lá também
 * [em] cartões... mas também mantenha no outro"): same look as the other cards
 * (kraft, black ink). /admin/etiquetas and the Folha tab fill in each chair's
 * number and QR link; the atelier can restyle it and save it in "Meus modelos"
 * (the first saved one of type "passaporte" is then used everywhere).
 */
export const PASSAPORTE_PRONTO: Cartao = {
  ...base,
  id: "pronto-passaporte",
  nome: "Etiqueta do passaporte",
  tipo: "passaporte",
  forma: "arredondado",
  largura: 60,
  altura: 90,
  furo: true,
  fonteTitulo: "bodoni",
  fonteTexto: "archivo",
  tamTitulo: 11,
  tamTexto: 7.5,
  logoTam: 10,
  titulo: "Ateliê SentArte",
  subtitulo: "Cadeira Sol",
  qr: "https://sentarte.com.br",
  qrTam: 30,
  texto: "Aponte a câmera e conheça\na história desta cadeira",
  rodape: "Trançada à mão",
};

export type DadosPassaporte = { n: number; numero: string; link: string; colecao?: string; modelo?: string };

/**
 * The tag says the chair's model ("Cadeira Sol"), not its number (user
 * 2026-11-13); the number stays on the passport page the QR opens.
 */
export const nomeNaEtiqueta = (p: DadosPassaporte) => {
  const m = (p.modelo ?? "").replace(/ personalizad[ao]$/i, "").trim();
  return m ? (/^cadeira\b/i.test(m) ? m : `Cadeira ${m}`) : `Cadeira Nº ${p.numero}`;
};

const comPassaporte = (c: Cartao, p: DadosPassaporte): Cartao => ({ ...c, subtitulo: nomeNaEtiqueta(p), qr: p.link, rodape: p.colecao ?? c.rodape });

/** Whether this card carries a passport (on the front, or on the back). */
export const temPassaporte = (c: Cartao) => c.tipo === "passaporte" || c.verso?.tipo === "passaporte";

/**
 * One chair's tag in the chosen style. When the passport is on the BACK of
 * another card (e.g. care tag in front, passport behind — user 2026-11-11),
 * the chair's number/QR go on the back and the front stays as it is.
 */
export function cartaoDoPassaporte(estilo: Cartao, p: DadosPassaporte): Cartao {
  const naFrente = estilo.tipo === "passaporte" || estilo.verso?.tipo !== "passaporte";
  return {
    ...(naFrente ? comPassaporte(estilo, p) : estilo),
    id: `passaporte-${p.n}`,
    nome: `Passaporte Nº ${p.numero}`,
    verso: !naFrente && estilo.verso ? comPassaporte(estilo.verso, p) : estilo.verso,
  };
}

/** The style for passport tags: the first saved one of that type, else the ready one. */
export const estiloPassaporte = (salvos: Cartao[]) => salvos.find((c) => c.tipo === "passaporte") ?? PASSAPORTE_PRONTO;

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
    PASSAPORTE_PRONTO,
    {
      ...base,
      id: "pronto-cuidados-praia",
      nome: "Cuidados – cadeira de praia",
      tipo: "cuidados",
      forma: "retangulo",
      largura: 90,
      altura: 135,
      cantos: true,
      fonteTitulo: "montserrat",
      fonteTexto: "montserrat",
      tamTitulo: 13,
      tamTexto: 7.5,
      logoTam: 13,
      titulo: "CUIDADOS –\nCADEIRAS DE PRAIA",
      subtitulo: "Fio náutico / corda",
      texto: "Seguindo esses cuidados, sua peça\nvai durar por muito mais tempo ♡",
      lista: [
        { marca: "sim", texto: "Limpar com pano úmido, água e sabão neutro" },
        { marca: "sim", texto: "Secar sempre à sombra" },
        { marca: "sim", texto: "Pode molhar, mas evite deixar submersa por muito tempo" },
        { marca: "sim", texto: "Após o uso na praia, retire o excesso de areia e sal" },
        { marca: "nao", texto: "Não usar produtos abrasivos" },
        { marca: "nao", texto: "Não usar cloro ou solventes" },
        { marca: "nao", texto: "Não guardar molhada" },
        { marca: "nao", texto: "Evitar exposição contínua ao sol quando não estiver em uso" },
        { marca: "dica", texto: "Dica extra: guardar em local seco aumenta a durabilidade." },
      ],
      rodape: ig,
    },
    // seasonal (2026-11-12): shapes + drawings, still kraft + black ink
    {
      ...base,
      id: "pronto-natal-arvore",
      nome: "Natal – árvore",
      tipo: "livre",
      forma: "arvore",
      largura: 80,
      altura: 100,
      moldura: true,
      fonteTitulo: "greatvibes",
      fonteTexto: "cormorant",
      tamTitulo: 20,
      tamTexto: 8,
      logoTam: 12,
      titulo: "Feliz\nNatal",
      desenhos: [{ id: "estrela", x: 40, y: 13, tam: 9, espelhar: false }],
    },
    {
      ...base,
      id: "pronto-natal-cartao",
      nome: "Natal – cartão",
      tipo: "livre",
      forma: "arredondado",
      largura: 100,
      altura: 70,
      fonteTitulo: "greatvibes",
      fonteTexto: "cormorant",
      tamTitulo: 26,
      tamTexto: 10,
      logoTam: 11,
      titulo: "Feliz Natal",
      texto: "Que o seu Natal seja leve\ncomo um fim de tarde na praia.",
      desenhos: [
        { id: "floco", x: 13, y: 13, tam: 12, espelhar: false },
        { id: "bola", x: 87, y: 14, tam: 14, espelhar: false },
        { id: "arvore", x: 13, y: 55, tam: 18, espelhar: false },
        { id: "presente", x: 87, y: 56, tam: 15, espelhar: false },
      ],
    },
    {
      ...base,
      id: "pronto-natal-bola",
      nome: "Natal – bola De/Para",
      tipo: "depara",
      forma: "bola",
      largura: 80,
      altura: 80,
      furo: true,
      moldura: true,
      fonteTitulo: "greatvibes",
      fonteTexto: "dancing",
      tamTitulo: 16,
      tamTexto: 10,
      logoTam: 10,
      titulo: "Feliz Natal",
      dePara: true,
    },
    {
      ...base,
      id: "pronto-ano-novo",
      nome: "Ano Novo",
      tipo: "livre",
      forma: "arredondado",
      largura: 100,
      altura: 70,
      fonteTitulo: "parisienne",
      fonteTexto: "cormorant",
      tamTitulo: 26,
      tamTexto: 10,
      logoTam: 11,
      titulo: "Feliz Ano Novo!",
      texto: "Que o ano que chega venha com\nmuito sol, mar e boas histórias.",
      desenhos: [
        { id: "estrelinhas", x: 13, y: 13, tam: 12, espelhar: false },
        { id: "fogos", x: 87, y: 15, tam: 16, espelhar: false },
        { id: "tacas", x: 14, y: 54, tam: 19, espelhar: false },
        { id: "relogio", x: 87, y: 56, tam: 14, espelhar: false },
      ],
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
export function normalizarCartao(v: unknown, nivel = 0): Cartao | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const id = typeof o.id === "string" && /^[a-z0-9-]{3,40}$/.test(o.id) ? o.id : null;
  if (!id) return null;
  const forma = um(o.forma, FORMAS, "retangulo");
  const largura = num(o.largura, LIMITES.largura, 90);
  const altura = forma === "redondo" ? largura : num(o.altura, LIMITES.altura, 50);
  return {
    id,
    nome: texto(o.nome, 60).trim() || "Meu cartão",
    tipo: um(o.tipo, ["visita", "depara", "aniversario", "obrigado", "cuidados", "passaporte", "livre"] as const, "livre"),
    forma,
    largura,
    altura,
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
    qr: typeof o.qr === "string" && /^https?:\/\/[^\s<>"]{3,200}$/.test(o.qr.trim()) ? o.qr.trim() : "",
    qrTam: num(o.qrTam, LIMITES.qrTam, 30),
    verso: nivel === 0 && o.verso ? normalizarCartao(o.verso, 1) : null,
    furo: o.furo === true,
    imprimirFundo: o.imprimirFundo !== false,
    cuidados: (Array.isArray(o.cuidados) ? o.cuidados : [])
      .slice(0, 8)
      .map((i) => ({ icone: um((i as ItemCuidado)?.icone, ICONES_CUIDADO, "pano"), texto: texto((i as ItemCuidado)?.texto, 40) })),
    lista: (Array.isArray(o.lista) ? o.lista : [])
      .slice(0, 14)
      .map((i) => ({ marca: um((i as ItemLista)?.marca, MARCAS, "ponto"), texto: texto((i as ItemLista)?.texto, 120) })),
    cantos: o.cantos === true,
    pos: posicoes(o.pos),
    desenhos: desenhos(o.desenhos, largura, altura),
  };
}

/** Known drawings only, at most MAX_DESENHOS, centre kept on the card. */
function desenhos(v: unknown, largura: number, altura: number): Desenho[] {
  if (!Array.isArray(v)) return [];
  const out: Desenho[] = [];
  for (const d of v) {
    if (out.length >= MAX_DESENHOS) break;
    if (!d || typeof d !== "object") continue;
    const o = d as Record<string, unknown>;
    if (typeof o.id !== "string" || !Object.prototype.hasOwnProperty.call(DESENHOS, o.id)) continue;
    out.push({
      id: o.id as DesenhoId,
      x: num(o.x, [0, largura], largura / 2),
      y: num(o.y, [0, altura], altura / 2),
      tam: num(o.tam, LIMITES.desenho, 15),
      espelhar: o.espelhar === true,
    });
  }
  return out;
}

/** How many fit on an A4 sheet (8 mm margins, 3 mm between cards). */
export function porFolha(c: Pick<Cartao, "largura" | "altura">) {
  const GAP = 3;
  const colunas = Math.floor((194 + GAP) / (c.largura + GAP));
  const linhas = Math.floor((281 + GAP) / (c.altura + GAP));
  return { colunas, linhas, total: colunas * linhas };
}

/**
 * `girado`: printed turned sideways because that way it fit; `sentido` -1 =
 * turned the other way (the back of a turned card, so its top matches the front's).
 */
/** `dobra`: fold line on this card's left (side-by-side pair) or top (stacked pair); `invertido`: printed upside down (back of a stacked pair). */
export type Colocado = { c: Cartao; x: number; y: number; girado?: boolean; sentido?: 1 | -1; dobra?: "esquerda" | "topo"; invertido?: boolean };

/**
 * How tall a printed page has to be: down to its lowest card (+1 mm), never
 * the full 281 mm. A full-height box spilled its empty bottom onto an extra
 * blank sheet on printers whose printable area is a bit smaller (user
 * 2026-11-11: "ainda tá gerando mais folhas").
 */
export function alturaDaPagina(cartoes: Colocado[]) {
  const fundo = Math.max(0, ...cartoes.map((k) => k.y + (k.girado ? k.c.largura : k.c.altura)));
  return Math.min(281, Math.ceil(fundo) + 1);
}

/**
 * Moves a page's cards so the whole group sits in the middle of the sheet,
 * across and down (user 2026-11-11: "deixa centralizada quando for imprimir
 * frente e verso, para eu não ter que mexer em margem"). A centred group is
 * its own mirror image, so the back lands behind the front even when the
 * printer's margins are a bit off, and every card can be cut alone.
 */
export function centrarPagina(pagina: Colocado[]): Colocado[] {
  if (!pagina.length) return pagina;
  const w = (k: Colocado) => (k.girado ? k.c.altura : k.c.largura);
  const h = (k: Colocado) => (k.girado ? k.c.largura : k.c.altura);
  const x0 = Math.min(...pagina.map((k) => k.x));
  const y0 = Math.min(...pagina.map((k) => k.y));
  const x1 = Math.max(...pagina.map((k) => k.x + w(k)));
  const y1 = Math.max(...pagina.map((k) => k.y + h(k)));
  const dx = Math.round(((194 - (x1 - x0)) / 2 - x0) * 10) / 10;
  const dy = Math.round(((281 - (y1 - y0)) / 2 - y0) * 10) / 10;
  return pagina.map((k) => ({ ...k, x: k.x + dx, y: k.y + dy }));
}

/** Fields shared by both sides: changing them on the back changes the front. */
export const DOS_DOIS_LADOS = ["nome", "forma", "largura", "altura", "furo"] as const;

/** The back as a full card (size/shape from the front), or null. */
export function versoDe(c: Cartao): Cartao | null {
  if (!c.verso) return null;
  return { ...c.verso, id: "verso", nome: c.nome, forma: c.forma, largura: c.largura, altura: c.altura, furo: c.furo, verso: null };
}

/**
 * Another model (ready or saved) used as the back of `c` (user 2026-11-11:
 * "no verso eu queria colocar um desses cartões"). Size, shape and hole stay
 * the front's; letters, logo and QR shrink if the model was bigger.
 */
export function modeloNoVerso(c: Cartao, m: Cartao): Cartao {
  const k = Math.min(1, c.largura / m.largura, c.altura / m.altura);
  const enc = (v: number, [min, max]: readonly [number, number]) => Math.max(min, Math.min(max, Math.round(v * k * 2) / 2));
  return {
    ...m,
    id: "verso",
    nome: c.nome,
    forma: c.forma,
    largura: c.largura,
    altura: c.altura,
    furo: c.furo,
    verso: null,
    pos: k < 1 ? {} : { ...m.pos },
    desenhos: m.desenhos.map((d) => ({
      ...d,
      x: Math.round(((d.x * c.largura) / m.largura) * 2) / 2,
      y: Math.round(((d.y * c.altura) / m.altura) * 2) / 2,
      tam: Math.max(LIMITES.desenho[0], Math.round(d.tam * k * 2) / 2),
    })),
    tamTitulo: enc(m.tamTitulo, LIMITES.tamTitulo),
    tamTexto: enc(m.tamTexto, LIMITES.tamTexto),
    logoTam: enc(m.logoTam, LIMITES.logoTam),
    qrTam: enc(m.qrTam, LIMITES.qrTam),
  };
}

/** A first back: same look, only the logo (big) and the footer. */
export function novoVerso(c: Cartao): Cartao {
  return {
    ...c,
    id: "verso",
    verso: null,
    titulo: "",
    subtitulo: "",
    texto: "",
    lista: [],
    cuidados: [],
    dePara: false,
    para: "",
    de: "",
    qr: "",
    pos: {},
    desenhos: [],
    logo: "topo",
    alinhar: "centro",
    cantos: false,
    logoTam: Math.round(Math.min(40, Math.min(c.largura, c.altura) * 0.42)),
  };
}

/** One card × qtd on A4 sheets, a centred grid (8 mm margins, 3 mm apart). */
export function paginasDoCartao(c: Cartao, qtd: number): Colocado[][] {
  const f = porFolha(c);
  if (!f.total) return [];
  const GAP = 3;
  const x0 = (194 - (f.colunas * c.largura + (f.colunas - 1) * GAP)) / 2;
  const paginas: Colocado[][] = [];
  for (let i = 0; i < qtd; i++) {
    const p = Math.floor(i / f.total);
    const k = i % f.total;
    (paginas[p] ??= []).push({ c, x: x0 + (k % f.colunas) * (c.largura + GAP), y: Math.floor(k / f.colunas) * (c.altura + GAP) });
  }
  return paginas.map(centrarPagina);
}

/**
 * The back of a printed sheet: each card's back lands exactly behind its own
 * front when the sheet is turned over like a book page (left ↔ right, the
 * printer's "virar pela borda longa"). Printable area 194 mm wide, centred.
 */
export function versoDaPagina(pagina: Colocado[]): Colocado[] {
  return pagina.flatMap((k) => {
    const v = versoDe(k.c);
    if (!v) return [];
    const largura = k.girado ? k.c.altura : k.c.largura;
    return [{ c: v, x: 194 - k.x - largura, y: k.y, girado: k.girado, sentido: k.girado ? -1 : 1 }];
  });
}

/**
 * "Para dobrar" (user 2026-11-11, after duplex printing kept landing off: "ainda
 * assim não foi"): front and back side by side on the SAME face, sharing the
 * right edge of the front. Cut around the pair and fold on the dashed line —
 * the back always lands exactly behind the front, whatever the printer does.
 * The hole is centred on top, so it matches after the fold. Pairs are never
 * turned sideways (a turned pair would need its back upside down). Round
 * cards can't be folded (two circles only touch at a point): they come out
 * without the back.
 */
/** Front and back fold apart only along a straight edge (not round / seasonal shapes). */
export const dobravel = (c: Pick<Cartao, "forma">) => c.forma !== "redondo" && !ehFigura(c.forma);

export function montarDobradas(cartoes: Cartao[]): { paginas: Colocado[][]; grandes: Cartao[] } {
  // Two shapes of pair, keep the one with fewer sheets: side by side (fold on
  // the shared side edge) or stacked (back above, upside down, fold on the top
  // edge). Either pair may also be laid sideways as a whole (big cards, user
  // 2026-11-11 "coloquei para imprimir e não deixou": a 10 × 15 pair only fits
  // turned) — a whole pair turned is still a correct fold.
  const montar = (emPe: boolean) => {
    const original = new Map<Cartao, Cartao>();
    const pares = cartoes.map((c) => {
      if (!c.verso || !dobravel(c)) return { ...c, verso: null };
      const par: Cartao = emPe ? { ...c, altura: c.altura * 2 } : { ...c, largura: c.largura * 2 };
      original.set(par, c);
      return par;
    });
    const r = montarFolhas(pares);
    const paginas = r.paginas.map((p) =>
      p.flatMap((k): Colocado[] => {
        const c = original.get(k.c);
        if (!c) return [k];
        const v = versoDe(c)!;
        if (emPe)
          return k.girado
            ? [
                { c, x: k.x, y: k.y, girado: true, dobra: "topo" },
                { c: v, x: k.x + c.altura, y: k.y, girado: true, sentido: -1 },
              ]
            : [
                { c: v, x: k.x, y: k.y, invertido: true },
                { c, x: k.x, y: k.y + c.altura, dobra: "topo" },
              ];
        return k.girado
          ? [
              { c, x: k.x, y: k.y, girado: true },
              { c: v, x: k.x, y: k.y + c.largura, girado: true, dobra: "esquerda" },
            ]
          : [
              { c, x: k.x, y: k.y },
              { c: v, x: k.x + c.largura, y: k.y, dobra: "esquerda" },
            ];
      }),
    );
    // a pair bigger than the sheet either way: front and back on their own (to glue), never left out
    const soltos = r.grandes.flatMap((g) => {
      const c = original.get(g);
      return c ? [{ ...c, verso: null }, versoDe(c)!] : [g];
    });
    const extra = soltos.length ? montarFolhas(soltos) : { paginas: [], grandes: [] };
    return { paginas: [...paginas, ...extra.paginas], grandes: extra.grandes, soltos: r.grandes.length };
  };
  const deLado = montar(false);
  const emPe = montar(true);
  // fewest cards left out, then fewest pairs that could not be folded, then fewest sheets
  const nota = (r: typeof deLado) => r.grandes.length * 1e6 + r.soltos * 1e3 + r.paginas.length;
  const { paginas, grandes } = nota(emPe) < nota(deLado) ? emPe : deLado;
  return { paginas, grandes };
}

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
  // round and seasonal shapes keep their orientation (a tree lying down is wrong)
  const giravel = (c: Cartao) => c.forma !== "redondo" && !ehFigura(c.forma) && c.largura !== c.altura;
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
  return { paginas: paginas.map(centrarPagina), grandes };
}
