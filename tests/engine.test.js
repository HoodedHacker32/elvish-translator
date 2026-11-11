import { test } from 'node:test'
import assert from 'node:assert/strict'
import { translate } from '../src/engine/translate.js'
import { respell } from '../src/engine/pronounce.js'
import { toTengwar, toTengwarNumber, toAnnatar, fromAnnatar, CSUR } from '../src/engine/tengwar.js'
import { CANON } from '../src/data/canon.js'
import { SINDARIN } from '../src/data/sindarin.js'
import { QUENYA } from '../src/data/quenya.js'
import { SOURCES, STATUS } from '../src/data/sources.js'

const line = (en, lang) => translate(en, lang).line

test('canon lines come back verbatim', () => {
  assert.equal(line('Speak, friend, and enter', 'S'), 'Pedo mellon a minno')
  assert.equal(line('A star shines on the hour of our meeting', 'Q'), 'Elen síla lúmenn’ omentielvo')
  assert.equal(line('well met', 'S'), 'Mae govannen')
  assert.equal(translate('Long live the Halflings!', 'S').mode, 'canon')
})

test('canon in the other language is offered, not forced', () => {
  const r = translate('Speak, friend, and enter', 'Q')
  assert.equal(r.mode, 'composed')
  assert.equal(r.canonElsewhere[0].lang, 'S')
})

test('Sindarin articles mutate the noun', () => {
  assert.equal(line('the trees', 'S'), 'I ngelaidh') // in + g → i ng-
  assert.equal(line('the tower', 'S'), 'I varad') // soft mutation b → v
  assert.equal(line('the elves', 'S'), 'In edhil')
})

test('Tolkien-attested plurals are used before rules', () => {
  assert.equal(line('mountains', 'S'), 'Eryd')
  assert.equal(line('stars', 'Q'), 'Eleni')
})

test('Quenya endings: genitive, possessive, future with subject', () => {
  assert.equal(line('the light of the stars', 'Q'), 'I cala elenion')
  assert.equal(line('my friend', 'Q'), 'Meldonya')
  assert.equal(line('I will abide', 'Q'), 'Maruvan')
  assert.equal(line('you will find', 'Q'), 'Hiruvalyë')
})

test('Sindarin verbs use attested forms where Tolkien gives them', () => {
  assert.equal(line('I will sing', 'S'), 'Linnathon')
  assert.equal(line('enter', 'S'), 'Minno')
  assert.equal(line('do not flee', 'S'), 'Avo dhrego')
})

test('full sentences keep their subject and object', () => {
  assert.equal(line('You are my friend', 'S'), 'Le mellon nín')
  assert.equal(line('I am an elf', 'S'), 'Im edhel')
  assert.equal(line('They are my friends', 'S'), 'Hain mellyn nín')
  assert.equal(line('You are my friend', 'Q'), 'Elyë ná meldonya')
  assert.equal(line('He loves her', 'Q'), 'Melis se')
})

test('Sindarin pronouns go before the verb, as Tolkien wrote them', () => {
  assert.equal(line('I will sing to you', 'S'), 'Le linnathon')
  assert.equal(line('I cry to you', 'S'), 'Le nallon')
  assert.equal(line('I can see you', 'S'), 'Le cenin')
  assert.equal(line('Give me the ring', 'S'), 'Anno nin i gor') // commands keep the object after; cor is Tolkien's word for ring
})

test('Quenya adjectives after “are” agree in number', () => {
  assert.equal(line('We are free', 'Q'), 'Elmë nar lérinë')
  assert.equal(line('The elves are wise', 'Q'), 'I Eldar nar sailë')
})

test('modal verbs and sentence-start words do not break the sentence', () => {
  assert.equal(line('I cannot find my friends', 'Q'), 'Lá polin hirë meldonyar') // Tolkien's pol- "can": polin quetë
  assert.equal(translate('Where is the king?', 'S').items[0].status, 'G')
})

