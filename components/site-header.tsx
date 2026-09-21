"use client";

import Link from "next/link";
import { useState } from "react";
import { CloseIcon, MenuIcon, WhatsAppIcon } from "@/components/icons";
import { NAV_LINKS } from "@/lib/nav";
import { whatsappUrl } from "@/lib/urls";

export function SiteHeader({ siteName, whatsappNumero }: { siteName: string; whatsappNumero: string }) {
  const [open, setOpen] = useState(false);
  const contactMsg = whatsappUrl(whatsappNumero, "Oi! Vim pelo site e queria saber mais sobre as cadeiras.");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          className="font-serif text-2xl tracking-tight text-ink"
          onClick={() => setOpen(false)}
        >
          {siteName}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.95rem] tracking-wide text-ink-soft transition-colors hover:text-marine"
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
            className="hidden items-center gap-2 border border-marine px-4 py-2 text-sm font-medium text-marine transition-colors hover:bg-marine hover:text-paper sm:inline-flex"
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp
          </a>
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
              className="inline-flex items-center gap-2 border border-marine px-4 py-2 text-sm font-medium text-marine"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Falar no WhatsApp
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
