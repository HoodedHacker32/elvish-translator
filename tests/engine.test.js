import { test } from 'node:test'
import assert from 'node:assert/strict'
import { translate } from '../src/engine/translate.js'
import { respell } from '../src/engine/pronounce.js'
import { toTengwar } from '../src/engine/tengwar.js'
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
  assert.equal(line('I cannot find my friends', 'Q'), 'Lá hirin meldorinyar')
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
  assert.equal(line('the fucking orcs stole my bread', 'S'), 'In yrch pilant bas nín')
  assert.equal(line('the fucking orcs stole my bread', 'Q'), 'I orcor húnë piller massanya')
})

test('names after “my name is” are kept as names, even in lowercase', () => {
  const r = translate('my name is inigo montoya', 'S')
  assert.equal(r.line, 'Eneth nín Inigo Montoya')
  assert.equal(r.trust.level, 'safe')
})

test('a message is rated sentence by sentence, so one weak part does not hide the rest', () => {
  const r = translate('hello. My name is inigo montoya, you killed my father, prepare to die', 'Q')
  assert.equal(r.mode, 'multi')
  assert.deepEqual(r.segments.map((s) => s.result.line), ['Aiya.', 'Essenya ná Inigo Montoya', 'Nahtanelyë atarinya', 'Á ferya firë'])
  const s = translate('hello. My name is inigo montoya, you killed my father, prepare to die', 'S')
  assert.deepEqual(s.segments.map((x) => x.result.trust.level), ['safe', 'safe', 'caution', 'safe'])
  // Tolkien's own comma lines are never split
  assert.equal(translate('Speak, friend, and enter', 'S').line, 'Pedo mellon a minno')
})