test('stretched meanings and reconstructions are labelled', () => {
  const car = translate('I see the car', 'Q').items.at(-1)
  assert.equal(car.el, 'lunca')
  assert.ok(car.steps.some((s) => s.includes('wain')))
  const steal = translate('They will steal the wagon', 'Q').items[0]
  assert.equal(steal.el, 'Piluvantë')
  assert.equal(steal.status, 'N')
  assert.equal(line('The thief stole my vehicle', 'Q'), 'I arpo pillë luncanya')
})

test('unknown words are flagged, never invented', () => {
  const r = translate('the computer', 'S')
  const gap = r.items.find((i) => i.status === 'G')
  assert.ok(gap)
  assert.equal(gap.el, '[computer]')
})

test('names pass through as names', () => {
  const r = translate('Frodo is my friend', 'S')
  assert.equal(r.items[0].el, 'Frodo')
  assert.equal(r.items[0].status, 'P')
})

test('every lexicon row has a known status and source', () => {
  for (const [keys, el, , st, src] of [...SINDARIN, ...QUENYA]) {
    assert.ok(STATUS[st], `${keys} → ${el} has status ${st}`)
    assert.ok(SOURCES[src], `${keys} → ${el} has source ${src}`)
  }
})

test('canon entries are short and fully described', () => {
  for (const c of CANON) {
    assert.ok(c.elvish.split(/\s+/).length <= 10, c.id)
    assert.ok(c.keys.length && c.meaning && c.where && c.words.length, c.id)
  }
})

test('pronunciation respells with stress in capitals', () => {
  assert.equal(respell('Namárië', 'Q'), 'nah-MAH-ree-eh')
  assert.equal(respell('mellon', 'S'), 'MEL-lon')
  assert.equal(respell('Galadriel', 'S'), 'gah-LAHD-ree-el')
  assert.equal(respell('aiya', 'Q'), 'EYE-yah')
})

test('tengwar output uses the Tengwar code block', () => {
  const t = toTengwar('Elen síla', 'Q')
  assert.ok(t.length > 0)
  for (const ch of t.replace(/\s/g, '')) assert.ok(ch.charCodeAt(0) >= 0xe000 && ch.charCodeAt(0) <= 0xe07f)
})

test('the Eldamo lexicon is merged and every word is labelled', async () => {
  const { SINDARIN_ALL, QUENYA_ALL } = await import('../src/data/lexicon.js')
  assert.ok(SINDARIN_ALL.length > 2000)
  assert.ok(QUENYA_ALL.length > 4000)
  for (const row of [...SINDARIN_ALL, ...QUENYA_ALL]) assert.ok(STATUS[row[3]], `${row[1]} has status ${row[3]}`)
  // corf was a fan coinage; Tolkien's own word for ring is cor
  assert.equal(SINDARIN_ALL.find((r) => r[1] === 'corf')[3], 'N')
})

test('Tolkien’s mature words win over earlier drafts and fan words', () => {
  const r = translate('The wolf hunts in the snow', 'Q')
  assert.ok(r.items.every((i) => i.status !== 'G'))
  const dragon = translate('the dragon', 'S').items.at(-1)
  assert.equal(dragon.status === 'A' || dragon.status === 'D', true)
})

test('“want / would like to” + verb follows Tolkien’s patterns', () => {
  // Sindarin: aníra + verb-noun in -d, as in the King's Letter's “aníra suilannad”
  assert.equal(line('I would like to steal your vehicle', 'S'), 'Aníron piled rasg lín')
  assert.equal(line('I want to sing', 'S'), 'Aníron linnad')
  // Quenya: mer- + plain infinitive, as in “polin quetë”
  assert.equal(line('I would like to steal your vehicle', 'Q'), 'Merin pilë luncalya')
  // “like” as a comparison stays “like”
  assert.equal(line('The stars are like jewels', 'S'), 'I ngîl sui mîr')
})

test('every result carries a trust rating', () => {
  const lvl = (en, l) => translate(en, l).trust.level
  assert.equal(lvl('Speak, friend, and enter', 'S'), 'exact')
  assert.equal(lvl('give us this day our daily bread', 'S'), 'exact')
  assert.equal(line('we have no bread', 'S'), 'Penim vast') // Tolkien's own sentence, not composed
  assert.equal(lvl('Give me bread', 'S'), 'safe')
  assert.equal(lvl('I would like to steal your vehicle', 'S'), 'caution')
  for (const en of ['Can I have a sandwich?', 'Where is the king?', 'If you come, I will sing', 'The king who sleeps', 'I can see you']) {
    assert.equal(lvl(en, 'S'), 'unsafe', en)
  }
})

