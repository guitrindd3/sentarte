import QRCode from "qrcode";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { lerPedido } from "@/lib/clientes";
import { codigoDoPedido } from "@/lib/pedido";
import { linkDoPassaporte, lerPassaportes, numeroBonito, type Passaporte } from "@/lib/passaporte";
import { redisAtivo } from "@/lib/redis";
import { Imprimir } from "./imprimir";

// Printable QR tags for chair passports (lib/passaporte.ts): 6 x 9 cm cards,
// 9 per A4 page, to cut out, punch and tie to the chair. Outside the (painel)
// group so the admin shell doesn't print; proxy.ts gates /admin and the page
// checks the session itself.

export const dynamic = "force-dynamic";

async function Etiqueta({ p }: { p: Passaporte }) {
  const url = linkDoPassaporte(p.n);
  const svg = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1c1714", light: "#ffffff" } });
  return (
    <div className="etiqueta relative flex flex-col items-center border border-dashed border-ink/40 bg-white px-[5mm] pb-[4mm] pt-[7mm] text-center text-ink">
      <span aria-hidden className="absolute left-1/2 top-[2.2mm] h-[3mm] w-[3mm] -translate-x-1/2 rounded-full border border-ink/50" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo.png" alt="" className="h-[10mm] w-[10mm]" />
      <p className="mt-[1mm] font-serif text-[11pt] font-semibold tracking-tight">Ateliê SentArte</p>
      <p className="font-mono text-[8pt] tracking-[0.2em]">CADEIRA Nº {numeroBonito(p.n)}</p>
      <div className="mt-[3mm] h-[32mm] w-[32mm] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="mt-[3mm] text-[8.5pt] leading-tight">Aponte a câmera e conheça a história desta cadeira</p>
      {p.colecao ? (
        <p className="mt-[1.5mm] text-[7.5pt] font-semibold">
          {p.colecao.nome} · {String(p.colecao.numero).padStart(2, "0")}/{p.colecao.total}
        </p>
      ) : (
        <p className="mt-[1.5mm] text-[7.5pt] text-ink/70">Trançada à mão</p>
      )}
    </div>
  );
}

export default async function Etiquetas({ searchParams }: PageProps<"/admin/etiquetas">) {
  if (!(await verifySession())) redirect("/admin/login");
  const sp = await searchParams;
  const ref = typeof sp.ref === "string" ? sp.ref : "";
  const ns = typeof sp.n === "string" ? sp.n.split(",").map(Number).filter((x) => Number.isInteger(x) && x > 0).slice(0, 60) : [];
  let titulo = "Etiquetas do passaporte";
  let numeros = ns;
  if (ref && redisAtivo()) {
    const p = await lerPedido(ref);
    numeros = p?.passaportes ?? [];
    if (p) titulo = `Etiquetas do pedido ${codigoDoPedido(p.ref)}`;
  }
  const lista = redisAtivo() ? await lerPassaportes(numeros) : [];

  return (
    <main className="min-h-screen bg-canvas-deep px-6 py-8 print:bg-white print:p-0">
      <style>{`@page { size: A4; margin: 10mm } @media print { .sem-imprimir { display: none !important } }`}</style>
      <div className="sem-imprimir mx-auto mb-6 flex max-w-[190mm] flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-ink">{titulo}</h1>
          <p className="text-sm text-ink-soft">Imprima em papel firme (couché ou cartão), recorte na linha tracejada, fure o círculo e amarre na cadeira com um cordão.</p>
        </div>
        <Imprimir />
      </div>
      {lista.length ? (
        <div className="mx-auto grid w-[190mm] grid-cols-3 gap-[4mm] bg-white p-[2mm] print:p-0">
          {lista.map((p) => (
            <Etiqueta key={p.n} p={p} />
          ))}
        </div>
      ) : (
        <p className="sem-imprimir text-center text-sm text-ink-soft">Nenhum passaporte para imprimir.</p>
      )}
    </main>
  );
}
