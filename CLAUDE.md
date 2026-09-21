@AGENTS.md

# Sentarte — project notes

Marketing/catalog site for a handmade beach-chair atelier (Next.js 16 App
Router, Tailwind v4). Every "order" is a WhatsApp deep link — there is no
cart or checkout, and none should be added without the user explicitly
asking for it. As of 2026-09-21 the site has an admin panel (`/admin`) that
edits site content live; see "Content model" and "Admin panel" below.

## Design system

- Tokens live in `app/globals.css` under `@theme inline` (`canvas`, `canvas-deep`,
  `paper`, `ink`, `ink-soft`, `marine`, `clay`, `rattan`, `navy`, `line`). Use
  these Tailwind classes (`bg-marine`, `text-ink-soft`, etc.) — never hardcode
  hex colors in components except where `WeavePattern`/`Configurator` need raw
  hex strings for SVG fills. Token values were brightened 2026-09-21 (user felt
  the original muted/desaturated version read as "apagado" — `paper` is now
  true white, `canvas`/`canvas-deep` lighter, `marine`/`clay`/`rattan` more
  saturated, `navy` deepened for more contrast) — don't drift back toward the
  original dusty/muted hex values.
- Fonts: `font-serif` (Bodoni Moda — a high-contrast display serif, swapped
  2026-09-21 from Frank Ruhl Libre which the user found unappealing) for
  headings/display, `font-sans` (Archivo, the default body font) for
  everything else. Don't add another typeface.
  - Bodoni Moda is loaded with only weights `500/600/700` (see
    `app/layout.tsx`). Every `font-serif` heading must carry an explicit
    Tailwind weight class (`font-medium`/`font-semibold`) — leaving it off
    let Tailwind Preflight's heading reset fall back to a weight the font
    never loaded, which read as thin/rough (user's 2026-09-21 "as fontes de
    letras estão ruins" complaint). Fixed sitewide 2026-09-21 by adding
    `font-medium tracking-tight` to secondary `font-serif` headings and
    `font-semibold tracking-tight` to the carousel's big display title; also
    added a subtle text-shadow to the carousel copy for legibility over
    photos. Keep this convention for any new `font-serif` heading.
- The recurring visual motif is `components/weave-pattern.tsx`, a basket-weave
  SVG built from two colors — the fallback shown for any model/category that
  has no real photo yet. `components/framed-weave.tsx` wraps it (or a real
  photo, via `imagemUrl`) in a matted "gallery frame" for showcase spots
  (hero, material-spec, sobre, configurator preview). `ModeloCard` renders
  photos un-matted (catalog-card convention) instead.
- Rope color palette for the homepage configurator lives in `lib/palette.ts`
  (`FIOS`) — a fixed brand palette, not admin-editable.
- The homepage opens with `components/home/carousel.tsx` (added 2026-09-21,
  replacing the old two-column `hero.tsx`), a full-viewport-height
  auto-advancing photo carousel ("Bem-vindo ao {hero.titulo}") — a fixed
  "portal" welcome moment the user asked for by name. `hero.titulo`/
  `subtitulo`/`tags` are still the admin-editable fields (via the "Boas-vindas"
  section in `/admin`), just relabeled/repurposed for this new layout.
- `public/photos/` — real Unsplash photos (Unsplash License — free for
  commercial use, no permission/attribution required; always check the photo
  page says "free" — Unsplash also sells paid "Unsplash+" photos mixed into
  search results, skip those). Don't add more site imagery by scraping
  arbitrary web/Pinterest results — same reasoning as
  [[feedback-no-scraped-stock-photos]]: only pull from a clearly
  commercial-use-licensed source like this, and record the source below.
  - hero-beach.jpg, rope-texture.jpg, sand-texture.jpg — used in the old
    two-column hero/material-spec/sobre (2026-09-21). Sources:
    unsplash.com/photos/9Itl-03hLao, /mbdOQS8SDnE, /n5HOJGtYt4Q.
  - carousel-palms.jpg, carousel-wave.jpg, carousel-sunset.jpg — the three
    `components/home/carousel.tsx` slides (2026-09-21). Sources:
    unsplash.com/photos/Qe58SmRMcH4, /photo-1501696461415-6bd6660c6742,
    /6nxEDrj61CY.
- Avoid generic AI-page tells: no ALL-CAPS labels, no middle-dot-joined meta
  strings, no arrow-suffixed link text, no uniform rounded-card-with-grey-shadow
  kit. Hover states use a hard offset shadow (`hover:shadow-[6px_6px_0_0_var(--rattan)]`)
  to read as a stamped/print card, not a soft SaaS shadow.

## Content model

Site content (hero copy, site settings, categories and their models/photos)
lives as one JSON document in Vercel Blob (`content/site-content.json`), not
in git. `lib/content-schema.ts` defines the shape (`SiteContent`) and
`DEFAULT_CONTENT` (used as a fallback before the admin ever saves anything,
and to backfill missing fields on read). `lib/content-store.ts` exports
`getContent()` (React `cache()`-wrapped — safe to call from multiple
components in one request, only one Blob read happens) and `saveContent()`.

Categories are flat (no parent/subcategory nesting) — each has its own
`modelos` array. `/categoria/[slug]` and the homepage are `force-dynamic` and
read live from `getContent()`, so there's no `generateStaticParams`/build-time
category list anymore. A `Modelo` shows its uploaded photo (`imagemUrl`,
served via `next/image` — remote pattern for
`*.public.blob.vercel-storage.com` is in `next.config.ts`) when present, else
falls back to the `WeavePattern` swatch built from its `corA`/`corB`.

`lib/nav.ts` still holds `SITE_URL` and the static nav/footer link lists —
those aren't admin-editable (nav structure isn't "content" the same way text
is), but note the nav hardcodes `/categoria/cadeiras|bolsas|espreguicadeiras`
— if the admin renames or deletes one of those three category slugs, that nav
link 404s. `lib/urls.ts` has `whatsappUrl(numero, mensagem)` /
`instagramUrl(handle)` — both now take the number/handle as an argument
(sourced from `content.site`) rather than a hardcoded constant.