test('unsafe requests offer a safe rephrasing in Tolkien’s own pattern', () => {
  const s = translate('Can I have a sandwich?', 'S').trust.suggestions
  assert.equal(s[0].english, 'Give me bread')
  assert.equal(s[0].line, 'Anno nin bas') // cf. Tolkien’s “anno ammen … i mbas”
  assert.ok(s.every((x) => x.level !== 'unsafe'))
  assert.equal(translate('Give me bread', 'Q').line, 'Á anta nin massa')
})

test('closest Tolkien lines are offered for composed sentences', () => {
  const c = translate('the bread is good', 'S').closest
  assert.ok(c.some((p) => /bread/.test(p.english)))
})

test('swearing is answered with an Elvish way to vent, using Tolkien’s words', () => {
  const s = translate('Fuck!', 'S')
  assert.equal(s.mode, 'expletive')
  assert.equal(s.trust.level, 'idiom')
  assert.equal(s.line, 'Rhach!')
  assert.equal(translate('fuck off', 'Q').line, 'Heca!') // Tolkien’s “begone!”
  assert.equal(translate('oh shit', 'S').line, 'Saw!')
  assert.equal(translate('you bastard', 'Q').line, 'Úvanimo!')
  // inside a sentence the rude word maps to Tolkien’s plain meaning, or is left out
  assert.equal(line('this is shit', 'Q'), 'Sina ná söa')
  assert.equal(line('the fucking orcs stole my bread', 'S'), 'In yrch pilanner bas nín') // plural past, like Quenya piller
  assert.equal(line('the fucking orcs stole my bread', 'Q'), 'I húnë orcor piller massanya') // Quenya adjective before the noun
})

test('names after “my name is” are kept as names, even in lowercase', () => {
  const r = translate('my name is inigo montoya', 'S')
  assert.equal(r.line, 'Eneth nín Inigo Montoya')
  assert.equal(r.trust.level, 'safe')
})

test('a message is rated sentence by sentence, so one weak part does not hide the rest', () => {
  const r = translate('hello. My name is inigo montoya, you killed my father, prepare to die', 'Q')
  assert.equal(r.mode, 'multi')
  assert.deepEqual(r.segments.map((s) => s.result.line), ['Aiya!', 'Essenya ná Inigo Montoya', 'Nahtanelyë atarinya', 'Á ferya firë'])
  const s = translate('hello. My name is inigo montoya, you killed my father, prepare to die', 'S')
  assert.deepEqual(s.segments.map((x) => x.result.trust.level), ['idiom', 'safe', 'caution', 'safe'])
  // Tolkien's own comma lines are never split
  assert.equal(translate('Speak, friend, and enter', 'S').line, 'Pedo mellon a minno')
})

test('commands that start with “do” are not mistaken for questions', () => {
  assert.notEqual(translate('Do not flee', 'S').trust.level, 'unsafe')
  assert.equal(line('Do not flee', 'S'), 'Avo dhrego')
  assert.equal(translate('Do you love me?', 'S').trust.level, 'unsafe')
  assert.equal(translate('do you see the stars', 'S').trust.level, 'unsafe')
})

test('every example button on the page translates without being refused', async () => {
  const src = (await import('node:fs')).readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const block = src.match(/const EXAMPLES = \{([\s\S]*?)\n\}/)[1]
  for (const [, l, list] of block.matchAll(/(S|Q): \[([^\]]*)\]/g)) {
    for (const [, ex] of list.matchAll(/'([^']*)'/g)) {
      assert.notEqual(translate(ex, l).trust.level, 'unsafe', `${l}: ${ex}`)
    }
  }
})

