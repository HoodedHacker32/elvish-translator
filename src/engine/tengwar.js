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
  acute: 0xe046, doubleAcute: 0xe048, rightCurl: 0xe04a, leftCurl: 0xe04c, nasalizer: 0xe050, doubler: 0xe051, tilde: 0xe052, breve: 0xe053,
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

// ——— English, spelling-based (orthographic) ———
// Following Tolkien's own English samples as tabled by Måns Björkman (Amanyë Tenceli, "General English"
// orthographic mode; DTS 5, 10, 11, 62, 84): one tengwa per letter or digraph, the vowel sign over the
// FOLLOWING tengwa, a dot below for a silent final e, a bar below for a doubled letter, a bar above for a
// nasal before a consonant of the same series, rómen before a vowel, and the shorthands for "the", "of", "and".
// Where Tolkien's samples disagree (he wrote final y both as a dot and a breve) the choice is noted.
const EN_DIGRAPHS = {
  ch: C.calma, sh: C.harma, th: C.thule, gh: C.unque, ng: C.nwalme, ph: C.formen, wh: C.hwestaSindarinwa, ck: C.quesse,
}
const EN_LETTERS = {
  t: C.tinco, p: C.parma, c: C.quesse, k: C.quesse, q: C.quesse, d: C.ando, b: C.umbar, j: C.anga, g: C.ungwe,
  f: C.formen, v: C.ampa, n: C.numen, m: C.malta, w: C.vala, l: C.lambe, s: C.silme, z: C.esse, h: C.hyarmen,
}
// th is voiced (anto) in these common words; Björkman's table separates th [θ] (thúle) from th [ð] (anto)
const EN_VOICED_TH = /^(this|that|these|those|they|them|their|theirs|there|then|than|thee|thou|thy|thine|though|thus|with|within|without|other|others|mother|father|brother|either|neither|whether|rather|together|further|weather|feather|leather|gather|bathe|breathe|clothe|smooth)$/
// ch is hwesta when it says [k] (Björkman: "Michael")
const EN_HARD_CH = /^(christ|chris|chor|chara|chao|chem|echo|school|stomach|ache|anch|orchest|michael|tech|mechan|archit|chrom|chron|choir|psych|chlor)/
// s is esse when it says [z] in these short words (Björkman: "is", "as")
const EN_Z_WORDS = /^(is|as|has|was|his|hers|does|goes|these|those|whose)$/
const EN_NASAL = { t: C.tinco, d: C.ando, p: C.parma, b: C.umbar, c: C.quesse, k: C.quesse, q: C.quesse, ch: C.calma, j: C.anga }
const EN_HOMORGANIC = { n: ['t', 'd', 'c', 'k', 'q', 'ch', 'j'], m: ['p', 'b'] }
export const STEMLESS_ANNA = 0xe032
const EN_TEHTA = { a: TEHTA.a, e: TEHTA.e, i: TEHTA.i, o: TEHTA.o, u: TEHTA.u }

function englishUnits(word) {
  const out = []
  let i = 0
  while (i < word.length) {
    const two = word.slice(i, i + 2)
    if (/[aeiou]/.test(word[i])) { out.push({ v: word[i] }); i++; continue }
    if (word[i] === 'y') {
      // y before a vowel is the consonant (anna); otherwise it is a vowel
      if (/[aeiou]/.test(word[i + 1] || '')) out.push({ c: C.anna, key: 'y' })
      else out.push({ v: 'y' })
      i++; continue
    }
    if (word[i] === 'x') { out.push({ c: C.quesse, key: 'x' }, { c: C.silme, key: 's' }); i++; continue }
    if (two === 'qu') { out.push({ c: C.quesse, key: 'q' }, { c: C.vala, key: 'w' }); i += 2; continue }
    if (EN_DIGRAPHS[two]) { out.push({ c: EN_DIGRAPHS[two], key: two }); i += 2; continue }
    if (word[i] === 'r') { out.push({ c: C.ore, key: 'r' }); i++; continue }
    if (EN_LETTERS[word[i]] != null) { out.push({ c: EN_LETTERS[word[i]], key: word[i] }); i++; continue }
    i++
  }
  return out
}

