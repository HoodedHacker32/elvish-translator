// How far can a result be trusted? Checked after composing, in plain words for the visitor.
//   exact    Tolkien wrote this line
//   safe     only Tolkien's own words, put together with grammar he demonstrated
//   caution  works, but leans on a word or ending Tolkien did not write (each one listed)
//   unsafe   needs something Tolkien never showed; the line is withheld unless the visitor asks for it

import { EARLIER, GRAMMAR_WORDS } from '../data/eldamo-earlier.js'

// A meaning with no word in the main lexicon may still have one in an earlier stage of Tolkien's language
// (checked in Eldamo), so “no word” is never said without saying what does exist.
function noWord(gloss, lang) {
  const g0 = gloss.toLowerCase()
  const e = EARLIER[lang]?.[g0]
  const name = lang === 'S' ? 'Sindarin' : 'Quenya'
  // grammar words (“his”, “where”, “their”) are not in the lexicon, but Eldamo may still have them
  const gw = !e && GRAMMAR_WORDS[lang]?.[g0]
  if (gw) {
    const [form, stage, src, kind] = gw
    const at = src ? `${stage}, ${src}` : stage
    if (/fan-made/.test(stage)) return `“${gloss}”: Tolkien left no word for this in any stage of his ${name}. Writers of Neo-${name} use ${form}, but that is not his, so it is not used here.`
    if (/^Tolkien/.test(stage) && kind === 'suffix') return `“${gloss}”: Tolkien wrote this as an ending, ${form} (${at}), but left no example of it on a word, so it is not added here.`
    if (/^Tolkien/.test(stage)) return `“${gloss}”: Tolkien wrote ${form} for this (${at}), but too few examples to place it in a sentence like this one reliably.`
    return `“${gloss}”: no word in Tolkien’s finished ${name}. In ${stage} he wrote ${form} (${src}), but it was never carried into the finished language, so it is not used here.`
  }
  if (!e) return `“${gloss}”: Eldamo lists no word for this in any stage of Tolkien’s ${name}.`
  return `“${gloss}”: no word in Tolkien’s finished ${name}. In ${e[1]} he wrote ${e[0]} (${e[2]}), but it was never carried into the finished language, so it is not used here.`
}

const MODAL = /\b(can|could|may|might|must|should|would|shall i|cannot|can't|couldn't|wouldn't|shouldn't)\b/
const CLAUSE = /\b(if|because|unless|although|though|while|whether|than)\b/
const RELATIVE = /\b\w+\s+(who|which|whom|whose)\b|\b(that)\s+(is|are|was|were|i|you|he|she|we|they)\b/
// A question starts with a question word, or with a helper verb followed by its subject (“do you…”, “can I…”).
// A helper verb followed by anything else is a command or statement: “Do not flee”, “Be still”.
const QUESTION_START = /^(who|what|where|when|why|how|which)\b|^(can|could|may|would|will|shall|do|does|did|is|are|am|was|were|have|has)\s+(i|you|he|she|it|we|they|the|a|an|my|your|his|her|our|their|this|that|these|those|there)\b/
const HAVE = /\b(have|has|had|having)\b(?!\s+(to|been|come|gone))/

// Plain-English stand-ins for modern things, only ever offered as a suggestion to rephrase
const CLOSEST_THING = {
  sandwich: 'bread', burger: 'bread', pizza: 'bread', toast: 'bread', cake: 'bread', biscuit: 'bread', cookie: 'bread', bun: 'bread',
  coffee: 'water', tea: 'water', soda: 'water', juice: 'water',
  phone: null, computer: null, internet: null, money: 'gold', coin: 'gold', cash: 'gold',
}

// Words Tolkien never glossed whose meaning one of his words covers closely (checked in Eldamo)
const WANDERER = { english: 'wanderer', why: 'Tolkien left no word for “traveller”; his nearest is Sindarin randir “wanderer, pilgrim”, as in Mithrandir (Parma Eldalamberon 17)' }
const NEAREST = { traveller: WANDERER, travellers: { ...WANDERER, english: 'wanderers' }, traveler: WANDERER, travelers: { ...WANDERER, english: 'wanderers' }, wayfarer: WANDERER,
  doomed: { english: 'fated', why: 'Tolkien’s nearest to “doomed” is “fated”: Quenya marta (The Etymologies), Sindarin barad' } }

