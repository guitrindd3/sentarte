import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { BackLink } from "@/components/back-link";
import { VIDEO_MONTE_SUA_CADEIRA, POSTER_MONTE_SUA_CADEIRA } from "@/components/cover-link-card";
import { ChairBuilder } from "@/components/chair-builder";
import { getContent } from "@/lib/content-store";
import { TextoRico, textoSimples } from "@/components/texto-rico";
import { textosDaPagina } from "@/lib/textos-paginas";
import { MedidasCadeiras } from "@/components/medidas-cadeiras";

// Pre-rendered and cached (2026-10-06, the site felt slow): rebuilt every 10 min
// at most, and right away when the admin saves (revalidatePath("/", "layout")).
export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Monte a sua cadeira de praia",
  description:
    "Escolha as cores e o trançado, escreva um nome e veja a prévia da sua cadeira de praia personalizada antes de pedir.",
  path: "/personalizar",
});

export default async function PersonalizarPage() {
  const content = await getContent();
  const tp = textosDaPagina(content.paginas, "personalizar");

  return (
    <>
      {/* Header with the looping "chair being woven" clip the user supplied
          (2026-09-29, public/videos/monte-sua-cadeira.mp4, 480x848, ~3.5s).
          Muted + playsInline so mobile browsers allow autoplay. */}
      <section className="border-b border-line bg-canvas-deep pb-10 pt-4 md:pb-12 md:pt-6">
        <div className="mx-auto max-w-6xl px-6">
          <BackLink />
        </div>
        <div className="mx-auto mt-2 grid max-w-6xl items-start gap-10 px-6 md:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <h1 className="font-serif text-3xl font-medium tracking-tight text-ink md:text-4xl">{textoSimples(tp.linha("titulo"))}</h1>
            <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
              <TextoRico inline texto={tp.linha("resumo")} whatsappNumero={content.site.whatsappNumero} />
            </p>
            <MedidasCadeiras embutido whatsappNumero={content.site.whatsappNumero} />
          </div>
          <div className="mx-auto hidden w-full max-w-[17rem] border border-line bg-paper p-2 shadow-[6px_6px_0_0_var(--line)] md:block">
            <video
              src={VIDEO_MONTE_SUA_CADEIRA}
              poster={POSTER_MONTE_SUA_CADEIRA}
              width={480}
              height={848}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Vídeo de uma cadeira sendo trançada"
              className="block aspect-[480/848] h-auto w-full bg-canvas object-cover"
            />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-14">
        <ChairBuilder whatsappNumero={content.site.whatsappNumero} />
      </section>
    </>
  );
}
