// New Year on the site (user 2026-11-12, after approving the preview: "gostei do
// ano novo, pode deixar para subir no site também, quando acabar o do Natal").
// Every year from 26 December to 15 January (Brasília, both inclusive) the
// decorations in components/ano-novo.tsx show. No coupon (the Christmas one
// ends on 25/12). The year being celebrated is computed, never hard-coded.
// Shared by server and browser: pure date math only.

/** MM-DD, both inclusive; the window crosses the turn of the year. */
export const ANO_NOVO_DE = "12-26";
export const ANO_NOVO_ATE = "01-15";

/** `hoje` = YYYY-MM-DD in Brasília. */
export const naEpocaDeAnoNovo = (hoje: string) => {
  const md = hoje.slice(5);
  return md >= ANO_NOVO_DE || md <= ANO_NOVO_ATE;
};

/** The year being celebrated: in December the next one, in January the current one. */
export const anoQueVem = (hoje: string) => Number(hoje.slice(0, 4)) + (hoje.slice(5, 7) === "12" ? 1 : 0);

/** Midnight of 1 January in Brasília (UTC−3, no daylight saving since 2019). */
export const viradaMs = (ano: number) => Date.UTC(ano, 0, 1, 3, 0, 0);
