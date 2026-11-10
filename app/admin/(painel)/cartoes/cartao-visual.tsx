import QRCode from "qrcode";
import type { CSSProperties, PointerEvent as PE, ReactNode } from "react";
import { LOGOS, type Cartao, type IconeCuidado, type Marca, type Parte } from "@/lib/cartoes-modelo";
import { FAMILIA } from "./fontes";

// One card drawn at its real printed size (mm / pt). The editor shows it
// scaled; the print sheet uses it as is.

const X = <path d="M4 4l16 16M20 4 4 20" />;

const ICONES: Record<IconeCuidado, ReactNode> = {
  pano: (
    <>
      <path d="M4 7h13v9a3 3 0 0 1-3 3H4z" />
      <path d="M7 11h7M7 14.5h5M19.5 3.5c1 1.3 1.5 2.1 1.5 2.8a1.5 1.5 0 0 1-3 0c0-.7.5-1.5 1.5-2.8z" />
    </>
  ),
  mao: (
    <>
      <path d="M3 12l2 8h14l2-8M3 14.5c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0" />
      <path d="M9 11V5.5M11.5 11V4M14 11V5M16.5 11V7" />
    </>
  ),
  alvejante: (
    <>
      <path d="M12 4.5 20.5 19h-17z" />
      {X}
    </>
  ),
  sol: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
      {X}
    </>
  ),
  chuva: (
    <>
      <path d="M7 14.5a3.8 3.8 0 0 1-.4-7.6A5 5 0 0 1 16.4 7.6 3.5 3.5 0 0 1 17 14.5z" />
      <path d="M9 17.5 8 20M13 17.5 12 20M17 17.5 16 20" />
      {X}
    </>
  ),
  secadora: (
    <>
      <path d="M4.5 4.5h15v15h-15z" />
      <circle cx="12" cy="12" r="4.5" />
      {X}
    </>
  ),
  ferro: (
    <>
      <path d="M3 17.5h17l-1.2-5.2A4 4 0 0 0 14.9 9H7.5M8.5 9V6.5h8" />
      {X}
    </>
  ),
  arrastar: (
    <>
      <path d="M6 4v15M6 12h8v7M14 12V9" />
      <path d="M16 6h5M19 4l2 2-2 2" />
      {X}
    </>
  ),
  coracao: <path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />,
};

const MARCA: Record<Marca, ReactNode> = {
  sim: <path d="M4 12.5l5 5L20 6.5" strokeWidth="3" />,
  nao: <path d="M6 6l12 12M18 6 6 18" strokeWidth="3" />,
  dica: <path d="M4 12h14M13 6.5l5.5 5.5-5.5 5.5" strokeWidth="2.6" />,
  ponto: <circle cx="12" cy="12" r="3.2" fill="currentColor" />,
};

export function MarcaSvg({ marca, tam }: { marca: Marca; tam: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: tam, height: tam, flexShrink: 0 }}
      aria-hidden
    >
      {MARCA[marca]}
    </svg>
  );
}

export function IconeCuidadoSvg({ icone, tam }: { icone: IconeCuidado; tam: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: tam, height: tam }}
      aria-hidden
    >
      {ICONES[icone]}
    </svg>
  );
}

function Instagram({ tam }: { tam: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: tam, height: tam, flexShrink: 0 }} aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" />
    </svg>
  );
}

const PT = 0.3528; // 1pt in mm

/** QR drawn as one SVG path (no HTML injection), in the card's ink colour. */
function Qr({ texto, tam }: { texto: string; tam: number }) {
  let d = "";
  let n = 0;
  try {
    const q = QRCode.create(texto, { errorCorrectionLevel: "M" });
    n = q.modules.size;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.modules.get(x, y)) d += `M${x} ${y}h1v1h-1z`;
  } catch {
    return null;
  }
  return (
    <svg viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" style={{ width: `${tam}mm`, height: `${tam}mm`, display: "block" }} aria-hidden>
      <path d={d} fill="currentColor" />
    </svg>
  );
}

/** In the editor preview: pieces can be grabbed and dragged. */
export type Edicao = { selecionado: Parte | null; onPegar: (parte: Parte, e: PE<HTMLElement>) => void };

