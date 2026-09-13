---
name: Treino
description: Papel morno, tinta quente e um único verde pinho que quer dizer "feito".
colors:
  papel: "#fbf9f6"
  carta: "#ffffff"
  tinta: "#1a1714"
  tinta-2: "#4a423b"
  tinta-3: "#6f665e"
  pinho: "#2f6b4f"
  pinho-fundo: "#245740"
  pinho-claro: "#e9f1ec"
  pinho-nevoa: "#f4f8f5"
  ambar: "#8a5a00"
  ambar-claro: "#fdf4e6"
  rubro: "#a32e22"
  rubro-claro: "#fbeeec"
  linha: "#ebe5dc"
  linha-forte: "#d7cec3"
typography:
  titulo-tela:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.012em"
  titulo-tela-largo:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.012em"
  titulo-cartao:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.012em"
  corpo:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  corpo-menor:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  medida:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.1
    fontFeature: "tabular-nums"
  bloco:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  bloco-forte:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
  meta:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  etiqueta:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.2
  rotulo:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.02em"
  miudo:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.9em"
    fontWeight: 400
rounded:
  r: "14px"
  r-guia: "13px"
  r-sm: "10px"
  r-lente: "7px"
  r-codigo: "5px"
  r-foco: "4px"
  r-fio: "2px"
  r-tique: "1px"
  r-pilula: "999px"
  r-circulo: "50%"
spacing:
  xs: "0.25rem"
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.75rem"
  "2xl": "0.875rem"
  "3xl": "1rem"
  "4xl": "1.125rem"
  "5xl": "1.25rem"
  "6xl": "1.5rem"
components:
  cartao-exercicio:
    backgroundColor: "{colors.carta}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.r}"
    padding: "1rem 1rem 0.875rem"
  aba:
    backgroundColor: "transparent"
    textColor: "{colors.tinta-2}"
    typography: "{typography.rotulo}"
    rounded: "{rounded.r-sm}"
    padding: "0.4rem 0.5rem"
    height: "46px"
  aba-ativa:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.carta}"
    rounded: "{rounded.r-sm}"
  chip-valor:
    backgroundColor: "{colors.carta}"
    textColor: "{colors.tinta}"
    typography: "{typography.medida}"
    rounded: "{rounded.r-sm}"
    padding: "0.4375rem 0.625rem"
    height: "44px"
    width: "4.75rem"
  chip-valor-vazio:
    backgroundColor: "{colors.carta}"
    textColor: "{colors.tinta-3}"
    rounded: "{rounded.r-sm}"
  chip-valor-aberto:
    backgroundColor: "{colors.pinho-nevoa}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.r-sm}"
  check-serie:
    backgroundColor: "{colors.carta}"
    textColor: "transparent"
    rounded: "{rounded.r-circulo}"
    height: "44px"
    width: "44px"
  check-serie-feita:
    backgroundColor: "{colors.pinho}"
    textColor: "#ffffff"
    rounded: "{rounded.r-circulo}"
  pilula-alvo:
    backgroundColor: "{colors.pinho-nevoa}"
    textColor: "{colors.pinho-fundo}"
    typography: "{typography.meta}"
    rounded: "{rounded.r-pilula}"
    padding: "0.25rem 0.5rem"
  pilula-sync:
    backgroundColor: "{colors.pinho-nevoa}"
    textColor: "{colors.tinta-3}"
    typography: "{typography.etiqueta}"
    rounded: "{rounded.r-pilula}"
    padding: "0.3125rem 0.5625rem"
  pilula-sync-pendente:
    backgroundColor: "{colors.ambar-claro}"
    textColor: "{colors.ambar}"
    rounded: "{rounded.r-pilula}"
  pilula-sync-sem-acesso:
    backgroundColor: "{colors.rubro-claro}"
    textColor: "{colors.rubro}"
    rounded: "{rounded.r-pilula}"
  aviso-acesso:
    backgroundColor: "{colors.rubro-claro}"
    textColor: "{colors.rubro}"
    typography: "{typography.bloco}"
    rounded: "{rounded.r-sm}"
    padding: "0.8125rem 0.875rem"
  aquecimento:
    backgroundColor: "{colors.carta}"
    textColor: "{colors.tinta-2}"
    typography: "{typography.bloco}"
    rounded: "{rounded.r-sm}"
    padding: "0.8125rem 0.875rem"
  nota:
    backgroundColor: "transparent"
    textColor: "{colors.tinta-3}"
    rounded: "{rounded.r-sm}"
    padding: "0.75rem 0.875rem"
  regua:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta-3}"
    typography: "{typography.etiqueta}"
    rounded: "{rounded.r-sm}"
    height: "58px"
  guia-resumo:
    backgroundColor: "transparent"
    textColor: "{colors.tinta-2}"
    typography: "{typography.bloco-forte}"
    rounded: "{rounded.r-guia}"
    padding: "0 1rem"
    height: "48px"
  estado-vazio:
    backgroundColor: "transparent"
    textColor: "{colors.tinta-3}"
    typography: "{typography.corpo-menor}"
    rounded: "{rounded.r}"
    padding: "2.5rem 1.25rem"