test('“to hell with you” and other brush-offs give the same answer as “fuck off”', () => {
  for (const en of ['to hell with you', 'To hell with it!', 'go to hell', 'screw you', 'get lost']) {
    assert.equal(translate(en, 'S').line, translate('fuck off', 'S').line, en)
    assert.equal(translate(en, 'Q').line, 'Heca!', en)
  }
})

test('“not” is never silently dropped (that would reverse the meaning)', () => {
  assert.equal(line('the spider is not dead', 'S'), 'I ungol ú fern')
  assert.equal(line('the spider is not dead', 'Q'), 'I ungwë ná lá qualin')
  assert.equal(translate('the spider is not dead', 'S').trust.level, 'caution') // no clear Tolkien pattern for “is not”
  assert.equal(line('we are not free', 'Q'), 'Elmë nar lá lérinë') // “free” after “are” is a description, not a verb
  assert.equal(line('I will not sing', 'S'), 'Ú-linnathon')
  // every negative sentence either shows a negative word or is refused
  const NEG = /^(ú|lá|avo|áva|baw|vá)(?=$|[\s!.,-])|^ú-/i
  for (const en of ['the spider is not dead', 'I am not afraid', 'you are not my friend', 'I did not see the orcs', 'he is not an elf', 'it is not good']) {
    for (const l of ['S', 'Q']) {
      const r = translate(en, l)
      assert.ok(r.trust.level === 'unsafe' || r.items.some((i) => NEG.test(i.el)), `${l}: ${en} → ${r.line}`)
    }
  }
})

test('source files contain no stray control characters', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const root = fileURLToPath(new URL('../src/', import.meta.url))
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name)
    return d.isDirectory() ? walk(p) : /\.(js|jsx|css)$/.test(d.name) ? [p] : []
  })
  const files = walk(root)
  assert.ok(files.length > 10)
  for (const f of files) {
    assert.ok(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(fs.readFileSync(f, 'utf8')), f)
  }
})

test('who/what questions, Quenya “can” and “have”, and “have no” follow Tolkien’s patterns', () => {
  const lvl = (en, l) => translate(en, l).trust.level
  assert.equal(line('What have we done?', 'Q'), 'Mana carnelmë?') // cf. Sindarin man agorech?
  assert.equal(lvl('What have we done?', 'S'), 'caution')
  assert.equal(lvl('Do you love me?', 'S'), 'unsafe') // yes/no questions: no Tolkien pattern
  assert.equal(line('I can speak', 'Q'), 'Polin quetë') // Tolkien's own words
  assert.equal(lvl('I can see you', 'Q'), 'safe')
  assert.equal(lvl('I can see you', 'S'), 'unsafe') // no Sindarin “can”
  assert.equal(line('I have a sword', 'Q'), 'Haryan macil')
  assert.equal(line('I have a sword', 'S'), 'Sevin megil') // Tolkien's sevin “I have”
  assert.equal(line('we have no hope', 'S'), 'Penim estel')
  assert.equal(line('speak, friend, and enter', 'S'), 'Pedo mellon a minno')
  assert.equal(line('the old darkness', 'Q'), 'Enwina lúmë') // Tolkien's own line
  assert.match(line('the dark tower', 'Q'), /^I \S+ mindon$/) // adjective first, like his enwina lúmë
})

test('the exam against Tolkien’s sentences does not get worse', async () => {
  const { EXAM, score } = await import('../scripts/exam.mjs')
  const { compose } = await import('../src/engine/translate.js')
  const avg = (l) => {
    const rs = EXAM.filter((p) => p.lang === l)
    return rs.reduce((a, p) => a + score(p.elvish, compose(p.english.replace(/\([^)]*\)|\[[^\]]*\]/g, ' '), l).line), 0) / rs.length
  }
  assert.ok(avg('S') >= 0.47, `Sindarin ${avg('S')}`)
  assert.ok(avg('Q') >= 0.35, `Quenya ${avg('Q')}`)
})

test('Elvish → English: Tolkien’s lines come back with his own English', async () => {
  const { toEnglish } = await import('../src/engine/reverse.js')
  assert.equal(toEnglish('Pedo mellon a minno', 'S').english, 'Speak, friend, and enter')
  assert.equal(toEnglish('Penim vast', 'S').trust.level, 'exact')
  assert.equal(toEnglish('Mae govannen, mellon', 'S').english, 'Well met, friend')
})

