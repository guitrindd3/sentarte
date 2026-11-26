import "server-only";
import { gravarPedido, lerPedido, pedidosRecentes, type EnvioME, type PedidoCliente } from "./clientes";
import { atualizarEnvios, envioPeloRastreio } from "./melhor-envio";
import { redis } from "./redis";

// Delivered orders move to "Entregue" by themselves (user 2026-11-26: "tem que
// atualizar sozinho"). Orders in "enviado" are checked on Melhor Envio — the shipments
// made in the admin (`envios`) or, for a label bought on melhorenvio.com.br with only
// the code pasted, the shipment found by that tracking code. Correios labels bought
// elsewhere can't be checked (Correios only opens tracking to contract customers).
// Runs with the reminders (page views + daily cron), at most every 3 hours.

const K_VEZ = "entregas:vez";
const INTERVALO_S = 3 * 3600;
const MAX_POR_RODADA = 15;
const JANELA_MS = 60 * 86_400_000;

export async function talvezAtualizarEntregas() {
  const [vez] = await redis([["SET", K_VEZ, 1, "NX", "EX", INTERVALO_S]]);
  if (vez !== "OK") return;
  await atualizarEntregas();
}

/** Checks shipped orders; returns the refs that just became "entregue". */
export async function atualizarEntregas(): Promise<string[]> {
  if (!process.env.MELHORENVIO_TOKEN) return [];
  const agora = Date.now();
  const enviados = (await pedidosRecentes(200)).filter(
    (p) => p.status === "pago" && p.etapa === "enviado" && agora - (p.etapaEm?.enviado ?? p.em) < JANELA_MS && (p.envios?.length || p.rastreio)
  );
  const entregues: string[] = [];
  for (const resumo of enviados.slice(0, MAX_POR_RODADA)) {
    try {
      if (await conferirPedido(resumo.ref)) entregues.push(resumo.ref);
    } catch (err) {
      console.error("entregas", resumo.ref, err instanceof Error ? err.message : err);
    }
  }
  if (entregues.length) {
    const { avisarEtapaAgora } = await import("./lembretes");
    for (const ref of entregues) await avisarEtapaAgora(ref);
  }
  return entregues;
}

async function conferirPedido(ref: string): Promise<boolean> {
  const p = await lerPedido(ref);
  if (!p || p.status !== "pago" || p.etapa !== "enviado") return false;
  let envios: EnvioME[] = p.envios ?? [];
  let ligou = false;
  if (!envios.length) {
    const codigos = (p.rastreio ?? "").split(",").map((c) => c.trim()).filter(Boolean);
    for (const c of codigos) {
      const e = await envioPeloRastreio(c);
      if (e) envios.push(e);
    }
    if (!envios.length) return false;
    ligou = true;
  } else {
    envios = await atualizarEnvios(envios);
  }
  const entregue = envios.every((e) => e.status === "delivered");
  if (!entregue && !ligou && sameStatus(p.envios ?? [], envios)) return false;
  const atual = (await lerPedido(ref)) as PedidoCliente;
  if (atual.etapa !== "enviado") return false;
  atual.envios = envios;
  if (entregue) {
    atual.etapa = "entregue";
    atual.etapaEm = { ...atual.etapaEm, entregue: Date.now() };
  }
  await gravarPedido(atual);
  return entregue;
}

function sameStatus(a: EnvioME[], b: EnvioME[]) {
  return a.length === b.length && a.every((e, i) => e.status === b[i].status);
}
