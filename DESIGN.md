---
name: UniHome
description: Logement étudiant vérifié par IA au Maroc — Soft-depth SaaS, electric blue on near-white, the verification pipeline shown working.
colors:
  ground: "#fafafa"
  surface: "#ffffff"
  ink: "#09090b"
  ink-secondary: "#52525b"
  ink-muted: "#71717a"
  hairline: "#e4e4e7"
  divider: "#f4f4f5"
  electric-blue: "#2563eb"
  electric-blue-deep: "#1d4ed8"
  electric-blue-bright: "#60a5fa"
  blue-tint: "#eff6ff"
  night: "#09090b"
  night-surface: "#18181b"
  night-hairline: "#27272a"
  night-body: "#a1a1aa"
  verdict-green: "#059669"
  verdict-green-bright: "#34d399"
  verdict-amber: "#fbbf24"
  verdict-amber-deep: "#d97706"
  verdict-red: "#ef4444"
  verdict-red-bright: "#f87171"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "2.6rem" # steps to 3.75rem (sm) and 4.4rem (lg) on the hero
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.875rem" # steps to 2.25rem (sm); final CTA reaches 3rem
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.9375rem" # 15px standard prose; 1rem–1.125rem for the hero lead
    fontWeight: 400
    lineHeight: 1.625
  data:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.8125rem" # 13px terminal body; 10–11px for micro-labels
    fontWeight: 500
    letterSpacing: "normal"
    fontFeature: "'zero' 0 at micro sizes — plain zero; the slashed zero reads as 8 below ~12px"
rounded:
  pill: "9999px"
  container: "24px"
  card: "16px"
  panel: "12px"
  tile: "8px"
  inset: "6px"
spacing:
  section-y: "96px" # py-24, steps to 112px (sm:py-28)
  section-x: "20px" # px-5, steps to 32px (sm:px-8)
  card-pad: "28px" # p-7; audience panels use 32px (p-8)
  grid-gap: "16px"
  headline-drop: "48px" # mt-12 between section headline and its content
components:
  button-primary:
    backgroundColor: "{colors.electric-blue}"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.electric-blue-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
  button-quiet:
    backgroundColor: "{colors.surface}"
    textColor: "#27272a"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-inverse:
    backgroundColor: "#18181b"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  chip-verified:
    backgroundColor: "#ecfdf5"
    textColor: "#047857"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: UniHome

## Overview

**Creative North Star: "The Control Room"**

UniHome's homepage does not market verification — it performs it. The page is a calm, near-white operations surface where a synthetic listing visibly travels through the real control pipeline (5 weighted criteria, a 0–100 score, a verdict) and comes out the other side with a badge that was earned on screen. The aesthetic is Soft-depth SaaS at the Linear/Vercel 2026 bar: one confident Geist display voice, hairline-bordered white cards that sit flat until touched, a single electric blue accent doing all the brand work, and exactly one near-black band where the machine speaks in monospace.

The personality is factual and protective, in French. Copy states what the product does and — in a dedicated section — what it deliberately does not do (no contracts, no payments, no commission). Confirmed rejections: the icon-card marketing scaffold the category defaults to (three columns of icon + title + blurb) is refused in favor of bento tiles containing working abstract mockups; seed or demo data never appears on the homepage (every visual is a synthetic skeleton); testimonials, user counts, press, and partner logos are never fabricated; unbuilt features (messaging, booking, payment) are never implied.

**Key Characteristics:**

