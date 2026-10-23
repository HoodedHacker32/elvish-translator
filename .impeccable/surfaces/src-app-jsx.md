---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: []
---

# Translator surface

Scope: the single-page translator app (translate view, lexicon browser, canon phrases). Mode: Operate.
Audience/job: Tolkien fans turning an English phrase into Sindarin or Quenya and checking how canonical each word is.
Constraints: client-side only; provenance shown for every word; Neo-Elvish labeled; gaps flagged, never invented.
Memorable moment: hovering an Elvish leaf draws its silver vein back to the English word it came from.

## Direction contract

THESIS: The translator wears the Lórien cloak. It refuses the two-grey-pane translator: the Elvish line is the hero, set large in silver, and each word below it is a leaf-card of provenance.
OWN-WORLD: Twilight grey-green cloak ground with faint woven twill; lighter cloak panels; silver text and filigree hairlines; enamel leaf green only on pressable things; mallorn gold only for Neo-Elvish fill-ins; muted rust only for untranslatable gaps. Marcellus-class flared display for Elvish, a humanist sans for UI. Leaf-cut corners (one rounded diagonal) on tokens.
STORY: Visitor types English, sees Elvish instantly, sees which words are Tolkien's own (with source) versus derived or reconstructed, copies or saves it, and can browse the lexicon or canon phrases.
FIRST VIEWPORT: 68px top bar (wordmark, Sindarin/Quenya pill tabs, Translate/Lexicon/Canon nav). Below: 420px English panel left with textarea and green Translate action; right panel with label, the Elvish line at ~64px, Tengwar line beneath, provenance summary. A full-width strip of leaf-cards (word, gloss, part of speech, provenance tag) under both.
FORM: Cloak & Brooch of Lórien, position 6 of 7 on the grounded list (assigned). seed:24a7fbd4267d4ad7. Signature interaction: vein lines drawn between hovered English word, Elvish word and its leaf-card. Raises: value economy (Datamatics); fixed per-word furniture (Goods catalog); gold reserved for non-canon (Gate board); green only where pressable (Warm app).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
