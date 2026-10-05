"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons";
import { whatsappUrl } from "@/lib/urls";
import type { SiteContent } from "@/lib/content-schema";

// Default photos and their descriptions (order set by the user 2026-09-30). Since
// 2026-10-05 the list comes from the admin (Páginas → Página inicial → Fotos do topo).
const PADRAO = [
  {
    src: "/photos/carousel-boho-2.jpg",
    alt: "Cadeiras de praia boho SentArte numa varanda decorada",
  },
  {
    src: "/photos/carousel-boho.jpg",
    alt: "Cadeiras de praia boho SentArte num terraço ao pôr do sol",
  },
  {
    src: "/photos/carousel-times.jpg",
    alt: "Cadeiras de praia de time SentArte numa varanda de frente para o mar",
  },
];

/** Time each photo stays up (was 6s — the user found it slow). */
const INTERVALO_MS = 4000;

export function Carousel({
  hero,
  whatsappNumero,
  fotos,
}: {
  hero: SiteContent["hero"];
  whatsappNumero: string;
  fotos?: string[];
}) {
  const SLIDES = fotos?.length
    ? fotos.map((src) => ({ src, alt: PADRAO.find((p) => p.src === src)?.alt ?? "Cadeiras de praia SentArte, trançadas à mão" }))
    : PADRAO;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance, except while the visitor is hovering/focused on the
  // carousel or has asked the OS for reduced motion.
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVALO_MS);
    return () => clearInterval(id);
  }, [paused, SLIDES.length]);

  return (
    <section
      className="relative overflow-hidden bg-espresso md:min-h-[92vh]"
      aria-roledescription="carrossel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative aspect-square md:absolute md:inset-0 md:aspect-auto">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Fills the frame on every size (user 2026-09-30: the square
                photo "ficou certo", the wider ones letterboxed). On phones
                the frame is square, so the 4:3 / 5:4 photos only lose a
                little of each side. */}
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-espresso/55 md:from-espresso/85 md:via-espresso/25 md:to-espresso/45" />

      {/* Welcome + title sit up near the top of the photo; the phrase sits
          down with the buttons/dots instead. */}
      <div className="absolute inset-x-0 top-3 mx-auto max-w-2xl px-6 text-center text-canvas md:top-6">
        <p className="font-serif text-lg italic tracking-[0.01em] text-canvas/80 [text-shadow:0_1px_12px_rgba(16,32,42,0.5)] md:text-2xl">
          Bem-vindo ao
        </p>
        <h1 className="mt-1 font-serif text-5xl font-semibold md:mt-2 md:text-6xl lg:text-8xl leading-[1.08] tracking-tight text-canvas [text-shadow:0_2px_20px_rgba(16,32,42,0.45)]">
          {hero.titulo}
        </h1>

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
      </div>

      {/* Phrase + CTA buttons + carousel dots anchored near the bottom, away
          from the busier middle of the photo. */}
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5 px-6 pb-6 pt-5 text-center md:absolute md:inset-x-0 md:bottom-16 md:gap-6 md:p-0 md:px-6">
        <p className="mx-auto max-w-[42ch] text-base font-normal leading-relaxed tracking-[0.01em] text-canvas/90 [text-shadow:0_1px_10px_rgba(16,32,42,0.4)] md:text-lg">
          {hero.subtitulo}
        </p>

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
            className="inline-flex items-center gap-2 py-3 text-sm font-medium text-canvas hover:underline"
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
              className="group/dot flex h-8 items-center px-1"
            >
              <span
                className={`block h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-canvas" : "w-1.5 bg-canvas/40 group-hover/dot:bg-canvas/70"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