const plain = (s) => s.toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, ' ').trim()

export function suggestRephrase(english, lang = 'S') {
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
  // a word Tolkien never glossed, swapped for his nearest one anywhere in the sentence
  for (const [word, near] of Object.entries(NEAREST)) {
    const re = new RegExp(`\\b${word}\\b`)
    if (re.test(t)) {
      // built from what was typed, so names and capitals stay as they were
      const english2 = english.trim().replace(new RegExp(`\\b${word}\\b`, 'i'), near.english)
      out.push({ english: english2[0].toUpperCase() + english2.slice(1), why: near.why })
    }
  }
  // “their”: Tolkien left only the bare ending -ent (PE17/46), never on a word; “the” keeps the sense
  if (/\btheir\b/i.test(english)) {
    out.push({ english: english.trim().replace(/\btheir\b/g, 'the').replace(/\bTheir\b/g, 'The'), why: 'Tolkien left “their” only as a bare ending (-ent, Parma Eldalamberon 17) with no example on a word; “the” keeps the sense' })
  }
  // “… where X lie”: Sindarin has no relative “where” of Tolkien's, but his ennas “there” (King's Letter) says it
  // (built from what was typed, not the lower-cased copy, so names like Mordor stay names)
  const rel = english.trim().replace(/[.!]+$/, '').match(/^(?!where\b)(.+?),?\s+where\s+(.+)$/i)
  if (lang === 'S' && rel && !/\?$/.test(english.trim())) {
    out.push({ english: `${rel[1]}, there ${rel[2]}`, why: 'Tolkien left no Sindarin word for “where” in this sense; his ennas “there” (Sauron Defeated, the King’s Letter) says the same thing' })
  }
  const where = t.match(/^where\s+(?:is|are)\s+(.+)$/)
  if (where) out.push({ english: `I seek ${where[1]}`, why: 'Tolkien left almost no questions; a statement is safe' })
  return out
}

