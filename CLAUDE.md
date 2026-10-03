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
  - hero-beach.jpg, sand-texture.jpg — used in the old two-column
    hero/sobre (2026-09-21). Sources: unsplash.com/photos/9Itl-03hLao,
    /n5HOJGtYt4Q.
  - rope-texture.jpg — superseded 2026-09-25 by thread-spools.jpg below,
    no longer referenced; left on disk in case a future section wants a
    plain texture again.
  - thread-spools.jpg — `components/home/material-spec.tsx`'s photo
    (2026-09-25). Not stock — cropped from a screenshot the user supplied
    of an old site/Instagram post of their own branded thread spools
    (their "@ateliesentarte" tag is visible in it); the original file no
    longer exists anywhere, this crop is the only copy.
  - carousel-times.jpg, carousel-boho.jpg, carousel-boho-2.jpg — the three
    `components/home/carousel.tsx` slides (2026-09-25, replacing the
    original Unsplash carousel-palms/wave/sunset). Real product lifestyle
    photos the user supplied directly (one AI-generated mockup of the
    team chairs, two real photos of the boho chairs) — not stock, no
    license needed.
- `public/videos/monte-sua-cadeira.mp4` — the user's own clip (480x848,
  ~3.5s, a chair being woven), shown looping/muted/autoplay in the
  /personalizar header and on the "Monte a sua trama" CoverLinkCard (`videoUrl`
  prop, homepage + /categoria/cadeiras) since 2026-09-29 ("sempre fica
  rodando"). Source:
  `~/Pictures/cadeiras de praias/Video monte sua cadeira/`.
- `public/brand/` — the atelier's own brand assets, supplied directly by the
  user (not sourced/licensed by Claude): `logo.png` (circular "SA" mark,
  transparent background, 1024×1024), used next to the "Sentarte" wordmark in
  `components/site-header.tsx`'s sticky nav row. `bem-vindo.png` (a 1792×592
  "Bem vindo ao Ateliê" photo banner of crochet thread/wooden bowls) sat above
  the nav as a short non-sticky ribbon from 2026-09-21 until 2026-09-26, when
  the user asked to remove it and shrink the header down to just the nav row
  ("o espaço está muito grande") — left on disk unreferenced in case a future
  section wants it again.
- Avoid generic AI-page tells: no ALL-CAPS labels, no middle-dot-joined meta
  strings, no arrow-suffixed link text, no uniform rounded-card-with-grey-shadow
  kit. Hover states use a hard offset shadow (`hover:shadow-[6px_6px_0_0_var(--rattan)]`)
  to read as a stamped/print card, not a soft SaaS shadow.

## Storage — repo, not Vercel Blob (2026-10-02, supersedes Blob notes below)

The free Vercel Blob store was suspended for exceeding usage limits twice
(old account 09-24, this one ~10-01: `limits-exceeded-suspended`, every
photo 403). Everything moved into the repo:
- `content/site-content.json` — the site content (same `SiteContent` shape).
  `getContent()` imports it at build time; no storage calls on page views.
- `public/catalogo/*.jpg` — all catalog photos (converted ≤1400px).
- `content/admin.json` — `revogadoEm` for "Sair de todos os aparelhos".
- Admin saves commit to GitHub through `lib/github-store.ts` (Contents
  API, needs `GITHUB_TOKEN` env var, fine-grained, Contents read/write on
  guitrindd3/sentarte). Each commit redeploys → changes show in ~1-2 min.
  Writes use the file sha from `getContentForWrite()` so a stale save is
  rejected (409) instead of overwriting. Without the token, /admin shows a
  banner and saving fails.
- `@vercel/blob` was uninstalled. The Blob store still exists (suspended) on
  the account, unused. Notes below about Blob propagation/caching are
  historical.

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
`ModeloCard` shows the variants as a gallery on the photo itself (prev/next arrows plus a thumbnail row overlaid at the bottom, hover previews; redesigned 2026-09-29 after the user found the old below-the-photo "Cor: Variação 1" swatch row "estranho" — kept on the photo so cards with/without variants stay the same height),
but **only in the "Sem nome" state** — a personalizado model always shows
its own single photo, no variant picker, since no personalizado model has
more than one photo yet.

