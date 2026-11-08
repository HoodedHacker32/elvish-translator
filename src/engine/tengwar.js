// Latin Elvish → Tengwar, in the "general use" tehtar modes (vowels written as marks).
// Output uses the standard Tengwar private-use code points that Alcarin Tengwar draws.
// Quenya puts each vowel mark on the consonant before it; Sindarin on the consonant after it.

const T = (cp) => String.fromCharCode(cp)

// Code points from the ConScript Unicode Registry's Tengwar table (revision of 2008-04-14), the layout
// Alcarin Tengwar and every other Unicode Tengwar font follows. Tengwar is not in Unicode itself.
export const CSUR = {
  tinco: 0xe000, parma: 0xe001, calma: 0xe002, quesse: 0xe003,
  ando: 0xe004, umbar: 0xe005, anga: 0xe006, ungwe: 0xe007,
  thule: 0xe008, formen: 0xe009, harma: 0xe00a, hwesta: 0xe00b,
  anto: 0xe00c, ampa: 0xe00d, anca: 0xe00e, unque: 0xe00f,
  numen: 0xe010, malta: 0xe011, noldo: 0xe012, nwalme: 0xe013,
  ore: 0xe014, vala: 0xe015, anna: 0xe016, vilya: 0xe017,
  extTinco: 0xe018, extParma: 0xe019, extCalma: 0xe01a, extQuesse: 0xe01b,
  extAndo: 0xe01c, extUmbar: 0xe01d, extAnga: 0xe01e, extUngwe: 0xe01f,
  romen: 0xe020, arda: 0xe021, lambe: 0xe022, alda: 0xe023,
  silme: 0xe024, silmeNuquerna: 0xe025, esse: 0xe026, esseNuquerna: 0xe027,
  hyarmen: 0xe028, hwestaSindarinwa: 0xe029, yanta: 0xe02a, ure: 0xe02b,
  longCarrier: 0xe02c, halla: 0xe02d, shortCarrier: 0xe02e,
  // tehtar
  threeDots: 0xe040, threeDotsBelow: 0xe041, twoDots: 0xe042, twoDotsBelow: 0xe043, dot: 0xe044, dotBelow: 0xe045,
  acute: 0xe046, doubleAcute: 0xe048, rightCurl: 0xe04a, leftCurl: 0xe04c, nasalizer: 0xe050, doubler: 0xe051, tilde: 0xe052,
  // punctuation
  pusta: 0xe060, doublePusta: 0xe061, triplePusta: 0xe062, quadruplePusta: 0xe063, quintuplePusta: 0xe064,
  exclamation: 0xe065, question: 0xe066, parenthesis: 0xe067, section: 0xe068,
}
const CARRIER = T(CSUR.shortCarrier)
const LONG_CARRIER = T(CSUR.longCarrier)
const DOUBLE = T(CSUR.doubler)
// o is the right curl and u the left curl, as Tolkien's general use writes them (checked against Tengwar Annatar)
const TEHTA = { a: T(CSUR.threeDots), e: T(CSUR.acute), i: T(CSUR.dot), o: T(CSUR.rightCurl), u: T(CSUR.leftCurl), y: T(CSUR.twoDots) }
const YANTA = T(CSUR.yanta)
const URE = T(CSUR.ure)
const PUNCT = { ',': T(CSUR.pusta), '.': T(CSUR.doublePusta), '!': T(CSUR.exclamation), '?': T(CSUR.question), ';': T(CSUR.doublePusta), ':': T(CSUR.doublePusta) }

const C = CSUR
const QUENYA = {
  nqu: C.unque, ngw: C.ungwe, qu: C.quesse, nc: C.anca, nd: C.ando, mb: C.umbar, ng: C.anga, nt: C.anto, mp: C.ampa,
  hw: C.hwesta, nw: C.nwalme, rd: C.arda, ld: C.alda, th: C.thule, ss: C.esse,
  t: C.tinco, p: C.parma, c: C.calma, k: C.calma, f: C.formen, h: C.hyarmen, n: C.numen, m: C.malta, ñ: C.noldo,
  r: C.ore, l: C.lambe, s: C.silme, v: C.vala, w: C.vala, y: [C.anna, CSUR.twoDotsBelow], x: [C.calma, C.silme],
  d: C.ando, b: C.umbar, g: C.anga,
}
const SINDARIN = {
  th: C.thule, dh: C.anto, ch: C.harma, ph: C.formen, lh: C.alda, rh: C.arda, hw: C.hwestaSindarinwa, ng: C.noldo, ss: C.esse,
  t: C.tinco, p: C.parma, c: C.calma, k: C.calma, d: C.ando, b: C.umbar, g: C.anga, f: C.formen, v: C.ampa,
  n: C.numen, m: C.malta, r: C.ore, l: C.lambe, s: C.silme, h: C.hyarmen, w: C.vilya,
}
const ROMEN = C.romen
const NUQUERNA = { [C.silme]: C.silmeNuquerna, [C.esse]: C.esseNuquerna }

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