test('Elvish → English: word by word, undoing sound changes and endings', async () => {
  const { toEnglish } = await import('../src/engine/reverse.js')
  const en = (t, l) => toEnglish(t, l).english
  assert.equal(en('Le melin', 'S'), 'I love you')
  assert.equal(en('I gor nín', 'S'), 'My ring') // gor is cor softened after the article
  assert.equal(en('Ú-linnathon', 'S'), 'I will not sing')
  assert.equal(en('I ngîl glân', 'S'), 'The white stars')
  assert.equal(en('Hiruvalyë Valimar', 'Q'), 'You will find Valimar')
  assert.equal(en('I aran Eldaron', 'Q'), 'The king of elves')
  assert.equal(en('laurië lantar lassi', 'Q'), 'Golden leaves fall')
  assert.equal(toEnglish('xyz', 'S').trust.level, 'caution') // unknown words are flagged, never guessed
})

test('round trip: what the app writes, it can read back', async () => {
  const { toEnglish } = await import('../src/engine/reverse.js')
  for (const [en, l] of [['I love you', 'S'], ['my friend', 'Q'], ['the elves sing under the stars', 'S'], ['you will find the ring', 'Q']]) {
    const back = toEnglish(translate(en, l).line, l)
    assert.ok(back.words.every((w) => w.status !== 'G'), `${en} → ${translate(en, l).line} → ${back.english}`)
  }
})

test('“like” as a verb follows Tolkien’s “it is good to me”, never the preposition “as”', () => {
  assert.equal(line('I like it', 'Q'), 'Nás mára nin')
  assert.equal(line('you like it', 'Q'), 'Nás mára tyen')
  assert.equal(line('I like bread', 'Q'), 'Massa ná mára nin')
  assert.equal(line('I like the stars', 'Q'), 'I eleni nar márë nin')
  for (const [en, l] of [['she likes trees', 'Q'], ['I do not like it', 'Q']]) {
    const r = translate(en, l)
    assert.equal(r.trust.level, 'unsafe', `${en} (${l}) → ${r.line}`)
    assert.ok(!/\b(sui|ve)\b/i.test(r.line), `${en} (${l}) used “as”: ${r.line}`)
  }
  // Sindarin: mav- “like” from Tolkien's earliest drafts, always flagged as such
  const s = translate('I like bread', 'S')
  assert.equal(s.line, 'Mevin bas')
  assert.equal(s.trust.level, 'caution')
  assert.match(s.trust.reasons.join(' '), /earlier drafts/)
  assert.equal(line('like a star', 'S'), 'Sui gil') // the preposition still works
  assert.equal(line('the stars like jewels', 'S'), 'I ngîl sui mîr') // a simile, not the verb
  assert.equal(line('I would like bread', 'Q'), 'Merin massa')
})

test('Sindarin “have” is Tolkien’s sav- (sevin “I have”, aw “had”)', () => {
  assert.equal(line('I have a ring', 'S'), 'Sevin cor')
  assert.equal(translate('I have a ring', 'S').trust.level, 'safe')
  assert.match(line('she had a sword', 'S'), /\baw megil$/)
  assert.equal(line('we had bread', 'S'), 'Savannem bas') // the person never vanishes
  assert.equal(line('we have no bread', 'S'), 'Penim vast') // “have no” stays Tolkien's pen- “lack”
  assert.equal(line('have mercy', 'Q'), 'Órava') // a whole “have …” meaning in one Tolkien verb
  assert.equal(line('I own a horse', 'Q'), 'Öan rocco')
  assert.equal(line('I win', 'Q'), 'Turin')
  assert.equal(line('the elves are wise', 'Q'), 'I Eldar nar sailë') // extra meanings never outrank the main word
})