---

# Design System: Treino

## Overview

**Creative North Star: "Papel Morno"**

A warm paper sheet, held in one hand, in a bright gym. The ground (`--papel`) is a warm
off-white, the cards are true white, the ink is a warm near-black, and the rules between
things are hairline warm grey. Everything else is deliberately colourless: this interface
earns its calm by refusing to decorate. The one chromatic voice is a deep pine green that
means exactly one thing — done, or progress toward done. When pine appears, something was
accomplished.

The theme is light and there is exactly one. That is a decision made from the use scene
(a woman on her phone, in a brightly lit room, glancing between sets), not an omission:
`color-scheme: light` is declared, and no dark variant exists by choice. The type is the
platform's own system sans, also by choice — the app must open on gym wifi that drops, so
nothing is fetched from a network at render time. No webfont, no icon font, no CDN.

Density is generous rather than compact. Targets are big because the hand may be sweaty
and the other hand is holding a dumbbell; measured values are set in tabular figures so a
column of weights reads as a column. The composition is a single narrow column (34rem)
centred at every width — desktop is the same phone layout with more air, not a second
design.

**Key Characteristics:**
- Warm paper ground, true-white cards, hairline warm-grey rules
- One accent (deep pine) with one meaning: done / progress
- Light theme only, by decision
- System font stack, zero network-fetched assets
- Authored 1.75-stroke SVG icons; no emoji anywhere, favicon included
- Tabular numerals on every measured value
- 44px minimum on everything a thumb touches
- One shadow, one motion curve, one authored animated moment

## Colors

Warm neutrals carry the entire interface; colour is a vocabulary of three words, each
with one meaning, and nothing else in the interface is allowed to speak.

### Primary
- **Pinho** (`{colors.pinho}`): Done and progress. The filled round check, the session
  progress rail, the ruler's needle, the focus ring, and the count when the session is
  complete. Nothing that is not an accomplishment may wear it.
- **Pinho Fundo** (`{colors.pinho-fundo}`): The darker pine used where pine must sit on
  a pale pine tint and still read as text — the target pill, the ruler's live reading,
  the centred tick's number — and as the active-press fill of an already-done check.
- **Pinho Claro** (`{colors.pinho-claro}`): The pressed state of pine-reactive controls,
  the ruler's lens band, and the text-selection background.
- **Pinho Névoa** (`{colors.pinho-nevoa}`): The faintest pine tint. Hover ground, the
  done-set row's fill, the target pill's and sync pill's resting ground. Close enough to
  paper that it reads as warmth rather than colour.

### Secondary
- **Âmbar** (`{colors.ambar}`) on **Âmbar Claro** (`{colors.ambar-claro}`): Reserved,
  without exception, for "written on this device, not yet on the server" — the sync pill
  in `enviando`, `pendente` and `offline`, and the safety "Atenção" block inside the
  exercise guide, which borrows the same alert register.

### Tertiary
- **Rubro** (`{colors.rubro}`) on **Rubro Claro** (`{colors.rubro-claro}`): One meaning
  only — this link has no access, so nothing will ever reach the server. The sync pill in
  `sem-token` and the full-width access warning under the header.

### Neutral
- **Papel** (`{colors.papel}`): The page ground, the sticky session bar's ground (so it
  occludes cleanly on scroll), the ruler's own ground, and the browser theme-color.
- **Carta** (`{colors.carta}`): Every card, chip, tab strip and check at rest.
- **Tinta** (`{colors.tinta}`): Primary text, headings, and the fill of the *selected*
  tab — the one place warm-black is used as a surface.
