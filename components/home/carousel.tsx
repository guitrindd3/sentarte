"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons";
import { whatsappUrl } from "@/lib/urls";
import type { SiteContent } from "@/lib/content-schema";

const BEM_VINDO_AO = "Bem-vindo ao";

/**
 * Types `text` out over `durationMs`, starting after `delayMs`. Measures the
 * text's real rendered width (`scrollWidth`, unaffected by the element's own
 * clipped `width`) instead of animating to a percentage — a percentage
 * resolves against the *container*, which cut the phrase off whenever the
 * text itself (at this font size) was wider than that container. A blinking
 * caret shows until this line finishes typing.
 */
function TypewriterLine({
  as,
  text,
  className,
  delayMs,
  durationMs,
}: {
  as: "p" | "h1";
  text: string;
  className: string;
  delayMs: number;
  durationMs: number;
}) {
  const elRef = useRef<HTMLElement | null>(null);
  const [width, setWidth] = useState(0);
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => {
      if (elRef.current) setWidth(elRef.current.scrollWidth);
    }, delayMs);
    return () => clearTimeout(id);
  }, [delayMs, text]);

  const boxClassName = `inline-block overflow-hidden whitespace-nowrap align-bottom border-r-2 ${
    typing ? "sentarte-caret-blink border-canvas/80" : "border-transparent"
  } ${className}`;
  const style = {
    width,
    transition: `width ${durationMs}ms steps(${Math.max(text.length, 1)}, end)`,
  };

  if (as === "h1") {
    return (
      <h1
        ref={(el) => {
          elRef.current = el;
        }}
        className={boxClassName}
        style={style}
        onTransitionEnd={() => setTyping(false)}
      >
        {text}
      </h1>
    );
  }
  return (
    <p
      ref={(el) => {
        elRef.current = el;
      }}
      className={boxClassName}
      style={style}
      onTransitionEnd={() => setTyping(false)}
    >
      {text}
    </p>
  );
}

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
    <section className="relative min-h-[92vh] overflow-hidden bg-espresso">
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

      {/* Welcome + title sit up near the top of the photo now; the phrase
          moved down to join the buttons/dots at the bottom. */}
      <div className="absolute inset-x-0 top-3 mx-auto max-w-2xl px-6 text-center text-canvas md:top-6">
        <TypewriterLine
          as="p"
          text={BEM_VINDO_AO}
          delayMs={100}
          durationMs={550}
          className="font-serif text-xl italic tracking-[0.01em] text-canvas/80 [text-shadow:0_1px_12px_rgba(16,32,42,0.5)] md:text-2xl"
        />
        <TypewriterLine
          as="h1"
          text={hero.titulo}
          delayMs={700}
          durationMs={750}
          className="mt-2 font-serif text-6xl font-semibold leading-[1.08] tracking-tight text-canvas [text-shadow:0_2px_20px_rgba(16,32,42,0.45)] md:text-8xl"
        />

        <div className="sentarte-hero-in mt-8 flex flex-wrap items-center justify-center gap-3 [animation-delay:1550ms]">
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

      {/* Phrase + CTA buttons + carousel dots anchored near the bottom, away
          from the busier middle of the photo. */}
      <div className="absolute inset-x-0 bottom-10 mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 text-center md:bottom-16">
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
