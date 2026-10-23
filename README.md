# Lam Edhellen: Elvish translator

Translate English into Tolkien's Sindarin or Quenya, with a source for every word, Tengwar script, and a plain-English pronunciation guide.

Every result is rated so you know how far to trust it:

- **Tolkien's exact words**: a line Tolkien wrote himself (about 500 known).
- **Built from Tolkien's words**: only his words, joined with grammar he demonstrated.
- **Partly reconstructed**: works, but lists each piece that is not Tolkien's own.
- **Can't translate this reliably**: needs words or grammar Tolkien never left; the app says why and offers a safe way to say it.

## Run it

```bash
npm install
npm run dev
```

`npm test` runs the translation tests; `npm run build` makes the static site in `dist/`.

## Updating the vocabulary

The lexicons in `src/data/eldamo-*.js` are generated from Eldamo's data file. To rebuild them, download
`eldamo-data.xml` from [github.com/pfstrack/eldamo](https://github.com/pfstrack/eldamo) (`src/data/eldamo-data.xml`)
into `vendor-data/eldamo/`, then run `python -I scripts/build-eldamo.py`.

## Credits

- Vocabulary and Tolkien's phrases: [Eldamo](https://eldamo.org), the Elvish lexicon by Paul Strack, licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Converted and filtered for this app.
- Tengwar font: Alcarin Tengwar by Toshi Omagari, SIL Open Font License (`src/assets/fonts/OFL-AlcarinTengwar.txt`).
- The Elvish languages were created by J.R.R. Tolkien. This is an unofficial fan project, not affiliated with the Tolkien Estate.
