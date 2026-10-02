import type { Forma, Opcoes } from "./chair-render";

// A Monte a sua trama design packed into a short query string, so the
// WhatsApp message can carry a link whose preview IS the chair: /c?… is a
// page whose og:image is /api/cadeira?… (the same choices rendered as a PNG
// on the server). wa.me links can't attach files, so this is how the store
// gets the picture. Nothing is stored — the link holds every choice.

const HEX = /^[0-9a-f]{6}$/i;
const num = (v: string | null, min: number, max: number, padrao: number) => {
  const n = Number(v);
  return Number.isFinite(n) && v !== null && v !== "" ? Math.max(min, Math.min(max, n)) : padrao;
};
const r2 = (n: number) => Math.round(n * 100) / 100;

export function codificarCadeira(op: Opcoes): string {
  const p = new URLSearchParams();
  p.set("f", op.forma);
  p.set("a", op.corA.replace("#", ""));
  p.set("b", op.corB.replace("#", ""));
  if (op.corC) p.set("c", op.corC.replace("#", ""));
  if (op.formaAssento && op.formaAssento !== "lisa") p.set("fa", op.formaAssento);
  if ((op.escalaAssento ?? 1) !== 1) p.set("ea", String(r2(op.escalaAssento ?? 1)));
  if (op.nomeAssento?.trim()) p.set("na", op.nomeAssento.trim().slice(0, 30));
  if ((op.tamanhoNomeAssento ?? 1) !== 1) p.set("tna", String(r2(op.tamanhoNomeAssento ?? 1)));
  if (op.nome.trim()) {
    p.set("n", op.nome.trim().slice(0, 40));
    p.set("nx", String(r2(op.posicao.x)));
    p.set("ny", String(r2(op.posicao.y)));
    if ((op.tamanhoNome ?? 1) < 1) p.set("t", String(r2(op.tamanhoNome ?? 1)));
  }
  if ((op.escalaForma ?? 1) < 1) {
    p.set("e", String(r2(op.escalaForma ?? 1)));
    p.set("fx", String(r2(op.posForma?.x ?? 0.5)));
    p.set("fy", String(r2(op.posForma?.y ?? 0.5)));
  }
  return p.toString();
}

export function decodificarCadeira(q: URLSearchParams): Opcoes {
  const cor = (k: string, padrao: string) => {
    const v = q.get(k) ?? "";
    return HEX.test(v) ? `#${v}` : padrao;
  };
  const forma = q.get("f") ?? "lisa";
  const formaAssento = q.get("fa") ?? "lisa";
  return {
    forma: (/^[a-z-]{2,24}$/.test(forma) ? forma : "lisa") as Forma,
    corA: cor("a", "#1C1C1E"),
    corB: cor("b", "#F3F1EC"),
    corC: q.get("c") && HEX.test(q.get("c")!) ? `#${q.get("c")}` : undefined,
    formaAssento: (/^[a-z-]{2,24}$/.test(formaAssento) ? formaAssento : "lisa") as Forma,
    nome: (q.get("n") ?? "").slice(0, 40),
    nomeAssento: (q.get("na") ?? "").slice(0, 30),
    tamanhoNomeAssento: num(q.get("tna"), 0.4, 2, 1),
    escalaAssento: num(q.get("ea"), 0.4, 2, 1),
    posicao: { x: num(q.get("nx"), 0, 1, 0.5), y: num(q.get("ny"), 0, 1, 0.5) },
    tamanhoNome: num(q.get("t"), 0.3, 1, 1),
    escalaForma: num(q.get("e"), 0.35, 1, 1),
    posForma: { x: num(q.get("fx"), 0, 1, 0.5), y: num(q.get("fy"), 0, 1, 0.5) },
  };
}
