// Sound changes and word endings for Sindarin and Quenya.
// Every function returns { form, step } so the UI can show the working.

const LONG = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }
const CIRC = { a: 'â', e: 'ê', i: 'î', o: 'ô', u: 'û', y: 'ŷ' }

const keepCase = (orig, out) => (orig[0] && orig[0] !== orig[0].toLowerCase() ? out[0].toUpperCase() + out.slice(1) : out)

// ——— Sindarin mutations ———

const SOFT = [
  ['lh', 'thl'], ['rh', 'thr'], ['th', 'th'], ['dh', 'dh'], ['ch', 'ch'], ['ph', 'ph'],
  ['b', 'v'], ['c', 'g'], ['d', 'dh'], ['g', '’'], ['h', 'ch'], ['m', 'v'], ['p', 'b'], ['s', 'h'], ['t', 'd'],
]
const NASAL = [
  ['lh', 'l'], ['rh', 'r'], ['th', 'th'], ['dh', 'dh'], ['ch', 'ch'], ['ph', 'ph'],
  ['b', 'm'], ['c', 'ch'], ['d', 'n'], ['g', 'ng'], ['h', 'ch'], ['p', 'ph'], ['t', 'th'],
]

function mutate(word, table, name) {
  const lower = word.toLowerCase()
  for (const [from, to] of table) {
    if (lower.startsWith(from)) {
      if (from === to) return { form: word, step: null }
      const out = to + lower.slice(from.length)
      const form = to === '’' ? '’' + word.slice(1) : keepCase(word, out)
      return { form, step: `${name}: ${from}→${to === '’' ? '(dropped)' : to}` }
    }
  }
  return { form: word, step: null }
}

export const softMutation = (w) => mutate(w, SOFT, 'soft mutation')
export const nasalMutation = (w) => mutate(w, NASAL, 'nasal mutation')

// The Sindarin article: i (singular, soft mutation), in (plural, nasal mutation; the n merges into some consonants).
export function sindarinArticle(word, plural) {
  if (!plural) {
    const m = softMutation(word)
    return { article: 'i', form: m.form, step: m.step ? `after i, ${m.step}` : null }
  }
  const m = nasalMutation(word)
  const merges = /^(b|c|d|g|h|p|t|m|lh|rh)/i.test(word)
  return { article: merges ? 'i' : 'in', form: m.form, step: m.step ? `after plural in, ${m.step}` : null }
}

// Sindarin plural by i-affection (vowel change), used when Tolkien gives no plural.
export function sindarinPlural(word) {
  const lower = word.toLowerCase()
  const groups = [...lower.matchAll(/[aeiouyâêîôûŷáéíóú]+/g)]
  if (!groups.length) return { form: word, step: null }
  let out = lower
  for (let gi = groups.length - 1; gi >= 0; gi--) {
    const g = groups[gi]
    const isLast = gi === groups.length - 1
    const after = lower.slice(g.index + g[0].length)
    const clusterAfter = after.replace(/th|dh|ch|ph|lh|rh/g, 'X').match(/^[^aeiouyâêîôûŷ]*/)[0].length >= 2
    let v = g[0]
    if (isLast) {
      v = {
        a: clusterAfter ? 'e' : 'ai', â: 'ai', á: 'ai', e: 'i', ê: 'î', é: 'í', o: 'y', ô: 'ŷ', ó: 'ý', u: 'y', û: 'ui', ú: 'ui',
        au: 'oe', ie: 'i', io: 'y',
      }[v] ?? v
    } else {
      v = { a: 'e', o: 'e', u: 'y' }[v] ?? v
    }
    out = out.slice(0, g.index) + v + out.slice(g.index + g[0].length)
  }
  return { form: keepCase(word, out), step: 'plural by vowel change (i-affection)' }
}

// ——— Quenya noun endings ———

const softEnd = (w) => w.replace(/ë$/, 'e')
const endsVowel = (w) => /[aeiouëáéíóú]$/i.test(w)

export function quenyaPlural(word) {
  if (/ë$/.test(word)) return { form: word.slice(0, -1) + 'i', step: 'plural: final -ë becomes -i' }
  if (endsVowel(word)) return { form: word + 'r', step: 'plural: adds -r' }
  return { form: word + 'i', step: 'plural: adds -i' }
}

