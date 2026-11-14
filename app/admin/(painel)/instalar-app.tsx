"use client";

import { useEffect, useSyncExternalStore } from "react";

// "Instalar no celular" (2026-11-14): the panel is an installable app (manifest
// /painel.webmanifest). Chrome on Android fires `beforeinstallprompt` once per
// page load, usually before the visitor opens "Mais" — so the layout mounts
// <GuardarConviteInstalar /> to keep the event, and the card's button uses it.
// iPhone has no such event: the card explains Safari's share menu.

type ConviteInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let convite: ConviteInstalar | null = null;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());

function assinar(f: () => void) {
  ouvintes.add(f);
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", f);
  return () => {
    ouvintes.delete(f);
    mq.removeEventListener("change", f);
  };
}

const noApp = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Mounted once in the admin layout: keeps Chrome's install invitation for the button. */
export function GuardarConviteInstalar() {
  useEffect(() => {
    const guardar = (e: Event) => {
      e.preventDefault(); // we show our own button instead of Chrome's mini bar
      convite = e as ConviteInstalar;
      avisar();
    };
    const instalado = () => {
      convite = null;
      avisar();
    };
    window.addEventListener("beforeinstallprompt", guardar);
    window.addEventListener("appinstalled", instalado);
    return () => {
      window.removeEventListener("beforeinstallprompt", guardar);
      window.removeEventListener("appinstalled", instalado);
    };
  }, []);
  return null;
}

export function InstalarApp() {
  const podeInstalar = useSyncExternalStore(assinar, () => convite !== null, () => false);
  const jaNoApp = useSyncExternalStore(assinar, noApp, () => false);

  if (jaNoApp) {
    return (
      <p className="rounded-2xl border border-line/70 bg-paper px-4 py-3 text-sm text-ink-soft">
        Você está usando o Painel como app. Para atualizar uma página, puxe a tela para baixo ou feche e abra de novo.
      </p>
    );
  }

  async function instalar() {
    if (!convite) return;
    await convite.prompt();
    await convite.userChoice.catch(() => null);
    convite = null;
    avisar();
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-[0_1px_2px_rgba(36,31,26,0.05)]">
      <div className="flex items-start gap-3 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon */}
        <img src="/painel/icone-192.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <h2 className="font-semibold text-ink">Instalar no celular</h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            O painel vira um app na tela inicial, com o nome Painel: abre direto aqui, em tela cheia, sem a barra do navegador.
          </p>
        </div>
      </div>
      {podeInstalar ? (
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={instalar}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-espresso px-4 py-3 text-sm font-semibold text-paper hover:bg-espresso-soft sm:w-auto"
          >
            <span className="text-rattan">+</span> Instalar o Painel
          </button>
        </div>
      ) : null}
      <div className="grid gap-px border-t border-line/60 bg-line/60 sm:grid-cols-2">
        <div className="bg-paper px-4 py-3 text-sm">
          <p className="font-semibold text-ink">Android (Chrome)</p>
          <p className="mt-0.5 text-ink-soft">
            Toque no menu <b className="text-ink">⋮</b> lá em cima e depois em <b className="text-ink">Instalar app</b> (ou{" "}
            <b className="text-ink">Adicionar à tela inicial</b>).
          </p>
        </div>
        <div className="bg-paper px-4 py-3 text-sm">
          <p className="font-semibold text-ink">iPhone (Safari)</p>
          <p className="mt-0.5 text-ink-soft">
            Toque em <b className="text-ink">Compartilhar</b> (o quadrado com a setinha para cima) e depois em{" "}
            <b className="text-ink">Adicionar à Tela de Início</b>.
          </p>
        </div>
      </div>
      <p className="border-t border-line/60 px-4 py-2.5 text-xs text-ink-soft">
        O login continua valendo no app. Se pedir a senha de novo, é só entrar uma vez.
      </p>
    </section>
  );
}