test('everyday expressions give the Elvish way to say it, with an honest literal meaning', async () => {
  const { EVERYDAY_ENGLISH } = await import('../src/engine/everyday.js')
  const day = (en, l) => translate(en, l)
  assert.equal(day('Hello', 'Q').line, 'Aiya!')
  assert.equal(day('hello!', 'S').line, 'Suilad!')
  assert.equal(day('Goodbye', 'Q').line, 'Namárië!')
  assert.match(day('nice to meet you', 'S').line, /^Mae govannen/) // Tolkien's own line
  assert.equal(day('Please', 'Q').line, 'Mecin')
  assert.equal(day('How are you?', 'Q').trust.level, 'idiom') // not refused as a question
  assert.match(day('How are you?', 'Q').everyday.why, /never wrote/)
  assert.equal(day('Hello', 'Q').everyday.literal, 'hail! behold!')
  // fan-made answers are never presented as Tolkien's
  const thanks = day('thank you', 'S')
  assert.equal(thanks.line, 'Le hannon')
  assert.equal(thanks.trust.level, 'caution')
  assert.match(thanks.trust.reasons[0], /fan-made/)
  // no equivalent at all: refused, with the reason
  assert.equal(day('yes', 'S').line, 'Naw') // fan-made: Tolkien left no Sindarin “yes” (Eldamo checked)
  assert.match(day('yes', 'S').trust.reasons[0], /fan-made/)
  assert.equal(day('bless you', 'S').trust.level, 'unsafe') // no Equivalent at all: refused, with the reason
  assert.match(day('bless you', 'S').trust.reasons[0], /elia-/)
  // Tolkien's own lines still win
  assert.equal(day('well met', 'S').mode, 'canon')
  // every listed expression has an answer or an honest refusal in both languages
  for (const en of EVERYDAY_ENGLISH) for (const l of ['S', 'Q']) {
    const r = translate(en, l)
    assert.ok(r.mode === 'everyday' || r.mode === 'canon' || r.trust.level === 'unsafe', `${en} (${l}) → ${r.line}`)
  }
})

test('“no word” claims are checked against Eldamo, including Tolkien’s earlier stages', () => {
  // a gap names what Tolkien wrote in an earlier stage, when Eldamo has it
  assert.match(translate('the castle', 'Q').trust.reasons.join(' '), /Early Qenya.*malkor/)
  assert.match(translate('my computer', 'S').trust.reasons.join(' '), /Eldamo lists no word/)
  // corrected claims: Tolkien did write “very” (íta, íd) and “how” (manen)
  assert.equal(translate('the stars are very bright', 'Q').line, 'I eleni nar íta calimë')
  assert.equal(translate('the stars are very bright', 'Q').trust.level, 'caution')
  assert.ok(translate('How are you?', 'Q').everyday.alternatives.some((a) => a.el === 'Manen nalyë?'))
  // “really” is set aside without breaking the sentence
  assert.equal(translate('I really love you', 'S').line, 'Le melin')
  assert.equal(translate('very', 'S').trust.level, 'unsafe')
})

test('UK and US spellings find the same words', () => {
  // Eldamo glosses mix the two; either spelling must give the same Elvish
  assert.equal(line('The grey colour', 'S'), line('The gray color', 'S'))
  assert.notEqual(line('The grey colour', 'S').includes('['), true)
  // a word Tolkien never glossed gets his nearest one offered, whichever way it is spelt
  for (const w of ['traveller', 'traveler']) {
    const r = translate(`Well met, ${w}`, 'S')
    assert.equal(r.trust.level, 'unsafe')
    assert.ok(r.trust.suggestions.some((s) => s.english === 'Well met, wanderer'), w)
  }
  assert.equal(line('Well met, wanderer', 'S'), 'Mae govannen, randir')
  // no false pairs: “filled” is not “filed”, “four” is not “for”
  assert.notEqual(line('the floor', 'S'), line('the flour', 'S'))
})

