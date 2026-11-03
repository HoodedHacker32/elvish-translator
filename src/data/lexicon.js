// The full lexicons: the hand-curated lists first (they carry Tolkien's attested verb forms),
// then everything from Eldamo. Hand entries are re-checked against Eldamo so a word Tolkien only
// wrote in an earlier stage of the language is labelled that way rather than as mature canon.
import { SINDARIN } from './sindarin.js'
import { QUENYA } from './quenya.js'
import { ELDAMO_SINDARIN } from './eldamo-sindarin.js'
import { ELDAMO_QUENYA } from './eldamo-quenya.js'

const norm = (s) => s.toLowerCase().replace(/^-/, '')

function merge(hand, eldamo) {
  const byForm = new Map()
  const archaic = new Set()
  const eldamoKeys = new Map() // form|pos → Eldamo's English meanings, added to a hand entry for the same word
  for (const row of eldamo) {
    const k = norm(row[1])
    if (!byForm.has(k)) byForm.set(k, new Set())
    byForm.get(k).add(row[3])
    if (row[5]?.note?.includes('archaic')) archaic.add(k + '|' + row[2])
    eldamoKeys.set(k + '|' + row[2], row[0])
  }
  const handForms = new Set()
  const late = [] // Eldamo's extra meanings for a hand-listed word, ranked after every main entry
  const checked = hand.map((row) => {
    const [keys, el, pos, st, src, ex] = row
    const more = (eldamoKeys.get(norm(el) + '|' + pos) || '').split('|').filter((k) => k && !keys.split('|').includes(k))
    handForms.add(norm(el) + '|' + pos)
    const seen = byForm.get(norm(el))
    let out = row
    if ((st === 'A' || st === 'D') && seen && !seen.has('A') && !seen.has('D')) {
      const relabel = seen.has('E') ? 'E' : 'N'
      const note = relabel === 'E' ? 'Tolkien wrote this in an earlier stage of the language' : 'not found in Tolkien’s writings'
      out = [keys, el, pos, relabel, src, { ...(ex || {}), note: ex?.note ? `${ex.note}; ${note}` : note }]
    } else if (archaic.has(norm(el) + '|' + pos) && !ex?.note) out = [keys, el, pos, st, src, { ...(ex || {}), note: 'archaic or poetic word' }]
    if (more.length) late.push([more.join('|'), ...out.slice(1)])
    return out
  })
  const extra = eldamo.filter((row) => !handForms.has(norm(row[1]) + '|' + row[2]))
  return { words: [...checked, ...extra], late }
}

const S = merge(SINDARIN, ELDAMO_SINDARIN)
const Q = merge(QUENYA, ELDAMO_QUENYA)
// one row per word, for the Lexicon page
export const SINDARIN_WORDS = S.words
export const QUENYA_WORDS = Q.words
// for translating: the same, plus Eldamo's extra meanings for hand-listed words, ranked last
export const SINDARIN_ALL = [...S.words, ...S.late]
export const QUENYA_ALL = [...Q.words, ...Q.late]
