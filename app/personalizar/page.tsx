import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { BackLink } from "@/components/back-link";
import { VIDEO_MONTE_SUA_CADEIRA } from "@/components/cover-link-card";
import { ChairBuilder } from "@/components/chair-builder";
import { getContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Monte a sua cadeira de praia",
  description:
    "Escolha as cores e o trançado, escreva um nome e veja a prévia da sua cadeira de praia personalizada antes de pedir.",
  path: "/personalizar",
});

export default async function PersonalizarPage() {
  const content = await getContent();

  return (
    <>
      {/* Header with the looping "chair being woven" clip the user supplied
          (2026-09-29, public/videos/monte-sua-cadeira.mp4, 480x848, ~3.5s).
          Muted + playsInline so mobile browsers allow autoplay. */}
      <section className="border-b border-line bg-canvas-deep px-6 pb-10 pt-4 md:pb-12 md:pt-6">
        <div className="mx-auto max-w-6xl">
          <BackLink />
        </div>
        <div className="mx-auto mt-2 grid max-w-6xl items-center gap-10 md:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <h1 className="font-serif text-3xl font-medium tracking-tight text-ink md:text-4xl">Monte a sua trama</h1>
            <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
              Escolha o modelo, a forma do trançado e as cores para ver uma prévia. Quer um nome ou uma
              frase trançada junto? É só escrever. Quando estiver do seu jeito, manda pra gente pelo
              WhatsApp.
            </p>
          </div>
          <div className="mx-auto hidden w-full max-w-[17rem] border border-line bg-paper p-2 shadow-[6px_6px_0_0_var(--line)] md:block">
            <video
              src={VIDEO_MONTE_SUA_CADEIRA}
              width={480}
              height={848}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
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
