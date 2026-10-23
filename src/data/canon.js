// Canon phrases: short lines Tolkien wrote in Elvish, returned verbatim when the English matches.
// Only brief, well-known lines are kept; meanings are plain paraphrases, not quotations of the English text.
// Row fields:
//   lang     'S' Sindarin | 'Q' Quenya
//   elvish   the line as printed
//   keys     normalised English inputs that should return it
//   meaning  plain-English sense
//   who      speaker or setting
//   where    work and chapter
//   words    [elvish word, meaning, grammar note] for the leaf strip
export const CANON = [
  {
    id: 'elen-sila',
    lang: 'Q',
    elvish: 'Elen síla lúmenn’ omentielvo',
    keys: ['a star shines on the hour of our meeting', 'a star shines upon the hour of our meeting', 'a star shines on our meeting'],
    meaning: 'A star shines on the hour of our meeting',
    who: 'Frodo greeting Gildor’s Elves',
    where: 'The Fellowship of the Ring, Book I, ch. 3',
    words: [
      ['Elen', 'a star', 'noun'],
      ['síla', 'shines', 'verb, present'],
      ['lúmenn’', 'on the hour', 'noun + “to/upon” ending'],
      ['omentielvo', 'of our meeting', 'noun + “our” + “of”'],
    ],
  },
  {
    id: 'mae-govannen',
    lang: 'S',
    elvish: 'Mae govannen',
    keys: ['well met', 'nice to meet you', 'good to meet you'],
    meaning: 'Well met',
    who: 'Glorfindel meeting Aragorn',
    where: 'The Fellowship of the Ring, Book I, ch. 12',
    words: [
      ['Mae', 'well', 'adverb'],
      ['govannen', 'met', 'past participle, softened'],
    ],
  },
  {
    id: 'ai-na-vedui',
    lang: 'S',
    elvish: 'Ai na vedui, Dúnadan!',
    keys: ['ah at last dunadan', 'at last dunadan', 'at last man of the west'],
    meaning: 'Ah, at last, Man of the West!',
    who: 'Glorfindel to Aragorn',
    where: 'The Fellowship of the Ring, Book I, ch. 12',
    words: [
      ['Ai', 'ah', 'interjection'],
      ['na', 'at', 'preposition'],
      ['vedui', 'last', 'adjective, softened from bedui'],
      ['Dúnadan', 'Man of the West', 'noun'],
    ],
  },
  {
    id: 'noro-lim',
    lang: 'S',
    elvish: 'Noro lim, noro lim, Asfaloth!',
    keys: ['run swiftly run swiftly asfaloth', 'run fast run fast asfaloth', 'run swift run swift asfaloth', 'run fast asfaloth'],
    meaning: 'Run fast, run fast, Asfaloth!',
    who: 'Glorfindel urging his horse',
    where: 'The Fellowship of the Ring, Book I, ch. 12',
    words: [
      ['Noro', 'run!', 'verb, command'],
      ['lim', 'swiftly', 'adjective as adverb'],
      ['Asfaloth', 'Asfaloth', 'name of the horse'],
    ],
  },
  {
    id: 'naur-an-edraith',
    lang: 'S',
    elvish: 'Naur an edraith ammen!',
    keys: ['fire for saving of us', 'fire for our saving', 'fire to save us', 'fire save us'],
    meaning: 'Fire, to save us!',
    who: 'Gandalf on Caradhras',
    where: 'The Fellowship of the Ring, Book II, ch. 3',
    words: [
      ['Naur', 'fire', 'noun'],
      ['an', 'for', 'preposition'],
      ['edraith', 'saving', 'noun'],
      ['ammen', 'of us', 'pronoun'],
    ],
  },
  {
    id: 'pedo-mellon',
    lang: 'S',
    elvish: 'Pedo mellon a minno',
    keys: ['speak friend and enter', 'say friend and enter'],
    meaning: 'Speak, friend, and enter',
    who: 'Words on the West-gate of Moria',
    where: 'The Fellowship of the Ring, Book II, ch. 4',
    words: [
      ['Pedo', 'speak!', 'verb, command'],
      ['mellon', 'friend', 'noun'],
      ['a', 'and', 'conjunction'],
      ['minno', 'enter!', 'verb, command'],
    ],
  },
  {
    id: 'annon-edhellen',
    lang: 'S',
    elvish: 'Annon edhellen, edro hi ammen!',
    keys: ['elvish gate open now for us', 'elven gate open now for us', 'elvish gate open for us', 'elven gate open for us'],
    meaning: 'Elvish gate, open now for us!',
    who: 'Gandalf at the doors of Moria',
    where: 'The Fellowship of the Ring, Book II, ch. 4',
    words: [
      ['Annon', 'gate', 'noun'],
      ['edhellen', 'elvish', 'adjective, after its noun'],
      ['edro', 'open!', 'verb, command'],
      ['hi', 'now', 'adverb'],
      ['ammen', 'for us', 'pronoun'],
    ],
  },
  {
    id: 'daro',
    lang: 'S',
    elvish: 'Daro!',
    keys: ['stop', 'halt'],
    meaning: 'Stop!',
    who: 'Haldir’s Elves in Lothlórien',
    where: 'The Fellowship of the Ring, Book II, ch. 6',
    words: [['Daro', 'stop!', 'verb, command']],
  },
  {
    id: 'laurie-lantar',
    lang: 'Q',
    elvish: 'Ai! laurië lantar lassi súrinen',
    keys: ['ah like gold fall the leaves in the wind', 'like gold fall the leaves in the wind', 'the leaves fall like gold in the wind', 'golden leaves fall in the wind'],
    meaning: 'Ah! like gold the leaves fall in the wind',
    who: 'Galadriel’s lament',
    where: 'The Fellowship of the Ring, Book II, ch. 8',
    words: [
      ['Ai', 'ah', 'interjection'],
      ['laurië', 'like gold', 'adjective, plural'],
      ['lantar', 'fall', 'verb, plural'],
      ['lassi', 'leaves', 'noun, plural'],
      ['súrinen', 'in the wind', 'noun + “by/with” ending'],
    ],
  },
  {
    id: 'namarie',
    lang: 'Q',
    elvish: 'Namárië! Nai hiruvalyë Valimar.',
    keys: ['farewell maybe you will find valimar', 'farewell may you find valimar', 'farewell maybe thou shalt find valimar'],
    meaning: 'Farewell! May you find Valimar.',
    who: 'Galadriel’s lament',
    where: 'The Fellowship of the Ring, Book II, ch. 8',
    words: [
      ['Namárië', 'farewell', 'interjection'],
      ['Nai', 'may it be that', 'particle'],
      ['hiruvalyë', 'you will find', 'verb, future + “you”'],
      ['Valimar', 'Valimar', 'place name'],
    ],
  },
  {
    id: 'aiya-earendil',
    lang: 'Q',
    elvish: 'Aiya Eärendil Elenion Ancalima!',
    keys: ['hail earendil brightest of stars', 'hail earendil brightest of the stars', 'hail earendil brightest star'],
    meaning: 'Hail Eärendil, brightest of stars!',
    who: 'Frodo in Shelob’s lair',
    where: 'The Two Towers, Book IV, ch. 9',
    words: [
      ['Aiya', 'hail', 'interjection'],
      ['Eärendil', 'Eärendil', 'name'],
      ['Elenion', 'of stars', 'noun, plural + “of”'],
      ['Ancalima', 'brightest', 'adjective, superlative'],
    ],
  },
  {
    id: 'a-elbereth',
    lang: 'S',
    elvish: 'A Elbereth Gilthoniel',
    keys: ['o elbereth star kindler', 'o elbereth starkindler', 'oh elbereth star kindler', 'o elbereth gilthoniel'],
    meaning: 'O Elbereth, Star-kindler',
    who: 'Opening of the Elves’ hymn in Rivendell',
    where: 'The Fellowship of the Ring, Book II, ch. 1',
    words: [
      ['A', 'O', 'interjection'],
      ['Elbereth', 'Star-queen', 'name'],
      ['Gilthoniel', 'Star-kindler', 'title'],
    ],
  },
  {
    id: 'a-tiro-nin',
    lang: 'S',
    elvish: 'A tiro nin, Fanuilos!',
    keys: ['o look towards me ever white', 'look towards me ever white', 'o look upon me ever white', 'watch over me ever white'],
    meaning: 'O look toward me, Ever-white!',
    who: 'Sam at the Tower of Cirith Ungol',
    where: 'The Two Towers, Book IV, ch. 10',
    words: [
      ['A', 'O', 'interjection'],
      ['tiro', 'look!', 'verb, command'],
      ['nin', 'me', 'pronoun'],
      ['Fanuilos', 'Ever-white', 'title of Elbereth'],
    ],
  },
  {
    id: 'cuio-i-pheriain',
    lang: 'S',
    elvish: 'Cuio i Pheriain anann!',
    keys: ['long live the halflings', 'long live the hobbits', 'may the halflings live long'],
    meaning: 'Long live the Halflings!',
    who: 'The host at the Field of Cormallen',
    where: 'The Return of the King, Book VI, ch. 4',
    words: [
      ['Cuio', 'live!', 'verb, command'],
      ['i', 'the', 'article'],
      ['Pheriain', 'Halflings', 'noun, plural, mutated after i'],
      ['anann', 'long', 'adverb'],
    ],
  },
  {
    id: 'aglar-ni-pheriannath',
    lang: 'S',
    elvish: 'Aglar’ni Pheriannath!',
    keys: ['glory to the halflings', 'praise the halflings', 'glory to the hobbits'],
    meaning: 'Glory to the Halflings!',
    who: 'The host at the Field of Cormallen',
    where: 'The Return of the King, Book VI, ch. 4',
    words: [
      ['Aglar', 'glory', 'noun'],
      ['’ni', 'to the', 'preposition + article'],
      ['Pheriannath', 'Halflings', 'noun, group plural, mutated'],
    ],
  },
  {
    id: 'ernil-i-pheriannath',
    lang: 'S',
    elvish: 'Ernil i Pheriannath',
    keys: ['prince of the halflings', 'prince of the hobbits'],
    meaning: 'Prince of the Halflings',
    who: 'Gandalf’s title for Pippin in Minas Tirith',
    where: 'The Return of the King, Book V, ch. 1',
    words: [
      ['Ernil', 'prince', 'noun'],
      ['i', 'of the', 'article (genitive by position)'],
      ['Pheriannath', 'Halflings', 'noun, group plural, mutated'],
    ],
  },
  {
    id: 'et-earello',
    lang: 'Q',
    elvish: 'Et Eärello Endorenna utúlien.',
    keys: ['out of the great sea to middle earth i am come', 'out of the great sea to middle earth i have come', 'from the great sea to middle earth i have come'],
    meaning: 'Out of the Great Sea to Middle-earth I have come.',
    who: 'Elendil’s words, spoken by Aragorn at his crowning',
    where: 'The Return of the King, Book VI, ch. 5',
    words: [
      ['Et', 'out', 'preposition'],
      ['Eärello', 'from the Great Sea', 'noun + “from” ending'],
      ['Endorenna', 'to Middle-earth', 'noun + “to” ending'],
      ['utúlien', 'I have come', 'verb, perfect + “I”'],
    ],
  },
  {
    id: 'sinome-maruvan',
    lang: 'Q',
    elvish: 'Sinomë maruvan ar Hildinyar tenn’ Ambar-metta!',
    keys: ['here i will abide and my heirs until the end of the world', 'in this place will i abide and my heirs unto the ending of the world', 'here i will stay and my heirs until the end of the world'],
    meaning: 'Here I will remain, and my heirs, until the end of the world!',
    who: 'Elendil’s words, spoken by Aragorn at his crowning',
    where: 'The Return of the King, Book VI, ch. 5',
    words: [
      ['Sinomë', 'in this place', 'adverb'],
      ['maruvan', 'I will abide', 'verb, future + “I”'],
      ['ar', 'and', 'conjunction'],
      ['Hildinyar', 'my heirs', 'noun + “my”, plural'],
      ['tenn’', 'until', 'preposition'],
      ['Ambar-metta', 'the end of the world', 'compound noun'],
    ],
  },
  {
    id: 'onen-i-estel',
    lang: 'S',
    elvish: 'Ónen i-Estel Edain, ú-chebin estel anim.',
    keys: ['i gave hope to the dunedain i have kept no hope for myself', 'i gave hope to the dunedain i kept no hope for myself'],
    meaning: 'I gave Hope to the Dúnedain; I kept no hope for myself.',
    who: 'Gilraen, Aragorn’s mother',
    where: 'The Lord of the Rings, Appendix A',
    words: [
      ['Ónen', 'I gave', 'verb, past + “I”'],
      ['i-Estel', 'the Hope', 'article + noun (Aragorn’s childhood name)'],
      ['Edain', 'to Men', 'noun, plural'],
      ['ú-chebin', 'I did not keep', 'not + verb + “I”, mutated'],
      ['estel', 'hope', 'noun'],
      ['anim', 'for myself', 'pronoun'],
    ],
  },
  {
    id: 'a-vanimar',
    lang: 'Q',
    elvish: 'A vanimar, vanimálion nostari!',
    keys: ['o beautiful ones parents of beautiful children', 'o fair ones parents of fair children', 'beautiful ones parents of beautiful children'],
    meaning: 'O fair ones, parents of fair children!',
    who: 'Treebeard bidding Celeborn and Galadriel farewell',
    where: 'The Return of the King, Book VI, ch. 6',
    words: [
      ['A', 'O', 'interjection'],
      ['vanimar', 'fair ones', 'adjective as noun, plural'],
      ['vanimálion', 'of fair children', 'noun, plural + “of”'],
      ['nostari', 'parents', 'noun, plural'],
    ],
  },
  {
    id: 'utulie-n-aure',
    lang: 'Q',
    elvish: 'Utúlie’n aurë!',
    keys: ['the day has come', 'the day is come', 'day has come'],
    meaning: 'The day has come!',
    who: 'Fingon before the Battle of Unnumbered Tears',
    where: 'The Silmarillion, ch. 20',
    words: [
      ['Utúlie', 'has come', 'verb, perfect'],
      ['’n', 'the', 'article'],
      ['aurë', 'day', 'noun'],
    ],
  },
  {
    id: 'auta-i-lome',
    lang: 'Q',
    elvish: 'Auta i lómë!',
    keys: ['the night is passing', 'night is passing'],
    meaning: 'The night is passing!',
    who: 'Turgon’s host answering Fingon',
    where: 'The Silmarillion, ch. 20',
    words: [
      ['Auta', 'is passing', 'verb'],
      ['i', 'the', 'article'],
      ['lómë', 'night', 'noun'],
    ],
  },
  {
    id: 'lacho-calad',
    lang: 'S',
    elvish: 'Lacho calad! Drego morn!',
    keys: ['flame light flee night', 'blaze light flee night', 'shine light flee darkness'],
    meaning: 'Flame, Light! Flee, Night!',
    who: 'A war-cry of the Elves',
    where: 'Unfinished Tales',
    words: [
      ['Lacho', 'flame!', 'verb, command'],
      ['calad', 'light', 'noun'],
      ['Drego', 'flee!', 'verb, command'],
      ['morn', 'night, darkness', 'adjective as noun'],
    ],
  },
]

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-–—]/g, ' ')
    .replace(/[^a-z' ]/g, ' ')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim()

export const normaliseEnglish = norm

// Returns every canon line whose English keys match the whole input, any language.
export function findCanon(english) {
  const n = norm(english)
  if (!n) return []
  return CANON.filter((c) => c.keys.some((k) => norm(k) === n))
}
