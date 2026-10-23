// How far can a result be trusted? Checked after composing, in plain words for the visitor.
//   exact    Tolkien wrote this line
//   safe     only Tolkien's own words, put together with grammar he demonstrated
//   caution  works, but leans on a word or ending Tolkien did not write (each one listed)
//   unsafe   needs something Tolkien never showed; the line is withheld unless the visitor asks for it

const MODAL = /\b(can|could|may|might|must|should|would|shall i|cannot|can't|couldn't|wouldn't|shouldn't)\b/
const CLAUSE = /\b(if|because|unless|although|though|while|whether|than)\b/
const RELATIVE = /\b\w+\s+(who|which|whom|whose)\b|\b(that)\s+(is|are|was|were|i|you|he|she|we|they)\b/
const QUESTION_START = /^(who|what|where|when|why|how|which|can|could|may|would|will|shall|do|does|did|is|are|was|were|have|has)\b/
const HAVE = /\b(have|has|had|having)\b(?!\s+(to|been|come|gone))/

// Plain-English stand-ins for modern things, only ever offered as a suggestion to rephrase
const CLOSEST_THING = {
  sandwich: 'bread', burger: 'bread', pizza: 'bread', toast: 'bread', cake: 'bread', biscuit: 'bread', cookie: 'bread', bun: 'bread',
  coffee: 'water', tea: 'water', soda: 'water', juice: 'water',
  phone: null, computer: null, internet: null, money: 'gold', coin: 'gold', cash: 'gold',
}

const plain = (s) => s.toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, ' ').trim()

export function suggestRephrase(english) {
  const t = plain(english).replace(/[.!?]+$/, '')
  const out = []
  const req = t.match(/^(?:please\s+)?(?:can|could|may)\s+(?:i|we)\s+(?:please\s+)?(?:have|get)\s+(?:a |an |the |some )?(.+?)(?:\s+please)?$/) ||
    t.match(/^(?:i would like|i'd like|i want|i need)\s+(?:a |an |the |some )?(.+)$/)
  if (req && !/^to\s/.test(req[1])) {
    const thing = req[1]
    const words = thing.split(' ')
    const last = words.at(-1)
    if (last in CLOSEST_THING && CLOSEST_THING[last]) {
      out.push({ english: `Give me ${CLOSEST_THING[last]}`, why: `Elvish has no word for “${last}”; Tolkien’s nearest is “${CLOSEST_THING[last]}”` })
    }
    out.push({ english: `Give me ${thing}`, why: 'Tolkien wrote requests as commands, like “anno ammen … i mbas” (give us … the bread)' })
  }
  const modal = t.match(/^(i|you|we|they|he|she)\s+(?:can|could|must|should|might|may|would)\s+(.+)$/)
  if (modal && !/^like\b/.test(modal[2])) out.push({ english: `${modal[1]} ${modal[2]}`, why: 'Tolkien left no settled way to say “can / must / should”; the plain verb is safe' })
  const where = t.match(/^where\s+(?:is|are)\s+(.+)$/)
  if (where) out.push({ english: `I seek ${where[1]}`, why: 'Tolkien left almost no questions; a statement is safe' })
  return out
}

export function assess(english, result) {
  if (result.mode === 'canon' || result.mode === 'tolkien') {
    return { level: 'exact', reasons: [], suggestions: [] }
  }
  if (result.mode === 'expletive') return { level: 'idiom', reasons: [], suggestions: [] }
  const t = plain(english)
  const blockers = []
  const cautions = []

  const gaps = result.items.filter((i) => i.status === 'G').map((i) => i.gloss)
  if (gaps.length) blockers.push(`No Elvish word exists for ${gaps.map((g) => `“${g}”`).join(', ')}.`)
  if (/\?\s*$/.test(t) || QUESTION_START.test(t)) blockers.push('Tolkien left almost no examples of questions, so the word order would be a guess.')
  if (MODAL.test(t) && !/\bwould like\b|\bi'd like\b/.test(t)) blockers.push('There is no settled Elvish way to say “can”, “could”, “must” or “should”; that part would be left out.')
  if (CLAUSE.test(t)) blockers.push('Joining ideas with “if”, “because” or “than” is not something Tolkien showed clearly.')
  if (RELATIVE.test(t)) blockers.push('“Who / which / that …” clauses have very few examples in Tolkien’s writing.')
  if (HAVE.test(t)) blockers.push('Elvish has no attested verb “to have”.')

  for (const it of result.items) {
    if (it.status === 'G') continue
    if (it.status === 'N') cautions.push(`“${it.el}” (${it.gloss}) is a fan-made word, not Tolkien’s.`)
    else if (it.status === 'E') cautions.push(`“${it.el}” (${it.gloss}) comes from Tolkien’s earlier drafts, not his finished language.`)
    const recon = it.steps.find((s) => /reconstructed/.test(s))
    if (recon && it.status !== 'N') cautions.push(`The ending on “${it.el}” is a reconstruction: ${recon}.`)
    const stretch = it.steps.find((s) => /used here for/.test(s))
    if (stretch) cautions.push(`“${it.el}”: ${stretch}.`)
    if (/past “to be” not attested/.test(it.steps.join(' '))) cautions.push('Tolkien gave no reliable past tense of “to be”; the present “ná/nar” is used.')
  }

  const suggestions = blockers.length || cautions.length ? suggestRephrase(english) : []
  if (blockers.length) return { level: 'unsafe', reasons: blockers, cautions, suggestions }
  if (cautions.length) return { level: 'caution', reasons: cautions, suggestions }
  return { level: 'safe', reasons: [], suggestions: [] }
}

export const TRUST = {
  exact: { label: 'Tolkien’s exact words', blurb: 'Quoted from Tolkien’s own writing.' },
  idiom: { label: 'An Elvish way to say it', blurb: 'Elvish has no swear words: Tolkien’s Elves never cursed lightly. This says the same feeling with a word Tolkien wrote.' },
  safe: { label: 'Built from Tolkien’s words', blurb: 'Every word is Tolkien’s, joined with grammar he showed. Composed by this app, so not a quotation.' },
  caution: { label: 'Partly reconstructed', blurb: 'Readable, but some pieces are not Tolkien’s own. They are listed below.' },
  unsafe: { label: 'Can’t translate this reliably', blurb: 'This needs grammar or words Tolkien never left us.' },
}