export function quenyaAdjPlural(word) {
  if (/ëa$/.test(word)) return { form: word.slice(0, -2) + 'ië', step: 'adjective agrees: -ëa becomes -ië' }
  if (/a$/.test(word)) return { form: word.slice(0, -1) + 'ë', step: 'adjective agrees: -a becomes -ë' }
  if (/ë$/.test(word)) return { form: word.slice(0, -1) + 'i', step: 'adjective agrees: -ë becomes -i' }
  return { form: word, step: null }
}

export const QUENYA_POSS = {
  i: { sfx: 'nya', en: 'my' },
  you: { sfx: 'lya', en: 'your' },
  we: { sfx: 'lva', en: 'our' },
  he: { sfx: 'rya', en: 'his/her' },
  they: { sfx: 'nta', en: 'their' },
}

export function quenyaPossessive(word, sfx) {
  const base = endsVowel(word) ? softEnd(word) : word + (sfx === 'nya' ? 'i' : 'e')
  return { form: base + sfx, step: `“-${sfx}” possessive ending` }
}

const CASES = {
  all: { v: 'nna', c: 'enna', pl: 'nnar', label: 'allative “to, toward”' },
  abl: { v: 'llo', c: 'ello', pl: 'llon', label: 'ablative “from”' },
  loc: { v: 'ssë', c: 'essë', pl: 'ssen', label: 'locative “in, at”' },
  ins: { v: 'nen', c: 'inen', pl: 'inen', label: 'instrumental “by, with”' },
  dat: { v: 'n', c: 'en', pl: 'in', label: 'dative “for, to”' },
}

export function quenyaCase(word, kase, plural) {
  if (kase === 'gen') {
    if (plural) return { form: word.replace(/r$/, '') + (/[aeiou]r$/.test(word) ? 'ron' : 'on'), step: 'genitive “of”: plural + -on' }
    if (/a$/.test(word)) return { form: word.slice(0, -1) + 'o', step: 'genitive “of”: -a becomes -o' }
    if (/o$/.test(word)) return { form: word, step: 'genitive “of”: already ends in -o' }
    return { form: softEnd(word) + 'o', step: 'genitive “of”: adds -o' }
  }
  const c = CASES[kase]
  if (plural) {
    const stem = word.replace(/[ri]$/, '')
    return { form: (endsVowel(stem) ? softEnd(stem) : stem + 'e') + c.pl, step: `${c.label}, plural` }
  }
  return { form: endsVowel(word) ? softEnd(word) + c.v : word + c.c, step: c.label }
}

// ——— Verbs ———

const lengthenFirst = (stem, map) => stem.replace(/[aeiouy]/, (v) => map[v] ?? v)

export const QUENYA_SUBJ = { i: 'n', you: 'lyë', he: 's', we: 'lmë', they: 'ntë' }

function qAddSuffix(form, person, plural) {
  if (person) {
    const s = QUENYA_SUBJ[person]
    return { form: softEnd(form) + s, step: `subject ending -${s} (“${person === 'he' ? 'he/she/it' : person}”)` }
  }
  if (plural) return { form: softEnd(form) + 'r', step: 'plural subject: -r' }
  return { form, step: null }
}

// tense: 'pres' | 'cont' | 'past' | 'fut' | 'imp'
export function quenyaVerb(entry, { tense, person, plural }) {
  const stem = entry.el
  const ex = entry.ex || {}
  const aStem = ex.cls === 'a'
  const steps = []
  let form
  let attested = false
  if (tense === 'imp') {
    return { form: 'á ' + (aStem ? stem : stem + 'a'), steps: ['command: á + verb'], attested: false }
  }
  if (tense === 'inf') {
    return { form: aStem ? stem : stem + 'ë', steps: ['infinitive “to …”, as in Tolkien’s polin quetë “I can speak”'], attested: false }
  }
  if (tense === 'fut') {
    if (ex.fut) { form = ex.fut; attested = true } else form = (aStem ? stem.slice(0, -1) : stem) + 'uva'
    steps.push('future: -uva')
  } else if (tense === 'past') {
    if (ex.past) { form = ex.past; attested = true; steps.push('perfect “has …-ed”, as Tolkien wrote it') }
    else if (aStem) { form = stem + 'në'; steps.push('past: -në') }
    else {
      const last = stem.slice(-1)
      if ('tpc'.includes(last)) form = stem.slice(0, -1) + 'n' + last + 'ë'
      else if (last === 'l') form = stem + 'lë'
      else if (last === 'n') form = stem + 'në'
      else form = stem + 'në'
      steps.push('past: nasal past ending')
    }
  } else if (tense === 'cont') {
    if (ex.pres) { form = ex.pres; attested = true } else form = aStem ? stem.slice(0, -1) + 'ëa' : lengthenFirst(stem, LONG) + 'a'
    steps.push('continuous present “is …-ing”')
  } else {
    if (ex.pres && !person && !plural) { form = ex.pres; attested = true; steps.push('present') }
    else if (aStem) { form = stem; steps.push('present (aorist)') }
    else { form = person || plural ? stem + 'i' : stem + 'ë'; steps.push('present (aorist)') }
  }
  const s = qAddSuffix(form, person, plural)
  if (s.step) { steps.push(s.step); attested = false }
  return { form: s.form, steps, attested }
}

