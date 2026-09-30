"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CartIcon, CloseIcon, MenuIcon, SearchIcon, WhatsAppIcon } from "@/components/icons";
import { useCart } from "@/lib/cart-context";
import { NAV_LINKS } from "@/lib/nav";
import { whatsappUrl } from "@/lib/urls";

export function SiteHeader({ siteName, whatsappNumero }: { siteName: string; whatsappNumero: string }) {
  const [open, setOpen] = useState(false);
  const { count, openCart } = useCart();
  const contactMsg = whatsappUrl(whatsappNumero, "Oi! Vim pelo site e queria saber mais sobre as cadeiras.");

  // Publishes the header's real height as --altura-topo so things pinned
  // under it (the builder's chair band) sit flush on every phone.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const publicar = () =>
      document.documentElement.style.setProperty("--altura-topo", `${el.getBoundingClientRect().height}px`);
    publicar();
    const ro = new ResizeObserver(publicar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    // Sticky on the <header> itself: sticky on its only child never stuck,
    // because a sticky element can't leave its parent's box.
    // The ::before strip paints the header color above it, so page content
    // never shows through behind a translucent phone status bar.
    <header
      ref={headerRef}
      className="sticky top-0 z-40 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-40 before:bg-canvas"
    >
      <div className="border-b border-line bg-canvas/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
          <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <Image src="/brand/logo.png" alt="" width={40} height={40} className="h-10 w-10" />
            <span className="font-serif text-2xl font-medium tracking-tight text-ink">{siteName}</span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.95rem] tracking-wide text-ink-soft transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <a
              href={contactMsg}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-canvas sm:inline-flex"
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </a>

            <div className="flex items-center gap-3">
              <Link
                href="/busca"
                aria-label="Buscar"
                title="Buscar"
                className="-m-2 p-2 text-ink-soft transition-colors hover:text-ink"
              >
                <SearchIcon className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={openCart}
                aria-label={`Ver carrinho${count > 0 ? ` (${count} ${count === 1 ? "item" : "itens"})` : ""}`}
                title="Carrinho"
                className="relative -m-2 p-2 text-ink-soft transition-colors hover:text-ink"
              >
                <CartIcon className="h-5 w-5" />
                {count > 0 ? (
                  <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[0.6rem] font-medium leading-none text-canvas">
                    {count}
                  </span>
                ) : null}
              </button>
            </div>

            <button
              type="button"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="-m-2 p-2 text-ink lg:hidden"
            >
              {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="border-t border-line bg-canvas px-6 py-4 lg:hidden">
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
                className="inline-flex items-center gap-2 border border-ink px-4 py-2 text-sm font-medium text-ink"
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