export function assess(english, result) {
  if (result.mode === 'canon' || result.mode === 'tolkien') {
    return { level: 'exact', reasons: [], suggestions: [] }
  }
  if (result.mode === 'expletive') return { level: 'idiom', reasons: [], suggestions: [] }
  if (result.mode === 'everyday') {
    const d = result.everyday
    // a fan-made expression is useful, but never presented as Tolkien's
    if (d.status === 'N') return { level: 'caution', reasons: [`“${result.line}” is fan-made, not Tolkien’s. ${d.note}.`], suggestions: [] }
    return { level: 'idiom', reasons: [], suggestions: [] }
  }
  const t = plain(english)
  const blockers = []
  const cautions = []

  const lang = result.lang
  const likeGap = result.items.some((i) => i.status === 'G' && i.gloss === 'like')
  const gaps = result.items.filter((i) => i.status === 'G' && !(likeGap && i.gloss === 'like')).map((i) => i.gloss)
  for (const g of gaps) blockers.push(noWord(g, lang))
  if (!result.items.length) blockers.push('Nothing here has its own Elvish word: words like “very” or “really” only work inside a sentence.')
  // Quenya “like” is Tolkien's “it is good to me” (nás mára nin); Sindarin uses mav- from his earliest drafts
  if (likeGap) blockers.push('Tolkien said “like” as “it is good to me / to you” (nás mára nin, mára tyen), so it works for “I like …” and “you like …” only, in the present, without “not”.')
  const isQuestion = /\?\s*$/.test(t) || QUESTION_START.test(t)
  // Tolkien's own questions start with man “who, what” and keep statement order:
  // Sindarin man agorech? “what have we done?”, Quenya Sí man i yulma nin enquantuva? “who now will refill the cup for me?”
  const whoWhat = /^(who|what)\b/.test(t) || (lang === 'Q' && /^how\b/.test(t))
  if (isQuestion && whoWhat) cautions.push('A question built like Tolkien’s “man agorech?” (what have we done?): question word first, then the sentence. He left only a handful of these.')
  else if (isQuestion) blockers.push('Tolkien left almost no examples of questions like this, so the word order would be a guess. Questions starting “who” or “what” work.')
  // Quenya pol- “can” is Tolkien's (polin quetë); the rest have no settled form
  const modalHit = t.match(MODAL)
  const quenyaCan = lang === 'Q' && modalHit && /^(can|could|cannot|can't|couldn't)$/.test(modalHit[1])
  if (modalHit && !quenyaCan && !/\bwould like\b|\bi'd like\b/.test(t)) {
    blockers.push(lang === 'S' && /^(can|could|cannot|can't)/.test(modalHit[1])
      ? 'Sindarin has no attested verb for “can”. (Quenya does: try switching to Quenya.)'
      : 'There is no settled Elvish way to say “could”, “must”, “should” or “may”; that part would be left out.')
  }
  if (CLAUSE.test(t)) blockers.push('Joining ideas with “if”, “because” or “than” is not something Tolkien showed clearly.')
  if (RELATIVE.test(t)) blockers.push('“Who / which / that …” clauses have very few examples in Tolkien’s writing.')
  // “have”: Tolkien's pen- “lack” covers “have no / don't have”; Quenya harya- and Sindarin sav- cover “have”
  const lacks = result.items.some((i) => /pen-/.test(i.steps.join(' ')) || /^pen/i.test(i.el) && /lack/.test(i.steps.join(' ')))
  // (or a single Elvish verb for a whole “have …” meaning, like órava “have mercy”)
  const hasHave = result.items.some((i) => /haryalyë|sevin/.test(i.steps.join(' ')) || /\bha(ve|s|d)\b/.test(i.gloss) && i.status !== 'G')
  if (HAVE.test(t) && !isQuestion && !lacks && !hasHave) blockers.push('Elvish has no attested verb for this use of “have”.')

  // Safety net: a “not” that does not reach the Elvish would flip the meaning
  // (no \b after the Elvish forms: \b does not work after accented letters like ú)
  const NEG_FORMS = /^(ú|lá|avo|áva|baw|vá|ua|um|ui|aua|ava)(?=$|[\s!.,-])|^ú-/i
  if (/\b(not|never)\b|n['’]t\b|\bcannot\b/.test(t) && !result.items.some((i) => NEG_FORMS.test(i.el) || i.steps.some((x) => /negat/.test(x)))) {
    blockers.push('The “not” in your sentence could not be carried into the Elvish, so the meaning would be reversed.')
  }
  for (const it of result.items) {
    if (/no clear example/.test(it.steps.join(' '))) cautions.push(`“${it.el}” (${it.gloss}): Tolkien left no clear example of saying “is not …” this way.`)
    if (it.status === 'G') continue
    if (it.status === 'N') cautions.push(`“${it.el}” (${it.gloss}) is a fan-made word, not Tolkien’s.`)
    else if (it.status === 'E') cautions.push(`“${it.el}” (${it.gloss}) comes from Tolkien’s earlier drafts, not his finished language.`)
    const recon = it.steps.find((s) => /reconstructed/.test(s))
    if (recon && it.status !== 'N') cautions.push(`The ending on “${it.el}” is a reconstruction: ${recon}.`)
    const stretch = it.steps.find((s) => /used here for/.test(s))
    if (stretch) cautions.push(`“${it.el}”: ${stretch}.`)
    if (/past “to be” not attested/.test(it.steps.join(' '))) cautions.push('Tolkien gave no reliable past tense of “to be”; the present “ná/nar” is used.')
  }

  const suggestions = blockers.length || cautions.length ? suggestRephrase(english, lang) : []
  if (blockers.length) return { level: 'unsafe', reasons: blockers, cautions, suggestions }
  if (cautions.length) return { level: 'caution', reasons: cautions, suggestions }
  return { level: 'safe', reasons: [], suggestions: [] }
}

export const TRUST = {
  exact: { label: 'Tolkien’s exact words', blurb: 'Quoted from Tolkien’s own writing.' },
  idiom: { label: 'The Elvish way to say it', blurb: 'Not word for word: Elves would not say it the English way. This is what Tolkien’s Elves would say instead, in his words. Its literal meaning is shown below.' },
  safe: { label: 'Built from Tolkien’s words', blurb: 'Every word is Tolkien’s, joined with grammar he showed. Composed by this app, so not a quotation.' },
  caution: { label: 'Partly reconstructed', blurb: 'Readable, but some pieces are not Tolkien’s own. They are listed below.' },
  unsafe: { label: 'Can’t translate this reliably', blurb: 'This needs grammar or words Tolkien never left us.' },
  gloss: { label: 'Word-by-word meaning', blurb: 'Each Elvish word was found and read back into English. Elvish often leaves out “is” and orders words differently, so read it as a guide.' },
}
