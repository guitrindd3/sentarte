"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons";
import { whatsappUrl } from "@/lib/urls";
import type { SiteContent } from "@/lib/content-schema";

const SLIDES = [
  {
    src: "/photos/carousel-times.jpg",
    alt: "Cadeiras de time Sentarte numa varanda de frente para o mar",
  },
  {
    src: "/photos/carousel-boho.jpg",
    alt: "Cadeiras boho Sentarte num terraço ao pôr do sol",
  },
  {
    src: "/photos/carousel-boho-2.jpg",
    alt: "Cadeiras boho Sentarte numa varanda decorada",
  },
];

export function Carousel({
  hero,
  whatsappNumero,
}: {
  hero: SiteContent["hero"];
  whatsappNumero: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden bg-espresso">
      {SLIDES.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          className={`object-cover transition-opacity duration-[1600ms] ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          sizes="100vw"
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/25 to-espresso/45" />

      <div className="relative mx-auto max-w-2xl px-6 text-center text-canvas">
        <p className="font-serif text-lg italic tracking-[0.01em] text-canvas/80 [text-shadow:0_1px_12px_rgba(16,32,42,0.5)] md:text-xl">
          Bem-vindo ao
        </p>
        <h1 className="mt-2 font-serif text-6xl font-semibold leading-[1.08] tracking-tight text-canvas [text-shadow:0_2px_20px_rgba(16,32,42,0.45)] md:text-8xl">
          {hero.titulo}
        </h1>
        <p className="mx-auto mt-7 max-w-[42ch] text-base font-normal leading-relaxed tracking-[0.01em] text-canvas/90 [text-shadow:0_1px_10px_rgba(16,32,42,0.4)] md:text-lg">
          {hero.subtitulo}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {hero.tags.map((tag) => (
            <span
              key={tag}
              className="border border-dashed border-canvas/50 px-3 py-1.5 text-xs leading-snug text-canvas/90"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* CTA buttons + carousel dots anchored near the bottom, away from the
          busier middle of the photo, while the welcome/title/tags above stay
          vertically centered as before. */}
      <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-6 px-6 md:bottom-16">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/categoria/cadeiras"
            className="border border-canvas bg-canvas px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-transparent hover:text-canvas"
          >
            Ver modelos
          </Link>
          <a
            href={whatsappUrl(whatsappNumero, "Oi! Vim pelo site e queria saber mais sobre as cadeiras.")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-canvas hover:underline"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Falar no WhatsApp
          </a>
        </div>

        <div className="flex items-center justify-center gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Ver imagem ${i + 1} de ${SLIDES.length}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-canvas" : "w-1.5 bg-canvas/40 hover:bg-canvas/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
