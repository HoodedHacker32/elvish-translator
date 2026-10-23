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
  for (const row of eldamo) {
    const k = norm(row[1])
    if (!byForm.has(k)) byForm.set(k, new Set())
    byForm.get(k).add(row[3])
    if (row[5]?.note?.includes('archaic')) archaic.add(k + '|' + row[2])
  }
  const handForms = new Set()
  const checked = hand.map((row) => {
    const [keys, el, pos, st, src, ex] = row
    handForms.add(norm(el) + '|' + pos)
    const seen = byForm.get(norm(el))
    if ((st === 'A' || st === 'D') && seen && !seen.has('A') && !seen.has('D')) {
      const relabel = seen.has('E') ? 'E' : 'N'
      const note = relabel === 'E' ? 'Tolkien wrote this in an earlier stage of the language' : 'not found in Tolkien’s writings'
      return [keys, el, pos, relabel, src, { ...(ex || {}), note: ex?.note ? `${ex.note}; ${note}` : note }]
    }
    if (archaic.has(norm(el) + '|' + pos) && !ex?.note) return [keys, el, pos, st, src, { ...(ex || {}), note: 'archaic or poetic word' }]
    return row
  })
  const extra = eldamo.filter((row) => !handForms.has(norm(row[1]) + '|' + row[2]))
  return [...checked, ...extra]
}

export const SINDARIN_ALL = merge(SINDARIN, ELDAMO_SINDARIN)
export const QUENYA_ALL = merge(QUENYA, ELDAMO_QUENYA)