test('gaps Tolkien filled elsewhere are filled, with the source said', () => {
  // Noldorin tog- “bring” and gwedh- “bind” (Etymologies), as Eldamo's Neo-Sindarin uses them: a caution, not a refusal
  for (const s of ['Bring them', 'Bind them']) {
    const r = translate(s, 'S')
    assert.equal(r.trust.level, 'caution', s)
    assert.match(r.trust.reasons.join(' '), /earlier drafts/)
  }
  // dîn “his”, after the noun, as in the King's Letter (bess dîn “his wife”); “on” is bo (Ae Adar Nín), not na “to”
  const his = translate('He sat on his throne', 'S')
  assert.match(his.line, /\bdîn\b/)
  assert.match(his.line, /\bbo\b/)
  assert.doesNotMatch(his.line, /\bna\b/)
  // “where” and “their” have no usable word of Tolkien's, so the nearest wording is offered
  const where = translate('The hills where the stars shine', 'S')
  assert.ok(where.trust.suggestions.some((s) => /^The hills, there /.test(s.english)))
  const their = translate('The elves in their halls', 'S')
  assert.ok(their.trust.suggestions.some((s) => s.english === 'The elves in the halls'))
  // verse comes back line by line, and a comma-split clause keeps its comma
  assert.equal(translate('The stars shine\nThe moon is bright', 'S').segments.length, 2)
})

test('Quenya possessives on plurals, prepositions and relative “where”', () => {
  // the plural follows the possessive on the bare noun (má-rya-t, Namárië): solma-nya-ssen, not solmar-inya-r-essë
  assert.equal(line('in my halls', 'Q'), 'Solmanyassen')
  assert.equal(line('my halls', 'Q'), 'Solmanyar')
  // a fan-made verb glossed “under-” never takes over Tolkien's nu
  assert.equal(line('under the sky', 'Q'), 'Nu i menel')
  // yassë “where, in which place” (PE17/66)
  assert.match(line('the land where the shadows lie', 'Q'), / yassë /)
  // “doomed”: Tolkien's nearest is “fated” (marta), offered with the capitals kept
  assert.ok(translate('Mortal Men doomed to die', 'Q').trust.suggestions.some((s) => s.english === 'Mortal Men fated to die'))
})

test('Sindarin “all” follows Tolkien’s mhellyn în phain: plural pain after the noun phrase', () => {
  assert.equal(line('I greet all my friends', 'S'), 'Suilon mellyn nín pain')
  assert.equal(line('All elves sing', 'S'), 'Edhil pain linnar')
  assert.equal(line('One Ring to rule them all', 'S'), 'Min cor hain torthad pain')
  assert.equal(line('the whole land', 'S'), 'I dhôr pân')
})

test('Tengwar letters are the ConScript registry’s, the layout Alcarin Tengwar draws', () => {
  const cps = (s, lang) => [...toTengwar(s, lang)].map((c) => c.codePointAt(0))
  // mellon: malta, lambe + doubling bar + e, númen + o
  assert.deepEqual(cps('mellon', 'S'), [CSUR.malta, CSUR.lambe, CSUR.doubler, CSUR.acute, CSUR.numen, CSUR.rightCurl])
  // a word-initial vowel sits on the short carrier; s carrying a vowel turns to silme nuquerna
  assert.deepEqual(cps('elen sila', 'Q'), [CSUR.shortCarrier, CSUR.acute, CSUR.lambe, CSUR.acute, CSUR.numen, 32, CSUR.silmeNuquerna, CSUR.dot, CSUR.lambe, CSUR.threeDots])
  // r before a vowel is rómen; h is hyarmen; a long vowel takes the long carrier
  assert.ok(cps('namarie', 'Q').includes(CSUR.romen))
  assert.equal(cps('hrive', 'Q')[0], CSUR.hyarmen)
  assert.ok(cps('í', 'Q').includes(CSUR.longCarrier))
  // the codes the old table used by mistake (extended letters) never appear in ordinary text
  for (const w of ['lasto beth lammen', 'Ai na vedui Dúnadan', 'Namárië']) {
    assert.ok(cps(w, 'S').every((c) => c < CSUR.extTinco || c > CSUR.extUngwe), w)
  }
})

