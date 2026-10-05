import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { formatBRL, PARCELAS_MAX, PIX_DESCONTO, precoPix, PRAZO_PRODUCAO_DIAS_UTEIS, PRECO_CADEIRA, PRECO_CADEIRA_COM_NOME } from "@/lib/offer";
import { whatsappUrl } from "@/lib/urls";

// Renders a text edited in the admin "Páginas": blank line = new paragraph,
// {preco}-style placeholders filled from lib/offer.ts, and [words](target)
// links (target: "whatsapp", "/page" or "https://…"). See lib/textos-paginas.ts.

export function preencher(texto: string, nome = "SentArte") {
  const vars: Record<string, string> = {
    preco: formatBRL(PRECO_CADEIRA),
    preco_nome: formatBRL(PRECO_CADEIRA_COM_NOME),
    preco_pix: formatBRL(precoPix(PRECO_CADEIRA)),
    pix: `${Math.round(PIX_DESCONTO * 100)}%`,
    parcelas: String(PARCELAS_MAX),
    prazo: String(PRAZO_PRODUCAO_DIAS_UTEIS),
    nome,
  };
  return texto.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
}

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

function comLinks(texto: string, whatsappNumero: string): ReactNode[] {
  const out: ReactNode[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(LINK)) {
    const [inteiro, palavras, alvo] = m;
    out.push(texto.slice(ultimo, m.index));
    const cls = "font-medium text-ink underline-offset-2 hover:underline";
    if (alvo === "whatsapp") {
      out.push(
        <a key={m.index} href={whatsappUrl(whatsappNumero, "Oi! Vim pelo site.")} target="_blank" rel="noreferrer" className={cls}>
          {palavras}
        </a>
      );
    } else if (alvo.startsWith("/")) {
      out.push(
        <Link key={m.index} href={alvo} className={cls}>
          {palavras}
        </Link>
      );
    } else if (/^https:\/\//.test(alvo)) {
      out.push(
        <a key={m.index} href={alvo} target="_blank" rel="noreferrer" className={cls}>
          {palavras}
        </a>
      );
    } else {
      out.push(inteiro);
    }
    ultimo = (m.index ?? 0) + inteiro.length;
  }
  out.push(texto.slice(ultimo));
  return out;
}

/** Plain text for places that can't hold links (titles, JSON-LD, meta). */
export function textoSimples(texto: string, nome?: string) {
  return preencher(texto, nome).replace(LINK, "$1");
}

/** Paragraphs (`paragrafos`) or one inline run of text. */
export function TextoRico({
  texto,
  whatsappNumero,
  nome,
  paragrafoClassName,
  inline = false,
}: {
  texto: string;
  whatsappNumero: string;
  nome?: string;
  paragrafoClassName?: string;
  inline?: boolean;
}) {
  const t = preencher(texto, nome);
  if (inline) return <>{comLinks(t.replace(/\s*\n\s*/g, " "), whatsappNumero)}</>;
  return (
    <>
      {t
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={paragrafoClassName}>
            {comLinks(p, whatsappNumero).map((n, j) => (
              <Fragment key={j}>{n}</Fragment>
            ))}
          </p>
        ))}
    </>
  );
}
