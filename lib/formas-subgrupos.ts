import type { Categoria } from "./formas-categorias";

// Sub-groups inside the builder's shape tabs (2026-11-03, user: "dentro de
// bichos tem gato, tem cachorro… quero uma subdivisão… cachorro (abre só trama
// de cachorro)… nem todos precisa dividir"). Each tab lists its sub-groups in
// order; a shape goes to the FIRST one whose `re` matches its accent-free
// label or its key. Whatever matches nothing falls into "Outros". Tabs with
// no entry here show no sub-group chips.

type Sub = { valor: string; rotulo: string; re: RegExp };

export const SUBGRUPOS: Partial<Record<Categoria, Sub[]>> = {
  bichos: [
    { valor: "gatos", rotulo: "Gatos", re: /\bgat|ph-cat\b|^gato/ },
    { valor: "cachorros", rotulo: "Cachorros", re: /cachorr|salsicha|ossinho|ph-dog\b|\blobo/ },
    { valor: "passaros", rotulo: "Pássaros", re: /passar|beija|tucano|arara|papagaio|pomba|aguia|cisne|coruja|\bpatos?\b|patinho|galinha|\bgalo\b|pintinho|pinguim|pavao|\bperu\b/ },
    { valor: "insetos", rotulo: "Insetos e bichinhos", re: /borbolet|joaninha|abelha|besouro|inseto|formiga|libelula|grilo|vaga-lume|lagarta|aranha|minhoca|lesma|caracol/ },
    { valor: "fazenda", rotulo: "Fazenda", re: /vaquinha|cavalo|ovelha|porquinho|burrinho|cabrinha|coelh/ },
    { valor: "selvagens", rotulo: "Selvagens", re: /girafa|elefante|leao|macaco|zebra|panda|raposa|coala|canguru|camelo|hipopotamo|jacare|tigre|onca|gorila|rinoceronte|urs|preguica|capivara|tatu|mico|quati|lontra|veado|cervo|esquilo|ourico|tamandua|lhama|lagarto|cobra|camaleao|ratinho|morcego|dinossauro|sapinho|unicornio/ },
    { valor: "patinhas", rotulo: "Patinhas e pegadas", re: /pata|pegada/ },
  ],
  mar: [
    { valor: "peixes", rotulo: "Peixes", re: /peix|tubarao|moreia|baiacu|arraia|sardinha|ph-fish|anzol|vara de pescar/ },
    { valor: "tartarugas", rotulo: "Tartarugas", re: /tartaruga|jabuti/ },
    { valor: "bichos-mar", rotulo: "Bichos do mar", re: /polvo|lula|agua-viva|caranguejo|siri|lagosta|camara|estrela-do-mar|ourico|coral|anemona|alga|tartaruga|cavalo-marinho|baleia|golfinho|orca|foca|gaivota|pelicano|flamingo/ },
    { valor: "conchas", rotulo: "Conchas", re: /concha|vieira|buzio|nautilo|ostra/ },
    { valor: "barcos", rotulo: "Barcos", re: /barco|navio|caravela|veleiro|bote|caiaque|submarino|jet ski|stand-up|remo|leme|ancora/ },
    { valor: "piratas", rotulo: "Piratas e sereias", re: /pirata|mapa|luneta|tesouro|garrafa|tridente|sereia/ },
    { valor: "praia", rotulo: "Praia", re: /guarda-sol|chinelo|bola de praia|castelo|balde|biquini|boia|cooler|cadeira|toalha|protetor|rede|quiosque|barraca|oculos|chapeu|pegadas|salva-vidas|perigo|coco|coqueiro|ilha|mergulho|pes de pato/ },
    { valor: "ondas", rotulo: "Ondas e surfe", re: /onda|surf|bodyboard|por do sol|sol de oculos|farol/ },
  ],
  comidas: [
    { valor: "frutas", rotulo: "Frutas", re: /abacaxi|melancia|maca\b|cerej|banana|morango|\buva|abacate|limao|kiwi|pera\b|manga|pessego|maracuja|mirtilo|laranja|bolota|agua de coco/ },
    { valor: "doces", rotulo: "Doces e sorvetes", re: /sorvete|picole|cupcake|bolo|rosquinha|pirulito|brigadeiro|churros|macaron|chocolate|\bbala\b|algodao|torta|waffle|panqueca|pascoa|casquinha|biscoito|mel\b/ },
    { valor: "bebidas", rotulo: "Bebidas", re: /xicara|cafe|suco|milk|caipirinha|latinha|leite|\bcha\b|copo|vinho|drinque|brinde|chope|acai/ },
    { valor: "legumes", rotulo: "Legumes e verduras", re: /cenoura|pimenta|tomate|brocolis|cebola|\balho\b|milho|rabanete/ },
    { valor: "salgados", rotulo: "Salgados e pratos", re: /./ },
  ],
  esportes: [
    { valor: "futebol", rotulo: "Futebol", re: /^bola$|chuteira|\bgol\b|campo|escanteio|goleiro|bola classica|torcedor|torcida|camisa|chute|juiz|apito|cartoes|placar|bola na rede|futevolei/ },
    { valor: "quadra", rotulo: "Bolas e raquetes", re: /basquete|volei|tenis|raquete|beach|pingue|handebol|quadra|cesta|frescobol|peteca|beisebol|oval|boliche|sinuca|golfe|hoquei|capacete$|bola/ },
    { valor: "radicais", rotulo: "Rodas e radicais", re: /skat|patins|bicicleta|bike|pedal|ciclista|volante|surf|prancha|snowboard|esquiador|frisbee|largada|chegada|quadriculado/ },
    { valor: "luta", rotulo: "Luta e academia", re: /boxe|judo|quimono|halter|kettlebell|musculacao|barra fixa|ioga|pilates|corda|tai chi|punho|berimbau/ },
    { valor: "agua", rotulo: "Água", re: /nada|piscina|raias|canoagem|natacao/ },
    { valor: "premios", rotulo: "Troféus e medalhas", re: /taca|trofeu|medalha|primeiro|ranking|podio/ },
  ],
  natureza: [
    { valor: "flores", rotulo: "Flores", re: /flor|margarida|tulipa|lotus|girassol|rosa\b|hibisco|lavanda|dente-de-leao|cerejeira/ },
    { valor: "plantas", rotulo: "Plantas e árvores", re: /folh|arvore|pinheir|ramo|costela|samambaia|bambu|folhagem|cacto|saguaro|capim|palmeira|bonsai|arbusto|semente|broto|planta|trevo|pinha|tronco|trigo|cogumelo|vaso|pedras|galhos/ },
    { valor: "ceu", rotulo: "Sol, lua e estrelas", re: /\bsol|lua|estrel|eclipse|planeta|brilho|ceu|fases/ },
    { valor: "paisagens", rotulo: "Paisagens", re: /montanha|boneco de neve|vulcao|cachoeira|serra|por do sol|fogueira|ninho|pegada/ },
    { valor: "tempo", rotulo: "Chuva, neve e nuvens", re: /nuvem|nuvenzinha|chuva|gota|neve|floco|tempestade|tornado|vento|redemoinho|relampago|raio|arco-iris|guarda-chuva/ },
  ],
  divertidos: [
    { valor: "musica", rotulo: "Música", re: /nota|violao|fone|microfone|vinil|cassete|radio|piano/ },
    { valor: "veiculos", rotulo: "Veículos", re: /aviao|foguete|carr|patinete|lambreta|onibus|trem|trator|caminhao|paraquedas|\bmoto\b|\bvan\b|jipe|disco voador|aviaozinho/ },
    { valor: "jogos", rotulo: "Jogos e brinquedos", re: /dado|controle|joystick|videogame|quebra-cabeca|espadas|paus|ficha|bonequinho|pipa|balao|bolhas|presente|confete|fogos|robo|alien|fantasm|caveira|espada|castelo|varinha|unicornio/ },
    { valor: "amor", rotulo: "Corações e carinhas", re: /coraca|carinha|sorriso|cupido|paz e amor|mascara/ },
    { valor: "moda", rotulo: "Moda", re: /oculos|vestido|salto|meia|batom|sacola|mochila|tiara|coroa|lacinho/ },
  ],
  geometricos: [
    { valor: "circulos", rotulo: "Círculos", re: /circul|aneis|esfera|elipse|pilula|semicirculo|infinito|espiral|corrente|alvo|olho/ },
    { valor: "triangulos", rotulo: "Triângulos e estrelas", re: /triangul|estrela|piramide|zigurate|sierpinski|pontas|pentagono|hexagono|octogono|poligono|favo|escamas/ },
    { valor: "quadrados", rotulo: "Quadrados e losangos", re: /quadrad|losango|cubo|cantoneira|trapezio|paralelogramo|cilindro|gravata/ },
    { valor: "oticos", rotulo: "Ilusão de ótica", re: /otic|labirinto|hilbert|raios|perspectiva|xadrez|curva/ },
    { valor: "simbolos", rotulo: "Símbolos e setas", re: /./ },
  ],
  basicos: [
    { valor: "bolinhas", rotulo: "Bolinhas", re: /bolinha|pontilh|pontos|pontinhos|bolhas|bolas|argolinhas/ },
    { valor: "xadrez", rotulo: "Xadrez", re: /xadrez|quadricul|tarta|pied|argyle|grade|quadradinhos|quadrados|trama|tijolo|ladrilho|cesto/ },
    { valor: "listras", rotulo: "Listras", re: /listra|riscas|pijama|\blinhas/ },
    { valor: "faixas", rotulo: "Faixas", re: /faixa|barras|gola|aros|tricolor|bicolor|meio a meio|diagona/ },
    { valor: "molduras", rotulo: "Molduras e cantos", re: /moldura|borda|canto|janela|quadrado no meio|centro|cruz|\bx\b/ },
  ],
  time: [
    { valor: "escudos", rotulo: "Escudos", re: /escudo|distintivo/ },
    { valor: "estrelas", rotulo: "Estrelas e coroas", re: /estrela|coroa|louros/ },
    { valor: "numeros", rotulo: "Números e letras", re: /numero|\bgol\b|\bfc\b/ },
    { valor: "trofeus", rotulo: "Troféus e medalhas", re: /trofeu|medalha|podio|campeao/ },
    { valor: "cruzes", rotulo: "Cruzes e losangos", re: /cruz|losango|chevron/ },
    { valor: "torcida", rotulo: "Torcida", re: /megafone|cachecol|bandeira|flamula|bandeirao|arquibancada|chama|punho|joinha|bone|bracadeira|camisa|bola/ },
  ],
  boho: [
    { valor: "egito", rotulo: "Egito", re: /^egito-/ },
    { valor: "barroco", rotulo: "Barroco", re: /^barroco-/ },
    { valor: "indigena", rotulo: "Indígena", re: /^indigena-/ },
    { valor: "tribal", rotulo: "Tribal e kilim", re: /tribal|tribais|kilim|navajo|asteca|tapete|berbere|kente|shipibo|ikat|mud cloth|ciranda|cestaria|andin|etnicas|barrado/ },
    { valor: "mandalas", rotulo: "Mandalas e sóis", re: /mandala|\bsol|rosacea|medalhao|flor|lotus|cata-sol|petalas|rosa|estrela/ },
    { valor: "penas", rotulo: "Penas e flechas", re: /pena|flecha|seta/ },
    { valor: "misticos", rotulo: "Místicos", re: /olho|hamsa|filtro|arvore da vida|chakana|triscele|ferradura|cristal|teia|lua|bussola|selo|chama/ },
    { valor: "geo-boho", rotulo: "Losangos e ziguezagues", re: /diamante|ziguezague|losango|triangul|ampulheta|escada|piramide|grega|dentes|cruzinhas|escalonado|espinha|totem|caracol/ },
    { valor: "tecidos", rotulo: "Tecidos e franjas", re: /franja|tranca|macrame|contas|tear|ponto cruz|shibori|ondas|bandeirinhas|leque|vaso|coracao/ },
  ],
  animes: [
    { valor: "herois", rotulo: "Heróis e quadrinhos", re: /heroi|teia|aranha|pow|bum|zap|balao|explosao|emblema|raio/ },
    { valor: "japao", rotulo: "Ninja e Japão", re: /ninja|shuriken|kunai|katana|samurai|torii|cerejeira|koi|raposa|dragao oriental|lanterna|leque|fuji|daruma|oni|bento|onigiri|lamen|sushi|dango|gato da sorte|pergaminho/ },
    { valor: "padroes", rotulo: "Padrões japoneses", re: /ichimatsu|asanoha|seigaiha|yagasuri|kagome|chuva de sakura/ },
    { valor: "kawaii", rotulo: "Kawaii", re: /kawaii|carinha|fofo|olhos|raiva|cabelo|panda|pinguim|pintinho|unicornio|estrela sorrindo|nuvenzinha|lua dormindo|arco-iris|cha de bolinhas|chibi|joinha|coracao|laco|raposinha|coelhinho|sapinho|polvinho|baleia|gatinho/ },
    { valor: "robos", rotulo: "Robôs e espaço", re: /robo|alien|disco|foguet|astronauta|portal|planet/ },
    { valor: "games", rotulo: "Games e magia", re: /slime|fantasm|monstrinho|dragaozinho|pocao|espada|vidas|moeda|cogumelo|bau|caveir|bomba|fliperama|chapeu|livro|varinha|cristal|bola de energia|nuvem voadora|bichinho virtual|microfone/ },
  ],
};

const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Sub-group of a shape inside its tab ("outros" when nothing matches; "" when the tab isn't split). */
export function subgrupoDa(categoria: Categoria, valor: string, rotulo: string): string {
  const subs = SUBGRUPOS[categoria];
  if (!subs) return "";
  const texto = semAcento(rotulo);
  return subs.find((s) => s.re.test(texto) || s.re.test(valor))?.valor ?? "outros";
}
