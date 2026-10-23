# Design — Lam Edhellen

World: **Cloak & Brooch of Lórien.** The translator wears an Elven cloak: twilight grey-green, silver lettering, and each Elvish word set like an enamel leaf whose vein runs back to the English it came from.

## Tokens (`src/styles.css`, `:root`)

Every tone has one job. Do not add decorative greys.

| Token | Value | Job |
|---|---|---|
| `--ground` / `--ground-deep` | #2b352f / #222a25 | page cloak (with twill weave), inset wells |
| `--panel` / `--panel-hi` | #35413a / #3d4a42 | panels and cards; hover |
| `--line` / `--line-soft` | #56655a / #46544a | hairlines |
| `--silver` / `-2` / `-3` | #e6ece3 / #bccab9 / #98a896 | primary, secondary, tertiary text |
| `--enamel` (+ `-hi`, `-ink`) | #8fcf96 | **only** things you can press |
| `--gold` | #dcb862 | **only** Neo-Elvish (non-Tolkien) words |
| `--rust` | #d39477 | **only** gaps with no Elvish word |

## Type

- Elvish display: Marcellus (self-hosted via @fontsource). Hero line 64px desktop → 48 → 38 on phones.
- UI: Figtree Variable. Labels are 12px uppercase, 0.14em tracking.
- Tengwar: Alcarin Tengwar (OFL, `public/fonts`), standard Tengwar private-use code points, shaped by the browser.
- Pronunciation: Figtree 500, stressed syllable in capitals, no phonetic symbols.

## Shapes

- Leaf cut: `--leaf-r: 3px 16px 3px 16px` (one rounded diagonal) on chips, word cards, canon cards, the Say-it well.
- Panels: 4px radius, 1px hairline.
- Provenance mark: a small leaf SVG — filled silver (attested / canon), outlined (derived), dashed silver (earlier Tolkien, 1910s–40s drafts), gold (Neo-Elvish), dashed rust (gap), plain outline (name).

## Vocabulary

Most words come from Eldamo (eldamo.org, Paul Strack, CC BY 4.0), converted by `scripts/build-eldamo.py` from `vendor-data/eldamo/eldamo-data.xml`. Credit stays in the footer. When several words share a meaning the translator prefers mature Tolkien, then derived, then earlier-draft, then fan words; archaic words rank just below their everyday equivalents.

## Layout

- 68px top bar: wordmark, Sindarin/Quenya pill tabs, section nav (underline in enamel marks the current page).
- Translate: 420px English panel + flexible Elvish panel; full-width strip of word cards below; legend under that. Single column under 980px; two-up cards under 680px.

## Motion

One authored moment: hovering a word card, Elvish word or English chip draws silver veins (SVG stroke-dashoffset, 0.6s exponential ease-out) between all three. The Elvish line and Tengwar rise out of a soft blur on each Translate press. Everything collapses under `prefers-reduced-motion`.

## Content rules

- Canon lines are kept short (single lines, never whole poems); meanings are paraphrased; sources cite work and chapter only.
- Never show an invented word as Tolkien's: status and source sit on every card.
