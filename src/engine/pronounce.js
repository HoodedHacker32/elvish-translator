// Say-it-like-this respellings using ordinary English spelling, no phonetic symbols.
// Stress follows Tolkien's rule: two syllables → the first; longer words → the second-to-last
// if it is "heavy" (long vowel, two-vowel sound, or followed by two consonants), otherwise the one before.

const VOWELS = 'aeiouyáéíóúâêîôûëäöýŷ'
// In Quenya "y" is always a consonant, as in "yes"
const isV = (c, lang) => !!c && VOWELS.includes(c) && !(lang === 'Q' && c === 'y')
const LONGV = /[áéíóúâêîôûýŷ]/

const DIPH = { Q: ['ai', 'au', 'eu', 'iu', 'oi', 'ui'], S: ['ai', 'ae', 'au', 'aw', 'ei', 'oe', 'ui'] }
const DIGRAPHS = ['th', 'dh', 'ch', 'ph', 'lh', 'rh', 'hw', 'qu', 'ng']

function splitUnits(word, lang) {
  const out = []
  let i = 0
  while (i < word.length) {
    const c = word[i]
    if (isV(c, lang)) {
      const two = word.slice(i, i + 2).normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (DIPH[lang].includes(two) && !(two === 'aw' && isV(word[i + 2], lang))) { out.push({ v: word.slice(i, i + 2), diph: true }); i += 2; continue }
      // Sindarin: an i before another vowel at the start of a word is a "y" sound
      if (lang === 'S' && c === 'i' && i === 0 && isV(word[1], lang)) { out.push({ c: 'y' }); i++; continue }
      out.push({ v: c, long: LONGV.test(c) })
      i++
      continue
    }
    const dg = DIGRAPHS.find((d) => word.startsWith(d, i))
    if (dg) { out.push({ c: dg, heavy: dg === 'qu' }); i += dg.length; continue }
    if (/[a-zñ]/.test(c)) out.push({ c })
    i++
  }
  return out
}

function syllabify(units) {
  const syl = []
  let cur = { on: [], v: null, co: [] }
  const pendingC = []
  for (const u of units) {
    if (u.c) { pendingC.push(u); continue }
    if (cur.v) {
      // split the consonants between the previous vowel and this one
      if (pendingC.length >= 2) { cur.co.push(pendingC.shift()) }
      syl.push(cur)
      cur = { on: pendingC.splice(0), v: u, co: [] }
    } else {
      cur.on.push(...pendingC.splice(0))
      cur.v = u
    }
  }
  if (cur.v) { cur.co.push(...pendingC.splice(0)); syl.push(cur) } else if (syl.length) syl[syl.length - 1].co.push(...pendingC)
  // qu counts as two consonants: it makes the syllable before it heavy
  syl.forEach((s, k) => { s.heavy = !!(s.v.long || s.v.diph || s.co.length || (syl[k + 1] && syl[k + 1].on.some((c) => c.heavy))) })
  return syl
}

function stressIndex(syl) {
  if (syl.length <= 2) return 0
  return syl[syl.length - 2].heavy ? syl.length - 2 : syl.length - 3
}

const CONS_SAY = { c: 'k', k: 'k', ch: 'kh', ph: 'f', qu: 'kw', hw: 'hw', lh: 'hl', rh: 'hr', x: 'ks', ñ: 'ng', ny: 'ny', ty: 'ty', hy: 'hy', ly: 'ly', ry: 'ry', nw: 'nw' }

