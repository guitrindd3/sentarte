// Run after `git push`: waits until https://sentarte.com.br is serving the
// pushed commit (via /api/versao). If Vercel never starts the deploy (it
// happened on 2026-11-04 — the push reached GitHub, no deploy was created),
// pushes an empty commit once to re-fire the webhook, then waits again.
import { execSync } from "node:child_process";

const SITE = "https://sentarte.com.br/api/versao";
const sh = (c) => execSync(c, { encoding: "utf8" }).trim();
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function noAr() {
  try {
    const r = await fetch(`${SITE}?t=${Date.now()}`, { cache: "no-store" });
    return (await r.json()).commit ?? null;
  } catch {
    return null;
  }
}

// live commit is `alvo` or a descendant of it
function publicado(vivo, alvo) {
  if (!vivo) return false;
  if (vivo === alvo) return true;
  try {
    execSync(`git merge-base --is-ancestor ${alvo} ${vivo}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function aguardar(alvo, minutos) {
  const fim = Date.now() + minutos * 60_000;
  while (Date.now() < fim) {
    if (publicado(await noAr(), alvo)) return true;
    await esperar(15_000);
  }
  return false;
}

sh("git fetch -q origin main");
let alvo = sh("git rev-parse origin/main");
console.log(`Conferindo publicação de ${alvo.slice(0, 7)}...`);
if (await aguardar(alvo, 4)) {
  console.log("✓ No ar.");
  process.exit(0);
}
console.log("Vercel não publicou em 4 min — reenviando (commit vazio)...");
const hora = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date()).replace(",", "");
sh(`git commit -q --allow-empty -m "[${hora}] Redeploy: Vercel não publicou o envio anterior" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`);
sh("git push -q origin HEAD:main");
alvo = sh("git rev-parse HEAD");
if (await aguardar(alvo, 8)) {
  console.log("✓ No ar (depois do reenvio).");
  process.exit(0);
}
console.log("✗ Ainda não publicou — olhar o painel da Vercel.");
process.exit(1);
