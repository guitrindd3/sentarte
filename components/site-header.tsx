"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CloseIcon, LockIcon, MenuIcon, WhatsAppIcon } from "@/components/icons";
import { NAV_LINKS } from "@/lib/nav";
import { whatsappUrl } from "@/lib/urls";

export function SiteHeader({ siteName, whatsappNumero }: { siteName: string; whatsappNumero: string }) {
  const [open, setOpen] = useState(false);
  const contactMsg = whatsappUrl(whatsappNumero, "Oi! Vim pelo site e queria saber mais sobre as cadeiras.");

  return (
    <header className="relative">
      <div className="relative h-16 w-full overflow-hidden sm:h-24 md:h-32">
        <Image
          src="/brand/bem-vindo.png"
          alt="Bem-vindo ao ateliê — linhas e crochê trançados à mão"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-canvas/10 via-transparent to-canvas" />
      </div>

      <div className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
          <Link
            href="/"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/brand/logo.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="font-serif text-2xl font-medium tracking-tight text-ink">{siteName}</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.95rem] tracking-wide text-ink-soft transition-colors hover:text-wood"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={contactMsg}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 border border-wood px-4 py-2 text-sm font-medium text-wood transition-colors hover:bg-wood hover:text-paper sm:inline-flex"
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </a>
            <Link
              href="/admin"
              aria-label="Acessar painel administrativo"
              title="Painel administrativo"
              className="hidden text-ink-soft/40 transition-colors hover:text-ink-soft sm:block"
            >
              <LockIcon className="h-4 w-4" />
            </Link>
            <button
              type="button"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="text-ink md:hidden"
            >
              {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="border-t border-line bg-canvas px-6 py-4 md:hidden">
            <nav className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-base text-ink-soft"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={contactMsg}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border border-wood px-4 py-2 text-sm font-medium text-wood"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Falar no WhatsApp
              </a>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
