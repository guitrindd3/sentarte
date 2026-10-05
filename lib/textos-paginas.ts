// Editable page texts (2026-10-05, user: "quero editar o Sobre… deve ter
// telas aonde mexo em cada uma das páginas"). Every fixed text on the site's
// pages is listed here with its current wording as the default; the admin's
// "Páginas" screen edits them and saves into SiteContent.paginas (only the
// fields that differ from the default, so improving a default still reaches
// pages nobody customized).
//
// Inside texts: a blank line starts a new paragraph; {preco}, {preco_nome},
// {preco_pix}, {pix}, {parcelas}, {prazo} and {nome} are filled in from the
// shop's terms; [words](whatsapp) / [words](/page) / [words](https://…) become links.

export type Bloco = { titulo: string; texto: string };
export type ValorCampo = string | Bloco[] | string[];

export type Campo =
  | { id: string; rotulo: string; tipo: "linha" | "texto"; dica?: string; max?: number }
  /** A photo: the value is its URL (/catalogo/… once replaced in the admin). */
  | { id: string; rotulo: string; tipo: "imagem"; dica?: string }
  /** Several photos in order (the homepage carousel). */
  | { id: string; rotulo: string; tipo: "fotos"; dica?: string; max: number }
  | {
      id: string;
      rotulo: string;
      tipo: "blocos";
      dica?: string;
      /** Labels for each item's two fields. */
      rotulos: [string, string];
      /** Fixed number of items (e.g. the 4 steps); otherwise items can be added/removed. */
      fixo?: boolean;
    };

export type PaginaEditavel = {
  id: string;
  nome: string;
  caminho: string;
  descricao: string;
  aviso?: string;
  campos: Campo[];
  padrao: Record<string, ValorCampo>;
};

const tituloResumo = (titulo: string, resumo: string) => ({ titulo, resumo });
const camposTituloResumo: Campo[] = [
  { id: "titulo", rotulo: "Título", tipo: "linha", max: 80 },
  { id: "resumo", rotulo: "Texto embaixo do título", tipo: "texto", max: 400 },
];

