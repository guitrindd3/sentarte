// The top strip's yearly calendar (user 2026-10-20: "deixe programado
// sempre"). Every date is worked out from the year, so it repeats on its own
// forever: Carnaval follows Easter, Mães/Pais are the 2nd Sunday of May/Aug.
// Each date gets a "peça até {data}" strip (`antecedencia` days before it);
// the gift dates then get a last-minute vale-presente strip until the eve.
// Only the texts and the lead time are edited, in Páginas → Faixa do topo.

export type DataDoAno = {
  id: string;
  /** Name used by the vale-presente strip ({evento}) */
  evento: string;
  dia: (ano: number) => Date;
  /** fixed deadline instead of `dia − antecedência` */
  prazoFixo?: (ano: number) => Date;
  /** after the deadline, offer the vale-presente until the day before */
  vale?: boolean;
};

const utc = (a: number, m: number, d: number) => new Date(Date.UTC(a, m - 1, d));
const somar = (d: Date, dias: number) => new Date(d.getTime() + dias * 86_400_000);

/** Easter Sunday (Gregorian, "Anonymous" algorithm). */
export function pascoa(ano: number) {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(ano, mes, dia);
}

/** n-th Sunday of a month (1-based month). */
function domingo(ano: number, mes: number, n: number) {
  const primeiro = utc(ano, mes, 1);
  return somar(primeiro, ((7 - primeiro.getUTCDay()) % 7) + (n - 1) * 7);
}

/** In the order they show during a year (Réveillon sits between Natal and its vale strip). */
export const DATAS_DO_ANO: DataDoAno[] = [
  { id: "janeiro", evento: "Férias de janeiro", dia: (a) => utc(a, 1, 31), prazoFixo: (a) => utc(a, 1, 12) },
  // Saturday of Carnaval = Easter − 50 days
  { id: "carnaval", evento: "Carnaval", dia: (a) => somar(pascoa(a), -50) },
  { id: "maes", evento: "Dia das Mães", dia: (a) => domingo(a, 5, 2), vale: true },
  { id: "namorados", evento: "Dia dos Namorados", dia: (a) => utc(a, 6, 12), vale: true },
  { id: "pais", evento: "Dia dos Pais", dia: (a) => domingo(a, 8, 2), vale: true },
  { id: "criancas", evento: "Dia das Crianças", dia: (a) => utc(a, 10, 12), vale: true },
  { id: "natal", evento: "Natal", dia: (a) => utc(a, 12, 25), vale: true },
  { id: "reveillon", evento: "Réveillon", dia: (a) => utc(a, 12, 31), prazoFixo: (a) => utc(a, 12, 9) },
];

/** How far back a strip may start before its deadline (if the previous one is already over). */
const JANELA_DIAS = 45;

const iso = (d: Date) => d.toISOString().slice(0, 10);
const ddmm = (d: Date) => `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

export type FaixaProgramada = { inicio: string; ate: string; texto: string };

/**
 * The strips of the given years, back to back and never overlapping
 * (inicio/ate: YYYY-MM-DD, both inclusive). `textos[id]` is the "peça até"
 * text; `textoVale` the last-minute one. Blank texts are skipped.
 */
export function faixasDoCalendario(
  anos: number[],
  textos: Record<string, string>,
  textoVale: string,
  antecedencia: number
): FaixaProgramada[] {
  const out: FaixaProgramada[] = [];
  let cursor: Date | null = null;
  const pendentesVale: { d: DataDoAno; dia: Date; prazo: Date }[] = [];

  const adicionar = (inicio: Date, ate: Date, texto: string) => {
    const comeco: Date = cursor && cursor > inicio ? cursor : inicio;
    if (comeco > ate) return;
    cursor = somar(ate, 1);
    if (texto) out.push({ inicio: iso(comeco), ate: iso(ate), texto });
  };
  const vale = ({ d, dia, prazo }: (typeof pendentesVale)[number]) =>
    adicionar(somar(prazo, 1), somar(dia, -1), preencher(textoVale, d.evento, dia, prazo));

  for (const ano of anos) {
    for (const d of DATAS_DO_ANO) {
      const dia = d.dia(ano);
      const prazo = d.prazoFixo ? d.prazoFixo(ano) : somar(dia, -antecedencia);
      // The previous date's vale strip goes first — except Natal's, which
      // waits for Réveillon's last call (Dec 5–9) to end.
      if (d.id !== "reveillon") while (pendentesVale.length) vale(pendentesVale.shift()!);
      adicionar(somar(prazo, -JANELA_DIAS), prazo, preencher(textos[d.id] ?? "", d.evento, dia, prazo));
      if (d.vale) pendentesVale.push({ d, dia, prazo });
    }
    while (pendentesVale.length) vale(pendentesVale.shift()!);
  }
  return out;
}

function preencher(texto: string, evento: string, dia: Date, prazo: Date) {
  return texto
    .trim()
    .replace(/\{data\}/g, ddmm(prazo))
    .replace(/\{dia\}/g, ddmm(dia))
    .replace(/\{evento\}/g, evento);
}
