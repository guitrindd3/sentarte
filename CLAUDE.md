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
- `@vercel/blob` was uninstalled. The suspended Blob store `sentarte-content`
  was emptied and DELETED by the user on 2026-10-05 (with its
  `BLOB_READ_WRITE_TOKEN`); the account has no Blob stores. Notes below about Blob propagation/caching are
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
  juros"), shipping quoted by CEP (see "Shipping" below — no more free shipping), production in up to 5 business
  days, coupons are managed in the admin (see "Coupons"; SENTARTE = 5% off from 2 chairs), 2% off paying with Pix (stacked on the final total). Only the `cadeiras`
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
  Search Console is verified (2026-10-05) by the file `public/google590b889b4b231e43.html` — never delete it. `GOOGLE_SITE_VERIFICATION` env var (optional, unused) feeds the Search Console
  meta tag. `@vercel/analytics` is mounted in the layout.
- Brand is spelled **SentArte** (matches `site.nome` in the admin content).
- The header's admin (person) icon was removed — it read as a customer
  login. Reach the panel at `/admin` — "Área do ateliê" lock link at the end of the phone ☰ menu and in the footer's "Institucional" list (2026-10-06; it was in the footer's bottom corner, under the WhatsApp button). The floating WhatsApp button (`components/whatsapp-float.tsx`) hides while the footer (`#rodape`) is on screen.
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
empty frame) → "Começar a montar" goes STRAIGHT to step 1 (since 2026-10-05 the
weaving clip no longer plays inside the builder — user didn't want to wait; it
still loops in the page header) → from then on a canvas repaints `public/monte/cadeira-trancada.jpg`
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

## Shipping (2026-10-03)

Free shipping was removed from the whole site (user). Shipping is quoted by CEP: `lib/frete-servidor.ts` calls Melhor Envio's calculate API (cheapest carrier) from `FRETE_CEP_ORIGEM` with the packed-chair size in `FRETE_CAIXA` ("altura,largura,comprimento,pesoKg") and `MELHORENVIO_TOKEN`. **Espírito Santo CEPs (29xxx) ship free, but this must never be announced on the site** — the customer only sees "Grátis" after typing an ES CEP. `/api/frete` serves the cart (CEP field under the subtotal, remembered in localStorage) and the checkout form (`lib/use-frete.ts`); `/api/checkout` recomputes it and adds a "Frete" item to the Mercado Pago preference (the Pix 2% applies to the chairs only). Until the Melhor Envio env vars exist, non-ES CEPs show "Combinado pelo WhatsApp" and can't pay online.

## Chair sizes (2026-10-03)

`lib/medidas.ts` holds the specs (on /personalizar shown INSIDE the header under the text since 2026-10-06 — `<MedidasCadeiras embutido>`, folded in a details box on phones; the header logo scrolls to the top when already on the homepage) from the atelier's own card (infantil, fixa 1 posição, reclinável 8 posições — also 4 and 6): shown by `components/medidas-cadeiras.tsx` on the homepage (after MaterialSpec), /categoria/cadeiras and /personalizar, plus a FAQ entry. The homepage "Escolha a sua cadeira" block no longer has a "Ver todos os modelos" link (user: the 4 cards already cover everything). `FRETE_CAIXA` on Vercel is the folded fixed chair shipped in a plastic bag (no box — user): weight 2.1 kg (2 kg chair + 100 g plastic, user), size 10x56x76 cm (started as an estimate; the user said to keep it, 2026-10-03).

## Shape search & testimonials (2026-10-03)

- The builder has a "Buscar trançado" box above the style tabs: accent-insensitive match on the shape label across all four tabs (tabs show unselected while searching; clicking a tab clears the search).
- `SiteContent.depoimentos` (customer name, optional city/photo, text), managed in /admin ("Depoimentos de clientes", needs GITHUB_TOKEN to save). The homepage section `components/home/depoimentos.tsx` renders only when there is at least one — at the bottom, just before the contact CTA, as small square thumbnails beside the quote (user 2026-10-05). Only real customer messages — never invent testimonials.

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