**`Modelo.fotosExtras?: string[]` (added 2026-09-29)** holds extra photos
that are NOT a choice — other angles, or other customers' names on a
"personalizado" model. The card gallery shows `imagemUrl`, then `variantes`
(counted as "N cores", sent with the order as "Opção N"), then
`fotosExtras` (counted as "N fotos", never sent as a choice). A
personalizado sibling's gallery is its own `imagemUrl` + `fotosExtras`.
First populated by a script from `~/Pictures/cadeiras de praias/` (the
user: "faz do mesmo jeito para todas as cadeiras");
editable in /admin since 2026-09-29 ("Mais fotos": thumbnails with a remover checkbox + a multi-file input, capped at 8 per model in updateModeloAction).

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

## Offer, SEO & caching (2026-09-29 improvement pass)

- **Commercial terms live in `lib/offer.ts`**, not in admin content: chair
  price R$ 449,90, up to 4x on card (with the card fee, so never write "sem
  juros"), free shipping to all of Brazil, production in up to 5 business
  days, coupon `SENTARTE` = 5% off from 2 chairs, 2% off paying with Pix (stacked on the final total). Only the `cadeiras`
  category shows a price (`CATEGORIA_COM_PRECO`). A chair with a woven name
  costs `PRECO_CADEIRA_COM_NOME` (R$ 489,90) — `precoCadeira(comNome)`; the
  cart prices each line by whether it has `nomePersonalizado`, and every
  chair card offers the Sem nome/Personalizado toggle (name required to add
  to cart), not only models with a "<Nome> personalizado" sibling photo.
  Exception: `DESENHO_TEMAS` models (animes/desenhos) are already a
  personalized design — always the personalized price, no name toggle
  (`ehDesenho` in `ModeloCard`, `CartItem.personalizada`,
  `precoItemCadeira()`); /desenhos uses `<OfferStrip soPersonalizada />`. Used by `OfferStrip`
  (homepage band + compact under catalog headers), `ModeloCard`, the cart
  drawer totals/WhatsApp message, the FAQ and `politica-de-envio`.
- **`CATEGORIAS_OCULTAS` (bolsas, espreguicadeiras)** are filtered out inside
  `getContent()` itself, so every public page/nav/sitemap/search drops them
  while the data stays in Blob and editable in `/admin` (which reads via
  `getAdminContent()`, unfiltered and uncached). User: "ainda não" — they may
  come back; remove the slug from the set to restore.
- **Public content reads are cached across requests** (`unstable_cache`, tag
  `site-content`, 5 min) — see the comment in `lib/content-store.ts`. Admin
  saves call `updateTag` via `revalidateSite()`, so edits still appear on the
  next request. Functions are pinned to `gru1` (São Paulo) in `vercel.json`.
- SEO: no canonical/og:url in the root layout (it made every page claim to
  be the homepage); each page uses `pageMetadata()` from `lib/seo.ts`.
  JSON-LD via `components/json-ld.tsx`: `Store` in the layout, `FAQPage` on
  /faq, product `ItemList` with the price on /times, /boho, /desenhos.
  `GOOGLE_SITE_VERIFICATION` env var (optional) feeds the Search Console
  meta tag. `@vercel/analytics` is mounted in the layout.
- Brand is spelled **SentArte** (matches `site.nome` in the admin content).
- The header's admin (person) icon was removed — it read as a customer
  login. Reach the panel directly at `/admin`.
- Homepage: `CategoryBento` now shows the four collection cover cards
  (times/boho/desenhos/monte a sua) instead of category tiles. (A homepage
  mini live preview, `PreviewPromo`, was added and then removed the same day
  at the user's request — the flat chair illustration didn't look good.) `WhatsAppFloat` is the fixed bottom-right contact button.

## Monte a sua trama builder (2026-09-29)

**2026-10-02 update:** the base photo is now a frame of the user's second
clip (`public/monte/cadeira-trancada.{jpg,png}`, 464x832, higher camera so
the seat is visible) — regions in `lib/chair-render.ts` were re-measured
for it (ENCOSTO + ENCOSTO_QUAD trapezoid, LATERAIS, ASSENTO polygon), crop
CORTE_Y0=150. The seat takes a pattern too (`Opcoes.formaAssento`, detail
color, cells mapped in the seat's perspective by row edges); "Desenho do
assento" chips in step 1; link param `fa`. The intro clip/empty frame are
still from the first video (different angle) — a better matching clip would
make the transition seamless. Shape grid has Encosto / Assento tabs (one grid,
`parte` decides which shape it sets). Backrest pattern/name x is measured
between the trapezoid's edges on each row, so pattern columns follow the
slanted strands; backrest pattern area = MARGEM_TOPO 80 / MARGEM_BASE 30 /
MARGEM_LADO 14 (user-marked box, 2026-10-02) — patterns, figures and the
name stay inside it (meio-a-meio excepted); the seat's back band (y<504) and front band (y>=628) never
get pattern — only the vertical strands' color (user 2026-10-02). Seat pattern
and name only go on the flat panel between the side tubes
(`ASSENTO_PAINEL`, kept inside the curved side margins and slanted with the
seat), size `escalaAssento` 0.4-2 (link `ea`; above 1 the figure is cut at the panel edge), on a fixed 60x27 grid so figures fit whole and
centered; the name can go on the seat instead of the backrest
(`Opcoes.nomeAssento`, link param `na`) and then replaces the seat figure.
Shape thumbnails are flat (`desenharMiniatura`), not photo crops. **150 shapes per tab (600 visible) since 2026-10-03** — the user asked to remove everything that looked alike: `FORMAS_OCULTAS` in `lib/formas-extras-3.ts` hides 87 near-duplicates (numbered variants of stripes/checks/dots/zigzags, extra numbers...) from the grid only; their tests stay so old `/c` links still render — never delete a shape key, hide it. Batch 3 (`lib/formas-extras-3.ts`) adds generated team crests (7 outlines × interiors, 45 — "mais variações de escudo"), geometric figures, boho kilims/medallions/figures/textures, and 149 pixel icons in `lib/formas-icones.ts` converted from Phosphor Icons (MIT — license text kept in that file's header; regenerate with the scratchpad rasterizer, don't hand-edit). Before adding shapes, check new ones against the existing grid for look-alikes. The original ones are
`case`s in `celulaDaForma`; the 120 added 2026-10-02 live in
`lib/formas-extras.ts` (`FORMAS_EXTRAS` tests + `ROTULOS_EXTRAS` labels, and 200 more in `lib/formas-extras-2.ts` — repeated sprites/cells there draw only whole pieces,
pixel figures auto-fitted and centered). The seat grid is 61 columns (odd)
so centered shapes have a true middle; the seat panel is centered on the
chair's middle x=223 (ASSENTO_MEIO_X), which is also the 3-color split.

`/personalizar` is `components/chair-builder.tsx`, a 4-step builder
(trançado, cores, nome, pronto) built on the REAL chair from the user's
weaving clip instead of a drawn illustration (the old flat SVG
`Configurator`/`ChairPreview` and the Press Start 2P font were removed —
the user said it "não ta legal" and didn't want anything paid, e.g. AI 3D
services). Flow: shows `public/monte/cadeira-vazia.jpg` (clip frame 1,
empty frame) → "Começar a montar" plays the clip up to `FIM_DA_TRAMA`
(1.72s) → from then on a canvas repaints `public/monte/cadeira-trancada.jpg`
(clip frame at ~1.75s, black/white weave, no name) via
`lib/chair-render.ts` `pintarCadeira()`: every webbing pixel keeps the
photo's brightness (strand texture, light) and is recolored as main thread
(A, originally black) or detail thread (B, originally white); the backrest
panel also gets the weave shape and the name (`lib/pixel-font.ts`, 5x7
bitmap; size slider; position set by dragging on the canvas in the Nome
step — `posicaoNoEncosto()`, clamped to the area between the plain
MARGEM_TOPO/MARGEM_BASE bands, which the weave shape never enters either
(except "meio-a-meio", split top to bottom like real team chairs);
optional third color (`Opcoes.corC`, "Usar 3 cores" toggle in the Cores
step) splits the main/vertical thread down the middle (the seat is always
the main color only — no detail-color stripes, user 2026-10-02) (left corA, right
corC) on the backrest and seat — works with every shape; "triangulo-grande"
reproduces the three-color chair the user showed (a separate side-strap
color was added and then removed at the user's request, 2026-09-30 —
side straps always use corB); shape size `escalaForma` (0.35-1, draws a scaled copy in a box of
the name area) + `posForma` set by dragging in step 1 when reduced — a
reduced shape is not cleared by the name band, and a new name starts on
the opposite half; shapes
are grouped in tabs (Básicos / Estilo time / Estilo boho / Divertidos) via
`FORMAS[].grupo` in the builder;
). Regions (ENCOSTO/LATERAIS/ASSENTO) are hand-measured pixel
coordinates of that 480x848 frame — re-measure if the base photo changes.
The clip's frames aren't pixel-aligned (it's AI-generated; the background
shifts), so the webbing can't be found by diffing the two frames.
Frames were extracted with `ffmpeg-static` (npm, free) — not a project
dependency. A sharper pair of real photos (empty frame + fully white-woven,
same camera position) would look better; the user was told this.

## Mobile & navigation (2026-09-30)

- Every inner page has a "Voltar" (`components/back-link.tsx`) at the top —
  `PageHeader` renders it (prop `voltarPara` = fallback when the visitor
  didn't come from another page of the site; /times, /boho, /desenhos fall
  back to /categoria/cadeiras). The user had been tapping the logo to go back.
- The site header is `sticky` on the `<header>` element itself (before this
  the sticky class sat on its only child, so it never actually stuck).
- Phone layout choices: homepage collection cards 2 per row (`CoverLinkCard
  compacto`), homepage team showcase is a sideways-swipe row
  (`TeamGrid deslizar`), product photos square below `sm`, smaller section
  padding below `md`, /personalizar hides its header clip below `md` and the
  builder keeps the chair full size (a shrinking pinned band felt jumpy —
  user video 2026-09-30) and instead fades in a small live mini preview at
  the bottom-right while the big chair is scrolled out of view (phones only;
  on desktop the chair column is sticky and sized to the viewport height). Size controls (− % +) live under the chair and under the mini
  preview, editing the backrest shape / seat figure (step 1) or the name
  (step 3); seat name size `tamanhoNomeAssento` (link `tna`) never cuts the name.
- The one saturated color allowed in customer-facing chrome is `verde`
  (`--verde` in globals.css), and only on the builder's go-buttons
  (Começar a montar with the `.pulso-verde` ring, Próximo, Pedir pelo
  WhatsApp) — the user asked for a "cor chamativa verde, de validação".
- Homepage carousel: 4s per photo, order boho-2 / boho / times (user's
  pick); phones show a square photo frame (object-cover — the user wanted
  every slide to fill it like the square times photo, no letterbox) with
  the phrase/buttons below it; desktop unchanged.
- Homepage "Nossas cadeiras" row (every team, boho and desenho chair, all
  screen sizes, since 2026-10-02) drifts by itself and loops (`AutoScrollRow`:
  a duplicated, `inert` second set marked `data-loop-start`; pauses 3.5s
  after touch). No scroll-snap there — snap fights the sub-pixel drift.
- Mobile check workflow: Playwright (installed only in the session
  scratchpad, not a project dependency) with the iPhone 13 profile at
  deviceScaleFactor 1 — full-page shots at 3x blank out past ~16k px.

## Chair picture in the cart (2026-10-03)

The builder's cart item uses `imagemUrl: /api/cadeira?<choices>` (the same server render as the WhatsApp preview), so the cart shows the exact chair instead of a weave swatch; `CartDrawer` loads `/api/` images `unoptimized` with object-contain. The cart item id is the encoded design, so two different chairs never merge.

## Chair picture in the WhatsApp message (2026-10-02)

wa.me links can't attach images, so the builder's WhatsApp message carries
`/c?<choices>` (`lib/chair-link.ts` packs the design into the query
string). `/c` sets og:image to `/api/cadeira?<choices>`, which re-renders the
chair server-side with the same `pintarCadeira()` on
`public/monte/cadeira-trancada.png` (pngjs) — WhatsApp shows it as the link
preview. Nothing is stored. Catalog card photos use object-cover (fill the
frame, no white bands — user 2026-10-02).

## Online payment — Mercado Pago Checkout Pro (2026-09-30)

- The cart drawer shows "Pagar agora (Pix ou cartão)" only when the
  `MERCADOPAGO_ACCESS_TOKEN` env var is set on Vercel AND the cart has only
  chairs (fixed price). It opens `CheckoutForm` (delivery details, ViaCEP
  lookup) → POST `/api/checkout` → Mercado Pago preference → redirect.
  Pix: Pix-only preference at `totalPix`; card: card-only, up to
  `PARCELAS_MAX` installments at `total` (installment interest is whatever
  the Mercado Pago account is set to charge the buyer).
- `/api/checkout` recomputes every amount from `lib/pedido.ts`
  (`calcularPedido`) — never trusts browser prices.
- Mercado Pago sends the buyer back to `/pedido?payment_id=…`; that page
  confirms the status with `GET /v1/payments/{id}` before saying "aprovado",
  clears the cart, and offers a WhatsApp message with items + paid amount +
  payment id + delivery address (summary kept in localStorage under
  `sentarte-pedido` before redirect). WhatsApp stays the confirmation
  channel (user's choice). No order database and no webhook yet — the
  Mercado Pago dashboard is the record of payments.

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

## Security (2026-09-30 pass)

- Security headers + CSP in `next.config.ts` (`headers()`), `poweredByHeader:
  false`. If you add a new external resource (script, image host, fetch
  target), add it to the CSP or it will be silently blocked.
- Admin login: 1s delay per wrong password, 15-min lockout per IP after 5
  (in-memory per instance). Sessions last 7 days; "Sair de todos os
  aparelhos" writes `admin/sessoes-revogadas.json` to Blob and
  `verifySession()` rejects tokens issued up to that time (proxy.ts only
  checks the signature; the page/actions enforce revocation).
- Admin uploads accept only real JPEG/PNG/WebP (type + magic bytes), ≤10MB.
- `/admin`, `/api/`, `/pedido` are disallowed in robots and `/admin` is
  noindex. `/pedido` only trusts a payment whose external_reference matches
  the URL's.
- Keep `next` patched (`npm audit --omit=dev`) — upgraded 16.3.5 → 16.3.8 for
  GHSA-vcvr-r3jv-pc5j.

## Before shipping a change

Run `npm run build` (Next 16 + Turbopack; also runs the TypeScript check) and
`npx eslint .` — both must be clean. Both succeed without any env vars set
locally, since `force-dynamic` pages that touch Blob/session data never
execute during `next build`. `npm run dev -- -p <port>` for local review of
non-admin pages; check `netstat -ano | grep :<port>` before reusing a port,
dev servers from earlier sessions can linger.

## Deploy

Vercel project `sentarte` on the `ateliesentarte@gmail.com` account (team slug
`ateliesentarte-4506`, since 2026-09-24), production alias `sentarte.vercel.app`
(reclaimed 2026-09-29 after deleting the old `guitrindd3` project;
`sentarte-ten.vercel.app` 308-redirects to it), GitHub repo `guitrindd3/sentarte`. The Vercel
project is Git-connected (as of 2026-09-20) — push to `main` and it
auto-builds/deploys; no need to hand-inline files through the Vercel MCP
`create_deployment` tool anymore (that was the workaround used before the
Git connection existed). SSO/Vercel Authentication protection is disabled on
this project on purpose so the public site isn't gated. A Vercel Blob store
(`sentarte-content`) is attached to the project — `BLOB_READ_WRITE_TOKEN` is
auto-provisioned by Vercel, don't hand-set it.
