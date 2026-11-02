// Elvish → English. Tolkien's own lines come back with his own English; anything else is read word by
// word by running the app's grammar backwards: every form the composer could build is generated once,
// and Sindarin sound changes (i gor → cor) are undone before looking a word up.
import { SINDARIN_ALL, QUENYA_ALL } from '../data/lexicon.js'
import { CANON } from '../data/canon.js'
import { TOLKIEN_PHRASES } from '../data/eldamo-phrases.js'
import { SOURCES } from '../data/sources.js'
import { IRREGULAR_VERB } from './translate.js'
import { sindarinPlural, quenyaPlural, quenyaAdjPlural, quenyaCase, quenyaPossessive, quenyaVerb, sindarinVerb, QUENYA_POSS } from './morph.js'
import { SINDARIN_PHRASES } from '../data/sindarin.js'
import { QUENYA_PHRASES } from '../data/quenya.js'

const LEX = { S: SINDARIN_ALL, Q: QUENYA_ALL }
const RANK = { A: 0, D: 1, E: 2, N: 3 }

export const plainElvish = (s) => s.toLowerCase().normalize('NFC').replace(/[’'`]/g, '’').replace(/[!?.,;:"“”()]/g, ' ').replace(/\s+/g, ' ').trim()
const bare = (s) => plainElvish(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’·-]/g, ' ').replace(/\s+/g, ' ').trim()

// ——— English helpers for readable glosses ———

const PAST = {}
for (const [form, [lemma, tense]] of Object.entries(IRREGULAR_VERB)) if (tense === 'past' && !PAST[lemma]) PAST[lemma] = form
// verb helpers change only the first word of a phrasal verb: “come together” → “came together”
const firstWord = (fn) => (v) => { const [a, ...rest] = v.split(' '); return [fn(a), ...rest].join(' ') }
const pastOf = firstWord((v) => PAST[v] || (v.endsWith('e') ? v + 'd' : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + 'ied' : v + 'ed'))
const ingOf = firstWord((v) => (v.endsWith('ie') ? v.slice(0, -2) + 'ying' : v.endsWith('e') && v !== 'be' ? v.slice(0, -1) + 'ing' : v + 'ing'))
const sOf = firstWord((v) => (/(s|sh|ch|x|z|o)$/.test(v) ? v + 'es' : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + 'ies' : v + 's'))
const pluralOf = (n) => ({ man: 'men', woman: 'women', child: 'children', elf: 'elves', dwarf: 'dwarves', leaf: 'leaves', wolf: 'wolves', foot: 'feet', tooth: 'teeth' }[n] || sOf(n))
const PERSON = { i: 'I', you: 'you', he: 'he/she', we: 'we', they: 'they' }
const POSS_EN = { i: 'my', you: 'your', he: 'his/her', we: 'our', they: 'their' }
const CASE_EN = { all: 'to', abl: 'from', loc: 'in', ins: 'by', dat: 'for', gen: 'of' }
const headWord = (keys) => keys.split('|')[0]

// ——— every form the grammar can build, generated once per language ———

const FORMS = { S: null, Q: null }
const SET_PHRASES = new Map()

function addForm(map, form, rec) {
  if (!form || /\s/.test(form)) return
  const k = plainElvish(form)
  const list = map.get(k) || map.set(k, []).get(k)
  if (!list.some((r) => r.en === rec.en && r.entry === rec.entry)) list.push(rec)
}

function buildForms(lang) {
  const map = new Map()
  for (const [keys, el, pos, st, src, ex] of LEX[lang]) {
    const entry = { keys, el, pos, st, src, ex }
    const head = headWord(keys)
    const base = el.replace(/^-/, '')
    if (pos === 'v') {
      const v = head.replace(/^to /, '')
      addForm(map, base, { entry, en: v, note: 'verb stem' })
      const gen = lang === 'Q' ? quenyaVerb : sindarinVerb
      const tenses = { pres: (p) => (p === 'he' ? sOf(v) : v), past: () => pastOf(v), fut: () => `will ${v}`, cont: () => `is ${ingOf(v)}` }
      for (const [tense, eng] of Object.entries(tenses)) {
        for (const person of [undefined, 'i', 'you', 'he', 'we', 'they']) {
          try {
            const f = gen(entry, { tense, person, plural: false }).form
            const who = person ? PERSON[person] + ' ' : ''
            addForm(map, f, { entry, en: who + eng(person), note: `verb, ${tense === 'pres' ? 'present' : tense === 'cont' ? 'continuous' : tense === 'fut' ? 'future' : 'past'}${person ? `, “${PERSON[person]}”` : ''}` })
          } catch { /* a form the rules cannot build */ }
        }
      }
      for (const [tense, eng] of [['pres', v], ['past', pastOf(v)], ['fut', `will ${v}`]]) {
        try { addForm(map, gen(entry, { tense, plural: true }).form, { entry, en: `they ${eng}`, note: `verb, ${tense === 'pres' ? 'present' : tense === 'fut' ? 'future' : 'past'}, plural subject` }) } catch { /* none */ }
      }
      try { addForm(map, gen(entry, { tense: 'imp' }).form.replace(/^á /, ''), { entry, en: `${v}!`, note: 'command' }) } catch { /* none */ }
      try { addForm(map, gen(entry, { tense: 'inf' }).form, { entry, en: lang === 'S' ? ingOf(v) : `to ${v}`, note: lang === 'S' ? 'verb-noun' : 'infinitive' }) } catch { /* none */ }
      if (lang === 'S' && ex?.past) addForm(map, ex.past, { entry, en: pastOf(v), note: 'past, as Tolkien wrote it' })
      continue
    }
    addForm(map, base, { entry, en: head, note: pos === 'n' ? 'noun' : pos === 'adj' ? 'adjective' : null })
    if (pos === 'adj' && lang === 'Q') addForm(map, quenyaAdjPlural(base).form, { entry, en: head, note: 'adjective, plural' })
    if (pos === 'n') {
      const pl = ex?.pl || (lang === 'S' ? sindarinPlural(base).form : quenyaPlural(base).form)
      addForm(map, pl, { entry, en: pluralOf(head), note: ex?.pl ? 'plural, as Tolkien wrote it' : 'plural' })
      if (lang === 'Q') {
        for (const [kase, prep] of Object.entries(CASE_EN)) {
          addForm(map, quenyaCase(base, kase, false).form, { entry, en: `${prep} ${head}`, note: `“${prep}” ending` })
          addForm(map, quenyaCase(pl, kase, true).form, { entry, en: `${prep} ${pluralOf(head)}`, note: `plural, “${prep}” ending` })
        }
        for (const [person, { sfx }] of Object.entries(QUENYA_POSS)) {
          const f = quenyaPossessive(base, sfx).form
          addForm(map, f, { entry, en: `${POSS_EN[person]} ${head}`, note: `“${POSS_EN[person]}” ending` })
          addForm(map, f + 'r', { entry, en: `${POSS_EN[person]} ${pluralOf(head)}`, note: `“${POSS_EN[person]}” ending, plural` })
          for (const [kase, prep] of Object.entries(CASE_EN)) {
            addForm(map, quenyaCase(f, kase, false).form, { entry, en: `${prep} ${POSS_EN[person]} ${head}`, note: `“${POSS_EN[person]}” + “${prep}” endings` })
          }
        }
      }
    }
  }
  // the article and a few grammar words the lexicon leaves to the rules
  const extra = lang === 'S'
    ? [['i', 'the'], ['in', 'the (plural)'], ['en', 'of the'], ['a', 'and'], ['ar', 'and'], ['ú', 'not'], ['avo', 'don’t'], ['man', 'what/who'], ['nín', 'my'], ['lín', 'your'], ['vín', 'our'], ['dîn', 'his/her'], ['ammen', 'for us'], ['enni', 'to me'], ['anim', 'for myself']]
    : [['i', 'the'], ['ar', 'and'], ['lá', 'not'], ['vá', 'not, won’t'], ['áva', 'don’t'], ['ná', 'is'], ['nar', 'are'], ['nánë', 'was'], ['man', 'who'], ['mana', 'what'], ['nin', 'for me'], ['ámen', 'for us'], ['nai', 'may it be that'], ['á', '(command)']]
  for (const [form, en] of extra) addForm(map, form, { entry: { el: form, st: 'A', src: 'LotR' }, en, note: 'grammar word' })
  // the app's own set phrases (melinyel “I love you”, le hannon “thank you”)
  for (const [keys, el, st, src] of lang === 'S' ? SINDARIN_PHRASES : QUENYA_PHRASES) {
    addForm(map, el, { entry: { el, st, src, pos: 'phrase' }, en: headWord(keys), note: 'set phrase' })
    SET_PHRASES.set(bare(el), { lang, elvish: el, english: headWord(keys), st, src })
  }
  for (const list of map.values()) list.sort((a, b) => (RANK[a.entry.st] ?? 4) - (RANK[b.entry.st] ?? 4))
  return map
}

const formsFor = (lang) => (FORMS[lang] ||= buildForms(lang))

// Sindarin: undo the sound changes that articles and prepositions cause, so “i gor” finds cor
const UNSOFT = [['thl', 'lh'], ['thr', 'rh'], ['dh', 'd'], ['ch', 'h'], ['v', 'b'], ['v', 'm'], ['g', 'c'], ['b', 'p'], ['d', 't'], ['h', 's'], ['’', 'g']]
const UNNASAL = [['mb', 'b'], ['nd', 'd'], ['ng', 'g'], ['m', 'b'], ['ch', 'c'], ['n', 'd'], ['ph', 'p'], ['th', 't'], ['l', 'lh'], ['r', 'rh']]
function unmutate(w) {
  const out = []
  for (const [from, to] of UNSOFT) if (w.startsWith(from)) out.push({ w: to + w.slice(from.length), how: 'soft mutation undone' })
  for (const [from, to] of UNNASAL) if (w.startsWith(from)) out.push({ w: to + w.slice(from.length), how: 'nasal mutation undone' })
  if (/^[aeiouâêîôûáéíóúy]/.test(w)) out.push({ w: 'g' + w, how: 'lost g restored (soft mutation)' })
  return out
}

// put “not” where English wants it: “I will sing” → “I will not sing”, “I sing” → “I do not sing”
function negateEnglish(en) {
  const m = en.match(/^(I|you|he\/she|we|they) (will |is |did )?(.+)$/)
  if (!m) return 'not ' + en
  if (m[2]) return `${m[1]} ${m[2]}not ${m[3]}`
  return `${m[1]} ${m[1] === 'he/she' ? 'does' : 'do'} not ${m[3].replace(/s$/, '')}`
}

function readWord(token, lang, ctx = {}) {
  const map = formsFor(lang)
  const w = plainElvish(token)
  const tries = [{ w, how: null }]
  if (lang === 'S') {
    if (/^ú-/.test(w)) tries.push({ w: w.slice(2), how: 'negated with ú-', neg: true }, ...unmutate(w.slice(2)).map((x) => ({ ...x, neg: true })))
    if (/^i-/.test(w)) tries.push({ w: w.slice(2), how: 'after the article i', art: true })
    // after the article a noun is normally softened, so try the undone form first (i gor → cor “ring”)
    if (ctx.afterArticle) tries.unshift(...unmutate(w).filter((x) => map.get(x.w)?.some((h) => h.entry.pos === 'n')))
    else tries.push(...unmutate(w))
  }
  if (/’$/.test(w)) for (const v of ['a', 'ë', 'e', 'o']) tries.push({ w: w.slice(0, -1) + v, how: 'final vowel elided (’)' })
  for (const t of tries) {
    const hits = map.get(t.w) || map.get(t.w.normalize('NFD').replace(/[̀-ͯ]/g, '')) || null
    if (hits?.length) {
      // after a noun, a describing word is likelier than a noun with the same spelling (i ngîl glân “the stars bright”)
      const h = (ctx.afterNoun && hits.find((x) => x.entry.pos === 'adj')) || hits[0]
      const en = (t.art ? 'the ' : '') + (t.neg ? negateEnglish(h.en) : h.en)
      return {
        el: token, en, gloss: en, base: h.entry.el, pos: h.entry.pos, status: h.entry.st, note: [h.note, t.how].filter(Boolean).join('; '),
        sourceLabel: SOURCES[h.entry.src] || h.entry.src, alternatives: hits.slice(1, 4).map((x) => x.en).filter((x) => x !== h.en),
      }
    }
  }
  if (/^[A-ZÁÉÍÓÚÂÊÎÔÛ]/.test(token)) return { el: token, en: token, gloss: token, status: 'P', note: 'a name', sourceLabel: '' }
  return { el: token, en: `[${token}]`, gloss: '', status: 'G', note: 'not found in the lexicon', sourceLabel: '' }
}

// ——— Tolkien's own lines ———

const LINES = [
  ...CANON.map((c) => ({ lang: c.lang, elvish: c.elvish, english: c.meaning, where: c.where })),
  ...TOLKIEN_PHRASES,
]
const BY_ELVISH = new Map()
for (const p of LINES) {
  const k = bare(p.elvish)
  if (!BY_ELVISH.has(k)) BY_ELVISH.set(k, p)
}

export function toEnglish(text, lang = 'S') {
  const t = text.trim()
  if (!t) return { mode: 'reverse', lang, english: '', words: [], trust: { level: 'safe', reasons: [] } }
  const known = BY_ELVISH.get(bare(t))
  if (known) {
    return {
      mode: 'reverse', lang: known.lang, english: known.english.charAt(0).toUpperCase() + known.english.slice(1),
      tolkien: known, words: t.replace(/[!?.,;:]/g, ' ').split(/\s+/).filter(Boolean).map((w) => readWord(w, known.lang)),
      trust: { level: 'exact', reasons: [] },
    }
  }
  formsFor(lang)
  const set = SET_PHRASES.get(bare(t))
  if (set && set.lang === lang) {
    return {
      mode: 'reverse', lang, english: set.english.charAt(0).toUpperCase() + set.english.slice(1),
      words: [{ el: t, en: set.english, gloss: set.english, status: set.st, note: 'set phrase', sourceLabel: SOURCES[set.src] || set.src }],
      trust: { level: 'gloss', reasons: [] },
    }
  }
  const tokens = t.split(/\s+/).flatMap((w) => w.split(/(?<=’)(?=\S)/)).filter((w) => /\p{L}/u.test(w))
  const words = []
  for (let k = 0; k < tokens.length; k++) {
    // a run of words that is one of Tolkien's lines (or a set phrase) is read as a whole: “mae govannen, mellon”
    let whole = null
    for (let n = Math.min(8, tokens.length - k); n >= 2 && !whole; n--) {
      const run = tokens.slice(k, k + n).join(' ')
      const hit = BY_ELVISH.get(bare(run)) || SET_PHRASES.get(bare(run))
      if (hit && hit.lang === lang) whole = { n, hit }
    }
    if (whole) {
      const last = tokens[k + whole.n - 1]
      words.push({ el: tokens.slice(k, k + whole.n).join(' ').replace(/[!?.,;:]+$/, ''), en: whole.hit.english, gloss: whole.hit.english, pos: 'phrase',
        status: whole.hit.where ? 'C' : whole.hit.st, note: whole.hit.where ? 'a phrase Tolkien wrote' : 'set phrase',
        sourceLabel: whole.hit.where || SOURCES[whole.hit.src] || whole.hit.src || '', punct: (last.match(/[!?.,;:]+$/) || [''])[0] })
      k += whole.n - 1
      continue
    }
    const tok = tokens[k]
    const prev = words.at(-1)
    const ctx = { afterArticle: prev && /^(i|in|en)$/i.test(plainElvish(prev.el)), afterNoun: prev?.pos === 'n' }
    words.push({ ...readWord(tok.replace(/[!?.,;:"“”()]/g, ''), lang, ctx), punct: (tok.match(/[!?.,;:]+$/) || [''])[0] })
  }
  const english = englishLine(words)
  const unknown = words.filter((x) => x.status === 'G').length
  // try the other language too: if it reads far better, say so
  const other = lang === 'S' ? 'Q' : 'S'
  const otherUnknown = tokens.map((tok) => readWord(tok.replace(/[!?.,;:"“”()]/g, ''), other)).filter((x) => x.status === 'G').length
  const reasons = []
  if (unknown) reasons.push(`${unknown} word${unknown > 1 ? 's' : ''} not found in the ${lang === 'S' ? 'Sindarin' : 'Quenya'} lexicon.`)
  if (words.some((x) => x.status === 'N')) reasons.push('Some words are fan-made Neo-Elvish, not Tolkien’s.')
  return {
    mode: 'reverse', lang, english: english.charAt(0).toUpperCase() + english.slice(1), words,
    looksLike: otherUnknown < unknown ? other : null, closest: closestElvish(t),
    trust: { level: unknown ? 'caution' : 'gloss', reasons },
  }
}

// Turn word-by-word meanings into readable English order. Only reorders; never adds meaning.
const OBJ = { you: 'you', 'for me': 'me', me: 'me', 'for us': 'us', them: 'them', him: 'him', her: 'her', it: 'it' }
function englishLine(words) {
  const parts = words.map((w) => ({ en: w.en.replace(/^the \(plural\)$/, 'the'), punct: w.punct, pos: w.pos, status: w.status }))
  const isVerbWithSubject = (p) => p && /^(I|you|he\/she|we|they) /.test(p.en) && p.pos === 'v'
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    const next = parts[i + 1]
    // Sindarin puts an object pronoun before its verb: le melin “you I-love” → “I love you”
    if (p.pos === 'pron' && OBJ[p.en] && isVerbWithSubject(next) && !p.punct) {
      parts[i] = { ...next, punct: next.punct }
      parts[i + 1] = { ...p, en: OBJ[p.en], punct: '' }
      i++
      continue
    }
    // possessive after its noun: mellon nín “friend my” → “my friend”
    if (/^(my|your|our|his\/her|their)$/.test(next?.en || '') && (p.pos === 'n' || p.status === 'P') && !p.punct) {
      parts[i] = { ...p, en: `${next.en} ${p.en.replace(/^the /, '')}`, punct: next.punct }
      if (/^the /.test(p.en) && i > 0) { /* the article already reads as “the”; keep it */ }
      parts.splice(i + 1, 1)
      if (i > 0 && parts[i - 1].en === 'the') parts.splice(i - 1, 1), i--
    }
  }
  // Sindarin describing word after its noun → English order: i varad morn “the tower dark” → “the dark tower”
  for (let i = 0; i < parts.length - 1; i++) {
    const a = parts[i], b = parts[i + 1]
    if (a.pos === 'n' && b.pos === 'adj' && !a.punct && /^[a-z-]+$/.test(b.en)) {
      const the = /^the /.test(a.en)
      parts[i] = { ...b, en: `${the ? 'the ' : ''}${b.en} ${a.en.replace(/^the /, '')}`, pos: 'n', punct: b.punct }
      parts.splice(i + 1, 1)
    }
  }
  // Quenya often puts the verb first: lantar lassi “they-fall leaves” → “leaves fall”
  for (let i = 0; i < parts.length - 1; i++) {
    const v = parts[i], n = parts[i + 1]
    if (v.pos === 'v' && /^they /.test(v.en) && n.pos === 'n' && !v.punct) {
      parts[i] = { ...n, punct: '' }
      parts[i + 1] = { ...v, en: v.en.replace(/^they /, ''), punct: n.punct }
      i++
    }
  }
  // a noun subject already names who: “the elves they sing” → “the elves sing”
  for (let i = 1; i < parts.length; i++) {
    if ((parts[i - 1].pos === 'n' || parts[i - 1].status === 'P') && /^(they|he\/she) /.test(parts[i].en) && parts[i].pos === 'v') {
      parts[i].en = parts[i].en.replace(/^(they|he\/she) /, '')
    }
  }
  return parts.map((p) => p.en + (p.punct || '')).join(' ')
}

// Tolkien lines sharing words with the input, so a visitor can compare with something real
function closestElvish(text) {
  const want = new Set(bare(text).split(' ').filter((w) => w.length > 2))
  if (!want.size) return []
  return LINES.map((p) => {
    const have = new Set(bare(p.elvish).split(' '))
    let n = 0
    for (const w of want) if (have.has(w)) n++
    return { p, n }
  }).filter((x) => x.n > 0).sort((a, b) => b.n - a.n || a.p.elvish.length - b.p.elvish.length).slice(0, 3).map((x) => x.p)
}
