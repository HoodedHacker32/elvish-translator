// Latin Elvish → Tengwar, in the "general use" tehtar modes (vowels written as marks).
// Output uses the standard Tengwar private-use code points that Alcarin Tengwar draws.
// Quenya puts each vowel mark on the consonant before it; Sindarin on the consonant after it.

const T = (cp) => String.fromCharCode(cp)
const CARRIER = T(0xe025)
const LONG_CARRIER = T(0xe026)
const DOUBLE = T(0xe051)
const TEHTA = { a: T(0xe040), e: T(0xe046), i: T(0xe044), o: T(0xe04a), u: T(0xe04c), y: T(0xe042) }
const YANTA = T(0xe022)
const URE = T(0xe023)
const PUNCT = { ',': T(0xe060), '.': T(0xe061), '!': T(0xe065), '?': T(0xe066), ';': T(0xe061), ':': T(0xe061) }

const QUENYA = {
  nqu: 0xe00f, ngw: 0xe007, qu: 0xe003, nc: 0xe00e, nd: 0xe004, mb: 0xe005, ng: 0xe006, nt: 0xe00c, mp: 0xe00d,
  hw: 0xe00b, nw: 0xe013, rd: 0xe019, ld: 0xe01b, th: 0xe008, ss: 0xe01e,
  t: 0xe000, p: 0xe001, c: 0xe002, k: 0xe002, f: 0xe009, h: 0xe020, n: 0xe010, m: 0xe011, ñ: 0xe012,
  r: 0xe014, l: 0xe01a, s: 0xe01c, v: 0xe015, w: 0xe015, y: [0xe016, 0xe043], x: [0xe002, 0xe01c],
  d: 0xe004, b: 0xe005, g: 0xe006,
}
const SINDARIN = {
  th: 0xe008, dh: 0xe00c, ch: 0xe00a, ph: 0xe009, lh: 0xe01b, rh: 0xe019, hw: 0xe021, ng: 0xe012, ss: 0xe01e,
  t: 0xe000, p: 0xe001, c: 0xe002, k: 0xe002, d: 0xe004, b: 0xe005, g: 0xe006, f: 0xe009, v: 0xe00d,
  n: 0xe010, m: 0xe011, r: 0xe014, l: 0xe01a, s: 0xe01c, h: 0xe020, w: 0xe017,
}
const ROMEN = 0xe018
const NUQUERNA = { [0xe01c]: 0xe01d, [0xe01e]: 0xe01f }

const VOWEL_BASE = { a: 'a', á: 'a', â: 'a', e: 'e', é: 'e', ê: 'e', ë: 'e', i: 'i', í: 'i', î: 'i', o: 'o', ó: 'o', ô: 'o', u: 'u', ú: 'u', û: 'u', y: 'y', ý: 'y', ŷ: 'y' }
const IS_LONG = (ch) => /[áâéêíîóôúûýŷ]/.test(ch)

function units(word, table) {
  const keys = Object.keys(table).sort((a, b) => b.length - a.length)
  const out = []
  let i = 0
  while (i < word.length) {
    const ch = word[i]
    if (VOWEL_BASE[ch]) {
      const next = word[i + 1]
      const pair = ch + (next || '')
      if (/^(ai|ae|ei|ui|oe|oi)$/.test(VOWEL_BASE[ch] + (VOWEL_BASE[next] || ''))) { out.push({ v: VOWEL_BASE[ch], glide: YANTA }); i += 2; continue }
      if (/^(au|aw)$/.test(pair)) { out.push({ v: 'a', glide: URE }); i += 2; continue }
      out.push({ v: VOWEL_BASE[ch], long: IS_LONG(ch) })
      i++
      continue
    }
    const key = keys.find((k) => word.startsWith(k, i))
    if (!key) { i++; continue }
    const cp = table[key]
    const doubled = key.length === 1 && word[i + 1] === ch && key !== 's'
    out.push({ c: cp, key, doubled })
    i += key.length + (doubled ? 1 : 0)
  }
  return out
}

const glyph = (cp) => (Array.isArray(cp) ? cp.map(T).join('') : T(cp))

function consonantGlyph(u, nextIsVowel, hasMark) {
  let cp = u.c
  if (u.key === 'r' && nextIsVowel) cp = ROMEN
  if (hasMark && NUQUERNA[cp]) cp = NUQUERNA[cp]
  return glyph(cp) + (u.doubled ? DOUBLE : '')
}

const vowelOnCarrier = (u) => (u.glide ? u.glide + TEHTA[u.v] : (u.long ? LONG_CARRIER : CARRIER) + TEHTA[u.v])

function quenyaWord(word) {
  const us = units(word, QUENYA)
  let out = ''
  for (let k = 0; k < us.length; k++) {
    const u = us[k]
    if (u.c != null) {
      const n = us[k + 1]
      if (n && n.v && !n.long && !n.glide) { out += consonantGlyph(u, true, true) + TEHTA[n.v]; k++ }
      else if (n && n.v && n.glide) { out += consonantGlyph(u, true, true) + TEHTA[n.v] + n.glide; k++ }
      else out += consonantGlyph(u, !!(n && n.v), false)
    } else out += vowelOnCarrier(u)
  }
  return out
}

function sindarinWord(word) {
  const us = units(word, SINDARIN)
  let out = ''
  for (let k = 0; k < us.length; k++) {
    const u = us[k]
    if (u.v) {
      const n = us[k + 1]
      if (!u.long && !u.glide && n && n.c != null) {
        out += consonantGlyph(n, !!(us[k + 2] && us[k + 2].v), true) + TEHTA[u.v]
        k++
      } else out += vowelOnCarrier(u)
    } else out += consonantGlyph(u, !!(us[k + 1] && us[k + 1].v), false)
  }
  return out
}

export function toTengwar(text, lang) {
  const fn = lang === 'Q' ? quenyaWord : sindarinWord
  return text
    .toLowerCase()
    .replace(/[’'·\-]/g, ' ')
    .split(/(\s+|[.,!?;:])/)
    .map((part) => (PUNCT[part] ? PUNCT[part] : /^\s+$/.test(part) ? ' ' : part ? fn(part.replace(/\[.*?\]/g, '')) : ''))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}
