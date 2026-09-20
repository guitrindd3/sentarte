@AGENTS.md

# Sentarte — project notes

Marketing/catalog site for a handmade beach-chair atelier (Next.js App Router,
Tailwind v4, no backend/database). Every "order" is a WhatsApp deep link — there
is no cart, checkout, or account system, and none should be added without the
user explicitly asking for it.

## Design system

- Tokens live in `app/globals.css` under `@theme inline` (`canvas`, `canvas-deep`,
  `paper`, `ink`, `ink-soft`, `marine`, `clay`, `rattan`, `navy`, `line`). Use
  these Tailwind classes (`bg-marine`, `text-ink-soft`, etc.) — never hardcode
  hex colors in components except where `WeavePattern`/`Configurator` need raw
  hex strings for SVG fills.
- Fonts: `font-serif` (Frank Ruhl Libre) for headings/display, `font-sans`
  (Archivo, the default body font) for everything else. Don't add another
  typeface.
- The recurring visual motif is `components/weave-pattern.tsx`, a basket-weave
  SVG built from two colors. Reuse it instead of photos/illustrations —the site
  has no product photography.
- Rope color palette for anything color-pickable lives in `lib/palette.ts`
  (`FIOS`). Add new colors there, not inline.
- Avoid generic AI-page tells: no ALL-CAPS labels, no middle-dot-joined meta
  strings, no arrow-suffixed link text, no uniform rounded-card-with-grey-shadow
  kit. Hover states use a hard offset shadow (`hover:shadow-[6px_6px_0_0_var(--ink)]`)
  to read as a stamped/print card, not a soft SaaS shadow.

## Content model

- `lib/categories.ts` — `CATEGORIAS` drives `/categoria/[slug]`
  (`generateStaticParams`). Each category has `modelos` (style variants, not
  real SKUs/prices — this is a made-to-order shop, not instant-buy e-commerce).
- `lib/site.ts` — brand constants, WhatsApp number, `whatsappUrl(message)`
  helper. Every CTA on the site should go through `whatsappUrl`, not a bare
  `wa.me` string.
- Copy is in Brazilian Portuguese, informal but not sloppy ("você", not "tu"
  or formal "senhor(a)"). Policy pages (`politica-de-*`, `termos-de-uso`) are
  intentionally honest about being a small WhatsApp-order business — don't add
  fabricated legal identifiers (CNPJ, address) unless the user supplies them.

## Before shipping a change

Run `npm run build` (Next 16 + Turbopack; also runs the TypeScript check) and
`npx eslint .` — both must be clean. `npm run dev -- -p <port>` for local
review; check `netstat -ano | grep :<port>` before reusing a port, dev servers
from earlier sessions can linger.

## Deploy

Vercel project `sentarte` on team `guitrindd3` (slug `guitrindd4`), production
alias `sentarte.vercel.app`. No CLI is installed/authenticated locally —
deploys go through the Vercel MCP tools (`create_deployment` with inlined
`files`, target `production`). SSO/Vercel Authentication protection is
disabled on this project on purpose so the public site isn't gated.