Copy is in Brazilian Portuguese, informal but not sloppy ("você", not "tu"
or formal "senhor(a)"). Policy pages (`politica-de-*`, `termos-de-uso`) are
intentionally honest about being a small WhatsApp-order business — don't add
fabricated legal identifiers (CNPJ, address) unless the user supplies them.

## Admin panel

- `/admin/login` — single-admin password login (no username, no user table).
  `ADMIN_PASSWORD_HASH` env var holds `salt:scrypt-hash` (see `lib/auth.ts`);
  `SESSION_SECRET` signs a JWT session cookie (`jose`, HS256, 30-day expiry).
  Both are set on the Vercel project (production/preview/development) —
  they are not in git and there's no `.env.local` for local admin testing;
  test admin changes against the deployed site.
- `proxy.ts` (Next 16's renamed `middleware.ts`) redirects any `/admin/*`
  request without a valid session cookie to `/admin/login`. Every mutating
  Server Action in `app/admin/actions.ts` also re-checks the session itself
  (defense in depth, per Next's own auth guide) — don't remove those checks
  even though proxy already gates the route.
- All mutations are plain Server Actions (`app/admin/actions.ts`) posting
  straight to `/admin`, no separate `/api/admin/*` routes. Photo upload goes
  through the same `updateModeloAction` (a `<form encType="multipart/form-data">`
  with a `File` field) — it `put()`s to Blob under `modelos/` and stores the
  resulting URL on the model.
- To reset the admin password: generate a new `scrypt` hash the same way
  `SESSION_SECRET`/`ADMIN_PASSWORD_HASH` were originally generated (see git
  history around 2026-09-21), then update the env var on Vercel — there's no
  in-app "change password" flow.

## Before shipping a change

Run `npm run build` (Next 16 + Turbopack; also runs the TypeScript check) and
`npx eslint .` — both must be clean. Both succeed without any env vars set
locally, since `force-dynamic` pages that touch Blob/session data never
execute during `next build`. `npm run dev -- -p <port>` for local review of
non-admin pages; check `netstat -ano | grep :<port>` before reusing a port,
dev servers from earlier sessions can linger.

## Deploy

Vercel project `sentarte` on team `guitrindd3` (slug `guitrindd4`), production
alias `sentarte.vercel.app`, GitHub repo `guitrindd3/sentarte`. The Vercel
project is Git-connected (as of 2026-09-20) — push to `main` and it
auto-builds/deploys; no need to hand-inline files through the Vercel MCP
`create_deployment` tool anymore (that was the workaround used before the
Git connection existed). SSO/Vercel Authentication protection is disabled on
this project on purpose so the public site isn't gated. A Vercel Blob store
(`sentarte-content`) is attached to the project — `BLOB_READ_WRITE_TOKEN` is
auto-provisioned by Vercel, don't hand-set it.
