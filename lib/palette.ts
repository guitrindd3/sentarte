export type Fio = {
  nome: string;
  cor: string;
};

export type FamiliaDeCor = { nome: string; fios: Fio[] };

// Thread colors offered in the Monte a sua trama builder, grouped by family
// (expanded 2026-09-29 — the user asked for "todas as cores que existem";
// the builder also has a free "Outra cor" picker for anything not listed).
// Black and white come first: the real chairs (and the builder's base
// photo) are most often woven in these two.
export const FAMILIAS: FamiliaDeCor[] = [
  {
    nome: "Neutros",
    fios: [
      { nome: "Preto", cor: "#1C1C1E" },
      { nome: "Branco", cor: "#F3F1EC" },
      { nome: "Carvão", cor: "#241C15" },
      { nome: "Cinza-chumbo", cor: "#4A4D52" },
      { nome: "Cinza", cor: "#8E9196" },
      { nome: "Gelo", cor: "#DADCD8" },
      { nome: "Areia", cor: "#EDE3D0" },
      { nome: "Bege", cor: "#D8C3A0" },
    ],
  },
  {
    nome: "Vermelhos",
    fios: [
      { nome: "Vermelho", cor: "#C8102E" },
      { nome: "Vermelho-cereja", cor: "#9E1B32" },
      { nome: "Vinho", cor: "#7A2E3A" },
      { nome: "Bordô", cor: "#5C1A2B" },
      { nome: "Coral", cor: "#F2685A" },
    ],
  },
  {
    nome: "Laranjas e amarelos",
    fios: [
      { nome: "Terracota", cor: "#BD502E" },
      { nome: "Laranja", cor: "#F5A83C" },
      { nome: "Laranja-forte", cor: "#E8641B" },
      { nome: "Pêssego", cor: "#F4B89A" },
      { nome: "Mostarda", cor: "#C99A2E" },
      { nome: "Amarelo", cor: "#F4C518" },
      { nome: "Amarelo-claro", cor: "#F7E27A" },
    ],
  },
  {
    nome: "Verdes",
    fios: [
      { nome: "Verde-bandeira", cor: "#009739" },
      { nome: "Verde-folha", cor: "#6FA83C" },
      { nome: "Verde-limão", cor: "#B5D334" },
      { nome: "Verde-oliva", cor: "#6B6B2E" },
      { nome: "Verde-musgo", cor: "#3F5A36" },
      { nome: "Verde-marinho", cor: "#15564C" },
      { nome: "Verde-água", cor: "#6CC5B0" },
      { nome: "Menta", cor: "#BFE6D2" },
    ],
  },
  {
    nome: "Azuis",
    fios: [
      { nome: "Azul", cor: "#2F6690" },
      { nome: "Azul-royal", cor: "#1F4FB4" },
      { nome: "Azul-marinho", cor: "#1B2A4A" },
      { nome: "Noite", cor: "#16222B" },
      { nome: "Azul-celeste", cor: "#7CB7E0" },
      { nome: "Azul-bebê", cor: "#BFDDF2" },
      { nome: "Turquesa", cor: "#1FA7B5" },
      { nome: "Petróleo", cor: "#1E4E5C" },
    ],
  },
  {
    nome: "Roxos e rosas",
    fios: [
      { nome: "Roxo", cor: "#8B5FBF" },
      { nome: "Roxo-uva", cor: "#4B2463" },
      { nome: "Lilás", cor: "#C3A6DD" },
      { nome: "Rosa", cor: "#E85A97" },
      { nome: "Pink", cor: "#E0218A" },
      { nome: "Rosa-bebê", cor: "#F6C6D8" },
      { nome: "Rosê", cor: "#D8A0A0" },
    ],
  },
  {
    nome: "Marrons",
    fios: [
      { nome: "Rattan", cor: "#A9835A" },
      { nome: "Caramelo", cor: "#B7702F" },
      { nome: "Café", cor: "#5A3A22" },
      { nome: "Chocolate", cor: "#3B2417" },
    ],
  },
];

/** Every named color, flat. */
export const FIOS: Fio[] = FAMILIAS.flatMap((f) => f.fios);
