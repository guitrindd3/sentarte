"use client";

import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

// "Ajustar foto" window (2026-10-05, user: "quero redimensionar as fotos"):
// crop with a chosen shape, zoom, drag, rotate — then the result is handed
// back as a new JPEG File, uploaded like any picked photo.

const FORMATOS = [
  { id: "original", rotulo: "Original", valor: 0 },
  { id: "quadrada", rotulo: "Quadrada", valor: 1 },
  { id: "empe", rotulo: "Em pé", valor: 4 / 5 },
  { id: "deitada", rotulo: "Deitada", valor: 3 / 2 },
  { id: "larga", rotulo: "Larga", valor: 16 / 9 },
] as const;

const LADO_MAX = 2000;

function carregar(src: string) {
  return new Promise<HTMLImageElement>((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = erro;
    img.src = src;
  });
}

/** Draws the rotated photo and cuts out the chosen area (react-easy-crop's recipe). */
async function recortar(src: string, area: Area, rotacao: number, nome: string): Promise<File> {
  const img = await carregar(src);
  const rad = (rotacao * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const bw = img.width * cos + img.height * sin;
  const bh = img.width * sin + img.height * cos;
  const tela = document.createElement("canvas");
  tela.width = bw;
  tela.height = bh;
  const ctx = tela.getContext("2d")!;
  ctx.translate(bw / 2, bh / 2);
  ctx.rotate(rad);
  ctx.translate(-img.width / 2, -img.height / 2);
  ctx.drawImage(img, 0, 0);

  const escala = Math.min(1, LADO_MAX / Math.max(area.width, area.height));
  const out = document.createElement("canvas");
  out.width = Math.round(area.width * escala);
  out.height = Math.round(area.height * escala);
  const octx = out.getContext("2d")!;
  octx.fillStyle = "#fff";
  octx.fillRect(0, 0, out.width, out.height);
  octx.drawImage(tela, area.x, area.y, area.width, area.height, 0, 0, out.width, out.height);
  const blob = await new Promise<Blob | null>((r) => out.toBlob(r, "image/jpeg", 0.88));
  if (!blob) throw new Error("falhou");
  return new File([blob], nome.replace(/\.[^.]+$/, "") + "-ajustada.jpg", { type: "image/jpeg" });
}

export function AjustarFoto({
  src,
  nome = "foto.jpg",
  formatoInicial = "original",
  onPronto,
  onCancelar,
}: {
  src: string;
  nome?: string;
  formatoInicial?: (typeof FORMATOS)[number]["id"];
  onPronto: (f: File, previa: string) => void;
  onCancelar: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotacao, setRotacao] = useState(0);
  const [formato, setFormato] = useState<string>(formatoInicial);
  const [natural, setNatural] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCancelar();
    window.addEventListener("keydown", esc);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = antes;
    };
  }, [onCancelar]);

  const virada = rotacao % 180 !== 0;
  const aspecto = FORMATOS.find((f) => f.id === formato)?.valor || (virada ? 1 / natural : natural);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-espresso/70 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Ajustar foto">
      <div className="flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden bg-paper shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-line/70 px-5 py-3">
          <p className="font-serif text-xl font-medium tracking-tight text-ink">Ajustar foto</p>
          <button type="button" onClick={onCancelar} className="rounded-full px-3 py-1 text-sm text-ink-soft hover:bg-canvas hover:text-ink">
            Cancelar
          </button>
        </div>

        <div className="relative h-[52dvh] min-h-64 bg-espresso sm:h-[26rem]">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotacao}
            aspect={aspecto}
            minZoom={1}
            maxZoom={4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, px) => setArea(px)}
            onMediaLoaded={(m) => setNatural(m.naturalWidth / m.naturalHeight)}
            showGrid
          />
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <p className="text-xs font-semibold text-ink-soft">Formato</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {FORMATOS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormato(f.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    formato === f.id ? "border-espresso bg-espresso text-paper" : "border-line bg-paper text-ink hover:border-wood"
                  }`}
                >
                  {f.rotulo}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex min-w-[12rem] flex-1 items-center gap-3 text-sm text-ink-soft">
              <span className="font-semibold">Zoom</span>
              <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-[var(--wood)]" />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setRotacao((r) => (r + 270) % 360)} className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-wood" aria-label="Girar para a esquerda">
                ↺ Girar
              </button>
              <button type="button" onClick={() => setRotacao((r) => (r + 90) % 360)} className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-wood" aria-label="Girar para a direita">
                Girar ↻
              </button>
            </div>
          </div>
          <p className="text-xs text-ink-soft">Arraste a foto para escolher o pedaço que aparece. Use o zoom para aproximar.</p>
          {erro ? <p className="text-sm text-clay-dark">{erro}</p> : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-line/70 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button type="button" onClick={onCancelar} className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!area || salvando}
            onClick={async () => {
              if (!area) return;
              setSalvando(true);
              setErro("");
              try {
                const f = await recortar(src, area, rotacao, nome);
                onPronto(f, URL.createObjectURL(f));
              } catch {
                setErro("Não deu para ajustar essa foto. Tente outra.");
                setSalvando(false);
              }
            }}
            className="rounded-full bg-wood px-5 py-2 text-sm font-semibold text-paper hover:bg-wood-dark disabled:opacity-50"
          >
            {salvando ? "Preparando…" : "Usar esta foto"}
          </button>
        </div>
      </div>
    </div>
  );
}