- **Tinta 2** (`{colors.tinta-2}`): Secondary text; body copy inside guides and notes.
- **Tinta 3** (`{colors.tinta-3}`): Tertiary text; metadata, units, set numbers, ruler
  numbers, list markers.
- **Linha** (`{colors.linha}`): Hairline rules between set rows, card borders, the
  progress rail's empty track, the tab strip's border.
- **Linha Forte** (`{colors.linha-forte}`): The stronger hairline — chip borders, the
  resting check ring, dashed borders, scrollbar thumbs, minor ruler ticks.

### Not Palette Entries
Two colour literals appear in the stylesheet that are **not** palette tokens and must not
be treated as ones. `#000` is the opaque stop of the `mask-image` gradient on the ruler's
track — an alpha keyword standing for "fully visible", never painted. `#f4f0ea` is the
highlight stop inside the loading skeleton's shimmer gradient: a warm paper tint one step
off `--carta`, tuned to that gradient's 105° sweep rather than to the palette. Neither has
a role, and neither should be promoted into the token block or reused elsewhere.

### Named Rules
**The One Meaning Rule.** Each colour says one thing. Pine = done/progress. Amber =
written locally, not yet synced. Red = this link has no access. If a new element is not
one of those three things, it is warm neutral. Test: point at any coloured pixel and name
which of the three sentences it is saying; if you can't, it should not be coloured.

**The Not-Amber Rule.** Provisional, advisory or quiet content — the provisional-ficha
note, the "vídeo não cadastrado" line, the empty state — uses a dashed `--linha-forte`
border on the paper ground, never amber. Amber would claim a sync problem that isn't
there.

**The Single Theme Rule.** Light only. `color-scheme: light` is declared and no
`prefers-color-scheme: dark` block exists. Do not add one; the use scene is a bright
room, and a second theme doubles the surface for zero user.

## Typography