export function CartaoVisual({ c, semFundo = false, corte = false, edicao }: { c: Cartao; semFundo?: boolean; corte?: boolean; edicao?: Edicao }) {
  /** style + handlers that let a piece move (its offset from the automatic place) */
  const m = (parte: Parte, base: CSSProperties = {}) => {
    const p = c.pos?.[parte];
    const style: CSSProperties = { ...base, position: base.position ?? "relative", transform: p ? `translate(${p.x}mm, ${p.y}mm)` : undefined };
    if (!edicao) return { style };
    style.cursor = "move";
    style.touchAction = "none";
    style.userSelect = "none";
    if (edicao.selecionado === parte) {
      style.outline = "0.35mm dashed #c1622f";
      style.outlineOffset = "0.7mm";
    }
    return { style, onPointerDown: (e: PE<HTMLElement>) => edicao.onPegar(parte, e) };
  };
  const menor = Math.min(c.largura, c.altura);
  const redondo = c.forma === "redondo";
  const pad = redondo ? c.largura * 0.15 : Math.min(7, Math.max(3, menor * 0.08));
  const corteTag = Math.min(c.largura * 0.2, 10);
  const furoTam = Math.max(3.5, Math.min(5, menor * 0.07));
  const furoTopo = redondo ? c.largura * 0.06 : c.forma === "etiqueta" ? corteTag * 0.55 : 3;
  const topoExtra = c.furo || c.forma === "etiqueta" ? furoTopo + furoTam + 1.5 - (redondo ? pad * 0.6 : pad * 0.4) : 0;
  const inset = Math.max(2, pad * 0.45);
  const raio = c.forma === "arredondado" ? `${Math.min(5, menor * 0.08)}mm` : redondo ? "50%" : "0";
  const esquerda = c.alinhar === "esquerda";
  const lado = c.logo === "lado";
  const texto = (mult = 1): CSSProperties => ({ fontFamily: FAMILIA[c.fonteTexto], fontSize: `${c.tamTexto * mult}pt` });
  const linha = (rotulo: string, nome: string) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: "1.5mm", width: "100%" }}>
      <span style={{ ...texto(1.15), fontFamily: FAMILIA[c.fonteTitulo] }}>{rotulo}</span>
      <span
        style={{
          flex: 1,
          minHeight: `${c.tamTexto * PT * 1.6}mm`,
          borderBottom: "0.3mm dotted currentColor",
          fontFamily: FAMILIA[c.fonteTitulo],
          fontSize: `${c.tamTexto * 1.25}pt`,
          lineHeight: 1.1,
          textAlign: "center",
        }}
      >
        {nome}
      </span>
    </div>
  );

  const corpo = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: esquerda ? "flex-start" : "center",
        textAlign: esquerda ? "left" : "center",
        minWidth: 0,
        width: lado ? undefined : "100%",
        flex: lado ? 1 : undefined,
      }}
    >
      {c.titulo ? (
        <p
          {...m("titulo", {
            fontFamily: FAMILIA[c.fonteTitulo],
            fontSize: `${c.tamTitulo}pt`,
            lineHeight: 1.08,
            fontWeight: c.fonteTitulo === "bodoni" || c.fonteTitulo === "cormorant" ? 600 : undefined,
            whiteSpace: "pre-line",
          })}
        >
          {c.titulo}
        </p>
      ) : null}
      {c.subtitulo ? (
        <p {...m("subtitulo", { ...texto(0.85), marginTop: "1mm", color: c.destaque, textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 })}>
          {c.subtitulo}
        </p>
      ) : null}
      {c.qr ? (
        <div {...m("qr", { marginTop: "2.5mm" })}>
          <Qr texto={c.qr} tam={c.qrTam} />
        </div>
      ) : null}
      {c.texto ? (
        <div {...m("texto", { display: "flex", flexDirection: "column", alignItems: esquerda ? "flex-start" : "center" })}>
          {c.titulo && !lado ? <span style={{ display: "block", width: "8mm", height: "0.35mm", background: c.destaque, margin: "2mm 0 1.5mm" }} /> : null}
          <p style={{ ...texto(), marginTop: lado || !c.titulo ? "2mm" : 0, lineHeight: 1.4, whiteSpace: "pre-line" }}>{c.texto}</p>
        </div>
      ) : null}
      {c.cuidados.length ? (
        <div {...m("cuidados", { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5mm 3mm", marginTop: "3mm", width: "100%" })}>
          {c.cuidados.map((i, n) => (
            <div
              key={n}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", textAlign: "center", gap: "1mm" }}
            >
              <span style={{ ...texto(), lineHeight: 1.15, fontWeight: 500 }}>{i.texto}</span>
              <IconeCuidadoSvg icone={i.icone} tam={`${c.tamTexto * PT * 2.6}mm`} />
            </div>
          ))}
        </div>
      ) : null}
      {c.lista.length ? (
        <ul
          {...m("lista", { marginTop: "3mm", width: "100%", textAlign: "left", display: "flex", flexDirection: "column", gap: `${c.tamTexto * PT * 0.45}mm` })}
        >
          {c.lista.map((i, n) => (
            <li
              key={n}
              style={{
                ...texto(),
                display: "flex",
                alignItems: "flex-start",
                gap: "1.5mm",
                lineHeight: 1.3,
                // a little air where the list goes from ✔ to ✖ (or to the tip)
                marginTop: n > 0 && c.lista[n - 1].marca !== i.marca ? `${c.tamTexto * PT * 0.9}mm` : 0,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", height: `${c.tamTexto * PT * 1.3}mm` }}>
                <MarcaSvg marca={i.marca} tam={`${c.tamTexto * PT * 1.15}mm`} />
              </span>
              <span>{i.texto}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {c.dePara ? (
        <div
          {...m("depara", { display: "flex", flexDirection: "column", gap: `${c.tamTexto * PT * 1.1}mm`, marginTop: "3mm", width: "100%", textAlign: "left" })}
        >
          {linha("De:", c.de)}
          {linha("Para:", c.para)}
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      style={{
        width: `${c.largura}mm`,
        height: `${c.altura}mm`,
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          background: semFundo ? "transparent" : c.fundo,
          color: c.cor,
          borderRadius: raio,
          clipPath:
            c.forma === "etiqueta"
              ? `polygon(${corteTag}mm 0, calc(100% - ${corteTag}mm) 0, 100% ${corteTag}mm, 100% 100%, 0 100%, 0 ${corteTag}mm)`
              : undefined,
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
          display: "flex",
          flexDirection: "column",
          padding: `${pad + Math.max(0, topoExtra)}mm ${pad}mm ${pad}mm`,
        }}
      >
        {c.moldura && c.forma !== "etiqueta" ? (
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: `${inset}mm`,
              border: `0.35mm solid ${c.destaque}`,
              borderRadius: redondo ? "50%" : c.forma === "arredondado" ? "2.5mm" : 0,
              pointerEvents: "none",
            }}
          />
        ) : null}
        {c.cantos ? (
          <>
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: `${inset}mm`,
                right: `${inset}mm`,
                width: "35%",
                height: "28%",
                borderTop: `0.9mm solid ${c.destaque}`,
                borderRight: `0.9mm solid ${c.destaque}`,
                pointerEvents: "none",
              }}
            />
            <span
              aria-hidden
              style={{
                position: "absolute",
                bottom: `${inset}mm`,
                left: `${inset}mm`,
                width: "35%",
                height: "28%",
                borderBottom: `0.9mm solid ${c.destaque}`,
                borderLeft: `0.9mm solid ${c.destaque}`,
                pointerEvents: "none",
              }}
            />
          </>
        ) : null}
        {c.furo || c.forma === "etiqueta" ? (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: `${furoTopo}mm`,
              left: "50%",
              width: `${furoTam}mm`,
              height: `${furoTam}mm`,
              marginLeft: `${-furoTam / 2}mm`,
              borderRadius: "50%",
              background: "#ffffff",
              boxShadow: `0 0 0 0.6mm ${c.destaque}33, inset 0 0.2mm 0.4mm rgba(0,0,0,0.25)`,
            }}
          />
        ) : null}
        <div
          style={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: lado ? "row" : "column",
            alignItems: lado ? "center" : esquerda ? "flex-start" : "center",
            justifyContent: "center",
            gap: lado ? "4mm" : `${Math.max(1.5, menor * 0.03)}mm`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGOS[c.logoCor].src} alt="" draggable={false} {...m("logo", { width: `${c.logoTam}mm`, height: `${c.logoTam}mm`, flexShrink: 0 })} />
          {corpo}
        </div>
        {c.rodape ? (
          <p
            {...m("rodape", {
              ...texto(0.95),
              marginTop: "2mm",
              display: "flex",
              alignItems: "center",
              justifyContent: esquerda ? "flex-start" : "center",
              gap: "1mm",
            })}
          >
            {c.rodape.startsWith("@") ? <Instagram tam={`${c.tamTexto * PT * 1.3}mm`} /> : null}
            {c.rodape}
          </p>
        ) : null}
      </div>
      {corte ? (
        // cut line drawn around the shape itself: still there when the background is not printed (kraft)
        <svg
          aria-hidden
          viewBox={`0 0 ${c.largura} ${c.altura}`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
          fill="none"
          stroke="#8f8f8f"
          strokeWidth={0.25}
        >
          {redondo ? (
            <circle cx={c.largura / 2} cy={c.altura / 2} r={c.largura / 2} />
          ) : c.forma === "etiqueta" ? (
            <polygon points={`${corteTag},0 ${c.largura - corteTag},0 ${c.largura},${corteTag} ${c.largura},${c.altura} 0,${c.altura} 0,${corteTag}`} />
          ) : (
            <rect x={0} y={0} width={c.largura} height={c.altura} rx={c.forma === "arredondado" ? Math.min(5, menor * 0.08) : 0} />
          )}
        </svg>
      ) : null}
    </div>
  );
}