export function sindarinVerb(entry, { tense, person, plural }) {
  const stem = entry.el
  const ex = entry.ex || {}
  const aStem = ex.cls === 'a'
  const steps = []
  const neo = (form, step) => ({ form, steps: [...steps, step], attested: false, neo: true })

  if (tense === 'inf') {
    return { form: aStem ? stem + 'd' : stem + 'ed', steps: ['verb-noun “to …-ing”, as in Tolkien’s aníra suilannad “desires to greet”'], attested: false }
  }
  if (tense === 'imp') {
    if (ex.imp) return { form: ex.imp, steps: ['command, as Tolkien wrote it'], attested: true }
    return { form: aStem ? stem.slice(0, -1) + 'o' : stem + 'o', steps: ['command: -o'], attested: false }
  }
  if (tense === 'fut') {
    const base = aStem ? stem + 'tha' : stem + 'itha'
    steps.push('future: -tha')
    if (person === 'i') {
      if (ex.fut1) return { form: ex.fut1, steps: ['“I will …”, as Tolkien wrote it'], attested: true }
      return { form: base.replace(/a$/, 'on'), steps: [...steps, 'ending -on (“I”)'], attested: false }
    }
    if (person === 'we') return neo(base.replace(/a$/, 'am'), 'ending -m (“we”), reconstructed')
    if (plural || person === 'they') return { form: base + 'r', steps: [...steps, 'plural ending -r'], attested: false }
    return { form: base, steps, attested: false }
  }
  if (tense === 'past') {
    let base
    let att = false
    if (ex.past) { base = ex.past; att = true; steps.push('past, as Tolkien wrote it') }
    else if (aStem) { base = stem + 'nt'; steps.push('past: -nt') }
    else {
      const last = stem.slice(-1)
      const infix = { d: 'nt', b: 'mp', g: 'nc', t: 'nt', p: 'mp', c: 'nc' }[last]
      base = infix ? stem.slice(0, -1) + infix : stem + 'ant'
      return person === 'i' ? neo(base.replace(/nt$|mp$|nc$|ant$/, (m) => ({ nt: 'nnen', mp: 'mmen', nc: 'ngen', ant: 'annen' })[m]), 'past with “I”, reconstructed')
        : neo(base, 'past by nasal infix, reconstructed')
    }
    if (person === 'i') {
      if (ex.past1) return { form: ex.past1, steps: ['“I …-ed”, as Tolkien wrote it'], attested: true }
      return neo(base.replace(/nt$/, 'nnen'), 'ending -en (“I”), reconstructed')
    }
    if (plural || person === 'they') return { form: base.replace(/nt$/, 'nner'), steps: [...steps, 'plural ending'], attested: false }
    return { form: base, steps, attested: att }
  }
  // present
  if (person === 'i') {
    if (ex.p1) return { form: ex.p1, steps: ['“I …”, as Tolkien wrote it'], attested: true }
    return { form: aStem ? stem.slice(0, -1) + 'on' : stem + 'in', steps: [aStem ? 'present, ending -on (“I”)' : 'present, ending -in (“I”)'], attested: false }
  }
  if (person === 'we') return neo(aStem ? stem + 'm' : stem + 'im', 'present, ending -m (“we”), reconstructed')
  if (plural || person === 'they') return { form: aStem ? stem + 'r' : stem + 'ir', steps: ['present, plural ending'], attested: false }
  if (aStem) return { form: stem, steps: ['present'], attested: true }
  const isMono = (stem.match(/[aeiouy]+/g) || []).length === 1
  return isMono
    ? { form: lengthenFirst(stem, CIRC), steps: ['present: vowel lengthened'], attested: false }
    : { form: stem, steps: ['present'], attested: true }
}