test('English in Tengwar follows Tolkien’s spelling-based samples (Björkman, Amanyë Tenceli)', () => {
  const names = Object.fromEntries(Object.entries(CSUR).map(([k, v]) => [v, k]))
  const spell = (s) => [...toTengwar(s, 'E')].map((c) => names[c.codePointAt(0)] || (c === ' ' ? '|' : c.codePointAt(0).toString(16)))
  // the vowel sign sits on the letter after it; r before a vowel is rómen, otherwise óre
  assert.deepEqual(spell('march'), ['malta', 'ore', 'threeDots', 'calma'])
  assert.deepEqual(spell('return'), ['romen', 'tinco', 'acute', 'ore', 'leftCurl', 'numen'])
  // a silent final e is a dot below; voiced th is anto
  assert.deepEqual(spell('there'), ['anto', 'ore', 'acute', 'dotBelow'])
  // a doubled letter is a bar below, a nasal before its own series a bar above
  assert.deepEqual(spell('happy'), ['hyarmen', 'parma', 'doubler', 'threeDots', 'shortCarrier', 'dot'])
  assert.deepEqual(spell('want'), ['vala', 'tinco', 'nasalizer', 'threeDots'])
  // the shorthands Tolkien used for the, of, of the, and
  assert.deepEqual(spell('the lord of the rings').slice(0, 2), ['extAndo', '|'])
  assert.ok(spell('the lord of the rings').join(' ').includes('extUmbar doubler'))
  assert.deepEqual(spell('and'), ['ando', 'nasalizer'])
  // second vowels written as letters: -e yanta (Michael), -a stemless anna (Earth), -u vala (you)
  assert.ok(spell('michael').includes('yanta'))
  assert.equal(spell('earth')[0], 'e032')
  assert.deepEqual(spell('you'), ['anna', 'vala', 'rightCurl'])
  // names come out too: no Latin letters are ever left behind
  assert.ok([...toTengwar('Frodo Baggins', 'E')].every((c) => c === ' ' || c.codePointAt(0) >= 0xe000))
})

test('Tengwar numerals run least significant digit first', () => {
  const cps = (s) => [...s].map((c) => c.codePointAt(0))
  // 1954 in base 10: 4 5 9 1, each with a dot above
  assert.deepEqual(cps(toTengwarNumber(1954)), [0xe074, CSUR.dot, 0xe075, CSUR.dot, 0xe079, CSUR.dot, 0xe071, CSUR.dot])
  // 144 in base 12 is 100: dots below, and the ring under the units digit
  assert.deepEqual(cps(toTengwarNumber(144, 12)), [0xe070, CSUR.dotBelow, 0xe07d, 0xe070, CSUR.dotBelow, 0xe071, CSUR.dotBelow])
})

test('Tengwar Annatar output matches Johan Winge’s own example', () => {
  // the Annatar documentation types “sinome maruvan” as iT5^t$ t#7UyE5
  assert.equal(toAnnatar(toTengwar('sinome maruvan', 'Q')), 'iT5^t$ t#7UyE5')
  // every character converts: nothing in the private-use area is left over
  for (const [s, l] of [['Mae govannen', 'S'], ['Elen síla lúmenn omentielvo', 'Q'], ['the lord of the rings', 'E']]) {
    assert.ok([...toAnnatar(toTengwar(s, l))].every((c) => c.codePointAt(0) < 0xe000), s)
  }
})

test('Annatar text converts back to Unicode Tengwar', () => {
  // Johan Winge's own example, typed for Annatar, is the same Tengwar the engine writes
  assert.equal(fromAnnatar('iT5^t$ t#7UyE5'), toTengwar('sinome maruvan', 'Q'))
  // and the round trip loses nothing, numbers included
  for (const [s, l] of [['Mae govannen', 'S'], ['Elen síla lúmenn omentielvo', 'Q'], ['the lord of the rings', 'E'], ['Annon edhellen, edro hi ammen!', 'S']]) {
    const t = toTengwar(s, l)
    assert.equal(fromAnnatar(toAnnatar(t)), t, s)
  }
  assert.equal(fromAnnatar(toAnnatar(toTengwarNumber(1954))), toTengwarNumber(1954))
  // line breaks and spaces are kept
  assert.equal(fromAnnatar('1\nq'), String.fromCodePoint(CSUR.tinco) + '\n' + String.fromCodePoint(CSUR.parma))
})
