export type Modelo = {
  id: string;
  nome: string;
  descricao: string;
  corA: string;
  corB: string;
  imagemUrl?: string;
  /** Extra photos showing the same model in other color arrangements. */
  variantes?: string[];
};

export type Categoria = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string;
  intro: string;
  corA: string;
  corB: string;
  modelos: Modelo[];
};

export type SiteContent = {
  site: {
    nome: string;
    descricao: string;
    whatsappNumero: string;
    instagramHandle: string;
  };
  hero: {
    titulo: string;
    subtitulo: string;
    tags: string[];
  };
  categorias: Categoria[];
};

export const DEFAULT_CONTENT: SiteContent = {
  site: {
    nome: "Sentarte",
    descricao:
      "Cadeiras de praia, bolsas e espreguiçadeiras trançadas à mão, em corda náutica e alumínio, com modelo, cor e personalização escolhidos por você.",
    whatsappNumero: "5527995201669",
    instagramHandle: "ateliesentarte",
  },
  hero: {
    titulo: "Ateliê Sentarte",
    subtitulo:
      "Cadeiras de praia, bolsas e espreguiçadeiras trançadas à mão, para durar o verão inteiro — e os próximos.",
    tags: ["Feito à mão", "Corda náutica e alumínio", "Resistente à maresia"],
  },
  categorias: [
    {
      id: "cat-cadeiras",
      slug: "cadeiras",
      titulo: "Cadeiras de praia",
      resumo: "Personalizadas, de time ou em tramas exclusivas.",
      intro:
        "A peça que começou o Sentarte. Estrutura em alumínio, assento e encosto trançados à mão em corda náutica, dobrável para caber no porta-malas e resistente para durar temporadas de sol e maresia.",
      corA: "#15564C",
      corB: "#EDE3D0",
      modelos: [
        {
          id: "mod-trama-lisa",
          nome: "Trama lisa",
          descricao: "Um fio, uma cor, acabamento limpo. A base de toda cadeira Sentarte.",
          corA: "#15564C",
          corB: "#0E3E37",
        },
        {
          id: "mod-trama-mesclada",
          nome: "Trama mesclada",
          descricao: "Duas cores intercaladas fio a fio, para quem não abre mão de um contraste.",
          corA: "#BD502E",
          corB: "#EDE3D0",
        },
        {
          id: "mod-time-do-coracao",
          nome: "Time do coração",
          descricao: "Cores e brasão do seu time, trançados na estrutura — sem adesivo, sem estampa.",
          corA: "#16222B",
          corB: "#BD502E",
        },
        {
          id: "mod-frase-personalizada",
          nome: "Frase personalizada",
          descricao: "Um nome, uma data ou uma frase curta, trançada no encosto.",
          corA: "#A9835A",
          corB: "#241C15",
        },
      ],
    },
    {
      id: "cat-bolsas",
      slug: "bolsas",
      titulo: "Bolsas",
      resumo: "No mesmo trançado das cadeiras, para levar tudo pra praia.",
      intro:
        "Feitas com a mesma corda náutica das cadeiras, em tamanhos para o dia a dia ou para o dia de praia inteiro. Forro interno e alça reforçada para aguentar o peso da bolsa cheia.",
      corA: "#A9835A",
      corB: "#16222B",
      modelos: [
        {
          id: "mod-bolsa-dia-a-dia",
          nome: "Bolsa dia a dia",
          descricao: "Tamanho médio, alça de ombro, para o uso do dia a dia.",
          corA: "#A9835A",
          corB: "#EDE3D0",
        },
        {
          id: "mod-bolsa-de-praia",
          nome: "Bolsa de praia",
          descricao: "Grande, com espaço para canga, protetor e o que mais precisar levar.",
          corA: "#15564C",
          corB: "#BD502E",
        },
      ],
    },
    {
      id: "cat-espreguicadeiras",
      slug: "espreguicadeiras",
      titulo: "Espreguiçadeiras",
      resumo: "Para quem não abre mão do conforto.",
      intro:
        "Estrutura maior e reclinável, para quem quer passar a tarde inteira na praia ou na piscina sem sair do lugar. Mesma trama resistente à maresia, mesmo acabamento à mão.",
      corA: "#BD502E",
      corB: "#EDE3D0",
      modelos: [
        {
          id: "mod-espr-trama-lisa",
          nome: "Trama lisa",
          descricao: "Uma cor só, acabamento limpo, do jeito que combina com qualquer varanda.",
          corA: "#15564C",
          corB: "#0E3E37",
        },
        {
          id: "mod-espr-trama-mesclada",
          nome: "Trama mesclada",
          descricao: "Duas cores intercaladas, para dar mais presença à peça.",
          corA: "#BD502E",
          corB: "#EDE3D0",
        },
      ],
    },
  ],
};