function englishWord(word) {
  if (word === 'the') return T(C.extAndo)
  if (word === 'of') return T(C.extUmbar)
  if (word === 'and') return T(C.ando) + T(C.nasalizer)
  const us = englishUnits(word)
  if (EN_VOICED_TH.test(word)) for (const u of us) if (u.key === 'th') u.c = C.anto
  if (EN_HARD_CH.test(word)) for (const u of us) if (u.key === 'ch') u.c = C.hwesta
  if (EN_Z_WORDS.test(word)) { const last = us[us.length - 1]; if (last?.key === 's') last.c = C.esse }
  // a final e after a consonant, in a word with another vowel, is silent: a dot below the consonant before it
  const vowels = us.filter((u) => u.v).length
  let silentE = false
  if (us.length > 1 && us[us.length - 1].v === 'e' && us[us.length - 2].c != null && vowels > 1) { us.pop(); silentE = true }
  // a nasal before a consonant of its own series becomes a bar over that consonant; a doubled letter, a bar below
  const merged = []
  for (let k = 0; k < us.length; k++) {
    const u = us[k], n = us[k + 1]
    if (u.c != null && n?.c != null && EN_HOMORGANIC[u.key]?.includes(n.key)) { merged.push({ ...n, nasal: true }); k++; continue }
    if (u.c != null && n?.c != null && u.key === n.key && u.key.length === 1) { merged.push({ ...u, doubled: true }); k++; continue }
    merged.push(u)
  }
  // vowels pair up: a second vowel is written as a tengwa that carries the first (ai → a over anna,
  // au/aw → a over vala, -e → yanta as in “Michael”, -a → stemless anna as in “Earth”)
  const seq = []
  for (let k = 0; k < merged.length; k++) {
    const u = merged[k], n = merged[k + 1]
    if (u.v && n?.v && u.v !== n.v && u.v !== 'y') {
      // (a second i has no letter of its own in Björkman's table, so ai, ei, oi are two vowel signs)
      const glide = { y: C.anna, u: C.vala, e: C.yanta, a: STEMLESS_ANNA }[n.v]
      if (glide != null) { seq.push({ v: u.v }, { c: glide, key: 'glide' }); k++; continue }
    }
    if (u.v && n?.v && u.v === n.v) { seq.push({ v: u.v, double: true }); k++; continue }
    seq.push(u)
  }
  // y as a vowel: a breve in words where it is the only vowel (“by”), a dot elsewhere (“history”); Tolkien wrote both
  const onlyVowelY = seq.filter((u) => u.v).length === 1
  let out = ''
  for (let k = 0; k < seq.length; k++) {
    const u = seq[k]
    if (u.c != null) {
      out += englishConsonant(u, seq[k + 1])
      continue
    }
    const tehta = u.v === 'y' ? (onlyVowelY ? T(C.breve) : TEHTA.i) : EN_TEHTA[u.v]
    const n = seq[k + 1]
    if (u.double && u.v === 'e' && n?.c != null) { out += englishConsonant(n, seq[k + 2], true) + T(C.doubleAcute); k++; continue }
    if (u.double) { out += CARRIER + tehta; if (!(n?.c != null)) { out += CARRIER + tehta; continue } }
    if (n?.c != null) { out += englishConsonant(n, seq[k + 2], true) + tehta; k++ }
    else out += CARRIER + tehta
  }
  if (silentE) out += T(C.dotBelow)
  return out
}

function englishConsonant(u, next, carriesTehta = false) {
  let cp = u.c
  if (u.key === 'r') cp = next?.v ? C.romen : C.ore
  if (carriesTehta && NUQUERNA[cp]) cp = NUQUERNA[cp]
  return T(cp) + (u.nasal ? T(C.nasalizer) : '') + (u.doubled ? DOUBLE : '')
}

// ——— Numerals ———
// Tengwar digits are written least significant first. Following Tecendil's handbook, a decimal number has a dot
// above each digit; a duodecimal one a dot below, with Tolkien's ring under the units digit.
const DIGIT = (d) => T(0xe070 + d)
export function toTengwarNumber(n, base = 10) {
  let v = Math.floor(Math.abs(Number(n)))
  const digits = []
  do { digits.push(v % base); v = Math.floor(v / base) } while (v > 0)
  return digits.map((d, i) => DIGIT(d) + (base === 10 ? T(C.dot) : T(C.dotBelow) + (i === 0 && digits.length > 1 ? T(0xe07d) : ''))).join('')
}