**Body Font:** the platform's own UI sans (`system-ui, -apple-system, "Segoe UI", Roboto,
sans-serif`) at a 17px base.
**Mono Font:** `ui-monospace, SFMono-Regular, Menlo, monospace`, used only for inline
`code` (the `?k=` fragment in the access warning).

**Character:** Plain, native and unmistakably the device's own voice. The system stack is
a commitment, not a fallback: the app must render fully with no network, so no webfont is
ever fetched. Headings take a slight negative tracking (`-0.012em`), weight 600, and
`text-wrap: balance`; nothing in the interface is set above 1.5rem.

### Hierarchy
- **Título de tela** (600, 1.3125rem, 1.25): The single `h1`, "Treino de <nome>". At the
  40rem breakpoint it steps up to **Título de tela largo** (600, 1.5rem) — the only type
  size in the system that changes with viewport width, and the largest in the interface.
- **Título de cartão** (600, 1.0625rem, 1.3): The exercise name on each card.
- **Medida** (600, 1.0625rem, 1.1, tabular): The number inside a value chip. The largest
  thing on a set row, on purpose.
- **Corpo** (400, 17px, 1.5): Default body text.
- **Corpo menor** (400, 0.9375rem): Guide prose, empty/error states, the ruler's live
  reading (600).
- **Bloco** (400, 0.875rem): The full-width advisory blocks — the warm-up note and the
  access warning. Its sibling **Bloco forte** (600, 0.875rem) is the same step at heading
  weight, used once: the guide disclosure's summary row.
- **Meta** (400, 0.8125rem): Muscle · equipment, rest seconds, last-session weight, set
  numbers, session count.
- **Etiqueta** (400, 0.75rem, 1.2): The two smallest pieces of running text — the sync
  pill and the ruler drawer's field label.
- **Rótulo** (600, 0.8125rem, +0.02em, uppercase): Section headings inside the exercise
  guide ("PASSO A PASSO", "ATENÇÃO"). The only uppercase in the system.
- **Miúdo** (500, 0.6875rem): Tab subtitles (suggested day), chip units, ruler tick
  numbers.

### Named Rules
**The Tabular Rule.** Every number that represents a measurement — weight, reps, seconds,
set counts, ruler labels, dates — carries `font-variant-numeric: tabular-nums`. A column
of weights must line up digit-for-digit; a count that reflows as it increments looks
broken.

**The Portuguese Number Rule.** Decimals are written with a comma (7,5 not 7.5) and
integers drop the decimal entirely. The interface, its identifiers and its comments are
all pt-BR; anything new matches.

## Layout

One column, always. `.envelope` caps at **34rem** and centres with `margin-inline: auto`,
with `1rem` side padding that opens to `1.5rem` at the single breakpoint (**40rem**).
Above that breakpoint only two other things change: the header's top padding grows from
1.5rem to 2.5rem, and the `h1` grows to 1.5rem. There is no desktop layout — desktop is
the phone layout with more air, as the operating context intends.

Vertical rhythm is a rem ladder used consistently: `0.25 / 0.375 / 0.5 / 0.625 / 0.75 /
0.875 / 1 / 1.125 / 1.25 / 1.5rem`. Blocks that follow the header sit at `1.125rem`;
content blocks (warm-up, list) at `1.25rem`; cards are separated by `0.875rem`; the body
carries `4rem` of bottom padding so the last card clears the thumb.

The session bar is `position: sticky; top: 0` with a `z-index: 5` and a hairline drawn by
`::after` at its bottom edge, on the paper ground so scrolled content disappears cleanly
beneath it.

### Named Rules
**The Thumb Floor Rule.** Nothing interactive is smaller than 44px in its short axis:
the round check is 44×44, value chips are 44 tall and 4.75rem wide, tabs are 46 tall, the
guide disclosure is 48 tall, and a ruler tick is a 30×58 target. New controls inherit this
floor.

**The Right-Hand Rule.** The primary action of a row closes it on the right. The set row
reads set number → value chips → check, because the other hand is holding a dumbbell and
the right thumb must reach the finishing tap without changing grip.

## Elevation & Depth

Almost flat. Depth comes from tonal layering — white cards on warm paper, separated by
hairline warm-grey rules — and from exactly **one** shadow, worn only by the exercise
card. It is a real vertical offset plus a soft, long, warm-black blur; never a coloured
halo, never a hard offset block.

### Shadow Vocabulary
- **Sombra** (`box-shadow: 0 1px 2px rgba(26,23,20,.05), 0 6px 16px -8px rgba(26,23,20,.12)`):
  The exercise card, and nothing else.

### Motion

One easing curve, an exponential-out `cubic-bezier(.16, 1, .3, 1)`, named `--saida`, on
every transition in the system. Durations are short and tiered: `0.2s` for tabs and
chips, `0.24s` for the check's fill, `0.26s` for the guide chevron, `0.32s` (with a
`0.04s` delay) for the check mark's stroke, `0.45s` for the progress rail, `0.3s` for the
ruler drawer's reveal.

**The One Authored Moment.** Marking a set done: the round check fills pine while its
check glyph draws itself in, via `stroke-dasharray: 24` animating `stroke-dashoffset` from
24 to 0 on a 0.04s delay, so the fill lands first and the mark is written onto it. This is
the system's one piece of choreography. Everything else is a plain state change.

A `prefers-reduced-motion: reduce` block collapses every animation, transition and scroll
behaviour to `0.001ms`, and `tato.js` mutes haptics under the same query (re-checking on
change, not only at load).

### Named Rules
**The `background-color` Rule.** A `transition` must never name the `background`
shorthand — WebKit silently drops the transition and the change snaps. Always transition
`background-color`. This cost a real bug during the build.

**The scaleX Rule.** The progress rail grows with `transform: scaleX()` and
`transform-origin: left center`, never with `width`. Animating width relays out the
document on every frame.

**The Flat-Plus-One Rule.** Surfaces are flat. The card's shadow is the only one in the
system; a new surface that wants depth gets a hairline border and a tonal step, not a
second shadow token.

## Shapes

Soft, consistently warm corners. Three radii carry everything: **14px** (`--r`) for cards,
the tab strip and full-block states; **10px** (`--r-sm`) for the things that sit inside
them — chips, notes, warnings, the ruler, the video frame; and a **pill** (`--r-pilula`)
for status and target pills and the progress rail. Two shapes stand outside the ladder on
purpose: the set check is a full circle (`50%`), and the ruler's lens band is 7px so it
nests visually inside the ruler's 10px frame. The guide's `summary`, being the card's last
child, carries a hand-matched `0 0 13px 13px` so its hover ground respects the card's
outer corner without `overflow: hidden` clipping the focus ring.

Below the three structural radii sits a set of **micro radii**, each tied to one physical
detail and none of them a scale step to reuse decoratively: **7px** on the ruler's lens
band (nested inside the ruler's 10px frame), **5px** on inline `code`, **4px** on the
global `:focus-visible` ring (so the pine outline rounds slightly around square targets),
**2px** on the ruler's needle cap and **1px** on a ruler tick's cap — the last two are
simply half the width of the 2px needle and the 1.5px tick, i.e. a fully rounded end, and
are mechanical rather than chosen. The guide summary's **13px** bottom corners are
mechanical in the same way: 14px card radius minus the card's 1px border, hand-matched so
the summary's hover ground sits flush inside the card's outer corner. Do not "round" any
of these to the nearest scale step; each is measured against the thing it sits inside.

Borders are the primary separator: 1px `--linha` for structural edges (cards, tab strip,
row dividers, the rail's track), 1px `--linha-forte` for edges a finger will touch (chips,
the resting check ring at 1.5px). **Dashed** `--linha-forte` is the system's notation for
"provisional or absent" — the ficha note, the missing-video line, the empty state.

### Named Rules
**The Measured Corner Rule.** The three structural radii (14 / 10 / pill) are the only ones
a new component may choose from. Every other radius in the stylesheet — 13, 7, 5, 4, 2, 1 —
is derived from a neighbour's geometry, not picked from a scale. If a value looks like an
off-scale mistake, measure what it nests inside before changing it.

## Components

### Sync Pill (`.sync`)
Character: a whisper that only raises its voice when something is wrong. A small iconed
pill beside the `h1`, `role="status"`, driven entirely by `data-status`. Resting
(`sincronizado`) it is pine text on pine mist reading "Salvo". `enviando` / `pendente` /
`offline` switch to amber on amber-tint ("Enviando", "Na fila", "Salvo no aparelho"), with
the queue count appended in parentheses. `sem-token` switches to red on red-tint ("Sem
acesso"). Icon is 15×15, one per state (`nuvemOk`, `nuvemSubindo`, `relogio`,
`nuvemCortada`, `chave`). `white-space: nowrap` — it never wraps under the title.

### Access Warning (`.aviso`)
Full-width red-tint block under the header, shown only for `sem-token`, with a 22%-alpha
red border. It takes the whole width because nothing will sync without it. Carries the
`?k=` fragment as inline `code`.

### Segmented Tabs (`.abas`)
Character: two big slabs, not a nav bar. A `nav` with a `grid-auto-flow: column` /
`1fr` track inside a bordered white strip with `0.25rem` of internal padding, so the
selected tab looks inset. Each button is 46 tall and carries the treino name plus a
`<small>` subtitle (the suggested day) at 0.6875rem. Selection is `aria-pressed="true"`,
rendered as warm-black fill with white text (subtitle at 68% white). Hover is pine mist;
hover on the selected tab stays warm-black. Transitions `background-color` and `color` at
0.2s.

### Session Bar (`.sessao`) and Progress Rail (`.trilho`)
Character: the one piece of feedback that must never scroll away. Sticky at `top: 0` on
the paper ground. A baseline-aligned row — treino name · weekday, date on the left; the
count ("8 de 16 séries", `role="status"`, tabular) on the right — over a **6px** rail with
a pilled `--linha` track. The fill is pine, sized by `transform: scaleX(fraction)` with a
left origin and a 0.45s transition. At completion the bar gains `.sessao--completa`, the
count turns pine and bold, and the copy switches to "Treino completo · N séries".

### Warm-up Note (`.aquecimento`)
A white bordered block at `--r-sm` with a pine-tinted icon and up to two paragraphs of
prose, opening "Antes de começar:". The second paragraph, when present, covers the
approach sets for the first compound movements. Never a card, never shadowed — it is an
instruction, not a record.

### Training Rules (`.regras`)
A closed `<details>` in the same white block as the warm-up note, one notch quieter: the
`passos` icon, "Como treinar", a rotating chevron. Inside, uppercase 0.8125rem headings
over body prose — how heavy, what tempo, when to add weight, why the rest is long. Closed
by default on purpose: it is first-weeks reading, not something she crosses mid-set.

### Provisional Note (`.nota`)
Character: quiet, but present. Dashed `--linha-forte` border on the page ground, tertiary
ink at 0.8125rem, with the `nota` icon. Carries the ficha's observation — when to train
and how it meets the rest of her week. It uses dashes rather than amber on purpose (see
The Not-Amber Rule).

### Exercise Card (`.ex`)
Character: a sheet from the paper ficha. White, `--r` (14px), 1px `--linha` border, the
system's only shadow. Header padding `1rem 1rem 0.875rem`: name, then `grupo · equipamento`
in meta ink, then a prescription row holding the pine-tint **target pill** ("3 séries ×
10-12") beside plain rest seconds, then the last-session line ("Última vez: **8 kg** em
05/09/2026"). Below the header, the set list; below that, the guide disclosure as the
card's last child.

### Set Row (`.serie`)
An `li` separated from its neighbour by a 1px `--linha` top border. Layout left to right:
ordinal ("1ª", 1.5rem wide, tertiary, tabular), the value chips, then the check hard right
at `margin-left: auto`. When `data-feita="sim"`, the whole row takes a pine-mist ground and
the ordinal turns pine and bold — so a finished set is legible from arm's length without
reading anything.

### Round Check (`.check`)
Character: the moment of the app. A 44×44 circle, white with a 1.5px `--linha-forte` ring
and a *transparent* check glyph at rest. Hover brings the ring to pine; press fills pine
mist. At `aria-pressed="true"` it becomes solid pine with a white glyph, drawn in by the
dash-offset animation described in Motion. Pressing an already-done check darkens it to
`--pinho-fundo`. Accessible name is written out in full: "Série 2 de Agachamento Cálice
concluída". Marking it commits whatever the chips are currently showing, so a whole set
can cost one tap.

### Value Chip (`.chip`)
Character: a button that looks like the number it holds. `min-height: 44px`,
`min-width: 4.75rem`, `--r-sm`, 1px `--linha-forte`, holding a baseline-aligned pair: the
value at 1.0625rem/600/tabular and the unit at 0.6875rem in tertiary ink. `.chip--vazio`
(nothing recorded yet, showing a suggestion) softens the border to `--linha` and the value
to tertiary ink. Hover tints to pine mist; press goes pine-light with a pine border. Open
(`aria-expanded="true"`) it keeps the pine-mist ground and doubles its border with an
`inset 0 0 0 1px` pine ring, so the drawer below is visibly tied to this chip. Its
`aria-label` spells out field, set, exercise, value, unit, and "(sugerido)" when the number
is a suggestion.

### Ruler Picker (`.regua`) — signature component
Character: a physical measuring rule under the thumb. Tapping a chip opens **one** inline
drawer (`.gaveta`) beneath the set row — only ever one open in the whole page — revealed by
a 0.3s `clip-path: inset(0 0 100% 0)` wipe plus fade.

The drawer's label row pairs the field name ("Carga · série 3") in tertiary ink with the
live reading in pine-fundo 600 tabular on the right. Below it the rule: a paper-ground,
`--r-sm`, 1px-bordered strip with `touch-action: pan-x`. Its parts:
- **Lens**: a `::before` band of `--pinho-claro`, one tick wide (`--tique: 30px`), pinned
  to the centre with 7px corners.
- **Needle**: a 2px pine bar down the centre, above the lens, stopping short of the labels.
- **Track**: a horizontally scrolling flex row with `scroll-snap-type: x mandatory`,
  `scroll-snap-align: center` per tick, `overscroll-behavior-x: contain`, scrollbars hidden
  in both engines, and a `mask-image` linear-gradient fading the first and last 14% so
  values dissolve at the edges instead of being cut.
- **Ticks**: 30px wide, 58px tall, a 1.5×11px `--linha-forte` bar; labelled ticks
  (`--maior`) get a 17px `--tinta-3` bar plus a 0.6875rem tabular number. The centred tick's
  number turns pine-fundo and 700.

Behaviour: it opens centred on the most likely value (this set's, else the previous set's,
else last session's weight, else the prescribed target), so the common case costs zero
movement. Each tick crossed fires a **6ms** vibration where the platform exposes it (iOS
Safari does not; the rule is unaffected otherwise). It is `role="slider"` with
`aria-valuemin/max/now/valuetext` and `aria-orientation="horizontal"`, is focused on open,
and responds to arrows (±1), PageUp/PageDown (±10 for load, ±5 for reps/time), Home and
End. Tapping a tick is equivalent to dragging to it; on desktop, wheel/trackpad in either
axis drives it. The value is committed on scroll-end (or after a 140ms rest where
`scrollend` is unsupported).

### Guide Disclosure (`.guia`)
A native `<details>` as the card's last child, separated by a 1px top rule. The `summary`
is a 48-tall row at 0.875rem/600 — pine video icon, "Como fazer e vídeo", chevron pushed
right — with the marker suppressed in both engines, hover tinting to pine mist and its corners matching the
card's bottom (13px) while closed, squared while open. The chevron rotates 180° in 0.26s.
The body carries the purpose paragraph, an uppercase "PASSO A PASSO" heading over an
ordered list, an amber-tint "ATENÇÃO" block (the only amber outside sync), the muscle list
in tertiary ink, and the video. The YouTube iframe is 16/9, `--r-sm`, and is created only
on first open.

### Honest States
- **Loading** (`.carregando`): three 148px-tall skeleton cards — bordered, `--r`, with a
  105° warm gradient sweeping over 320% of their width on a 1.4s linear loop. Same
  silhouette as the real cards, so nothing jumps on arrival.
- **Empty / Error** (`.estado`): centred, dashed `--linha-forte`, `--r`, generous
  `2.5rem 1.25rem` padding, tertiary ink with a warm-black headline. Says what happened and
  what to do: "Não deu para carregar o treino. Verifique a conexão…".
- **Missing video** (`.video__ausente`): a dashed line reading "Vídeo ainda não cadastrado
  para este exercício." Never a placeholder player, never a fake thumbnail.

### Iconography
Every glyph is authored in `public/js/icones.js`: one 24 `viewBox`, `fill: none`,
`stroke: currentColor`, **1.75** stroke width, round caps and joins, sized at `1.25em` and
always `aria-hidden="true"` with the adjacent text carrying the meaning. Requesting an
unknown icon throws rather than rendering nothing.

### Browser-Surface Theming
The surfaces the browser draws are treated as part of the design: `theme-color` is
`--papel`; `::selection` is pine-fundo on pine-light; `:focus-visible` is a 2px pine
outline at 2px offset with a 4px radius, applied globally; scrollbars are thin with
`--linha-forte` thumbs on a transparent track, pilled, with a 3px paper-coloured border in
WebKit. The favicon and apple-touch-icon are inline SVG data URIs: a paper-coloured
rounded square with four pine bars rising like the progress rail, the fourth in
`--linha-forte` — the same idea as the session bar, at 32px.

## Do's and Don'ts

### Do:
- **Do** give every colour one of the system's three sentences — pine = done/progress,
  amber = written locally and not yet synced, red = this link has no access — and leave
  everything else warm neutral.
- **Do** set every measured number in `font-variant-numeric: tabular-nums`, and write
  decimals with a comma (7,5).
- **Do** keep every interactive target at 44px or more in its short axis, and put a row's
  primary action on the right.
- **Do** transition `background-color`, never the `background` shorthand — WebKit silently
  drops the shorthand.
- **Do** animate the progress rail with `transform: scaleX()` and a left origin.
- **Do** use `--saida` (`cubic-bezier(.16, 1, .3, 1)`) for every transition; it is the only
  curve in the system.
- **Do** draw new glyphs into `icones.js` on the same 24 viewBox at 1.75 stroke with
  `currentColor`.
- **Do** use a dashed `--linha-forte` border to mark anything provisional, absent or
  advisory.
- **Do** tell the truth in empty states — "vídeo ainda não cadastrado" beats a placeholder
  player.
- **Do** leave the mechanical values alone — the 13px guide corner, the 2px/1px stroke
  caps, the `#000` mask stop and the `#f4f0ea` shimmer stop are derived from their
  neighbours, not scale steps waiting to be tidied.
- **Do** keep the whole interface, its class names and its comments in Brazilian
  Portuguese.

### Don't:
- **Don't** add a dark theme. Light is a decision made from the use scene, and
  `color-scheme: light` records it.
- **Don't** load a webfont, an icon font, or any other network-fetched asset. The system
  stack is the design.
- **Don't** put an emoji anywhere — interface, empty state, or favicon.
- **Don't** use amber for anything other than "not yet synced", or red for anything other
  than "no access".
- **Don't** add a second shadow. `--sombra` on the exercise card is the system's entire
  elevation vocabulary.
- **Don't** open two rulers at once; one drawer is open in the page at any time.
- **Don't** introduce a `<input type="number">` or any control that summons the on-screen
  keyboard to record a set. Numbers are chosen on the rule.
- **Don't** let the session bar scroll away, or move its progress feedback into a card.
- **Don't** rely on hover to reveal an affordance; the primary device has no pointer.
- **Don't** ship a motion or haptic effect that ignores `prefers-reduced-motion`.
