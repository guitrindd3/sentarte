import { PNG } from "pngjs";
import { decodificarCadeira } from "@/lib/chair-link";
import { IMG_H, IMG_W, pintarCadeira } from "@/lib/chair-render";

// Renders a Monte a sua trama design (choices in the query string, see
// lib/chair-link.ts) as a PNG — the picture behind the WhatsApp link preview.
// Same painter as the browser, on the same base photo.

const CORTE_Y0 = 170;
const CORTE_H = 560;

let base: Promise<PNG> | null = null;
function fotoBase(origem: string) {
  base ??= fetch(new URL("/monte/cadeira-trancada.png", origem))
    .then((r) => {
      if (!r.ok) throw new Error(`base photo ${r.status}`);
      return r.arrayBuffer();
    })
    .then((b) => PNG.sync.read(Buffer.from(b)))
    .catch((e) => {
      base = null;
      throw e;
    });
  return base;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const op = decodificarCadeira(url.searchParams);
  const foto = await fotoBase(url.origin);
  if (foto.width !== IMG_W || foto.height !== IMG_H) return new Response("base photo size", { status: 500 });

  const saida = new PNG({ width: IMG_W, height: IMG_H });
  pintarCadeira(foto as unknown as ImageData, saida as unknown as ImageData, op);

  // crop to the chair, like the builder shows it
  const corte = new PNG({ width: IMG_W, height: CORTE_H });
  PNG.bitblt(saida, corte, 0, CORTE_Y0, IMG_W, CORTE_H, 0, 0);
  const png = PNG.sync.write(corte, { colorType: 2 });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      // same choices → same picture forever
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
