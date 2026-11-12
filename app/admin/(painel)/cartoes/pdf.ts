/**
 * Print sheet → A4 PDF, in the browser (user 2026-11-12: "deixa bom para
 * fazer pelo celular também"). Phone print services (Android, AirPrint,
 * printer apps) have no margin/scale controls and often ignore our @page
 * rules; a PDF whose pages ARE A4 with the cards already in place prints the
 * same everywhere. Each `.pagina-impressa` is drawn at ~300 dpi with
 * html-to-image and placed at the top of an A4 page, exactly where the print
 * CSS puts it, so fronts and backs stay mirrored and centred.
 */

const A4_PT = { w: 595.28, h: 841.89 };
const PX_LARGURA = 2480; // 210 mm at 300 dpi

function proximoQuadro() {
  return new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

async function imagensProntas(raiz: HTMLElement) {
  await Promise.all(
    Array.from(raiz.querySelectorAll("img")).map((img) => (img.complete && img.naturalWidth ? Promise.resolve() : img.decode().catch(() => {}))),
  );
}

function jpegDoCanvas(c: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((ok, erro) =>
    c.toBlob((b) => (b ? b.arrayBuffer().then((a) => ok(new Uint8Array(a)), erro) : erro(new Error("canvas vazio"))), "image/jpeg", 0.92),
  );
}

/** Minimal PDF: one full-width JPEG per A4 page, anchored at the top. */
function montarPdf(paginas: { jpeg: Uint8Array; w: number; h: number }[]): Blob {
  const enc = new TextEncoder();
  const partes: Uint8Array[] = [];
  const offsets: number[] = [];
  let tamanho = 0;
  const por = (p: Uint8Array | string) => {
    const b = typeof p === "string" ? enc.encode(p) : p;
    partes.push(b);
    tamanho += b.length;
  };
  const objeto = (n: number, corpo: () => void) => {
    offsets[n] = tamanho;
    por(`${n} 0 obj\n`);
    corpo();
    por("\nendobj\n");
  };
  por("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  // 1 catalog, 2 pages, then 3 objects per page: page, content, image
  const kids = paginas.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
  objeto(1, () => por("<< /Type /Catalog /Pages 2 0 R >>"));
  objeto(2, () => por(`<< /Type /Pages /Kids [${kids}] /Count ${paginas.length} >>`));
  paginas.forEach((p, i) => {
    const n = 3 + i * 3;
    const largura = A4_PT.w;
    const altura = Math.min(A4_PT.h, (A4_PT.w * p.h) / p.w);
    const conteudo = `q ${largura.toFixed(2)} 0 0 ${altura.toFixed(2)} 0 ${(A4_PT.h - altura).toFixed(2)} cm /Im0 Do Q`;
    objeto(n, () =>
      por(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_PT.w} ${A4_PT.h}] /Resources << /XObject << /Im0 ${n + 2} 0 R >> >> /Contents ${n + 1} 0 R >>`),
    );
    objeto(n + 1, () => por(`<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`));
    objeto(n + 2, () => {
      por(
        `<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`,
      );
      por(p.jpeg);
      por("\nendstream");
    });
  });
  const total = 3 + paginas.length * 3;
  const xref = tamanho;
  por(`xref\n0 ${total}\n0000000000 65535 f \n`);
  for (let n = 1; n < total; n++) por(`${String(offsets[n]).padStart(10, "0")} 00000 n \n`);
  por(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(partes as BlobPart[], { type: "application/pdf" });
}

/** Renders every printed page inside `raiz` (the hidden `.folha-cartoes`) into one PDF. */
export async function folhaEmPdf(raiz: HTMLElement): Promise<Blob> {
  const { toCanvas, getFontEmbedCSS } = await import("html-to-image");
  raiz.dataset.pdf = "1"; // visible (still off-screen) so the copies aren't hidden
  try {
    await document.fonts.ready;
    await imagensProntas(raiz);
    await proximoQuadro();
    const elementos = Array.from(raiz.querySelectorAll<HTMLElement>(".pagina-impressa"));
    if (!elementos.length) throw new Error("nada para imprimir");
    const fontEmbedCSS = await getFontEmbedCSS(raiz, { preferredFontFormat: "woff2" });
    const paginas = [];
    for (const [i, el] of elementos.entries()) {
      const pixelRatio = PX_LARGURA / el.offsetWidth;
      const opcoes = { pixelRatio, backgroundColor: "#ffffff", fontEmbedCSS, width: el.offsetWidth, height: el.offsetHeight };
      // Safari sometimes paints images only on the second pass
      if (i === 0) await toCanvas(el, opcoes).catch(() => null);
      const canvas = await toCanvas(el, opcoes);
      paginas.push({ jpeg: await jpegDoCanvas(canvas), w: canvas.width, h: canvas.height });
      canvas.width = canvas.height = 0; // free memory on phones
    }
    return montarPdf(paginas);
  } finally {
    delete raiz.dataset.pdf;
  }
}
