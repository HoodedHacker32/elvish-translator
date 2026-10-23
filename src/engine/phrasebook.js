// Find lines Tolkien himself wrote whose English matches, exactly or closely, what the visitor typed.
import { TOLKIEN_PHRASES } from '../data/eldamo-phrases.js'

const STOP = new Set('a an the of to in on at by for with from and or is are am was were be been it its this that these those i me my you your he him his she her we us our they them their o oh ah shall will would do does did not no so as have has had can could may might must should please'.split(' '))

const plain = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '').replace(/\[|\]/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

const stem = (w) => w.replace(/(ies)$/, 'y').replace(/(ing|ed|es|s)$/, '').replace(/(.)\1$/, '$1')
const content = (s) => new Set(plain(s).split(' ').filter((w) => w && !STOP.has(w)).map(stem))

// An exact match is the whole of Tolkien's English, or one of the alternatives he gave with “/” or “;”
// (never just a fragment between commas, which would turn “Arwen …, farewell” into “farewell”)
const variants = (english) => [english, ...english.split(/;| \/ /)].map(plain).filter(Boolean)

const INDEXED = TOLKIEN_PHRASES.map((p) => ({ ...p, forms: variants(p.english), words: content(p.english) }))

export function exactPhrase(english, lang) {
  const n = plain(english)
  if (!n) return null
  const hits = INDEXED.filter((p) => p.forms.includes(n))
  return hits.find((p) => p.lang === lang) || hits[0] || null
}

// Closest Tolkien lines by shared meaning words; preferred language first.
export function closestPhrases(english, lang, limit = 3) {
  const want = content(english)
  if (!want.size) return []
  return INDEXED
    .map((p) => {
      let shared = 0
      for (const w of want) if (p.words.has(w)) shared++
      const score = shared / Math.max(want.size, Math.min(p.words.size, want.size + 3))
      return { p, shared, score }
    })
    .filter((x) => x.shared > 0 && x.score >= 0.25)
    .sort((a, b) => b.score - a.score || (a.p.lang === lang ? -1 : 1) - (b.p.lang === lang ? -1 : 1) || a.p.english.length - b.p.english.length)
    .slice(0, limit)
    .map((x) => x.p)
}

export { TOLKIEN_PHRASES }