## Admin panel redesign (2026-10-05)

The user found the one-page /admin "muito minimalista" and confusing (saved, looked at the site, nothing yet). Now a route group `app/admin/(painel)/` with its own shell (espresso sidebar on desktop, bottom tab bar on phones; the public header/footer are hidden on /admin via `components/fora-do-admin.tsx`): Início (counts, shortcuts, "Últimas alterações" from GitHub commits starting with "Painel:", models missing a photo), Cadeiras (`catalogo`: category tabs, searchable photo grid, add model → goes straight to its editor), one editor page per model (`catalogo/[catId]/[modeloId]`: drag-and-drop photo slots with preview, variants, extra-photo gallery, order up/down, inline delete confirm, warning when the name ties it to /times, /boho, /desenhos — see `lib/admin-grupos.ts`), Depoimentos, Textos e contato.
- Every action returns a `Resultado` (`executar()` in actions.ts) shown as a toast; `AdminForm` (`app/admin/_ui.tsx`) submits by hand through useActionState so a failed save keeps what was typed, and remounts its fields after a successful one. Server pages can't pass render-function children to it (client boundary) — form state for `BarraSalvar`/`SaveButton` comes from context.
- One save = ONE commit: photos are staged with `prepararFoto()` and committed together with the content by `gravarCommit()` (Git Data API) in `lib/github-store.ts` — before, each photo was its own commit and its own redeploy. Commit messages are "Painel: <what changed>" in Portuguese (shown in the panel's history).
- "Site atualizado / Atualizando o site…" chip: `/api/admin/status` compares the serving deploy's `VERCEL_GIT_COMMIT_SHA` with the newest commit on main; polls fast for a few minutes after a save and toasts when the change is live.
- Photos are shrunk in the browser before upload (≤2000px JPEG, also converts HEIC when the browser can decode it).
- Local check: `next start` + Playwright with a session cookie signed with `SESSION_SECRET` from `.env.local`; saving fails locally (no `GITHUB_TOKEN`, it's a Vercel Secret) — which exercises the error toast.

## Site statistics — admin "Acessos" (2026-10-05)

Vercel Web Analytics wasn't enabled and on Hobby can't record searches/clicks, so the site counts itself: `components/rastreador.tsx` (root layout; page views on route change + a capture-phase click listener: `data-rastro` label, else WhatsApp/Instagram links, else the button/link text ≤50 chars; `data-sem-rastro` opts an area out) → `POST /api/e` (bots, the admin's own browser — `sentarte_admin` cookie — and >120/min per IP are dropped) → `lib/estatisticas.ts`, per-day Redis hashes `e:YYYY-MM-DD:{geral,pag,ref,disp,busca,clique,carrinho,hora,local}` + HyperLogLog `:vis` (visitor = one-day sha256 of secret+IP+UA, never stored raw), 400-day expiry. Cart adds come from `addItem` in `lib/cart-context.tsx`; the builder's shape search is sent after 1.5s idle; /busca's `q` rides on the page view. Dashboard: `app/admin/(painel)/acessos` (Hoje/7/30/90 days; 90 days ≈ 900 Redis commands per load).
- Storage: Upstash Redis "sentarte-estatisticas" from the Vercel Marketplace, plan **free**, region gru1, **autoUpgrade=false** (must never bill — the user can't spend money). Env vars `KV_REST_API_URL`/`KV_REST_API_TOKEN` (UPSTASH_REDIS_REST_* also accepted); without them tracking no-ops and the page says it isn't on yet. REST `/pipeline` via fetch, no SDK.
- Privacy page has an "Estatísticas de visita" paragraph — keep it true if tracking changes.
- Local test: scratchpad `fake-redis.mjs` (tiny REST stand-in) + `KV_REST_API_URL=http://localhost:3199`.

## Admin login security (2026-10-05)

`lib/seguranca.ts` + `/admin/seguranca` (sidebar "Segurança"; on phones a header link). All state in the same Upstash Redis as the statistics (`lib/redis.ts`):
- **Phone code (TOTP, RFC 6238, own implementation, no lib)**, turned on by the admin from /admin/seguranca: QR (`qrcode` npm, server SVG) → first code confirms → 8 one-time recovery codes shown once (stored as salted sha256 in a Redis set). Secret stored AES-256-GCM-encrypted with a key derived from SESSION_SECRET (`admin:totp`). Login is two-step: password → short-lived `sentarte_pre` cookie (5 min, path /admin) → code (app code or recovery code; an app code's 30s step can't be reused). Sessions carry `mfa: true`; once the code is on, `verifySession()` rejects password-only sessions. Rotating SESSION_SECRET breaks the stored secret/recovery codes — turn the code off first.
- While it's on, /admin/seguranca also offers "Gerar novos códigos reserva" (confirm with the app code → 8 new ones, old ones die; `novosCodigosReserva()`) and "Escanear de novo no celular" (new QR/secret without turning it off; reuses the setup flow, issues new recovery codes) — the user prefers app codes over recovery codes (2026-10-05).
- **Locked out (lost phone and recovery codes)?** Delete Redis key `admin:totp` (and `admin:reserva`, `admin:totp:ultimo`) with the `KV_REST_API_*` env vars — the panel goes back to password only.
- Login code field: number keyboard for the app code, with a "Usar código reserva (com letras)" toggle to the full keyboard (user 2026-10-05: on the phone recovery codes could not be typed).
- Wrong attempts (password or code) → `admin:falhas:<ip>` (5 per 15 min). History: `admin:log` (last 200: event, ok, city, device, masked IP), shown as a table.
- "Sair de todos os aparelhos" now writes `admin:revogadoEm` in Redis (instant); `content/admin.json` is the old repo-based copy, still honored (max of both).
- `verifySession()` fails closed if Redis errors. Without Redis env vars everything falls back to the old password-only behavior.
- Tested end to end locally (scratchpad `teste2fa.mjs`: fake Redis + a throwaway `ADMIN_PASSWORD_HASH` for "teste123" passed only to the local `next start`).

## Visitors & customers (2026-10-05)

The user asked "quem é o visitante". Anonymous visitors can't be identified (and the privacy page promises not to try); three consented/anonymous alternatives were built, all in the same Upstash Redis:
- **Visit journeys** ("Acessos" → tab "Visita por visita", `app/admin/(painel)/acessos/visitas`): `lib/rastro.ts` gives each tab a random `vid` (sessionStorage `sentarte-visita`) sent with every event; `cmdsDoCaminho()` in `lib/estatisticas.ts` keeps `vj:<vid>` (start/end, city, device, origin, flags carrinho/whatsapp/pagar/pagou/lista) + `vj:<vid>:p` (≤80 steps) for 30 days, index zset `vj`. Server-side steps (`anotarNoCaminho`): went to pay (/api/checkout), paid (/pedido), joined the list. Filters: carrinho / WhatsApp / foi pagar / lista; `?id=<vid>` shows one visit.
- **Started orders / abandoned carts** (admin "Clientes"): /api/checkout saves `pedido:<ref>` (name, WhatsApp, city, items, value, vid; 180 days, zset `pedidos`) after the Mercado Pago preference is created; /pedido marks it paid/pending/refused; the Clientes page also asks Mercado Pago (`payments/search?external_reference=`) for open ones. "Não terminou" = still waiting after 30 min; Início shows a callout for those (last 7 days). WhatsApp follow-up button with a prefilled message. The checkout form says the data is kept for contact about the order.
- **Novidades list**: footer box (`components/lista-novidades.tsx`, required consent checkbox, honeypot, 5 sign-ups/IP/hour) → `/api/interessados` → hash `interessados` keyed by number. Admin can call, remove, or copy all numbers; Início shows a green callout for sign-ups in the last 7 days.
- Privacy page describes all three. Admin nav: Início, Acessos, Clientes, Cadeiras, Depoimentos, Textos e contato, Segurança; on phones the bottom bar is Início/Acessos/Clientes/Cadeiras/Mais (`/admin/mais`).

## Coupons (2026-10-05)

Admin "Cupons" (`app/admin/(painel)/cupons`; phones: Mais → Cupons). Stored in Redis hash `cupons` (by code), paid uses in `cupons:usos` — changes apply instantly, no deploy. `lib/cupom.ts` = shared math (`melhorCupom`: the single biggest discount wins, no stacking; Pix 2% still stacks on top), `lib/cupons-store.ts` = storage/validation (on, valid-until date in Brasília, use limit). Fields: code (A-Z0-9), % or R$, min chairs, valid until, use limit, note, "entra sozinho" (automatic). SENTARTE (5% from 2 chairs, automatic) is seeded once from the old `lib/offer.ts` constants (removed) — the admin may edit/delete it; `cupons:semeado` stops re-seeding. Without Redis the old SENTARTE terms apply (`CUPOM_PADRAO`).
- Cart: "Tem cupom de desconto?" field (`lib/use-cupons.ts`, `/api/cupom` lookup, 30/min/IP, typed code remembered in localStorage and re-checked). `/api/checkout` re-checks the code server-side (`cuponsDoPedido`) and stores it on the order; uses are counted when the order becomes "pago" (`marcarPedido`). WhatsApp-closed orders aren't counted.
- The offer strip's 4th item and the FAQ's multi-chair answer come from the automatic coupon (fallback "Feito à mão" / question hidden).

## Google Business Profile (2026-10-05)

An "Ateliê SentArte" profile already existed (category Artesanato, Serra area, same WhatsApp); the user added the site link to it. Its share link is `site.googleUrl` (content, editable in /admin "Textos e contato"): footer "Avaliações no Google", a card on /contato, and in admin Clientes a "Pedir avaliação" WhatsApp button on paid orders plus a copyable review-request message. If the user later gets the direct "Pedir avaliações" link from the profile dashboard, they can paste it in that field. Profile ownership (verified/managed by the atelier account) wasn't confirmed yet.

## Editable page texts — admin "Páginas" (2026-10-05)

User: "quero editar o Sobre… deve ter telas aonde mexo em cada uma das páginas". `lib/textos-paginas.ts` lists every page with fixed text (home sections, Sobre, Contato, FAQ, Monte a sua trama, Times/Boho/Desenhos headers, Envio, Trocas, Privacidade, Termos): fields (`linha`, `texto`, `imagem` = photo URL — uploaded in the same commit via prepararFoto, "Remover" restores the default photo — and `blocos` = list of {titulo, texto}, optionally `fixo`) and the CURRENT wording as `padrao`. Saved in `SiteContent.paginas[pageId]` — only fields that differ from the default (so improving a default reaches untouched pages). Pages read `textosDaPagina(content.paginas, id)`; rich text renders with `components/texto-rico.tsx` (blank line = paragraph, `{preco}`/`{preco_nome}`/`{preco_pix}`/`{pix}`/`{parcelas}`/`{prazo}`/`{nome}` placeholders from lib/offer.ts, `[words](whatsapp|/path|https://…)` links; `textoSimples()` for titles/JSON-LD). Policy pages share `components/pagina-de-texto.tsx`. Admin: `/admin/paginas` list + `/admin/paginas/[id]` editor (`EditorBlocos` client list with add/remove/reorder), "Voltar ao texto original". Saving commits like other content (site updates in 1-2 min). When adding a new fixed text to a page, add it to the registry instead of hard-coding it. Not in "Páginas": the chair specs table (`lib/medidas.ts`), the builder's own UI texts, and the dynamic FAQ coupon answer.
Three defaults were corrected on 2026-10-05 because they still said orders were WhatsApp-only (FAQ "Como faço um pedido?", Envio production start, Termos intro).

## Photos in the admin: carousel list + "Ajustar" (2026-10-05)

- Homepage carousel photos are a `fotos` field (`carrossel`, max 8) in Páginas → Página inicial (`app/admin/(painel)/paginas/fotos.tsx`: add/remove/reorder/adjust; posts `carrossel.ordem` JSON tokens "u:<url>"/"n:<k>" + `carrossel.novos` files; the action only keeps URLs that were already in the saved/default list). `components/home/carousel.tsx` takes `fotos` (defaults = the 3 original /photos/carousel-*.jpg).
- Every admin photo field (FotoSlot, GaleriaFotos, carousel) has "Ajustar": `app/admin/ajustar-foto.tsx` (react-easy-crop, MIT) — shapes Original/Quadrada/Em pé (4:5)/Deitada (3:2)/Larga (16:9), zoom, rotate; outputs a ≤2000px JPEG File that replaces the field's file (adjusting a saved photo uploads a new copy; in the gallery the old one is marked for removal).
- Neither the chair row nor the top photo carousel pauses on mouse hover any more (user 2026-10-05: "quero que ele continue"); the row still pauses 3.5s after a drag/swipe/wheel, the carousel while keyboard focus is inside it.
- Homepage "Nossas cadeiras" row cards made smaller (user: "muito grande") — 23.5% of the column on desktop, 34% sm, 76% phones — and on every ModeloCard the whole photo is a button that ADDS THE CHAIR TO THE CART (changed the same day from a WhatsApp link — user: "tem que puxar para o carrinho"; personalizado without a name focuses the name field instead). Cards have two buttons: "Comprar" (filled; `comprarAgora` in the cart context adds once — no duplicate — and opens the drawer on the delivery/payment step, `etapa` now lives in the cart context) and "Adicionar ao carrinho" (outline). "Ou pedir direto pelo WhatsApp" stays below.
- Homepage "Nossas cadeiras" row now spans the full screen width (user: chairs should slide out at the screen edges); first card aligns with the text column via `lg:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]`, card widths computed from the viewport so they keep the old size.

## Star reviews (2026-10-05)

`Depoimento.estrelas` (1-5). The homepage testimonials section (`components/home/depoimentos.tsx`) now always renders: stars per card, the average + count, and "★ Já tem a sua? Avalie" (`components/avaliar.tsx` → `POST /api/avaliacoes`: stars, name, city, comment; honeypot; 3/IP/day). Reviews wait in Redis hash `avaliacoes:pendentes` (`lib/avaliacoes.ts`) until approved in /admin → Depoimentos ("Esperando aprovação": edit text/stars, add a photo, Aprovar e publicar → becomes a Depoimento via commit; or Recusar). Início shows a callout while some wait. The admin's own testimonials get a stars select too, and existing ones can get stars ("Salvar estrelas"). After sending, the customer is invited to also review on Google (`site.googleUrl`). No AggregateRating JSON-LD on purpose (self-serving reviews aren't eligible for Google stars). Privacy page default has an "Avaliações" section.

## Chair types in Monte a sua trama (2026-10-05)

Only the builder offers a chair type (user: no photos, chosen only there): Infantil R$ 399,90 / with name R$ 429,90, Normal R$ 449,90 / 489,90, Reclinável 8 posições R$ 549,90 / 569,90 — `TIPOS_CADEIRA` in `lib/offer.ts`, `precoCadeira(comNome, tipo)`. Selector above the builder steps with prices + the type's specs (from `lib/medidas.ts`); the preview stays the normal chair (a note says so). The type travels as `Opcoes.tipo` / link param `tc`, `CartItem.tipoCadeira` (missing = normal), the WhatsApp message ("Tipo: …"), the cart line name, and `ItemDoPedido.tipoCadeira` — /api/checkout and /api/frete sanitize it with `tipoValido()` and price it server-side. Shipping quotes one Melhor Envio product per type (`calcularFrete(cep, porTipo, valor)`): normal = `FRETE_CAIXA`; infantil/reclinável = `FRETE_CAIXA_INFANTIL` / `FRETE_CAIXA_RECLINAVEL` env vars, or estimates (8×42×50 cm 1.2 kg; 12×56×92 cm 2.6 kg) until the user sends real folded sizes.

## Cleanup (2026-10-05)

Ran `npx knip` (no unused source files). Removed: unused assets `public/brand/bem-vindo.png`, `public/photos/hero-beach.jpg`, `public/photos/rope-texture.jpg`, `public/catalogo/flamengo.jpg`; dead `UserIcon`; needless exports; the Vercel Blob hosts from the CSP and `images.remotePatterns` (`blob:` stays for admin previews); `@vercel/analytics` (Web Analytics was never enabled on the project — it recorded nothing; stats are our own, see "Site statistics"); the create-next-app README. Kept on purpose: `public/google590b889b4b231e43.html` (Search Console), `lib/chair-render.ts` / `lib/formas-extras-2.ts` exports used by offline render scripts. Notes above that mention those removed files are historical.

## Pix inside the site (2026-10-06)

User didn't want buyers sent to the Mercado Pago page. Pix is now paid INSIDE the cart drawer: `/api/pix` creates a Payments API Pix (`payment_method_id: "pix"`, 30-min `date_of_expiration`, idempotency key `<ref>-pix-site`) and returns the QR (`qr_code_base64`) + copia e cola; `components/pix-no-site.tsx` shows them and polls `/api/pix/status` (checks `external_reference` = this order) every 4 s; when approved it marks the order paid and goes to `/pedido?payment_id=…&external_reference=…`, which confirms again, clears the cart and offers the WhatsApp summary. Mercado Pago requires the payer's e-mail for this → the checkout form now has an e-mail field (required only for Pix). **Card inside the site too (2026-10-06):** `components/cartao-no-site.tsx` loads Mercado Pago's SDK v2 and the **Card Payment Brick** with `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (Vercel env, Production; inlined at build), max 4 installments; the brick returns a one-time card token → `/api/cartao` recomputes the amount and charges it via the Payments API (idempotency key from the token), maps refusal `status_detail` to Portuguese messages, marks the order paid/pending/refused, then goes to /pedido. The card number never touches our server. Fallback link "Prefere pagar na página do Mercado Pago?" still uses Checkout Pro (`/api/checkout`). CSP in next.config.ts allows the Mercado Pago/Mercado Libre/mlstatic hosts (script, style, img, font, connect, frame). No 3-D Secure handling yet — if many cards come back `pending_challenge`/refused, add it. Order math shared by both in `lib/checkout-servidor.ts` (`prepararPedido` / `registrarPedido`).

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

## Speed pass (2026-10-06)

User: "o site está muito lento". Public pages (/, /times, /boho, /desenhos, /personalizar, /sobre, /contato, /faq, policies, /categoria/[slug] via generateStaticParams) are no longer `force-dynamic`: `export const revalidate = 600` → pre-rendered, served from cache (`x-nextjs-cache: HIT`), rebuilt at most every 10 min and on every admin save (`revalidateSite()` = `revalidatePath("/", "layout")`). /busca, /c, /pedido stay dynamic. Anything a public page reads at render time must be cacheable: Redis reads use `fetch` with `no-store`, which forces the page dynamic — so the offer strip/FAQ use `cuponsDaVitrine` (`unstable_cache`, tag `cupons`, 10 min); the coupon admin actions call `updateTag("cupons")` + `revalidateSite()`. Cart/checkout/`/api/cupom` stay live. Don't add per-request reads (cookies, headers, live Redis) to these pages — use a client component + API route instead.
The "Monte a sua trama" clip was re-encoded (690 KB → 165 KB, no audio, faststart; ffmpeg-static in the scratchpad) and has a poster `public/videos/monte-sua-cadeira.jpg` (its first frame) — before, it showed a black box until it loaded.