export const PAGINAS_EDITAVEIS: PaginaEditavel[] = [
  {
    id: "inicio",
    nome: "Página inicial",
    caminho: "/",
    descricao: "Títulos e textos das seções da página inicial. A frase de boas-vindas fica em Textos e contato.",
    campos: [
      {
        id: "carrossel",
        rotulo: "Fotos do topo (passam sozinhas)",
        tipo: "fotos",
        max: 8,
        dica: "As fotos grandes do começo da página. A primeira é a que aparece ao abrir o site. Fotos deitadas (mais largas que altas) ficam melhores.",
      },
      { id: "escolhaTitulo", rotulo: "Título dos 4 cartões de coleção", tipo: "linha", max: 60 },
      { id: "nossasTitulo", rotulo: "Título da faixa que passa sozinha", tipo: "linha", max: 60 },
      { id: "nossasTexto", rotulo: "Texto da faixa que passa sozinha", tipo: "texto", max: 300 },
      { id: "passosTitulo", rotulo: "Título dos passos", tipo: "linha", max: 60 },
      { id: "passos", rotulo: "Os 4 passos", tipo: "blocos", rotulos: ["Título do passo", "Explicação"], fixo: true },
      { id: "frase", rotulo: "Frase de destaque", tipo: "texto", max: 300 },
      { id: "fraseAssinatura", rotulo: "Linha embaixo da frase", tipo: "linha", max: 120 },
      { id: "materialTitulo", rotulo: "Título do material", tipo: "linha", max: 60 },
      { id: "materialFoto", rotulo: "Foto do material", tipo: "imagem", dica: "Fica do lado do texto do material." },
      { id: "materialTexto", rotulo: "Texto do material", tipo: "texto", max: 600 },
      { id: "materialItens", rotulo: "Os 3 destaques do material", tipo: "blocos", rotulos: ["Destaque", "Explicação"], fixo: true },
      { id: "depoimentosTitulo", rotulo: "Título dos depoimentos", tipo: "linha", max: 60 },
      { id: "contatoTitulo", rotulo: "Título do quadro de contato (fim da página)", tipo: "linha", max: 100 },
      { id: "contatoTexto", rotulo: "Texto do quadro de contato", tipo: "texto", max: 300 },
    ],
    padrao: {
      carrossel: ["/photos/carousel-boho-2.jpg", "/photos/carousel-boho.jpg", "/photos/carousel-times.jpg"],
      escolhaTitulo: "Escolha a sua cadeira",
      nossasTitulo: "Nossas cadeiras",
      nossasTexto: "De time, boho ou com o seu desenho preferido — todas trançadas à mão, e qualquer uma pode levar um nome no encosto.",
      passosTitulo: "Como funciona a personalização",
      passos: [
        { titulo: "Escolha o modelo", texto: "De time, boho, com desenho ou uma trama montada do seu jeito." },
        { titulo: "Escolha a cor e a trama", texto: "Cores sólidas, mescladas ou as cores do time do coração." },
        { titulo: "Adicione uma personalização", texto: "Frase, nome ou símbolo, quando o modelo permitir." },
        {
          titulo: "Confirme o resumo",
          texto: "Você revê tudo pelo WhatsApp antes de fechar. Em até {prazo} dias úteis ela fica pronta e segue para a sua casa.",
        },
      ],
      frase: "Uma cadeira boa não é a que impressiona na primeira olhada — é a que continua inteira depois do quinto verão.",
      fraseAssinatura: "Do jeito que a gente pensa cada peça no ateliê.",
      materialTitulo: "A linha que sustenta cada peça",
      materialFoto: "/photos/thread-spools.jpg",
      materialTexto:
        "Trabalhamos com corda náutica 100% polipropileno — um material que não absorve água, por isso não apodrece nem mofa mesmo com contato constante com a maresia. A estrutura é em alumínio, que não enferruja e mantém a cadeira leve e fácil de dobrar e transportar.",
      materialItens: [
        { titulo: "Resistente à maresia", texto: "O polipropileno não absorve água, então não apodrece nem mofa." },
        { titulo: "Estrutura em alumínio", texto: "Não enferruja e mantém a cadeira leve." },
        { titulo: "Trançado à mão", texto: "Cada peça é feita fio a fio, com acabamento firme." },
      ],
      depoimentosTitulo: "Quem já tem a sua",
      contatoTitulo: "Ficou com dúvida sobre modelo, cor ou prazo?",
      contatoTexto: "Fala com a gente antes de fechar o pedido — a gente te ajuda a escolher.",
    },
  },
  {
    id: "sobre",
    nome: "Sobre",
    caminho: "/sobre",
    descricao: "A história do ateliê.",
    campos: [
      ...camposTituloResumo,
      { id: "texto", rotulo: "Texto da página", tipo: "texto", dica: "Deixe uma linha em branco entre os parágrafos.", max: 3000 },
      { id: "foto", rotulo: "Foto do lado do texto", tipo: "imagem", dica: "Uma foto do ateliê, de você trabalhando ou das cadeiras. Fica melhor em pé (mais alta que larga)." },
    ],
    padrao: {
      ...tituloResumo(
        "Sobre o SentArte",
        "Um ateliê pequeno, um processo que não muda de peça para peça: corda náutica, alumínio e muitas horas de trançado à mão."
      ),
      texto: [
        "O SentArte nasceu da vontade de fazer cadeiras de praia que aguentassem mais do que um verão — e que, de quebra, contassem alguma coisa sobre quem senta nelas. Por isso cada cadeira sai personalizada: na cor, na trama ou numa frase trançada no encosto.",
        "O processo não mudou desde a primeira peça: estrutura em alumínio, corda náutica de polipropileno e um trançado feito à mão, fio a fio, sem pressa. É esse cuidado que garante que a cadeira aguente sol, areia e maresia por temporadas seguidas.",
        "Cada cadeira é feita sob encomenda, com um resumo do pedido confirmado com você antes de começar. Fica pronta em até {prazo} dias úteis e segue para qualquer lugar do Brasil.",
      ].join("\n\n"),
      foto: "/photos/sand-texture.jpg",
    },
  },
  {
    id: "contato",
    nome: "Contato",
    caminho: "/contato",
    descricao: "O topo da página de contato. Os botões (WhatsApp, Instagram, Google) vêm de Textos e contato.",
    campos: camposTituloResumo,
    padrao: tituloResumo(
      "Fale com a gente",
      "Todo pedido — orçamento, dúvida de modelo ou prazo — passa pelo WhatsApp. É por lá que a gente confirma cor, trama e personalização antes de começar a trançar."
    ),
  },
  {
    id: "faq",
    nome: "Perguntas frequentes",
    caminho: "/faq",
    descricao: "As perguntas e respostas. A pergunta do desconto por quantidade entra sozinha, a partir do cupom automático.",
    campos: [
      { id: "titulo", rotulo: "Título", tipo: "linha", max: 80 },
      { id: "perguntas", rotulo: "Perguntas", tipo: "blocos", rotulos: ["Pergunta", "Resposta"] },
    ],
    padrao: {
      titulo: "Perguntas frequentes",
      perguntas: [
        {
          titulo: "Como faço um pedido?",
          texto:
            "Pelo WhatsApp ou aqui no site. Você escolhe o modelo, a cor e a personalização (quando o modelo permitir), e a gente confirma um resumo completo antes de começar a trançar.",
        },
        {
          titulo: "Quanto custa uma cadeira?",
          texto:
            "A cadeira de praia sai por {preco}. Com um nome ou outra personalização trançada, sai por {preco_nome}. No Pix tem {pix} de desconto ({preco_pix}), e no cartão dá para parcelar em até {parcelas}x (com a taxa do cartão).",
        },
        {
          titulo: "Quais são as medidas da cadeira?",
          texto:
            "A cadeira fixa tem 73 cm de altura, 54 cm de largura e 53 cm de profundidade, aguenta até 110 kg e pesa de 1,3 a 2 kg. A reclinável (8 posições) tem 88 x 54,5 x 67 cm e aguenta até 100 kg. A infantil tem 49,5 x 41,5 x 39 cm e aguenta até 30 kg. A tabela completa está na página das cadeiras.",
        },
        {
          titulo: "Quanto custa o frete?",
          texto: "Depende de onde você mora. É só colocar o seu CEP no carrinho que o valor e o prazo aparecem na hora, antes de pagar.",
        },
        {
          titulo: "Qual o prazo de produção?",
          texto:
            "Cada cadeira é feita sob encomenda, à mão, e fica pronta em até {prazo} dias úteis depois que o pedido é confirmado. Depois disso, é só o tempo de entrega até você.",
        },
        {
          titulo: "Posso escolher as cores do meu time?",
          texto: "Sim. As cores entram direto na trama, fio a fio — sem adesivo e sem estampa que descasca com o tempo.",
        },
        {
          titulo: "Como faço a manutenção da cadeira?",
          texto:
            "Basta lavar com água e sabão neutro e deixar secar à sombra. A corda náutica não absorve água, então não precisa de nenhum cuidado além disso.",
        },
        {
          titulo: "Como funcionam trocas e devoluções?",
          texto:
            "Consulte os detalhes na página de [trocas e devoluções](/politica-de-troca-e-devolucao). Por serem peças feitas sob medida, a troca por arrependimento segue regras diferentes das de defeito de fabricação.",
        },
      ],
    },
  },
  {
    id: "personalizar",
    nome: "Monte a sua trama",
    caminho: "/personalizar",
    descricao: "O topo da página do montador.",
    campos: [
      { id: "titulo", rotulo: "Título", tipo: "linha", max: 80 },
      { id: "resumo", rotulo: "Texto", tipo: "texto", max: 500 },
    ],
    padrao: tituloResumo(
      "Monte a sua trama",
      "Escolha o modelo, a forma do trançado e as cores para ver uma prévia. Quer um nome ou uma frase trançada junto? É só escrever. Quando estiver do seu jeito, manda pra gente pelo WhatsApp."
    ),
  },
  {
    id: "times",
    nome: "Cadeiras de time",
    caminho: "/times",
    descricao: "O topo da página dos times.",
    campos: camposTituloResumo,
    padrao: tituloResumo(
      "Cadeiras de time",
      "As cores e o escudo do seu time, trançados direto na estrutura — sem adesivo, sem estampa. Escolha com ou sem um nome no encosto."
    ),
  },
  {
    id: "boho",
    nome: "Cadeiras boho",
    caminho: "/boho",
    descricao: "O topo da página boho.",
    campos: camposTituloResumo,
    padrao: tituloResumo("Cadeiras boho", "Estampas boho exclusivas, em tons terrosos — cada padrão é uma trama diferente."),
  },
  {
    id: "desenhos",
    nome: "Animes e desenhos",
    caminho: "/desenhos",
    descricao: "O topo da página de desenhos.",
    campos: camposTituloResumo,
    padrao: tituloResumo(
      "Animes e desenhos",
      "Desenhos, personagens e frases tecidos na cadeira. Os exemplos abaixo são pedidos que já fizemos — conta pra gente o que você tem em mente e a gente tece."
    ),
  },
  {
    id: "envio",
    nome: "Política de envio",
    caminho: "/politica-de-envio",
    descricao: "Prazo de produção, frete e rastreio.",
    campos: [
      { id: "titulo", rotulo: "Título", tipo: "linha", max: 80 },
      { id: "secoes", rotulo: "Partes da página", tipo: "blocos", rotulos: ["Subtítulo", "Texto"] },
    ],
    padrao: {
      titulo: "Envio",
      secoes: [
        {
          titulo: "Produção sob encomenda",
          texto:
            "Cada peça começa a ser trançada só depois que o pedido é confirmado (pagamento aprovado no site ou pedido fechado pelo WhatsApp) e fica pronta em até {prazo} dias úteis. Aí ela já sai para envio.",
        },
        {
          titulo: "Frete",
          texto:
            "Enviamos para todo o Brasil por transportadora ou Correios. O valor e o prazo de entrega são calculados pelo seu CEP, no carrinho, antes de pagar. Também dá para combinar a retirada se você estiver na região.",
        },
        { titulo: "Acompanhamento", texto: "Assim que a peça é despachada, o código de rastreio é enviado pelo mesmo canal do pedido." },
      ],
    },
  },
  {
    id: "trocas",
    nome: "Trocas e devoluções",
    caminho: "/politica-de-troca-e-devolucao",
    descricao: "Regras de defeito, arrependimento e como pedir troca.",
    campos: [
      { id: "titulo", rotulo: "Título", tipo: "linha", max: 80 },
      { id: "secoes", rotulo: "Partes da página", tipo: "blocos", rotulos: ["Subtítulo", "Texto"] },
    ],
    padrao: {
      titulo: "Trocas e devoluções",
      secoes: [
        {
          titulo: "Defeito de fabricação",
          texto:
            "Se a peça chegar com defeito de fabricação — na trama, na estrutura ou na personalização combinada — entre em contato em até 7 dias corridos após o recebimento. Vamos avaliar o caso e resolver com reparo, troca ou reembolso.",
        },
        {
          titulo: "Arrependimento",
          texto:
            "Como cada peça é feita sob medida — na cor, na trama ou com uma personalização específica — pedidos personalizados não entram na troca por simples arrependimento depois que a produção é iniciada. Peças sem personalização seguem o direito de arrependimento em até 7 dias após o recebimento, conforme o Código de Defesa do Consumidor.",
        },
        {
          titulo: "Como pedir uma troca",
          texto: "Toda solicitação é feita pelo mesmo canal do pedido — [fale com a gente pelo WhatsApp](whatsapp) com fotos da peça e o número do pedido.",
        },
      ],
    },
  },
  {
    id: "privacidade",
    nome: "Política de privacidade",
    caminho: "/politica-de-privacidade",
    descricao: "O que o site guarda e por quê.",
    aviso:
      "Esta página precisa dizer a verdade sobre o que o site guarda (exigência da LGPD). Pode mudar o jeito de escrever, mas não tire informações. Se o site passar a guardar algo novo, me avise para atualizar.",
    campos: [
      { id: "titulo", rotulo: "Título", tipo: "linha", max: 80 },
      { id: "intro", rotulo: "Texto de abertura", tipo: "texto", max: 800 },
      { id: "secoes", rotulo: "Partes da página", tipo: "blocos", rotulos: ["Subtítulo", "Texto"] },
    ],
    padrao: {
      titulo: "Política de privacidade",
      intro:
        "O {nome} não tem cadastro de clientes: os pedidos são feitos pelo WhatsApp, pelo Instagram ou pagos aqui no site pelo Mercado Pago. Esta página explica quais dados são coletados e como eles são usados.",
      secoes: [
        {
          titulo: "Quais dados coletamos",
          texto:
            "Ao entrar em contato, você compartilha conosco o número de WhatsApp, o nome, e as informações necessárias para produzir seu pedido — como modelo, cor, personalização e endereço de entrega quando aplicável.",
        },
        {
          titulo: "Como usamos esses dados",
          texto:
            "Usamos essas informações apenas para produzir e entregar seu pedido, e para responder dúvidas relacionadas a ele. Não vendemos nem compartilhamos seus dados com terceiros para fins de marketing.",
        },
        {
          titulo: "Estatísticas de visita",
          texto:
            "Para melhorar o site, registramos de forma anônima quantas pessoas visitam, quais páginas são vistas, o que é pesquisado, em quais botões clicam, a cidade aproximada e se o acesso é pelo celular ou pelo computador. Também guardamos o caminho de cada visita (por exemplo: “abriu Cadeiras de time, colocou uma cadeira no carrinho”), ligado só a um código aleatório que fica no seu navegador enquanto a aba está aberta. Não usamos cookies para isso e não guardamos seu nome, IP ou qualquer dado que identifique você. Os números ficam guardados por até 13 meses e o caminho das visitas por 30 dias.",
        },
        {
          titulo: "Pedidos pagos pelo site",
          texto:
            "Quando você clica em pagar, guardamos seu nome, WhatsApp, cidade e os itens do pedido por até 6 meses, para confirmar o pagamento e falar com você sobre ele, inclusive se o pagamento não for concluído.",
        },
        {
          titulo: "Lista de novidades",
          texto:
            "Se você se cadastrar para receber novidades e cupons, guardamos seu nome e WhatsApp só para isso. Para sair da lista, é só pedir pelo WhatsApp que a gente apaga na hora.",
        },
        {
          titulo: "Avaliações",
          texto:
            "Se você avaliar a sua cadeira aqui no site, seu nome, a cidade (se informar), as estrelas e o comentário aparecem na página inicial depois que o ateliê conferir. Para tirar a sua avaliação, é só pedir pelo WhatsApp.",
        },
        {
          titulo: "Seus direitos",
          texto:
            "Você pode pedir a qualquer momento para saber quais dados temos sobre você, corrigi-los ou solicitar a exclusão, conforme a Lei Geral de Proteção de Dados (LGPD). Basta [enviar uma mensagem no WhatsApp](whatsapp).",
        },
      ],
    },
  },
  {
    id: "termos",
    nome: "Termos de uso",
    caminho: "/termos-de-uso",
    descricao: "Regras de uso do site.",
    campos: [
      { id: "titulo", rotulo: "Título", tipo: "linha", max: 80 },
      { id: "intro", rotulo: "Texto de abertura", tipo: "texto", max: 800 },
      { id: "secoes", rotulo: "Partes da página", tipo: "blocos", rotulos: ["Subtítulo", "Texto"] },
    ],
    padrao: {
      titulo: "Termos de uso",
      intro:
        "Este site apresenta os modelos, materiais e o processo de personalização do {nome}. A compra pode ser paga aqui no site, pelo Mercado Pago, ou combinada pelo WhatsApp ou Instagram — em todos os casos, cor, trama e personalização são confirmadas com você antes da produção.",
      secoes: [
        {
          titulo: "Sobre os modelos exibidos",
          texto:
            "As tramas e combinações de cor mostradas no site são ilustrativas do processo de personalização. Cada peça é feita sob encomenda, e pequenas variações de tom entre o que é exibido e o produto final podem ocorrer, por se tratar de um processo artesanal.",
        },
        {
          titulo: "Uso do conteúdo",
          texto:
            "Textos, imagens e o material trançado apresentado neste site pertencem ao {nome} e não podem ser reproduzidos comercialmente sem autorização.",
        },
        { titulo: "Alterações", texto: "Estes termos podem ser atualizados sem aviso prévio. A versão vigente é sempre a publicada nesta página." },
      ],
    },
  },
];

export const paginaEditavel = (id: string) => PAGINAS_EDITAVEIS.find((p) => p.id === id);

export type TextosSalvos = Record<string, Record<string, ValorCampo>>;

/** The page's texts: saved values over the defaults, field by field. */
export function textosDaPagina(salvos: TextosSalvos | undefined, id: string) {
  const pg = paginaEditavel(id);
  if (!pg) throw new Error(`página desconhecida: ${id}`);
  const s = salvos?.[id] ?? {};
  const out: Record<string, ValorCampo> = {};
  for (const c of pg.campos) {
    const v = s[c.id];
    const ok =
      c.tipo === "blocos"
        ? Array.isArray(v) && (!c.fixo || v.length === (pg.padrao[c.id] as Bloco[]).length)
        : c.tipo === "fotos"
          ? Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string")
          : typeof v === "string";
    out[c.id] = ok ? v : pg.padrao[c.id];
  }
  return {
    linha: (campo: string) => String(out[campo] ?? ""),
    blocos: (campo: string) => (Array.isArray(out[campo]) ? (out[campo] as Bloco[]) : []),
    fotos: (campo: string) => (Array.isArray(out[campo]) ? (out[campo] as string[]) : []),
  };
}