- Near-white ground (#fafafa) with zinc ink and one electric blue accent (#2563EB)
- Geist everywhere; JetBrains Mono strictly for pipeline data and machine output
- Hairline-bordered white cards, flat at rest, soft ambient shadow on hover
- One dark "terminal" band per page — the authored dramatic moment
- Verdict colors (emerald/amber/red) bound to real score states only
- Dot-grid texture and a single blue bloom as the only ornament
- Scroll-reveals, magnetic primary CTA, sequenced pipeline animation — all gated on `prefers-reduced-motion`

## Colors

A zinc monochrome field where blue is the only voice and green must be earned.

### Primary

- **Electric Blue** (#2563eb, Tailwind blue-600): the single brand accent. Primary CTAs, inline links, pipeline arrows, radius rings, icon tints inside cards, the campus pin. Hover deepens to **Deep Blue** (#1d4ed8, blue-700). On dark surfaces it brightens to **Bright Blue** (#60a5fa, blue-400). **Blue Tint** (#eff6ff, blue-50) grounds icon squares and the resolution row of the pain strip.

### Neutral

- **Ground** (#fafafa, zinc-50): the page background. The same value doubles as the sunken inner-panel tone inside white cards.
- **Surface** (#ffffff): card and section-band background. Alternating white bands on the #fafafa ground create the page rhythm.
- **Ink** (#09090b, zinc-950): headlines and primary text; also the background of the dark pipeline band.
- **Ink Secondary** (#52525b, zinc-600): body prose. **Ink Muted** (#71717a, zinc-500): captions, "déjà inscrit ?" lines, terminal prompts.
- **Hairline** (#e4e4e7, zinc-200): the universal card border. **Divider** (#f4f4f5, zinc-100): inner list dividers and skeleton fills.
- **Night Surface** (#18181b, zinc-900) with **Night Hairline** (#27272a, zinc-800) borders and **Night Body** (#a1a1aa, zinc-400) prose: the vocabulary of the dark band.

### Semantic (verdict states)

- **Verdict Green** (#059669 light / #34d399 dark, emerald): score ≥ 70 — "Vérifiée", auto-published. Also the WhatsApp chip.
- **Verdict Amber** (#fbbf24, amber-400): score 40–69 — queued for human review. Appears only in the dark band's threshold rows. On light instrument surfaces (score numerals, rulers, map pins) the amber verdict deepens to **Verdict Amber Deep** (#d97706, amber-600) for contrast — this is the value `verdictColor()` returns.
- **Verdict Red** (#ef4444 light / #f87171 dark): score < 40 — rejected; also the pain-strip X marks and hover tint (red-50 wash).

### Named Rules

**The One Voice Rule.** Electric blue is the only brand accent on the page. No secondary accent color exists; anything that isn't blue is zinc or a bound verdict color.

**The Earned Green Rule.** Emerald, amber, and red appear exclusively attached to their real score thresholds (≥ 70 / 40–69 / < 40) or a real state (WhatsApp, reported listing). They are never decorative — green is a verdict, not a garnish.

## Typography

**Display & Body Font:** Geist (with system-ui fallback) — loaded from Google Fonts, weights 400–800, applied via the `font-geist` Tailwind family.
**Data Font:** JetBrains Mono (weights 400–500).

**Character:** One quiet, confident grotesque carries the whole human voice — authority comes from scale and tight tracking, not from a second family. The mono is the machine's voice: whenever the pipeline itself speaks (scores, weights, thresholds, terminal output), the typeface switches.

### Hierarchy

- **Display** (700, 2.6rem → 3.75rem → 4.4rem, 1.04, −0.03em): hero headline only. Balanced (`text-balance`), with the emotional clause ("sans arnaque.") in electric blue.
- **Headline** (700, 1.875rem → 2.25rem, tight, −0.02em): section openers. Sections lead directly with the headline — no kicker above it.
- **Title** (700, 1.25rem, −0.01em): bento-card and step titles.
- **Body** (400, 15px standard / 16–18px hero lead, 1.625): zinc-600 prose, `text-pretty`, max ~28–32rem measure (`max-w-md`/`max-w-xl`).
- **Data** (500, 13px terminal / 10–11px micro-labels, `tabular-nums`): JetBrains Mono. Score ranges ("score ≥ 70"), criteria weights, terminal transcript, window-chrome labels; micro-labels may be uppercase with wide tracking.

### Named Rules

**The Machine Voice Rule.** JetBrains Mono appears only where the verification system itself is speaking: pipeline numbers, weights, thresholds, terminal output, and machine chrome labels. Human copy never sets in mono; numbers inside human copy stay in Geist.

**The Plain-Zero Rule.** JetBrains Mono at micro sizes (≤ ~12px readouts) sets `font-feature-settings: "zero" 0` — the slashed zero reads as an 8 at those sizes.

**The No-Kicker Rule.** Sections open with the headline itself. No uppercase eyebrow labels above headings.

## Layout

Single-column centered page: content containers are `max-w-5xl` (hero) and `max-w-6xl` (all other sections), padded 20px → 32px horizontally. Vertical rhythm is generous — 96px → 112px section padding (the pain strip runs slightly tighter at 80px → 96px). Page structure alternates full-bleed bands: #fafafa ground → white bordered band (`border-y` hairline) → #fafafa → the one dark band → #fafafa, ending in a hero-width rounded container for the final CTA.

Inside sections: a section headline, then a 48px drop (`mt-12`) to the content. The feature area is a bento grid (`md:grid-cols-2 lg:grid-cols-3`, 16px gaps) with one large 2×2 tile holding the signature radius-map mockup, two 1×1 tiles, and one full-width strip. Two-audience content splits into a symmetric `lg:grid-cols-2`. Hero and split sections collapse to a single column below `lg` (1024px); CTAs stack full-width below `sm` (640px).

App-like instrument surfaces (the public search) widen to `max-w-[1400px]` and run a **50/50 theater**: result list (left) and map (right) in `lg:grid-cols-2` with the map column sticky (`top-6`, `h-[calc(100vh-8rem)]`, min 480px). Below `lg` the map collapses into a full-screen overlay summoned by a fixed bottom-center "Carte" pill.

Texture is applied per-section, not globally: a 22px dot grid (`radial-gradient`, 1px dots at 10% ink opacity) masked with a radial ellipse so it fades before content, plus one large blurred blue bloom (blue-600 at 10%, `blur-3xl`) per dotted section.

## Elevation & Depth

Soft-depth: surfaces are defined by hairline borders first, shadows second. Cards sit flat at rest on their 1px zinc-200 border; depth appears as a response — a long, low-opacity ambient shadow on hover, or a permanent float under the two "product frame" moments (hero mock, terminal). The primary CTA and the terminal carry blue-tinted glows, tying elevation itself to the brand accent. Dark-mode depth swaps shadows for near-black ambient and relies on zinc-800 borders.

### Shadow Vocabulary

- **CTA glow** (`box-shadow: 0 8px 24px -8px rgba(37,99,235,0.5)`): under primary blue pill buttons, always on.
- **Mock float** (`box-shadow: 0 24px 60px -30px rgba(9,9,11,0.25)`): the hero verification frame; the one big at-rest lift on the page.
- **Card hover** (`box-shadow: 0 16px 48px -24px rgba(9,9,11,0.2)`): bento cards, on hover only (`transition-shadow`).
- **Terminal glow** (`box-shadow: 0 32px 80px -40px rgba(37,99,235,0.35)`): the terminal inside the dark band — blue light leaking from the machine.
- **Chip shadow** (`shadow-md` / `shadow-sm`): floating proof chips and map pins.

### Named Rules

**The Flat-at-Rest Rule.** Standard cards show no shadow at rest — border does the work. Shadow is reserved for hover response and the two authored product frames.

**The One Dark Band Rule.** Exactly one near-black (#09090b) section per page: the pipeline explainer, where the terminal lives. Dark is drama, and drama is rationed.

## Shapes

Two silhouettes rule the page: the **pill** (9999px — every button, badge, chip, tag, progress bar, and skeleton line) and the **soft rectangle** (16px cards, 24px for the final-CTA container, 12px inner panels, 8px nested tiles and icon squares). Radius steps down with nesting: container 24 → card 16 → panel 12 → tile 8 → inset 6. Borders are always 1px hairlines; there are no hard-offset shadows, no sharp corners, and no clipped or diagonal geometry. Product frames use faux window chrome: three 10px zinc dots plus a mono label. Icons are Lucide strokes at 14–18px, tinted blue or zinc, always accompanying text — never as standalone decoration.

## Components

### Buttons

- **Shape:** full pill (9999px), 15px semibold Geist, icon + label + trailing arrow that slides 2px on hover.
- **Primary:** electric blue (#2563eb) on white text, 28px×14px padding, permanent CTA glow, hover → #1d4ed8. The hero and final-CTA primaries are _magnetic_: they translate toward the cursor (0.12x/0.18y multipliers, 200ms ease-out), reset on leave, disabled under reduced motion.
- **Quiet (secondary):** white surface, zinc-300 border, zinc-800 text; hover darkens border and washes zinc-50. Used for the owner path beside every primary.
- **Inverse:** zinc-900 fill, white text (inverts in dark mode) — the owner-panel CTA.
- **Tertiary/link:** blue text, medium weight, `underline-offset-4`, underline on hover ("Se connecter").

### Chips / Badges

- **Verdict badge:** pill, emerald-50 bg / emerald-700 text, ShieldCheck icon, 12px semibold — appears only after the on-screen check sequence resolves.
- **Audience badge:** solid pill (blue-600 for students, zinc-900 for owners), white 12px bold text + icon.
- **Proof chips:** floating white pills with hairline border, `shadow-md`, ±3–4° rotation, blue icon — pinned to the hero mock's corners, hidden below `lg`.
- **Contact chips:** zinc-50/hairline pill for "Appeler", emerald-tinted pill for "WhatsApp".
- **Filter chips (search console):** 36px pills wrapping a select or number input. Idle: white, zinc-200 hairline, zinc-700 text; active (value set): blue-50 bg, blue-200 border, blue-800 text (dark: blue-500/10 wash). Lucide icon at 14px left; numeric inputs set in mono with `tabular-nums`; `focus-within:ring-2 ring-blue-500/30`.

### Cards / Containers

- **Corner style:** 16px (`rounded-2xl`); the final-CTA container 24px.
- **Background:** white on the #fafafa ground; zinc-50 for panels inside white bands; zinc-900 with zinc-800 borders on the dark band.
- **Shadow strategy:** flat at rest, card-hover shadow on hover (see Elevation).
- **Border:** always 1px zinc-200 (zinc-800 dark).
- **Internal padding:** 28px (p-7); audience panels 32px (p-8). Inner lists use zinc-100 dividers (`divide-y`) instead of nested boxes.

### Navigation

The homepage renders without the site header; entry points are in-page CTAs. (Header/footer remain on the incumbent world — see Migration Boundary.)

### The Terminal (signature)

A zinc-900 frame (16px radius, zinc-800 border, blue terminal glow) with window chrome, running a JetBrains Mono 13px transcript of the real pipeline: a `$` prompt line, five criteria rows with weight percentages (35/20/20/15/10) and blue-500 progress bars that scale in with `cubic-bezier(0.16,1,0.3,1)` staggered 140ms, a count-up score ("87 / 100", cubic ease-out ~1.1s), an emerald verdict line, and a blinking block caret. All numbers `tabular-nums`.

### The Search Console (signature — "La Ligne de Commande")

Search is a command issued to the verification machine, not a form above a list. A white 16px-radius card with mock-float shadow, topped by a **query line**: a zinc-50 (dark zinc-950) mono strip where a blue `$` prompt echoes the command being composed live from the chips — `$ recherche campus:EMI rayon:≤5km budget:≤3 000DH …` — ending in a pulsing blue block caret (static under reduced motion). Below it, the filter chips plus a natural-language input whose parser is **deterministic**: it only matches campuses, cities, types, budgets, surfaces and equipment that exist in the real catalogue, then fills the same chips. No fabricated AI interpretation.

### Result Rows (instrument rows)

A listing is an instrument row, not a marketing card: photo (rounded-xl, hover scale 1.05) → identity (15px bold Geist title, zinc-500 address line) → **mono readout** (11px JetBrains Mono: distance / prix / m², values in ink with `tabular-nums`) → a hairline-divided **verdict column** (w-32, `sm:` and up) holding the score numeral (18px mono, verdict-colored), its label (Vérifiée / En revue / Risquée) and a `ScoreRuler`. Rows are flat at rest with card-hover shadow; rows excluded by the trust lens render at `opacity-35 saturate-50` instead of unmounting.

### TrustLens

A score-threshold range slider (0–100, step 5) labeled `score ≥` in mono. At 0 the lens is off: the track is neutral zinc and the thumb zinc-500 — verdict colors are earned, never idle decoration. Once engaged, the track shows the three verdict zones as tints (red 40% / amber 30% / emerald 30%) and the 18px white-ringed thumb plus the mono value numeral take `verdictColor(value)`. Filtered-out rows dim rather than vanish, and the list header states the honest count: `12/31 annonces · score ≥ 70`.

### The Command Map

Leaflet 1.9.4 loaded from CDN with SRI integrity pins. The campus anchors the frame as a blue rounded-square badge; listings are **verdict-colored dot pins** carrying their score in 10px mono (selected: 12px + pulsing ring). The signature instrument is the **radius commander**: the blue radius circle has a draggable east handle (white disc, 3px blue border, blue glow) — dragging resizes the ring live between 500 m and 15 km, and release commits a real re-search through the same pipeline as the console (a fixed mono "dispatch en cours…" toast reports it). Selecting a listing draws the campus→listing walking route via OSRM (`/route/v1/foot`, straight-line fallback), and a mono HUD reads the machine state.

### The Inspection Replay (signature — detail page)

The annonce detail page's one dark band, framed as "La Contre-Visite": the machine rejoue son inspection devant l'étudiant across three acts. **Act I** is a full-bleed cinematic gallery (edge-to-edge photo band, mono frame counter `01/05` in a zinc-950/60 backdrop-blur pill, keyboard arrows + touch swipe, filmstrip thumbnails) that deliberately withholds the verdict — the first viewport shows title, ville and prix in machine voice but no score. **Act II** is the terminal band itself: a `rounded-3xl` zinc-950 container with zinc-800 border, terminal-glow shadow and window chrome, replaying the 5 real criteria (justificatif .35 / photos .20 / prix .20 / description .15 / cohérence .10, with `detail.texte` as the description fallback) as staggered mono rows, a `useCountUp` score (1300ms, reduced-motion gated), the verdict resolving in its earned `verdictColor`/`verdictLabel`, and a `ScoreRuler`. **Act III** is the ContactVault (below).

Two patterns this page introduces:

- **Page-scoped `dark` wrapper.** The dark band is wrapped in `<section className="dark">`, so its interior reuses the system's existing `dark:` vocabulary instead of a parallel set of dark-band classes. To stay distinct when the whole app is in dark theme, the band deepens beyond the page surface: `dark:bg-black` with `dark:border-zinc-700` (one step lighter than the ambient zinc-800 hairlines) and a `dark:ring-zinc-800`.
- **The Withheld Verdict.** The sticky summary bar (mono, `top-[72px]`, prix + CTA) shows no score on arrival; the score numeral joins only after Act II has scrolled into view, gated by an IntersectionObserver flipping a one-way `replaySeen` flag. The verdict is earned by watching the replay, never leaked above it.

### The ContactVault (signature — detail page)

Owner contacts are sealed, not merely hidden: masked mono rows (Lock icon, placeholder digits) inside a hairline card, unlocked by a blue-glow primary CTA that runs the real consultation call — the reveal is a genuine backend event, not a client-side toggle. After reveal, contacts render as real chips (zinc-50/hairline rows; WhatsApp keeps its emerald tint per The Earned Green Rule). The vault sits in a sticky aside (`lg:top-32`) beside the fiche technique `dl` grid and équipements chips.

### The Verification Mock (signature)

The hero's product frame: window chrome over a zinc-50 well containing a three-part pipeline — generic listing skeleton (camera placeholder, pill skeleton lines) → mono-labeled blue arrow ("analyse", "5 critères") → verdict card whose three checks resolve in a 260ms-staggered sequence before the "Vérifiée" badge scales in at ~1150ms. Entirely synthetic; no real listing data.

### Motion Grammar

- **Reveal:** every section block enters via IntersectionObserver — 16px rise + fade, 700ms ease-out, sibling delays 80–360ms, fired once.
- **Gated disclosure:** IntersectionObserver may also gate _information_, not just entrance — the detail page's sticky-bar score appears only after the inspection replay has been seen (one-way flag, never re-hidden).
- **Ambient loops:** radar rings (3.2s scale/fade) on the radius map; 1.1s step-end caret blink.
- All motion, including magnetic hover and count-ups, collapses to static end-states under `prefers-reduced-motion: reduce`.

## Do's and Don'ts

### Do:

- **Do** keep electric blue (#2563eb) as the sole accent, with emerald/amber/red bound strictly to score thresholds ≥ 70 / 40–69 / < 40 (The Earned Green Rule).
- **Do** cite the real pipeline facts when showing the mechanism: 5 criteria weighted 35/20/20/15/10, score 0–100, thresholds ≥ 70 auto-publish / 40–69 review / < 40 reject — in JetBrains Mono with `tabular-nums`.
- **Do** build surfaces from white cards with 1px zinc-200 hairlines, flat at rest, ambient shadow on hover only.
- **Do** write UI copy in French — factual, protective, first-person plural ("On contrôle…"), stating limits as plainly as capabilities.
- **Do** pair every primary blue CTA with a quiet bordered alternative for the owner path.
- **Do** gate every animation on `prefers-reduced-motion` and fire reveals once.
- **Do** keep filtering honest: threshold controls dim excluded rows (`opacity-35 saturate-50`) instead of hiding them, and counts state x/y against the full result set.
- **Do** keep "AI" input deterministic on search surfaces: natural-language parsing may only match values that exist in the real catalogue and must fill the same visible controls it stands beside.
- **Do** ship full `dark:` variant coverage on migrated app surfaces (zinc-900 surfaces, zinc-800 hairlines, bright-blue accent).

### Don't:

- **Don't** use seed or demo data (listing titles, prices, owner names, photos) on the homepage — visuals are abstract synthetic mockups only.
- **Don't** fabricate testimonials, user counts, press mentions, or partner logos anywhere.
- **Don't** imply unbuilt features: messaging between users, booking, payment, mobile app, realtime notifications.
- **Don't** build icon-card marketing grids (icon + title + blurb columns); features are shown as bento tiles containing working abstract product mockups.
- **Don't** add a second dark section, a second accent color, kicker/eyebrow labels, or mono type in human prose.
- **Don't** revive the discarded worlds: "Minuit → Plein Jour" Moroccan-modern (majorelle/terracotta/sand, Bricolage Grotesque) and the legacy Syne/indigo identity are incumbents being replaced, not options.

## Migration Boundary (August 2026)

This system is canonical for UniHome going forward (per the standing brand commitment in PRODUCT.md), but only the homepage has crossed so far:

- **On this world (Soft-depth SaaS):** `/` — frontend/src/pages/public/HomePreview.jsx; the public search `/annonces` and `/search` — frontend/src/pages/public/Search.jsx ("La Ligne de Commande", seed f66ed5f9 candidate 6 "the synchronized instrument") with frontend/src/components/search/ (SearchConsole, ResultRow, TrustLens, CommandMap) and the shared instruments in frontend/src/components/ui/instruments.jsx; the public annonce detail `/annonces/:id` — frontend/src/pages/public/AnnonceDetail.jsx ("La Contre-Visite", seed a8de6f35 candidate 3, mode operate: three acts — CinemaGallery / InspectionReplay / ContactVault — with restyled AvisSection, MiniMap and signaler modal; all legacy data logic preserved verbatim).
- **Still on "Minuit → Plein Jour" Moroccan-modern** (world primitives in frontend/src/world/, `.mms` scopes): the public shell (WorldHeader/WorldFooter), /login, /register, student and owner dashboards.
- **Still on the legacy Syne/indigo identity** (the `primary` indigo / `accent` violet / `dark` navy tokens and Syne/DM Sans families in frontend/tailwind.config.js): remaining public and admin bodies.

When migrating a route, adopt this DESIGN.md; do not blend worlds within a surface. The legacy Tailwind tokens and the Syne/DM Sans/Bricolage font loads in frontend/index.html remain only to serve un-migrated routes and should be removed once the migration completes.
