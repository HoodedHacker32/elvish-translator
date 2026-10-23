// Source keys used across the lexicons. Status codes:
//   A  attested — the form appears in Tolkien's own writing
//   D  derived  — built by Tolkien's published rules from an attested root or form
//   E  earlier Tolkien — his word from an earlier stage of the language (1910s–40s), adapted
//   N  Neo-Elvish — a community reconstruction filling a gap Tolkien left
export const SOURCES = {
  LotR: 'The Lord of the Rings',
  App: 'The Lord of the Rings, Appendices',
  Silm: 'The Silmarillion',
  SilmApp: 'The Silmarillion, Appendix: Elements in Quenya and Sindarin Names',
  RGEO: 'The Road Goes Ever On',
  UT: 'Unfinished Tales',
  Ety: 'The Etymologies (The Lost Road, HoMe V)',
  MR: "Morgoth's Ring (HoMe X)",
  WJ: 'The War of the Jewels (HoMe XI)',
  SD: 'Sauron Defeated (HoMe IX)',
  Letters: 'The Letters of J.R.R. Tolkien',
  VT: 'Vinyar Tengwar (Tolkien’s linguistic papers)',
  PE: 'Parma Eldalamberon (Tolkien’s linguistic papers)',
  GL: 'Gnomish Lexicon (Tolkien’s 1910s drafts)',
  GG: 'Gnomish Grammar (Tolkien’s 1910s drafts)',
  QL: 'Qenya Lexicon (Tolkien’s 1910s drafts)',
  Rule: 'Regular grammar applied to an attested root',
  Neo: 'Neo-Elvish community reconstruction',
}

export const STATUS = {
  A: { key: 'attested', label: 'Attested', blurb: 'Tolkien’s own word' },
  D: { key: 'derived', label: 'Derived', blurb: 'Built by Tolkien’s rules from his words' },
  E: { key: 'earlier', label: 'Earlier Tolkien', blurb: 'Tolkien’s word from an earlier version of the language, adapted' },
  N: { key: 'neo', label: 'Neo-Elvish', blurb: 'Community reconstruction, not Tolkien' },
  G: { key: 'gap', label: 'No Elvish word', blurb: 'Neither Tolkien nor reconstruction covers this' },
  C: { key: 'canon', label: 'Canon phrase', blurb: 'Quoted verbatim from Tolkien' },
  P: { key: 'name', label: 'Name', blurb: 'A proper name, kept as written' },
}
