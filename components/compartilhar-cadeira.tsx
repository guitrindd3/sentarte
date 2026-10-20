"use client";

import { useEffect, useRef, useState } from "react";
import { CompartilharIcon, WhatsAppIcon } from "@/components/icons";
import { formatBRL } from "@/lib/offer";
import { rastrear } from "@/lib/rastro";

// Share a chair (user 2026-10-20: "quero poder compartilhar... via wpp ou
// instagram"). Builds a 1080x1350 picture — the photo (with the Black Friday
// logo while it's on), name, price and the site — and hands it to the phone's
// share sheet (WhatsApp, Instagram, …) with the link. Where files can't be
// shared (most computers): a small menu with WhatsApp, copy link, download.

const W = 1080;
const FOTO_H = 1080;
const H = 1350;

function carregar(src: string) {
  return new Promise<HTMLImageElement>((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = erro;
    img.src = src;
  });
}

async function montarImagem({ foto, nome, preco, precoAntes, blackFriday }: Dados): Promise<File | null> {
  try {
    await document.fonts.ready;
    const css = getComputedStyle(document.documentElement);
    const serif = css.getPropertyValue("--font-display").trim() || "serif";
    const sans = css.getPropertyValue("--font-body").trim() || "sans-serif";
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d")!;
    g.fillStyle = "#faf7f2";
    g.fillRect(0, 0, W, H);
    const img = await carregar(foto);
    // cover-crop the photo into the square
    const esc = Math.max(W / img.naturalWidth, FOTO_H / img.naturalHeight);
    const iw = img.naturalWidth * esc, ih = img.naturalHeight * esc;
    g.save();
    g.beginPath();
    g.rect(0, 0, W, FOTO_H);
    g.clip();
    g.drawImage(img, (W - iw) / 2, (FOTO_H - ih) / 2, iw, ih);
    g.restore();
    if (blackFriday) {
      const logo = await carregar("/brand/black-friday.png");
      const lw = W * 0.42;
      g.shadowColor = "rgba(0,0,0,0.35)";
      g.shadowBlur = 18;
      g.drawImage(logo, 28, 28, lw, (lw * logo.naturalHeight) / logo.naturalWidth);
      g.shadowBlur = 0;
    }
    g.fillStyle = "#1c1a17";
    g.font = `500 68px ${serif}`;
    g.fillText(nome, 64, FOTO_H + 100, W - 128);
    let x = 64;
    const y = FOTO_H + 185;
    if (precoAntes) {
      g.font = `400 40px ${sans}`;
      g.fillStyle = "#6b645c";
      const t = formatBRL(precoAntes);
      g.fillText(t, x, y);
      const tw = g.measureText(t).width;
      g.fillRect(x, y - 13, tw, 3);
      x += tw + 20;
    }
    g.font = `600 54px ${sans}`;
    g.fillStyle = "#1c1a17";
    g.fillText(formatBRL(preco), x, y);
    g.font = `400 34px ${sans}`;
    g.fillStyle = "#6b645c";
    g.textAlign = "right";
    g.fillText("sentarte.com.br", W - 64, y);
    const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/jpeg", 0.9));
    return blob ? new File([blob], `${nome.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-sentarte.jpg`, { type: "image/jpeg" }) : null;
  } catch {
    return null;
  }
}

type Dados = { foto: string; nome: string; preco: number; precoAntes?: number; blackFriday: boolean };

export function CompartilharCadeira({ slug, className = "", ...dados }: Dados & { slug: string; className?: string }) {
  const [menu, setMenu] = useState(false);
  const [aviso, setAviso] = useState("");
  const caixa = useRef<HTMLDivElement>(null);
  const link = () => `${window.location.origin}/cadeira/${slug}`;
  const texto = () =>
    `${dados.nome}: ${formatBRL(dados.preco)}${dados.blackFriday ? " na Black Friday" : ""}. Cadeira de praia feita à mão pela SentArte.`;

  useEffect(() => {
    if (!menu) return;
    const fora = (e: PointerEvent) => !caixa.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [menu]);

  const compartilhar = async () => {
    rastrear({ t: "c", l: `Compartilhar: ${dados.nome}` });
    setAviso("");
    const arquivo = await montarImagem(dados);
    try {
      if (arquivo && navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], text: `${texto()} ${link()}` });
        return;
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return; // closed the share sheet
    }
    setMenu(true);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link());
      setAviso("Link copiado! É só colar onde quiser.");
    } catch {
      setAviso(link());
    }
  };

  const baixar = async () => {
    const arquivo = await montarImagem(dados);
    if (!arquivo) return setAviso("Não deu para montar a imagem agora.");
    const url = URL.createObjectURL(arquivo);
    const a = document.createElement("a");
    a.href = url;
    a.download = arquivo.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setAviso("Imagem baixada: poste no Instagram e coloque o link sentarte.com.br.");
  };

  const item = "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink hover:bg-canvas";
  return (
    <div ref={caixa} className={`relative ${className}`}>
      <button
        type="button"
        onClick={compartilhar}
        aria-label={`Compartilhar ${dados.nome}`}
        title="Compartilhar"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper/90 text-ink backdrop-blur transition-colors hover:border-ink"
      >
        <CompartilharIcon className="h-5 w-5" />
      </button>
      {menu ? (
        <div className="absolute right-0 top-12 z-30 w-64 border border-line bg-paper py-1 shadow-[6px_6px_0_0_var(--rattan)]" role="menu">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${texto()} ${link()}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={item}
            role="menuitem"
            onClick={() => setMenu(false)}
          >
            <WhatsAppIcon className="h-4 w-4" /> Mandar no WhatsApp
          </a>
          <button type="button" className={item} role="menuitem" onClick={copiar}>
            <CompartilharIcon className="h-4 w-4" /> Copiar o link
          </button>
          <button type="button" className={item} role="menuitem" onClick={baixar}>
            <CompartilharIcon className="h-4 w-4 rotate-180" /> Baixar a imagem (Instagram)
          </button>
          {aviso ? <p className="border-t border-line px-4 py-2 text-xs text-ink-soft" role="status">{aviso}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
