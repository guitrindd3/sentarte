// The ten tabs of the "Monte a sua trama" shape grid. 2026-10-09: six tabs
// ("coloca 6 categorias... tem de animal, de formas"), then ten the same day
// ("quero 10 opções, cada um com 100 imagens"). The shape batches still declare
// the group they were born in; MUDOU moves each shape to the tab where it fits
// best, so a shape's key never changes (old /c links keep working) — only the
// tab it shows up in.

export type Categoria =
  | "basicos"
  | "geometricos"
  | "time"
  | "esportes"
  | "boho"
  | "natureza"
  | "bichos"
  | "mar"
  | "comidas"
  | "divertidos";

/** `curto` is what phones show (rows of tabs). */
export const CATEGORIAS: { valor: Categoria; rotulo: string; curto: string }[] = [
  { valor: "basicos", rotulo: "Básicos", curto: "Básicos" },
  { valor: "geometricos", rotulo: "Geométricos", curto: "Geométricos" },
  { valor: "time", rotulo: "Estilo time", curto: "Time" },
  { valor: "esportes", rotulo: "Esportes", curto: "Esportes" },
  { valor: "boho", rotulo: "Estilo boho", curto: "Boho" },
  { valor: "natureza", rotulo: "Natureza", curto: "Natureza" },
  { valor: "bichos", rotulo: "Bichos", curto: "Bichos" },
  { valor: "mar", rotulo: "Praia e mar", curto: "Praia e mar" },
  { valor: "comidas", rotulo: "Comidas", curto: "Comidas" },
  { valor: "divertidos", rotulo: "Divertidos", curto: "Divertidos" },
];

const para = (c: Categoria, valores: string) => valores.split(/\s+/).filter(Boolean).map((v) => [v, c] as const);

const MUDOU: Record<string, Categoria> = Object.fromEntries([
  ...para("basicos", `argyle aros aros-5 bicolor-diagonal diagonal-invertida duas-diagonais duas-faixas duas-faixas-em-pe faixa-central faixa-diagonal faixa-lateral faixa-v faixa-vertical faixa-x gola-v listrado-5 listras-largas listras-nos-lados meio-a-meio meio-a-meio-deitado quadrantes trama-cruzada triangulos-laterais tricolor-diagonal tricolor-horizontal tricolor-vertical`),
  ...para("geometricos", `alvo-quadrado aneis aneis-tracejados cantoneiras cata-vento circulo-cheio circulo-em-quatro circulo-grande circulo-listrado circulo-no-quadrado circulos-concentricos circulos-entrelacados circulos-oticos corrente cruz-vazada curva curva-de-hilbert dois-circulos escamas espiral-redonda estrela-oito estrela-vazada favo gravata-borboleta hexagono ic-aperture ic-arrow-u-up-left ic-arrows-clockwise ic-arrows-out-cardinal ic-arrows-split ic-asterisk ic-at ic-atom ic-barcode ic-bezier-curve ic-check-fat ic-circle-half ic-circle-half-tilt ic-circles-four ic-command ic-compass-tool ic-crosshair ic-cube ic-cube-transparent ic-cylinder ic-diamonds-four ic-dna ic-exclamation-mark ic-exclude ic-fingerprint ic-gear ic-graph ic-hash ic-heartbeat ic-intersect ic-keyhole ic-line-segments ic-pencil-ruler ic-pentagon ic-percent ic-perspective ic-pi ic-polygon ic-power ic-prohibit ic-qr-code ic-question-mark ic-recycle ic-scribble-loop ic-shapes ic-shuffle ic-sigma ic-sphere ic-spinner ic-square-half ic-star-half ic-tree-structure ic-unite ic-wave-sawtooth ic-wave-square ic-waveform ic-yin-yang infinito labirinto labirinto-curvo losango-bicolor losango-cheio octogono olho paralelogramo pilula piramide-vista-de-cima pontos-em-espiral quadrado-e-losango quadrado-losango quadrado-vazado quadrados-concentricos quadrados-sobrepostos quatro-pontas raios-oticos semicirculo seta-dupla seta-grande sierpinski tapete-sierpinski trapezio tres-circulos triangulo-cheio triangulo-vazado xadrez-circular xadrez-otico xadrez-redondo zigurate`),
  ...para("esportes", `apito bandeira-chegada bandeira-escanteio bandeira-quadriculada bola bola-basquete campo chuteira cronometro esporte-beach-tennis esporte-cartoes esporte-cesta esporte-garrafinha esporte-kettlebell esporte-patins esporte-placar esporte-primeiro-lugar esporte-rede-volei esporte-skate fig-bicicleta fig-tenis gol ic-barbell ic-baseball ic-baseball-helmet ic-bowling-ball ic-boxing-glove ic-court-basketball ic-football ic-football-helmet ic-golf ic-hockey ic-person-simple-run ic-ping-pong ic-racquet ic-sneaker-move ic-soccer-ball ic-target ic-tennis-ball ic-volleyball luva-goleiro prancha`),
  ...para("natureza", `arco-iris bambu boho-lavanda boho-pampas boho-saguaro boho-vaso-com-galhos cacto cogumelo costela-de-adao estrela estrela-cadente estrelinhas fases-da-lua fig-arvore fig-pinheiro fig-tulipa flor flor-de-lotus folha folhagem girassol gota ic-campfire ic-cloud-sun ic-clover ic-flower ic-hurricane ic-plant ic-potted-plant ic-rainbow-cloud ic-snowflake ic-sparkle ic-sun-horizon ic-wind lua lua-e-estrelas lua-e-montanha margarida montanhas nuvem pinha planeta raio ramo samambaia sementes sol-e-lua sol-nascente`),
  ...para("bichos", `boho-beija-flor boho-cervo boho-cobra boho-lagarto boho-lhama borboleta fig-abelha fig-cachorro fig-caracol fig-coelho fig-coruja fig-dinossauro fig-joaninha fig-passaro fig-pato fig-pinguim fig-porquinho fig-sapo fig-urso gatinho gato-apaixonado gato-bravo gato-deitado gato-espiando gato-olhao gato-patinha gato-patinha-oi gato-patinha-tchau gato-pulando gato-sentado gato-sonolento ic-bone ic-bug-beetle ic-cow ic-footprints ic-horse passaro-trovao passaros pata`),
  ...para("mar", `ancora baleia barco bicho-agua-viva bicho-arraia bicho-baiacu bicho-camarao bicho-foca bicho-gaivota bicho-golfinho bicho-lagosta bicho-peixe-palhaco bicho-siri boho-cavalo-marinho boho-peixe-tribal bola-de-praia caranguejo chinelos concha coqueiro estrela-do-mar farol fig-balde-e-pa fig-biquini fig-boia fig-castelo-de-areia fig-chapeu-de-palha fig-coco fig-tubarao flamingo guarda-sol ic-island nautilo onda-grande peixe peixinhos polvo tartaruga`),
  ...para("comidas", `abacaxi cereja cupcake fig-abacate fig-acai fig-banana fig-bolo fig-hamburguer fig-milho fig-morango fig-ovo-frito fig-pastel fig-pirulito fig-rosquinha fig-uva fig-xicara ic-acorn ic-bread ic-carrot ic-cheese ic-cookie ic-onigiri ic-pepper ic-popcorn maca melancia picole pizza sorvete`),
  ...para("divertidos", `coracao-listrado`),
]);

/** The tab a shape shows up in. */
export function categoriaDa(valor: string, grupoOriginal: Categoria): Categoria {
  return MUDOU[valor] ?? grupoOriginal;
}
