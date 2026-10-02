import type { Metadata } from "next";
import Link from "next/link";
import { codificarCadeira, decodificarCadeira } from "@/lib/chair-link";
import { SITE_URL } from "@/lib/nav";

// Share page for a design made in Monte a sua trama. Its og:image is the
// rendered chair, so pasting the link in WhatsApp shows the picture.

export const dynamic = "force-dynamic";

function paramsDe(q: Record<string, string | string[] | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (typeof v === "string") p.set(k, v);
  return codificarCadeira(decodificarCadeira(p)); // normalized, only known keys
}

export async function generateMetadata({ searchParams }: PageProps<"/c">): Promise<Metadata> {
  const qs = paramsDe(await searchParams);
  const imagem = `${SITE_URL}/api/cadeira?${qs}`;
  return {
    title: "Cadeira montada no site",
    description: "Uma cadeira de praia montada no Monte a sua trama da SentArte.",
    robots: { index: false, follow: false },
    openGraph: {
      title: "Minha cadeira SentArte",
      description: "Montada no site — trançada à mão sob encomenda.",
      url: `${SITE_URL}/c?${qs}`,
      images: [{ url: imagem, width: 480, height: 560, alt: "Prévia da cadeira montada" }],
    },
    twitter: { card: "summary_large_image", images: [imagem] },
  };
}

export default async function CadeiraCompartilhada({ searchParams }: PageProps<"/c">) {
  const qs = paramsDe(await searchParams);
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink">Cadeira montada no site</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Prévia de uma cadeira montada no Monte a sua trama. Antes de trançar, a gente confirma tudo pelo
          WhatsApp.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- server-rendered PNG of the design */}
        <img
          src={`/api/cadeira?${qs}`}
          alt="Prévia da cadeira montada"
          width={480}
          height={560}
          className="mt-6 w-full border border-line bg-canvas"
        />
        <Link
          href="/personalizar"
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-verde px-6 py-3 text-sm font-semibold text-white hover:bg-verde-escuro"
        >
          Montar a minha
        </Link>
      </div>
    </section>
  );
}
