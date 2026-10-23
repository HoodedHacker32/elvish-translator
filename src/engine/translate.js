// English → Sindarin / Quenya. Deterministic: lexicon lookup plus Tolkien's grammar rules, no guessing.
import { SINDARIN_PHRASES } from '../data/sindarin.js'
import { QUENYA_PHRASES } from '../data/quenya.js'
import { SINDARIN_ALL, QUENYA_ALL } from '../data/lexicon.js'
import { CANON, findCanon, normaliseEnglish } from '../data/canon.js'
import { SOURCES } from '../data/sources.js'
import { exactPhrase, closestPhrases } from './phrasebook.js'
import { assess } from './trust.js'
import { expletive, isSwear } from './expletives.js'
import {
  sindarinArticle, sindarinPlural, softMutation, nasalMutation,
  quenyaPlural, quenyaAdjPlural, quenyaPossessive, quenyaCase, quenyaVerb, sindarinVerb, QUENYA_POSS,
} from './morph.js'

// ——— lexicon index ———

// When several words share an English meaning, prefer Tolkien's mature words, then derived forms,
// then his earlier-stage words, then fan reconstructions. Ties keep list order (hand-curated first).
const RANK = { phrase: -1, A: 0, D: 1, E: 2, N: 3 }
const rankOf = (e) => (e.pos === 'phrase' ? RANK.phrase : RANK[e.st] ?? 4) + (e.ex?.note?.includes('archaic') ? 0.5 : 0)

function buildIndex(rows, phrases) {
  const words = new Map()
  const multi = new Map()
  const addMulti = (key, entry) => { const cur = multi.get(key); if (!cur || rankOf(entry) < rankOf(cur)) multi.set(key, entry) }
  for (const [keys, el, st, src] of phrases) {
    for (const k of keys.split('|')) {
      const key = normaliseEnglish(k)
      const entry = { key, el, pos: 'phrase', st, src }
      if (key.includes(' ')) addMulti(key, entry)
      else (words.get(key) || words.set(key, []).get(key)).push(entry)
    }
  }
  for (const [keys, el, pos, st, src, ex] of rows) {
    for (const k of keys.split('|')) {
      const key = normaliseEnglish(k)
      if (!key) continue
      const entry = { key, el, pos, st, src, ex }
      if (key.includes(' ')) addMulti(key, entry)
      else (words.get(key) || words.set(key, []).get(key)).push(entry)
    }
  }
  for (const list of words.values()) list.sort((a, b) => rankOf(a) - rankOf(b))
  return { words, multi }
}

const INDEX = { S: buildIndex(SINDARIN_ALL, SINDARIN_PHRASES), Q: buildIndex(QUENYA_ALL, QUENYA_PHRASES) }
export const LEXICON = { S: SINDARIN_ALL, Q: QUENYA_ALL }
export { CANON }

// ——— English side ———