// Returns the vowel sound; a trailing "|" means the coda is already folded in (e.g. "dine").
function sayVowel(v, closed, lang, onset, coda) {
  const plain = v.v.normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (v.diph && (plain === 'ai' || plain === 'ae') && onset) {
    if (!coda) return 'ye'
    if (/^[bdklmnprstvg]$/.test(coda)) return 'i' + coda + 'e|'
  }
  if (v.diph) return { ai: 'eye', ae: 'eye', au: 'ow', aw: 'ow', ei: 'ay', eu: 'eh-oo', iu: 'yoo', oi: 'oy', oe: 'oy', ui: 'ooy' }[plain]
  const long = v.long
  switch (plain) {
    case 'a': return 'ah'
    case 'e': return long ? 'ay' : closed ? 'e' : 'eh'
    case 'i': return long || !closed ? 'ee' : 'i'
    case 'o': return long || !closed ? 'oh' : 'o'
    case 'u': return 'oo'
    case 'y': return lang === 'S' ? 'ew' : 'ee'
    default: return plain
  }
}

function sayCons(list, lang, wordFinal) {
  return list.map((u, k) => {
    if (lang === 'S' && u.c === 'f' && wordFinal && k === list.length - 1) return 'v'
    if (u.c === 'h' && list.length > 1 && k < list.length - 1) return 'kh'
    return CONS_SAY[u.c] ?? u.c
  }).join('')
}

export function respell(word, lang) {
  const clean = word.toLowerCase().replace(/[’'·\[\]]/g, '').replace(/[^a-zñáéíóúâêîôûëäöýŷ-]/g, '')
  if (!clean) return null
  const parts = clean.split('-').filter(Boolean)
  return parts.map((p) => {
    const syl = syllabify(splitUnits(p, lang))
    if (!syl.length) return p
    const st = stressIndex(syl)
    return syl.map((s, k) => {
      const last = k === syl.length - 1
      const on = sayCons(s.on, lang, false)
      const co = sayCons(s.co, lang, last)
      const vw = sayVowel(s.v, s.co.length > 0, lang, on, co)
      let txt = vw.endsWith('|') ? on + vw.slice(0, -1) : on + vw + co
      txt = txt.replace(/(.)\1\1+/g, '$1$1').replace(/([bcdfgklmnprstvz])\1$/, '$1')
      return k === st && syl.length > 1 ? txt.toUpperCase() : txt
    }).join('-')
  }).join(' ')
}

export function respellLine(line, lang) {
  return line
    .split(/\s+/)
    .map((w) => (w.startsWith('[') ? null : respell(w, lang)))
    .filter(Boolean)
    .join('  ·  ')
}

const TIPS = [
  { test: /dh/, tip: '“dh” is the soft “th” in “this”.' },
  { test: /th/, tip: '“th” is the hard “th” in “thin”.' },
  { test: /ch/, tip: '“ch” (written “kh” here) is the throaty sound in Scottish “loch”, never “church”.' },
  { test: /c/, tip: '“c” is always a hard “k”, as in “cat”.' },
  { test: /g/, tip: '“g” is always hard, as in “go”.' },
  { test: /r/, tip: 'Tap or lightly roll every “r”, even at the end of a word.' },
  { test: /s/, tip: '“s” always hisses like “sun”, never buzzes like “rose”.' },
  { test: /ë$|e$/, tip: 'Say the “e” at the end of a word; it is never silent.', lang: 'Q' },
  { test: /y/, tip: '“y” as a vowel: say “ee” while rounding your lips, like French “tu”.', lang: 'S' },
  { test: /ae|ai/, tip: '“ai” and “ae” both sound like “eye”.' },
  { test: /lh|rh/, tip: '“lh” and “rh” are breathy: let air out as you say the l or r.' },
  { test: /hw/, tip: '“hw” is a breathy “w”, like some people say “what”.' },
  { test: /qu/, tip: '“qu” is “kw”, as in “queen”.' },
  { test: /([bcdfglmnprst])\1/, tip: 'Hold double letters a little longer, like the “nn” in “unknown”.' },
  { test: /[áéíóúâêîôû]/, tip: 'Accented vowels are simply held a little longer.' },
]

export function pronunciationTips(line, lang) {
  const l = line.toLowerCase()
  return TIPS.filter((t) => (!t.lang || t.lang === lang) && t.test.test(l)).map((t) => t.tip).slice(0, 5)
}
