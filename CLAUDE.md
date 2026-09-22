@AGENTS.md

# Sentarte — project notes

Marketing/catalog site for a handmade beach-chair atelier (Next.js 16 App
Router, Tailwind v4). As of 2026-09-21 the site has an admin panel (`/admin`)
that edits site content live (see "Content model"/"Admin panel" below) and a
client-only shopping cart (see "Cart & search" below) — every order still
ends as a WhatsApp message, there's no payment processing.

## Design system

- Tokens live in `app/globals.css` under `@theme inline` (`canvas`, `canvas-deep`,
  `paper`, `ink`, `ink-soft`, `wood`, `clay`, `rattan`, `espresso`, `line`). Use
  these Tailwind classes (`bg-wood`, `text-ink-soft`, etc.) — never hardcode
  hex colors in components except where `WeavePattern`/`Configurator` need raw
  hex strings for SVG fills. Palette history: brightened 2026-09-21 (user felt
  the original read as "apagado"); recolored to a warm "rustic ateliê" scheme
  later that day (`marine`→`wood` coffee-brown, `navy`→`espresso` near-black
  brown); then recolored a *third* time same day to a pale minimal palette
  (`canvas`/`canvas-deep`/`paper`/`ink`/`ink-soft`/`line` sampled pixel-for-
  pixel from a reference screenshot the user sent, wanting "essa mesma
  paleta" applied site-wide). That third pass is current — `canvas` is now
  very pale off-white (`#faf7f2`), `ink` near-black, `line` a muted tan
  border. It also **removed `wood`/`clay`/`rattan` from customer-facing site
  chrome** (nav hover, WhatsApp button, link colors, decorative rules/dashed
  borders) in favor of plain `ink`/`line` — those three tokens' hex values
  are kept only for literal product-color representation (`WeavePattern`
  swatches, `lib/palette.ts` `FIOS`, admin `<input type="color">`) and for
  `/admin`'s own UI (not reskinned to match, it's staff-only). Don't
  reintroduce teal or true navy-blue (old `marine`/`navy`), and don't add
  saturated accent color back into customer-facing chrome without the user
  asking — the current look is intentionally close to monochrome.
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
- `public/brand/` — the atelier's own brand assets, supplied directly by the
  user (not sourced/licensed by Claude): `logo.png` (circular "SA" mark,
  transparent background, 1024×1024) and `bem-vindo.png` (a 1792×592 "Bem
  vindo ao Ateliê" photo banner of crochet thread/wooden bowls, with the
  greeting text baked into the image). Added 2026-09-21 into
  `components/site-header.tsx`: the logo sits next to the "Sentarte" wordmark
  in the sticky nav row, and `bem-vindo.png` is a short non-sticky ribbon
  above the nav (fades into `canvas` at the bottom edge via a gradient
  overlay) — the user asked for both "no cabeçário", kept subtle/short so it
  doesn't compete with the carousel's own welcome moment below it.
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

`getContent()` busts the blob's CDN cache with `?v=<Date.now()>` on every
read (fixed 2026-09-21 — an earlier attempt busted with `list()`'s own
`uploadedAt` instead, but that metadata can itself lag behind the write by
10-30s, so the query stayed identical and the stale response kept being
served; `Date.now()` has no such dependency). Without cache-busting at all,
`fetch(match.url, {cache:"no-store"})` only skips Next's own Data Cache —
the blob's public URL still sits behind a CDN edge cache.

**Even with the fix, treat writes to this blob as eventually consistent —
NOT immediately read-your-writes.** Every save does a read-modify-write of
the *whole* content object, so if a second save's `getContent()` runs
before the first save has propagated, the second save's write will
silently revert the first save's change (confirmed empirically: the
propagation window is variable, seen anywhere from ~8s to ~25-30s, and
longer — up to ~40s — for a save that also uploads a photo). When making
several category/model edits back to back (by hand or via automation),
wait for each save to be confirmed live (**hard-reload**, e.g.
ctrl+shift+r — a plain reload can itself serve a browser-cached `/admin`
response and show stale data even once the blob write really has landed;
this cost real time misdiagnosing propagation delay on 2026-09-21 when it
was actually just browser cache) before starting the next one — don't fire
them in quick succession.

**Server Actions default to a 1MB body limit** (`experimental.serverActions
.bodySizeLimit` in `next.config.ts`, raised to `10mb` on 2026-09-21). A
~2.9MB promo photo uploaded via the "Time do coração" Foto field silently
failed for close to two minutes before this was diagnosed — the action
never ran, so there was nothing to wait out, and no error surfaced through
the admin UI or the browser-automation flow used to drive it. If a future
photo upload never confirms no matter how long you wait, suspect this
limit before suspecting Blob propagation delay again.

