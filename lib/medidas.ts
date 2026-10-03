// Chair sizes and specs, from the atelier's own "Medidas e Especificações"
// card (user, 2026-10-03). Change here and every page follows.

export type ModeloMedidas = {
  nome: string;
  detalhe?: string;
  altura: string;
  largura: string;
  profundidade: string;
  capacidade: string;
  peso?: string;
};

export const MEDIDAS_CADEIRAS: ModeloMedidas[] = [
  { nome: "Cadeira infantil", altura: "49,5 cm", largura: "41,5 cm", profundidade: "39 cm", capacidade: "até 30 kg" },
  {
    nome: "Cadeira fixa",
    detalhe: "1 posição",
    altura: "73 cm",
    largura: "54 cm",
    profundidade: "53 cm",
    capacidade: "até 110 kg",
    peso: "de 1,3 kg a 2 kg",
  },
  {
    nome: "Cadeira reclinável",
    detalhe: "8 posições",
    altura: "88 cm",
    largura: "54,5 cm",
    profundidade: "67 cm",
    capacidade: "até 100 kg",
    peso: "cerca de 1,8 kg",
  },
];

export const OBS_RECLINAVEL = "A reclinável também tem versões de 4 e 6 posições.";