const CONTRACTIONS = [
  [/\bi'm\b/g, 'i am'], [/\bcannot\b/g, 'can not'], [/\bwon't\b/g, 'will not'], [/\bcan't\b/g, 'can not'], [/\bshan't\b/g, 'shall not'],
  [/n't\b/g, ' not'], [/'ll\b/g, ' will'], [/'re\b/g, ' are'], [/'ve\b/g, ' have'], [/'d\b/g, ' would'],
  [/\b(it|he|she|that|there|what)'s\b/g, '$1 is'], [/'s\b/g, ''],
]

const IRREGULAR_NOUN = {
  men: 'man', women: 'woman', children: 'child', elves: 'elf', dwarves: 'dwarf', dwarfs: 'dwarf', wolves: 'wolf',
  leaves: 'leaf', halflings: 'halfling', people: 'people', teeth: 'tooth', feet: 'foot', lives: 'life', knives: 'knife',
  ents: 'ent', dunedain: 'dunadan', valar: 'vala', geese: 'goose', mice: 'mouse',
}
const IRREGULAR_VERB = {
  was: ['be', 'past'], were: ['be', 'past'], am: ['be', 'pres'], is: ['be', 'pres'], are: ['be', 'pres'], been: ['be', 'past'],
  came: ['come', 'past'], went: ['go', 'past'], gone: ['go', 'past'], saw: ['see', 'past'], seen: ['see', 'past'],
  gave: ['give', 'past'], given: ['give', 'past'], made: ['make', 'past'], spoke: ['speak', 'past'], spoken: ['speak', 'past'],
  said: ['say', 'past'], fell: ['fall', 'past'], fallen: ['fall', 'past'], flew: ['fly', 'past'], flown: ['fly', 'past'],
  ran: ['run', 'past'], sang: ['sing', 'past'], sung: ['sing', 'past'], ate: ['eat', 'past'], eaten: ['eat', 'past'],
  drank: ['drink', 'past'], drunk: ['drink', 'past'], knew: ['know', 'past'], known: ['know', 'past'], found: ['find', 'past'],
  slept: ['sleep', 'past'], fought: ['fight', 'past'], kept: ['keep', 'past'], held: ['hold', 'past'], heard: ['hear', 'past'],
  drew: ['draw', 'past'], drawn: ['draw', 'past'], wrote: ['write', 'past'], written: ['write', 'past'], fled: ['flee', 'past'],
  shone: ['shine', 'past'], stood: ['stand', 'past'], did: ['do', 'past'], had: ['have', 'past'], told: ['tell', 'past'],
  dwelt: ['dwell', 'past'], thought: ['think', 'past'], built: ['build', 'past'], slew: ['slay', 'past'], slain: ['slay', 'past'],
  hid: ['hide', 'past'], hidden: ['hide', 'past'], woke: ['wake', 'past'], awoke: ['awaken', 'past'], sat: ['sit', 'past'],
  lay: ['lie', 'past'], sought: ['seek', 'past'], cut: ['cut', 'pres'], struck: ['strike', 'past'], swore: ['swear', 'past'],
  grew: ['grow', 'past'], bore: ['bear', 'past'], wore: ['wear', 'past'], began: ['begin', 'past'], left: ['leave', 'past'],
  burnt: ['burn', 'past'], stole: ['steal', 'past'], stolen: ['steal', 'past'], robbed: ['rob', 'past'], forged: ['forge', 'past'], beheld: ['behold', 'past'], understood: ['understand', 'past'],
}
const SUBJECTS = { i: 'i', you: 'you', thou: 'you', he: 'he', she: 'he', it: 'he', we: 'we', they: 'they' }
const POSSESSIVES = { my: 'i', mine: 'i', your: 'you', thy: 'you', his: 'he', her: 'he', its: 'he', our: 'we', their: 'they' }
const DROP = {
  a: 'Elvish has no word for “a”', an: 'Elvish has no word for “a”', do: 'helper verb, not needed', does: 'helper verb, not needed',
  did: 'helper verb; past tense goes on the main verb', will: 'future goes on the verb', shall: 'future goes on the verb',
  would: 'not translated', have: 'not translated', has: 'not translated',
  can: 'Elvish does not mark “can” separately', could: 'Elvish does not mark “could” separately',
  should: 'no attested word for “should”', must: 'no attested word for “must”', might: 'no attested word for “might”',
  may: 'no attested word for “may” here', very: 'no attested word for “very”', really: 'no attested word for “really”',
  just: 'not translated', so: 'not translated',
}
const MODALS = ['will', 'shall', 'not', 'do', 'does', 'did', 'am', 'is', 'are', 'was', 'were', 'have', 'has', 'can', 'could', 'should', 'must', 'might', 'may', 'would']
// Capitalised words at the start of a sentence that are ordinary English, not names
const COMMON = new Set('where what why when who how which there here this that these those very so but if because then hello hi please yes no okay ok oh well just now today tomorrow yesterday always never maybe perhaps let lets every each some any nothing everything someone everyone thank thanks good bad'.split(' '))
// Sindarin puts an object pronoun before a non-command verb (le linnathon, le nallon)
const S_OBJECT_PRON = new Set(['nin', 'le', 'ammen', 'hain', 'hon', 'hen', 'den'])
const Q_CASE_PREP = { to: 'all', towards: 'all', toward: 'all', into: 'all', upon: 'all', onto: 'all', from: 'abl', in: 'loc', at: 'loc', on: 'loc', by: 'ins', of: 'gen', for: 'dat' }
const S_MUTATING_PREP = { na: 'soft', di: 'soft', an: 'nasal' }

function tokenize(text) {
  let t = text.toLowerCase().replace(/[’‘]/g, "'")
  for (const [re, rep] of CONTRACTIONS) t = t.replace(re, rep)
  t = t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-–—]/g, ' ')
  const out = []
  const raw = text.replace(/[’‘]/g, "'").split(/\s+/)
  const caps = new Set(raw.filter((w) => /^[A-Z][a-z]/.test(w)).map((w) => w.replace(/[^A-Za-z]/g, '').toLowerCase()))
  for (const m of t.matchAll(/[a-z']+|[.,!?;:]/g)) {
    const w = m[0].replace(/^'+|'+$/g, '')
    if (!w) continue
    if (/^[.,!?;:]$/.test(w)) out.push({ text: w, punct: true })
    else out.push({ text: w, cap: caps.has(w) })
  }
  return out
}

function lemmaCandidates(w) {
  const c = [[w, {}]]
  if (IRREGULAR_NOUN[w]) c.push([IRREGULAR_NOUN[w], { plural: true }])
  if (IRREGULAR_VERB[w]) c.push([IRREGULAR_VERB[w][0], { tense: IRREGULAR_VERB[w][1] }])
  if (w.endsWith('ies')) c.push([w.slice(0, -3) + 'y', { plural: true, s3: true }])
  if (w.endsWith('es')) c.push([w.slice(0, -2), { plural: true, s3: true }])
  if (w.endsWith('s') && !w.endsWith('ss')) c.push([w.slice(0, -1), { plural: true, s3: true }])
  if (w.endsWith('ied')) c.push([w.slice(0, -3) + 'y', { tense: 'past' }])
  if (w.endsWith('ed')) {
    c.push([w.slice(0, -2), { tense: 'past' }], [w.slice(0, -1), { tense: 'past' }])
    if (/(.)\1ed$/.test(w)) c.push([w.slice(0, -3), { tense: 'past' }])
  }
  if (w.endsWith('ing')) {
    c.push([w.slice(0, -3), { ing: true }], [w.slice(0, -3) + 'e', { ing: true }])
    if (/(.)\1ing$/.test(w)) c.push([w.slice(0, -4), { ing: true }])
  }
  if (w.endsWith('est')) c.push([w.slice(0, -3), { superlative: true }], [w.slice(0, -2), { superlative: true }])
  if (w.endsWith('ily')) c.push([w.slice(0, -3) + 'y', {}])
  if (w.endsWith('ly')) c.push([w.slice(0, -2), {}], [w.slice(0, -2) + 'e', {}])
  if (w.endsWith('er') && w.length > 4) c.push([w.slice(0, -2), {}], [w.slice(0, -1), {}])
  return c
}

function lookup(idx, w) {
  for (const [lemma, feats] of lemmaCandidates(w)) {
    const hits = idx.words.get(lemma)
    if (hits) return { lemma, feats, hits }
  }
  return null
}

const isVerbLike = (idx, w) => {
  if (['be', 'am', 'is', 'are', 'was', 'were'].includes(w)) return true
  const r = lookup(idx, w)
  return !!r && r.hits.some((h) => h.pos === 'v' || h.pos === 'v-cop')
}
const isNounLike = (idx, w) => {
  const r = lookup(idx, w)
  return !!r && r.hits.some((h) => h.pos === 'n')
}

// ——— composing ———

const statusOf = (base, changed, neo) => (base === 'N' || neo ? 'N' : base === 'G' ? 'G' : changed ? (base === 'A' ? 'D' : base) : base)
const srcLabel = (k) => SOURCES[k] || k

function makeItem(el, en, gloss, pos, st, src, steps = []) {
  return { el, en, gloss, pos, status: st, source: src, sourceLabel: srcLabel(src), steps: steps.filter(Boolean) }
}

function compose(text, lang = 'S') {
  const idx = INDEX[lang]
  const canon = findCanon(text)
  const here = canon.find((c) => c.lang === lang)
  if (here) return canonResult(here, lang)

  const toks = tokenize(text)
  const items = []
  const english = toks.map((t, i) => ({ ...t, i, item: null, dropped: null }))
  const notes = []

  // pass 1: whole multi-word matches (longest first)
  const units = []
  for (let i = 0; i < toks.length; ) {
    if (toks[i].punct) { units.push({ kind: 'punct', i }); i++; continue }
    let hit = null
    for (let n = Math.min(7, toks.length - i); n >= 2; n--) {
      const slice = toks.slice(i, i + n)
      if (slice.some((t) => t.punct)) continue
      const key = slice.map((t) => t.text).join(' ')
      const e = idx.multi.get(key)
      if (e) { hit = { e, n }; break }
    }
    if (hit) { units.push({ kind: 'phrase', i, n: hit.n, e: hit.e }); i += hit.n }
    else { units.push({ kind: 'word', i, w: toks[i].text }); i++ }
  }

  const nextWordUnit = (u) => { for (let k = u + 1; k < units.length; k++) if (units[k].kind !== 'punct') return k; return -1 }

  // pass 2: walk the units, building noun phrases and verbs
  let np = null // { article, poss, adjs:[], prep, gen, neg }
  let pendingSubject = null // { person, unitIdx, enIdx }
  let tenseHint = null
  let negate = null
  let lastNounPlural = false
  let prepItem = null
  let sentenceItems = 0
  let lastVerb = null // { index, imp }
  let predPlural = false // Quenya: an adjective after “are” agrees in number
  let pendingInf = false // “to” + verb after another verb: an infinitive
  let nameMode = false // after “my name is / called / named”, unknown words are names
  let afterCopula = false // after “is / are”, a word like “free” is a description, not a verb

  const flushNP = () => { if (np && np.leftover) np = null }

  const attachEnglish = (item, enIdxs) => {
    item.en = enIdxs
    items.push(item)
    sentenceItems++
    for (const k of enIdxs) english[k].item = items.length - 1
    return item
  }
  const insertAt = (pos, item, enIdxs) => {
    item.en = enIdxs
    items.splice(pos, 0, item)
    sentenceItems++
    for (const e of english) if (e.item != null && e.item >= pos) e.item++
    for (const k of enIdxs) english[k].item = pos
    if (lastVerb && lastVerb.index >= pos) lastVerb.index++
    return item
  }

  for (let u = 0; u < units.length; u++) {
    const unit = units[u]
    if (unit.kind === 'punct') {
      if (items.length) items[items.length - 1].punct = (items[items.length - 1].punct || '') + toks[unit.i].text
      if (pendingSubject) flushSubject()
      flushNegation()
      np = null; pendingSubject = null; tenseHint = null; negate = null; sentenceItems = 0; lastVerb = null; predPlural = false; pendingInf = false; nameMode = false; afterCopula = false
      continue
    }
    if (unit.kind === 'phrase') {
      const e = unit.e
      const enIdxs = Array.from({ length: unit.n }, (_, k) => unit.i + k)
      attachEnglish(makeItem(e.el, null, toks.slice(unit.i, unit.i + unit.n).map((t) => t.text).join(' '), e.pos === 'phrase' ? 'set phrase' : posName(e.pos), e.st, e.src, ['whole phrase matched']), enIdxs)
      np = null
      continue
    }

    const w = unit.w
    const enI = unit.i
    const prevW1 = u > 0 && units[u - 1].kind === 'word' ? units[u - 1].w : null
    if ((w === 'is' && prevW1 === 'name') || w === 'named' || w === 'called' || (w === 'me' && prevW1 === 'call')) nameMode = true
    const nextU = nextWordUnit(u)
    const nextW = nextU >= 0 && units[nextU].kind === 'word' ? units[nextU].w : null

    // articles, possessives, helpers
    if (w === 'the') { np = { ...(np || {}), article: enI, adjs: np?.adjs || [] }; continue }
    const herIsObject = w === 'her' && (!nextW || (!isNounLike(idx, nextW) && !lookup(idx, nextW)?.hits.some((h) => h.pos === 'adj')))
    // “mine / yours / ours” standing alone (“the ring is mine”)
    const STANDALONE = { mine: 'i', yours: 'you', ours: 'we' }
    if (STANDALONE[w] || (POSSESSIVES[w] && !herIsObject && !nextW && w !== 'her')) {
      const person = STANDALONE[w] || POSSESSIVES[w]
      const forms = lang === 'S'
        ? { i: ['nín', 'D', 'VT'], you: ['lín', 'A', 'VT'], we: ['vín', 'A', 'VT'] }
        : { i: ['ninya', 'N', 'Neo'], you: ['lenya', 'N', 'Neo'], we: ['menya', 'A', 'VT'] }
      const f = forms[person]
      if (f) {
        if (pendingSubject) flushSubject()
        attachEnglish(makeItem(f[0], null, w, 'possessive', f[1], f[2], ['standing alone, “mine/yours/ours”']), [enI])
        np = null
        continue
      }
    }
    if (POSSESSIVES[w] && !herIsObject) {
      np = { ...(np || {}), poss: { person: POSSESSIVES[w], enI }, adjs: np?.adjs || [] }
      continue
    }
    if (w === 'not' || w === 'no' && nextW && isVerbLike(idx, nextW)) { negate = enI; continue }
    if ((w === 'will' || w === 'shall') && nextW) { tenseHint = 'fut'; english[enI].dropped = DROP[w]; continue }
    if (DROP[w] && !(w === 'have' && nextW === 'come')) {
      if (w === 'did') tenseHint = 'past'
      english[enI].dropped = DROP[w]
      continue
    }
    const afterVerb = lastVerb && lastVerb.index === items.length - 1
    if (w === 'to' && nextW && isVerbLike(idx, nextW) && (afterVerb || !isNounLike(idx, nextW))) {
      english[enI].dropped = '“to” is shown by the verb’s ending'
      if (afterVerb) pendingInf = true
      continue
    }
    if (w === 'there' && ['is', 'are', 'was', 'were'].includes(nextW)) { english[enI].dropped = '“there is” is not translated'; continue }

    // be / is / are
    if (['be', 'am', 'is', 'are', 'was', 'were'].includes(w)) {
      const nextR = nextW ? lookup(idx, nextW) : null
      if (nextR?.feats.ing) { tenseHint = 'cont'; english[enI].dropped = 'folded into the “-ing” verb'; continue }
      afterCopula = true
      if (lang === 'S') {
        english[enI].dropped = 'Sindarin leaves out “is/are”'
        if (pendingSubject) flushSubject()
        continue
      }
      const plural = pendingSubject ? ['we', 'they'].includes(pendingSubject.person) : (lastNounPlural || ((w === 'are' || w === 'were') && sentenceItems === 0))
      if (pendingSubject) flushSubject()
      attachEnglish(makeItem(plural ? 'nar' : 'ná', null, w, 'verb “to be”', w === 'was' || w === 'were' ? 'D' : 'A', 'VT', [w === 'was' || w === 'were' ? 'past “to be” not attested; present used' : plural ? 'plural “are”' : '“is”']), [enI])
      predPlural = plural
      continue
    }

    // subject pronouns
    if (SUBJECTS[w] && w !== 'it' || (w === 'it' && nextW && isVerbLike(idx, nextW))) {
      const person = SUBJECTS[w]
      if (nextW && (isVerbLike(idx, nextW) || MODALS.includes(nextW) || nextW === 'like')) {
        pendingSubject = { person, enI }
        continue
      }
    }

    if (lang === 'Q' && Q_CASE_PREP[w] && nextW) {
      np = { ...(np || {}), adjs: np?.adjs || [], kase: Q_CASE_PREP[w], caseEn: enI }
      continue
    }
    if (lang === 'S' && w === 'of') { english[enI].dropped = 'Sindarin shows “of” by word order'; continue }

    // “fucking / bloody / damn” as an intensifier: Quenya has Tolkien’s húna “accursed”; Sindarin has no such word
    if (lang === 'S' && /^(fucking|fuckin|bloody|damned|damn|goddamn|goddamned|freaking|frigging)$/.test(w) && nextW) {
      english[enI].dropped = 'Elvish has no swear words, so this is left out'
      continue
    }
    // “would like (to)” / “I like to …” means “want”
    const prevWord = u > 0 && units[u - 1].kind === 'word' ? units[u - 1].w : null
    const likeAsWant = w === 'like' && (prevWord === 'would' || nextW === 'to' || (!!pendingSubject && !nextW))
    const r = lookup(idx, likeAsWant ? 'want' : w)
    if (!r) {
      if (negate != null) {
        const neg = lang === 'S' ? ['ú', 'A', 'App'] : ['lá', 'D', 'VT']
        attachEnglish(makeItem(neg[0], null, 'not', 'negative', neg[1], neg[2], ['negative particle']), [negate])
        negate = null
      }
      if (isSwear(w)) { english[enI].dropped = 'Elvish has no swear words, so this is left out'; continue }
      const name = (toks[enI].cap || nameMode) && !COMMON.has(w)
      if (pendingSubject) flushSubject()
      attachEnglish(makeItem(name ? capitalise(w) : `[${w}]`, null, w, name ? 'name' : '—', name ? 'P' : 'G', '', [name ? 'kept as a name' : 'no Tolkien or reconstructed word found']), [enI])
      np = null
      continue
    }

    // pick the best entry for this context
    const prevW = u > 0 && units[u - 1].kind === 'word' ? units[u - 1].w : null
    // straight after a subject noun, with no verb yet, a word like “plays” is the verb
    const afterSubject = !lastVerb && !np && sentenceItems > 0 && /^(noun|pronoun|name)/.test(items.at(-1)?.pos || '')
    const wantVerb = !!pendingSubject || !!tenseHint || r.feats.ing || r.feats.tense ||
      (afterSubject && r.hits.some((h) => h.pos === 'v')) ||
      (prevW && ['to', 'not', 'will', 'shall', 'and'].includes(prevW) && r.hits.some((h) => h.pos === 'v')) ||
      (sentenceItems === 0 && !np)
    const wantNoun = !!np && (np.article != null || np.poss || np.prep)
    let entry = null
    if (afterCopula && !r.feats.ing) entry = r.hits.find((h) => h.pos === 'adj') || r.hits.find((h) => h.pos === 'n')
    if (entry || !['not', 'never'].includes(w)) afterCopula = false
    if (wantNoun) entry = r.hits.find((h) => h.pos === 'n') || r.hits.find((h) => h.pos === 'adj')
    if (!entry && wantVerb) entry = r.hits.find((h) => h.pos === 'v')
    if (!entry && nextW && isNounLike(idx, nextW) && !wantVerb) entry = r.hits.find((h) => h.pos === 'adj')
    if (!entry) entry = r.hits.find((h) => h.pos !== 'v') || r.hits[0]

    // prepositions
    if (entry.pos === 'prep') {
      prepItem = attachEnglish(makeItem(entry.el, null, w, 'preposition', entry.st, entry.src), [enI])
      np = { adjs: [], prepMut: S_MUTATING_PREP[entry.el] }
      continue
    }

    if (entry.pos === 'adj' && nextW && (isNounLike(idx, nextW) || lookup(idx, nextW)?.hits.some((h) => h.pos === 'adj'))) {
      np = { ...(np || {}), adjs: [...(np?.adjs || []), { entry, enI, feats: r.feats }] }
      continue
    }

    if (entry.pos === 'v') {
      const person = pendingSubject?.person
      let tense = pendingInf ? 'inf' : tenseHint || (r.feats.ing ? 'cont' : r.feats.tense === 'past' ? 'past' : 'pres')
      if (!pendingSubject && !tenseHint && !r.feats.tense && !r.feats.ing && sentenceItems === 0) tense = 'imp'
      const plural = !person && lastNounPlural
      const v = (lang === 'Q' ? quenyaVerb : sindarinVerb)(entry, { tense, person, plural })
      const enIdxs = [enI]
      let absorbed = false
      if (pendingSubject && (lang === 'Q' || person === 'i' || person === 'we')) { enIdxs.unshift(pendingSubject.enI); absorbed = true }
      else if (pendingSubject) {
        const pr = idx.words.get(pendingSubject.person === 'he' ? 'he' : pendingSubject.person)?.find((h) => h.pos === 'pron')
        if (pr) attachEnglish(makeItem(pr.el, null, toks[pendingSubject.enI].text, 'pronoun', pr.st, pr.src), [pendingSubject.enI])
      }
      let form = v.form
      const steps = [...v.steps, entry.ex?.note]
      if (negate != null && tense === 'imp') {
        if (lang === 'S') {
          const m = softMutation(form)
          attachEnglish(makeItem('avo', null, 'do not', 'negative command', 'A', 'WJ', ['“don’t!” particle']), [negate])
          form = m.form; steps.push(m.step && `after avo, ${m.step}`)
        } else {
          attachEnglish(makeItem('áva', null, 'do not', 'negative command', 'A', 'WJ', ['“don’t!” particle']), [negate])
          form = form.replace(/^á /, '')
        }
      } else if (negate != null) {
        if (lang === 'S') {
          const m = /^h/i.test(form) ? { form: 'ch' + form.slice(1), step: 'h→ch after ú' } : softMutation(form)
          form = 'ú-' + m.form
          steps.push('negated with ú-', m.step)
        } else {
          attachEnglish(makeItem('lá', null, 'not', 'negative', 'D', 'VT', ['negative particle before the verb']), [negate])
        }
        enIdxs.push(negate)
      }
      if (absorbed) steps.push('subject folded into the verb')
      attachEnglish(makeItem(form, null, glossVerb(toks, enIdxs), 'verb · ' + tenseName(tense), statusOf(entry.st, form !== entry.el && !v.attested, v.neo), entry.src, steps), enIdxs)
      lastVerb = { index: items.length - 1, imp: tense === 'imp', giving: /^(give|tell|show|bring|send|grant|offer)$/.test(likeAsWant ? 'want' : r.lemma) }
      pendingInf = false
      pendingSubject = null; tenseHint = null; negate = null; np = null
      continue
    }

    if (entry.pos === 'n' || entry.pos === 'adj' && np) {
      if (pendingSubject) flushSubject()
      flushNegation()
      emitNounPhrase(entry, r, enI)
      continue
    }

    if (pendingSubject && entry.pos !== 'v') flushSubject()

    // everything else: pronouns, numbers, small words, lone adjectives
    let el = entry.el
    const steps = [entry.ex?.note]
    if (lang === 'Q' && np?.kase && (entry.pos === 'pron' || entry.pos === 'dem')) {
      const c = quenyaCase(el, np.kase, false)
      el = c.form; steps.push(c.step)
    }
    if (lang === 'S' && np?.prepMut && !prepItem?.used) {
      const m = np.prepMut === 'soft' ? softMutation(el) : nasalMutation(el)
      el = m.form; steps.push(m.step && `after ${prepItem.el}, ${m.step}`)
    }
    if (entry.pos === 'poss' && lang === 'Q') { el = entry.el; steps.push('Quenya uses this as an ending on the noun') }
    // Quenya “give me / give us”: the to-form of the pronoun, as in Tolkien’s “ámen anta” (give to us) and Namárië’s “nin”
    if (lang === 'Q' && entry.pos === 'pron' && lastVerb?.giving && lastVerb.index === items.length - 1 && !np?.kase) {
      const dat = { me: 'nin', us: 'ámen' }[w]
      if (dat) { el = dat; steps.push('“to me / to us” form, as Tolkien wrote it') }
    }
    if (lang === 'Q' && entry.pos === 'adj' && predPlural) {
      const ap = quenyaAdjPlural(el)
      if (ap.step) { el = ap.form; steps.push(ap.step) }
    }
    // Sindarin “to you/me/us” with a verb: the pronoun alone goes before the verb (le linnathon “to thee I will sing”)
    if (lang === 'S' && entry.pos === 'pron' && S_OBJECT_PRON.has(entry.el) && prepItem?.el === 'na' && !prepItem.used &&
        lastVerb && !lastVerb.imp && lastVerb.index === items.length - 2 && items[items.length - 1] === prepItem) {
      const toEn = prepItem.en[0]
      items.pop(); sentenceItems--
      english[toEn].item = null
      english[toEn].dropped = 'shown by putting the pronoun before the verb'
      const it = makeItem(entry.el, null, `${toks[toEn].text} ${w}`, 'pronoun', entry.st, entry.src, ['“to …” pronoun goes before the verb, as in Tolkien’s “le linnathon”'])
      insertAt(lastVerb.index, it, [toEn, enI])
      prepItem = null; np = null
      continue
    }
    if (entry.pos !== 'pron') flushNegation()
    const enIdxs = [enI]
    if (np?.caseEn != null) enIdxs.unshift(np.caseEn)
    const item = makeItem(el, null, enIdxs.map((k) => toks[k].text).join(' '), posName(entry.pos), statusOf(entry.st, el !== entry.el), entry.src, steps)
    const objectBeforeVerb = lang === 'S' && entry.pos === 'pron' && S_OBJECT_PRON.has(el) && !np?.prepMut &&
      lastVerb && !lastVerb.imp && lastVerb.index === items.length - 1
    if (objectBeforeVerb) {
      item.steps.push('object pronoun goes before the verb, as in Tolkien’s “le linnathon”')
      insertAt(lastVerb.index, item, enIdxs)
    } else attachEnglish(item, enIdxs)
    np = null
  }

  if (pendingSubject) flushSubject()
  flushNegation()
  flushNP()
  if (!items.length && toks.length) notes.push('Nothing to translate yet.')

  if (items[0]) items[0].el = capitaliseLine(items[0].el)
  const line = items.map((it) => it.el + (it.punct || '')).join(' ')
  const others = canon.filter((c) => c.lang !== lang)
  return {
    lang, mode: 'composed', line: capitaliseLine(line), items, english, notes,
    canonElsewhere: others.map((c) => ({ id: c.id, lang: c.lang, elvish: c.elvish, where: c.where })),
    summary: summarise(items),
  }

  function flushNegation() {
    if (negate == null) return
    const [el, st, src] = lang === 'S' ? ['ú', 'A', 'App'] : ['lá', 'D', 'VT']
    attachEnglish(makeItem(el, null, 'not', 'negative', st, src, ['“not” before a description: Tolkien left no clear example of this pattern']), [negate])
    negate = null
  }

  function flushSubject() {
    const p = pendingSubject
    pendingSubject = null
    const word = toks[p.enI].text
    const pr = idx.words.get(word === 'she' || word === 'it' ? 'he' : word)?.find((h) => h.pos === 'pron')
    if (pr) attachEnglish(makeItem(pr.el, null, word, 'pronoun', pr.st, pr.src), [p.enI])
  }

  function emitNounPhrase(entry, r, enI) {
    const cur = np || { adjs: [] }
    const plural = !!r.feats.plural && r.lemma !== toks[enI].text
    const steps = [entry.ex?.note]
    let form = entry.el
    let attestedForm = true
    if (plural) {
      if (entry.ex?.pl) { form = entry.ex.pl; steps.push('plural, as Tolkien wrote it') }
      else {
        const p = lang === 'S' ? sindarinPlural(form) : quenyaPlural(form)
        form = p.form; steps.push(p.step); attestedForm = false
      }
    }
    const enIdxs = [enI]
    const out = []
    // adjectives (after the noun in both languages, agreeing in Quenya)
    const adjItems = cur.adjs.map((a) => {
      let af = a.entry.el
      const as = []
      if (lang === 'Q' && plural) { const ap = quenyaAdjPlural(af); af = ap.form; if (ap.step) as.push(ap.step) }
      as.push('placed after the noun')
      return { a, af, as }
    })
    if (lang === 'Q') {
      if (cur.poss) {
        const q = quenyaPossessive(form, QUENYA_POSS[cur.poss.person].sfx)
        form = q.form; steps.push(q.step); attestedForm = false; enIdxs.unshift(cur.poss.enI)
        if (plural) { form = form + 'r'; steps.push('plural -r after the ending') }
      }
      if (cur.kase) {
        const k = quenyaCase(form, cur.kase, plural && !cur.poss)
        form = k.form; steps.push(k.step); attestedForm = false; enIdxs.unshift(cur.caseEn)
      }
      if (cur.article != null && cur.kase !== 'gen') {
        out.push({ item: makeItem('i', null, 'the', 'article', 'A', 'LotR'), en: [cur.article] })
      } else if (cur.article != null) english[cur.article].dropped = 'folded into the “of” ending'
    } else {
      if (cur.article != null) {
        const a = sindarinArticle(form, plural)
        form = a.form; if (a.step) { steps.push(a.step); attestedForm = false }
        out.push({ item: makeItem(a.article, null, 'the', 'article', 'A', 'LotR', [plural ? 'plural article' : null]), en: [cur.article] })
      } else if (cur.prepMut && prepItem && !prepItem.used) {
        const m = cur.prepMut === 'soft' ? softMutation(form) : nasalMutation(form)
        if (m.step) { form = m.form; steps.push(`after ${prepItem.el}, ${m.step}`); attestedForm = false }
      }
      if (prepItem) prepItem.used = true
    }
    out.push({
      item: makeItem(form, null, '', posName('n') + (plural ? ', plural' : ''), statusOf(entry.st, !attestedForm && form !== entry.el), entry.src, steps),
      en: enIdxs,
    })
    for (const { a, af, as } of adjItems) {
      out.push({ item: makeItem(af, null, toks[a.enI].text, 'adjective', statusOf(a.entry.st, af !== a.entry.el), a.entry.src, as), en: [a.enI] })
    }
    if (lang === 'S' && cur.poss) {
      const p = idx.words.get({ i: 'my', you: 'your', we: 'our' }[cur.poss.person] || '')?.[0]
      if (p) out.push({ item: makeItem(p.el, null, toks[cur.poss.enI].text, 'possessive', p.st, p.src, ['follows the noun']), en: [cur.poss.enI] })
      else out.push({ item: makeItem(`[${toks[cur.poss.enI].text}]`, null, toks[cur.poss.enI].text, '—', 'G', '', ['no attested Sindarin form']), en: [cur.poss.enI] })
    }
    for (const o of out) {
      if (!o.item.gloss) o.item.gloss = o.en.map((k) => toks[k].text).join(' ')
      attachEnglish(o.item, o.en)
    }
    lastNounPlural = plural
    np = null
    prepItem = null
  }
}

function canonResult(c, lang) {
  const items = c.words.map(([el, gloss, pos], i) => ({
    el, gloss, pos, status: 'C', source: c.where, sourceLabel: c.where, steps: [], en: [], canonIndex: i,
  }))
  return {
    lang, mode: 'canon', line: c.elvish, items, english: [], notes: [],
    canon: { id: c.id, meaning: c.meaning, who: c.who, where: c.where },
    canonElsewhere: [], summary: summarise(items),
  }
}

function summarise(items) {
  const s = { A: 0, D: 0, N: 0, G: 0, C: 0, P: 0 }
  for (const it of items) s[it.status] = (s[it.status] || 0) + 1
  return s
}

const capitalise = (w) => w[0].toUpperCase() + w.slice(1)
const capitaliseLine = (l) => l.replace(/^([’']?)(\p{L})/u, (_, a, b) => a + b.toUpperCase())

function posName(p) {
  return { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', prep: 'preposition', conj: 'conjunction', pron: 'pronoun', poss: 'possessive', dem: 'demonstrative', num: 'number', interj: 'interjection', 'v-cop': 'verb “to be”' }[p] || p
}
function tenseName(t) {
  return { pres: 'present', cont: 'continuous', past: 'past', fut: 'future', imp: 'command', inf: 'infinitive' }[t]
}
function glossVerb(toks, idxs) {
  return [...idxs].sort((a, b) => a - b).map((k) => toks[k].text).join(' ')
}

// ——— the public entry point: Tolkien's own lines first, then a composed sentence with its trust rating ———

const REVERSE = {}
for (const [code, rows] of Object.entries({ S: SINDARIN_ALL, Q: QUENYA_ALL })) {
  const m = new Map()
  for (const [keys, el, pos, st] of rows) {
    const k = el.toLowerCase()
    if (!m.has(k) || (st === 'A' && m.get(k).st !== 'A')) m.set(k, { gloss: keys.split('|')[0], pos, st })
  }
  REVERSE[code] = m
}

function tolkienResult(p, lang) {
  const words = p.elvish.replace(/[!?.,:;]/g, ' ').split(/\s+/).filter(Boolean)
  const items = words.map((w) => {
    const hit = REVERSE[lang].get(w.toLowerCase().replace(/^[’']|[’']$/g, '').replace(/^\w+·/, ''))
    return {
      el: w, gloss: hit?.gloss || '', pos: hit ? posName(hit.pos) : '', status: 'C',
      source: p.where, sourceLabel: p.where, steps: [], en: [],
    }
  })
  if (items[0]) items[0].el = capitaliseLine(items[0].el)
  return {
    lang, mode: 'tolkien', line: p.elvish.charAt(0).toUpperCase() + p.elvish.slice(1), items, english: [], notes: [],
    canon: { id: 'tolkien:' + p.elvish, meaning: p.english, who: 'Tolkien', where: p.where, uncertain: p.uncertain },
    canonElsewhere: [], summary: summarise(items),
  }
}

function expletiveResult(x, lang) {
  const items = [{
    el: x.choice.el, gloss: x.choice.gloss, pos: 'exclamation', status: x.choice.status,
    source: x.choice.where, sourceLabel: x.choice.where, steps: [x.choice.note], en: [],
  }]
  return {
    lang, mode: 'expletive', line: x.choice.el, items, english: [], notes: [], canonElsewhere: [],
    expletive: { feeling: x.feeling, alternatives: x.alternatives }, summary: summarise(items),
  }
}

// Split a message into sentences (and long comma-joined clauses) so one weak part does not sink the rest.
function splitSentences(text) {
  const parts = text.split(/(?<=[.!?;])\s+/).flatMap((s) => {
    const bits = s.split(/,\s+/)
    if (bits.length < 2) return [s]
    const out = [bits[0]]
    for (const b of bits.slice(1)) {
      const prev = out[out.length - 1]
      if (prev.split(/\s+/).length >= 3 && b.split(/\s+/).length >= 3) out.push(b)
      else out[out.length - 1] = prev + ', ' + b
    }
    return out
  })
  return parts.map((p) => p.trim()).filter((p) => /[a-z]/i.test(p))
}

const LEVELS = ['exact', 'idiom', 'safe', 'caution', 'unsafe']

export function translate(text, lang = 'S', { suggestions = true, whole = false } = {}) {
  // a whole line Tolkien wrote wins before any splitting
  const parts = whole ? [text] : splitSentences(text)
  if (parts.length > 1 && !exactPhrase(text, lang) && !findCanon(text).length && !expletive(text, lang)) {
    const segments = parts.map((p) => ({ english: p, result: translate(p, lang, { suggestions, whole: true }) }))
    const worst = segments.reduce((w, s) => Math.max(w, LEVELS.indexOf(s.result.trust.level)), 0)
    const shown = segments.filter((s) => s.result.trust.level !== 'unsafe')
    const items = shown.flatMap((s) => s.result.items)
    return {
      lang, mode: 'multi', segments, items, english: [], notes: [], canonElsewhere: [], closest: [],
      line: shown.map((s) => s.result.line).join(' '),
      summary: summarise(items),
      trust: { level: LEVELS[worst], reasons: [], suggestions: [] },
    }
  }
  const swear = expletive(text, lang)
  if (swear) {
    const r = expletiveResult(swear, lang)
    r.trust = assess(text, r)
    r.closest = []
    return r
  }
  const exact = exactPhrase(text, lang)
  let result
  if (exact && exact.lang === lang && !findCanon(text).some((c) => c.lang === lang)) result = tolkienResult(exact, lang)
  else result = compose(text, lang)

  result.trust = assess(text, result)
  result.closest = result.mode === 'composed' ? closestPhrases(text, lang) : []
  if (exact && exact.lang !== lang && result.mode === 'composed' && !result.canonElsewhere.length) {
    result.canonElsewhere = [{ id: 'tolkien:' + exact.elvish, lang: exact.lang, elvish: exact.elvish, where: exact.where }]
  }
  if (suggestions && result.trust.suggestions?.length) {
    // only offer a rephrasing that is genuinely more trustworthy than what was typed
    const better = { exact: 0, safe: 1, caution: 2, unsafe: 3 }
    result.trust.suggestions = result.trust.suggestions
      .map((s) => {
        const r = translate(s.english, lang, { suggestions: false })
        return { ...s, line: r.line, level: r.trust.level }
      })
      .filter((s) => better[s.level] < better[result.trust.level])
  }
  return result
}