2026-09-21: added six real "Cadeiras de praia" models, one per soccer team
(Flamengo, Corinthians, Botafogo, Fluminense, Palmeiras, Vasco), each with a
customer-supplied WhatsApp photo the user sorted into per-team folders under
`~/Pictures/cadeiras de praias/` and asked to have "cadastradas" — uploaded
via the real `/admin` file-upload flow (not committed to the repo, they live
in Blob under `modelos/` like any other admin-uploaded photo). These sit
alongside the earlier generic "Time do coração" model rather than replacing
it. Each team also got a second admin-panel model named `"<Time>
personalizado"` (e.g. "Vasco personalizado") holding a photo with a real
customer name woven in.

**"<Nome> personalizado" is a naming convention, not a schema field** —
`lib/modelo-pairs.ts` (`pairPersonalizados()`) scans a category's flat
`modelos` array and folds any `"<Nome> personalizado"` entry into its
`"<Nome>"` sibling, so they render as *one* `ModeloCard` with a "Sem
nome"/"Personalizado" toggle instead of two separate cards. This was a
direct revision 2026-09-21 — building them as 12 separate cards (per the
user's own earlier choice) read as cluttered once live ("não gostei
muito"), so the toggle replaced it. `ModeloCard` is a client component now
(it needs the toggle's local state) — always pass the *base* model as
`modelo` and the sibling (if any) as `personalizado`, never the reverse.
The toggle only appears when a personalizado sibling exists; a model with
no pair (e.g. "Trama lisa") renders exactly as before.

**The six team models are curated out of "Cadeiras de praia"'s general grid
and centralized at `/times`** (`app/times/page.tsx`) — also a same-day
revision: showing all 6 teams inline in the category grid *and* behind
"Time do coração" read as redundant once both existed. `lib/team-models.ts`
is now the single source of truth for the team name list (`TIMES`) and
`getTeamPairs(categorias)` (base+personalizado lookup); `components/
team-grid.tsx` renders that list as a `ModeloCard` grid and is reused by
both `/times` and the homepage's `TeamShowcase` section. In
`app/categoria/[slug]/page.tsx`, the six team models (base + personalizado)
are filtered out of the general grid entirely, and the "Time do coração"
model renders as `components/cover-link-card.tsx` (`CoverLinkCard`) — a
card styled like `ModeloCard` but that's just a `Link` (to whatever `href`
it's given), no add-to-cart. `/busca` still surfaces individual team
models on a matching search — only the *browsing* grid excludes them, not
search.

If a 7th team gets added via `/admin` later, add its name to `TIMES` in
`lib/team-models.ts` — that's the only place the list lives.

**"Cadeiras boho" ended up mirroring the team pattern exactly, after two
false starts on 2026-09-21/22** — worth reading in order since each was a
direct user correction:
1. First built as a *single* `Modelo` using the `variantes` photo picker
   (6 patterns as one product with a color-swatch selector), shown inline
   in the general grid with its own "Adicionar ao carrinho".
2. User compared it to "Time do coração" (screenshot, circled) and wanted
   the same "just a cover + link" card in the grid — so the picker+cart
   moved to a dedicated `/boho` page, but *still as one single `Modelo`*
   with 6 photo variants selected by swatch.
3. User sent two more screenshots: `/times` (six separate cards, each its
   own product) vs. `/boho` (one card with a swatch picker) and said
   "separa elas" — they wanted the *teams* structure, not the variant-
   picker structure: **six standalone `Modelo`s**, not one model with
   `variantes`.

Current state matches step 3 / the teams exactly: `lib/boho-model.ts`
exports `BOHO_NOME` ("Cadeiras boho", the cover-only model that renders
via `CoverLinkCard` in the general grid, same as `TIME_DO_CORACAO_NOME`)
and `BOHO_PADROES` (the six pattern names — "Diamante verde", "Degradê
pôr do sol", "Diamante multicolor", "Totem espiral", "Losango terracota",
"Sol" — each its own `Modelo`, no `personalizado` sibling, no
`variantes`). `app/categoria/[slug]/page.tsx` hides both `TEAM_MODEL_NAMES`
and `BOHO_PADROES` from the general grid (`HIDDEN_FROM_GRID`); `app/boho/
page.tsx` renders `BOHO_PADROES` as a `ModeloCard` grid, structurally
identical to `app/times/page.tsx` (that one uses `getTeamPairs()` for the
personalizado pairing boho doesn't need — otherwise the same shape). If a
7th boho pattern gets added, add its name to `BOHO_PADROES`, same as
adding a team to `TIMES`. The `variantes` field/UI (photo-swatch picker)
is still real and still used elsewhere — it just turned out to be the
wrong fit for this specific "several distinct standalone products" case;
reach for it only when there's genuinely *one* product in different
colorways (Flamengo's alternate layouts), not a family of separate
products.

**This is now the confirmed standard for any future product group**
(2026-09-22: "ficou certo agora... quero que você mantenha isso como
padrão para as coisas que vou te pedir" — after the boho detour above).
When the user asks to add a new *group* of related products, go straight
to: separate `Modelo`s + a curated name list in `lib/` + a generic cover
`Modelo` rendered via `CoverLinkCard` in the general grid + a dedicated
`app/<group>/page.tsx` grid page + excluding the group's names from
`HIDDEN_FROM_GRID` in `app/categoria/[slug]/page.tsx`. Don't propose the
`variantes` picker for a new group and don't re-derive this structure from
scratch — copy `/times` or `/boho`.

**`Modelo.variantes?: string[]` (added 2026-09-21)** holds extra photos of
the same model in other color arrangements (e.g. Flamengo's alternate
red/black layouts) — `imagemUrl` stays the primary/cover photo, `variantes`
are additional ones. Admin support is capped at 5 extra slots
(`fotoVariante2`..`fotoVariante6` fields in `updateModeloAction`, generated
via a `[2,3,4,5,6].map(...)` in `app/admin/page.tsx`, so 6 total photos per
model) rather than an open-ended list — raised from an initial cap of 2 the
same day to fit "Cadeiras boho" (6 distinct patterns). Bump the array
literal in both files together if a model ever needs more than 6.
`ModeloCard` shows a row of small photo-swatch buttons to pick a variant,
but **only in the "Sem nome" state** — a personalizado model always shows
its own single photo, no variant picker, since no personalizado model has
more than one photo yet.

**Personalizado now has a real name input.** When "Personalizado" is
selected, `ModeloCard` shows a text field for the customer's name/apelido;
it's threaded into both the cart (`CartItem.nomePersonalizado`, shown in
`CartDrawer` and included in the consolidated WhatsApp message) and the
card's own quick "Pedir direto pelo WhatsApp" link. The cart item's `id`
incorporates the typed name (`${categoriaSlug}:${modeloId}:${nome}`) so two
different names for the same model become separate line items instead of
just bumping quantity on one.

`app/admin/actions.ts` Server Actions default to a 1MB body limit in
Next.js — raised to `10mb` in `next.config.ts`'s
`experimental.serverActions.bodySizeLimit` after a ~2.9MB photo silently
failed to upload for close to two minutes with no error surfaced anywhere
(see "Content model" above for the incident). If a future upload never
confirms, suspect this before Blob propagation delay.

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

## Cart & search

- Added 2026-09-21 (user: "quero a lupinha para as pessoas pesquisarem, o
  carrinho... e o negócio de usuário adm"). Both are intentionally simple —
  no backend, no accounts.
- **Cart**: `lib/cart-context.tsx` (`CartProvider`/`useCart`, "use client")
  holds cart state in memory and mirrors it to `localStorage` — there is no
  server-side cart, no database table, nothing admin-editable. `CartProvider`
  wraps everything in `app/layout.tsx`. `components/add-to-cart-button.tsx`
  is the primary CTA on `ModeloCard` (adds one item, opens the drawer);
  `components/cart-drawer.tsx` is the slide-over (qty steppers, remove,
  "Esvaziar carrinho"). Checking out ("Finalizar pedido no WhatsApp") builds
  *one* consolidated message listing every line item and opens
  `whatsappUrl()`, then clears the cart — there's still no payment step, the
  cart only changes how the WhatsApp message gets composed (one order vs.
  one message per model). `ModeloCard` also keeps a small secondary "Ou
  pedir direto pelo WhatsApp" link for a single-item order that skips the
  cart entirely.
- **Search**: `/busca?q=...` (`app/busca/page.tsx`, `force-dynamic`) flattens
  every category's `modelos`, accent-insensitive-substring-matches against
  `nome`/`descricao`/category `titulo`, and renders results with the same
  `ModeloCard`. The page's own search box is a plain `<form method="get">` —
  no client JS needed for the search itself. The header's search icon is
  just a `Link` to `/busca`.
- **Admin icon**: the header's admin-panel link icon was `LockIcon`, swapped
  to `UserIcon` (a plain person glyph) to match the reference screenshot's
  icon row (search / user / cart). It's still just a `Link` to `/admin` —
  no customer accounts exist, this icon is staff-only, same as before.

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
