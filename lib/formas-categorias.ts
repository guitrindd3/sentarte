// The six tabs of the "Monte a sua trama" shape grid (2026-10-09, user: "coloca 6
// categorias e divide as imagens... tem de animal, de formas... verifique aonde
// mais se encaixam"). The shape batches still declare their original four groups;
// MUDOU moves the ones that fit better elsewhere, so a shape's key never changes
// (old /c links keep working) — only the tab it shows up in.

export type Categoria = "basicos" | "geometricos" | "time" | "boho" | "bichos" | "divertidos";

/** `curto` is what phones show (two rows of three). */
export const CATEGORIAS: { valor: Categoria; rotulo: string; curto: string }[] = [
  { valor: "basicos", rotulo: "Básicos", curto: "Básicos" },
  { valor: "geometricos", rotulo: "Geométricos", curto: "Geométricos" },
  { valor: "time", rotulo: "Estilo time", curto: "Time" },
  { valor: "boho", rotulo: "Estilo boho", curto: "Boho" },
  { valor: "bichos", rotulo: "Bichos", curto: "Bichos" },
  { valor: "divertidos", rotulo: "Divertidos", curto: "Divertidos" },
];

const para = (c: Categoria, valores: string) => valores.split(/\s+/).filter(Boolean).map((v) => [v, c] as const);

const MUDOU: Record<string, Categoria> = Object.fromEntries([
  ...para("basicos", `argyle aros aros-5 bicolor-diagonal diagonal-invertida duas-diagonais duas-faixas duas-faixas-em-pe faixa-central faixa-diagonal faixa-lateral faixa-v faixa-vertical faixa-x gola-v listrado-5 listras-largas listras-nos-lados meio-a-meio meio-a-meio-deitado quadrantes trama-cruzada triangulos-laterais tricolor-diagonal tricolor-horizontal tricolor-vertical`),
  ...para("geometricos", `alvo-quadrado aneis aneis-tracejados cantoneiras cata-vento circulo-cheio circulo-em-quatro circulo-grande circulo-listrado circulo-no-quadrado circulos-concentricos circulos-entrelacados circulos-oticos corrente cruz-vazada curva curva-de-hilbert dois-circulos escamas espiral-redonda estrela-oito estrela-vazada favo gravata-borboleta hexagono ic-aperture ic-arrow-u-up-left ic-arrows-clockwise ic-arrows-out-cardinal ic-arrows-split ic-asterisk ic-at ic-atom ic-barcode ic-bezier-curve ic-check-fat ic-circle-half ic-circle-half-tilt ic-circles-four ic-command ic-compass-tool ic-crosshair ic-cube ic-cube-transparent ic-cylinder ic-diamonds-four ic-dna ic-exclamation-mark ic-exclude ic-fingerprint ic-gear ic-graph ic-hash ic-heartbeat ic-intersect ic-keyhole ic-line-segments ic-pencil-ruler ic-pentagon ic-percent ic-perspective ic-pi ic-polygon ic-power ic-prohibit ic-qr-code ic-question-mark ic-recycle ic-scribble-loop ic-shapes ic-shuffle ic-sigma ic-sphere ic-spinner ic-square-half ic-star-half ic-tree-structure ic-unite ic-wave-sawtooth ic-wave-square ic-waveform ic-yin-yang infinito labirinto labirinto-curvo losango-bicolor losango-cheio octogono olho paralelogramo pilula piramide-vista-de-cima pontos-em-espiral quadrado-e-losango quadrado-losango quadrado-vazado quadrados-concentricos quadrados-sobrepostos quatro-pontas raios-oticos semicirculo seta-dupla seta-grande sierpinski tapete-sierpinski trapezio tres-circulos triangulo-cheio triangulo-vazado xadrez-circular xadrez-otico xadrez-redondo zigurate`),
  ...para("time", `bandeira-chegada`),
  ...para("bichos", `baleia boho-beija-flor boho-cavalo-marinho boho-cervo boho-cobra boho-lagarto boho-lhama boho-peixe-tribal borboleta caranguejo estrela-do-mar fig-abelha fig-cachorro fig-caracol fig-coelho fig-coruja fig-dinossauro fig-joaninha fig-passaro fig-pato fig-pinguim fig-porquinho fig-sapo fig-tubarao fig-urso flamingo gatinho gato-apaixonado gato-bravo gato-deitado gato-espiando gato-olhao gato-patinha gato-patinha-oi gato-patinha-tchau gato-pulando gato-sentado gato-sonolento ic-bone ic-bug-beetle ic-cow ic-footprints ic-horse passaro-trovao passaros pata peixe peixinhos polvo tartaruga`),
  ...para("divertidos", `coracao-listrado estrela-cadente`),
]);

/** The tab a shape shows up in. */
export function categoriaDa(valor: string, grupoOriginal: Categoria): Categoria {
  return MUDOU[valor] ?? grupoOriginal;
}
