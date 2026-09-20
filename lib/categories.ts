export type Modelo = {
  nome: string;
  descricao: string;
  cores: [string, string];
};

export type Categoria = {
  slug: string;
  titulo: string;
  resumo: string;
  intro: string;
  parent?: string;
  modelos: Modelo[];
};

const CADEIRA_BASE_MODELOS: Modelo[] = [
  {
    nome: "Trama lisa",
    descricao: "Um fio, uma cor, acabamento limpo. A base de toda cadeira Sentarte.",
    cores: ["#15564C", "#0E3E37"],
  },
  {
    nome: "Trama mesclada",
    descricao: "Duas cores intercaladas fio a fio, para quem não abre mão de um contraste.",
    cores: ["#BD502E", "#EDE3D0"],
  },
  {
    nome: "Time do coração",
    descricao: "Cores e brasão do seu time, trançados na estrutura — sem adesivo, sem estampa.",
    cores: ["#16222B", "#BD502E"],
  },
  {
    nome: "Frase personalizada",
    descricao: "Um nome, uma data ou uma frase curta, trançada no encosto.",
    cores: ["#A9835A", "#241C15"],
  },
];

export const CATEGORIAS: Categoria[] = [
  {
    slug: "cadeiras",
    titulo: "Cadeiras de praia",
    resumo: "Personalizadas, de time ou em tramas exclusivas.",
    intro:
      "A peça que começou o Sentarte. Estrutura em alumínio, assento e encosto trançados à mão em corda náutica, dobrável para caber no porta-malas e resistente para durar temporadas de sol e maresia.",
    modelos: CADEIRA_BASE_MODELOS,
  },
  {
    slug: "cadeiras-personalizadas",
    titulo: "Cadeiras personalizadas",
    resumo: "Cor, trama e uma frase ou tema à sua escolha.",
    intro:
      "Escolha o modelo e a cor, e quando fizer sentido, adicione uma frase, um nome ou um símbolo. Antes de fechar o pedido, você recebe pelo WhatsApp um resumo completo da personalização — nada se perde no meio do caminho.",
    parent: "cadeiras",
    modelos: CADEIRA_BASE_MODELOS.filter((m) =>
      ["Trama mesclada", "Frase personalizada"].includes(m.nome)
    ),
  },
  {
    slug: "cadeiras-times",
    titulo: "Cadeiras de time",
    resumo: "As cores do seu clube, trançadas na estrutura.",
    intro:
      "Nada de adesivo que descasca ou estampa que desbota. As cores do time entram direto na trama, fio a fio, no mesmo processo de qualquer outra cadeira Sentarte.",
    parent: "cadeiras",
    modelos: CADEIRA_BASE_MODELOS.filter((m) => m.nome === "Time do coração"),
  },
  {
    slug: "cadeiras-tramas",
    titulo: "Tramas exclusivas",
    resumo: "Combinações de cor pensadas pelo ateliê.",
    intro:
      "Uma seleção de combinações de cor testadas pelo ateliê para quem prefere escolher entre curadoria pronta em vez de montar a personalização do zero.",
    parent: "cadeiras",
    modelos: CADEIRA_BASE_MODELOS.filter((m) =>
      ["Trama lisa", "Trama mesclada"].includes(m.nome)
    ),
  },
  {
    slug: "bolsas",
    titulo: "Bolsas",
    resumo: "No mesmo trançado das cadeiras, para levar tudo pra praia.",
    intro:
      "Feitas com a mesma corda náutica das cadeiras, em tamanhos para o dia a dia ou para o dia de praia inteiro. Forro interno e alça reforçada para aguentar o peso da bolsa cheia.",
    modelos: [
      {
        nome: "Bolsa dia a dia",
        descricao: "Tamanho médio, alça de ombro, para o uso do dia a dia.",
        cores: ["#A9835A", "#EDE3D0"],
      },
      {
        nome: "Bolsa de praia",
        descricao: "Grande, com espaço para canga, protetor e o que mais precisar levar.",
        cores: ["#15564C", "#BD502E"],
      },
      {
        nome: "Trama mesclada",
        descricao: "Duas cores intercaladas, combinando com a cadeira personalizada.",
        cores: ["#16222B", "#A9835A"],
      },
    ],
  },
  {
    slug: "espreguicadeiras",
    titulo: "Espreguiçadeiras",
    resumo: "Para quem não abre mão do conforto.",
    intro:
      "Estrutura maior e reclinável, para quem quer passar a tarde inteira na praia ou na piscina sem sair do lugar. Mesma trama resistente à maresia, mesmo acabamento à mão.",
    modelos: [
      {
        nome: "Trama lisa",
        descricao: "Uma cor só, acabamento limpo, do jeito que combina com qualquer varanda.",
        cores: ["#15564C", "#0E3E37"],
      },
      {
        nome: "Trama mesclada",
        descricao: "Duas cores intercaladas, para dar mais presença à peça.",
        cores: ["#BD502E", "#EDE3D0"],
      },
    ],
  },
];

export function getCategoria(slug: string) {
  return CATEGORIAS.find((c) => c.slug === slug);
}

export function getSubcategorias(parentSlug: string) {
  return CATEGORIAS.filter((c) => c.parent === parentSlug);
}