export function toTengwar(text, lang) {
  const fn = lang === 'Q' ? quenyaWord : lang === 'E' ? englishWord : sindarinWord
  let src = text.toLowerCase()
  // “of the”: the “of” shorthand with a bar below (Björkman, DTS 10)
  if (lang === 'E') src = src.replace(/\bof the\b/g, '\u0001')
  return src
    .replace(/[’'·\-]/g, lang === 'E' ? '' : ' ')
    .split(/(\s+|[.,!?;:]|\d+)/)
    .map((part) => {
      if (part === '\u0001') return T(C.extUmbar) + DOUBLE
      if (PUNCT[part]) return PUNCT[part]
      if (/^\d+$/.test(part)) return toTengwarNumber(part)
      if (/^\s+$/.test(part)) return ' '
      return part ? fn(part.replace(/\[.*?\]/g, '').replace('\u0001', '')) : ''
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

// ——— Tengwar Annatar (Dan Smith's keyboard encoding) ———
// For the keyboard-mapped fonts: each tengwa is an ordinary key, and each tehta has four keys, chosen by the
// shape of the letter under it (Johan Winge, Tengwar Annatar 1.20 documentation, tables 3 and 4):
// wide letters (two bows), narrow letters (one bow), letters with a raised stem, and the carriers.
export const ANNATAR_LETTERS = {
  tinco: '1', parma: 'q', calma: 'a', quesse: 'z', ando: '2', umbar: 'w', anga: 's', ungwe: 'x',
  thule: '3', formen: 'e', harma: 'd', hwesta: 'c', anto: '4', ampa: 'r', anca: 'f', unque: 'v',
  numen: '5', malta: 't', noldo: 'g', nwalme: 'b', ore: '6', vala: 'y', anna: 'h', vilya: 'n',
  romen: '7', arda: 'u', lambe: 'j', alda: 'm', silme: '8', silmeNuquerna: 'i', esse: 'k', esseNuquerna: ',',
  hyarmen: '9', hwestaSindarinwa: 'o', yanta: 'l', ure: '.', halla: '½', shortCarrier: '`', longCarrier: '~',
  extTinco: '!', extParma: 'Q', extCalma: 'A', extQuesse: 'Z', extAndo: '@', extUmbar: 'W', extAnga: 'S', extUngwe: 'X',
  pusta: '=', doublePusta: '-', exclamation: 'Á', question: 'À',
}
const SHAPE = {
  wide: ['ando', 'umbar', 'anga', 'ungwe', 'numen', 'malta', 'noldo', 'nwalme'],
  tall: ['thule', 'formen', 'harma', 'hwesta', 'anto', 'ampa', 'anca', 'unque', 'silme', 'esse', 'hyarmen', 'hwestaSindarinwa', 'longCarrier',
    'extTinco', 'extParma', 'extCalma', 'extQuesse', 'extAndo', 'extUmbar', 'extAnga', 'extUngwe'],
  carrier: ['shortCarrier', 'halla'],
}
const shapeOf = (name) => (SHAPE.wide.includes(name) ? 0 : SHAPE.tall.includes(name) ? 2 : SHAPE.carrier.includes(name) ? 3 : 1)
export const ANNATAR_TEHTAR = {
  threeDots: '#EDC', acute: '$RFV', dot: '%TGB', rightCurl: '^YHN', leftCurl: '&UJM', twoDots: 'ÔÕÖ×', breve: 'ØÙÚÛ',
  dotBelow: 'ÈÉÊË', twoDotsBelow: 'ÌÍÎÏ', nasalizer: '{{[[', doubler: '""\'\'', tilde: 'PPpp',
  // Annatar's standard font has no single doubled acute, so “ee” is two acutes
  doubleAcute: ['$$', 'RR', 'FF', 'VV'],
}
const NAME_OF = Object.fromEntries(Object.entries(CSUR).map(([k, v]) => [v, k]))
NAME_OF[STEMLESS_ANNA] = 'stemlessAnna'
const ANNATAR_DIGITS = 'ðñòóôõö÷øùúû'

// The other way: text typed for Tengwar Annatar, or any font in Dan Smith's encoding (Parmaitë, Elfica, the
// older Tengwar Sindarin, Quenya and Noldor fonts), as Unicode (ConScript) for Alcarin, Telcontar, FreeMono
// Tengwar and this app. Characters that mean nothing in the encoding (spaces, line breaks) are kept.
let FROM_ANNATAR = null
export function fromAnnatar(text) {
  if (!FROM_ANNATAR) {
    FROM_ANNATAR = new Map()
    for (const [name, key] of Object.entries(ANNATAR_LETTERS)) if (CSUR[name] != null) FROM_ANNATAR.set(key, String.fromCodePoint(CSUR[name]))
    for (const [name, keys] of Object.entries(ANNATAR_TEHTAR)) {
      if (CSUR[name] == null || Array.isArray(keys)) continue
      for (const k of keys) if (!FROM_ANNATAR.has(k)) FROM_ANNATAR.set(k, String.fromCodePoint(CSUR[name]))
    }
    ;[...ANNATAR_DIGITS].forEach((k, i) => FROM_ANNATAR.set(k, String.fromCodePoint(0xe070 + i)))
    FROM_ANNATAR.set(']', String.fromCodePoint(STEMLESS_ANNA))
  }
  let out = ''
  for (const ch of text) out += FROM_ANNATAR.get(ch) ?? ch
  return out
}

export function toAnnatar(tengwar) {
  let out = ''
  let base = null
  for (const ch of tengwar) {
    const cp = ch.codePointAt(0)
    if (cp >= 0xe070 && cp <= 0xe07b) { out += ANNATAR_DIGITS[cp - 0xe070]; base = 'shortCarrier'; continue }
    const name = NAME_OF[cp]
    if (name === 'stemlessAnna') { out += ']'; base = 'shortCarrier'; continue }
    if (name && ANNATAR_TEHTAR[name]) { out += ANNATAR_TEHTAR[name][shapeOf(base)]; continue }
    if (name && ANNATAR_LETTERS[name]) { out += ANNATAR_LETTERS[name]; base = name; continue }
    out += ch === ' ' ? ' ' : ''
  }
  return out
}
