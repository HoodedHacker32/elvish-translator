// Everyday expressions (“hello”, “how are you”, “thank you”) that cannot be built word by word: Elves do not
// say them the English way. Each answer is what Tolkien's Elves would say in its place, with its literal
// meaning, and honestly labelled: Tolkien's own word or line (A, C), built from his words (D), or fan-made (N).
// When there is no equivalent at all, `missing` says so instead of guessing.

const LOTR = 'The Lord of the Rings'
const W = {
  suilad: { el: 'Suilad!', literal: 'greeting!', status: 'A', where: 'Sauron Defeated, p. 129 (the King’s Letter)', note: 'Tolkien’s word “greeting”, from the King’s letter to Sam. Using it alone as “hello” is today’s custom, not something he wrote' },
  govannen: { el: 'Mae govannen!', literal: 'well met!', status: 'C', where: LOTR, note: 'Tolkien’s own greeting, spoken by Glorfindel to Aragorn' },
  aiya: { el: 'Aiya!', literal: 'hail! behold!', status: 'A', where: LOTR, note: 'Tolkien’s word, as in Frodo’s cry aiya Eärendil elenion ancalima “hail Eärendil, brightest of stars”' },
  alla: { el: 'Alla!', literal: 'welcome! hail!', status: 'A', where: 'Parma Eldalamberon 17, p. 146', note: 'Tolkien’s word for greeting someone who arrives' },
  elen: { el: 'Elen síla lúmenn’ omentielvo', literal: 'a star shines on the hour of our meeting', status: 'C', where: LOTR, note: 'Frodo’s greeting to Gildor, Tolkien’s own line' },
  namarie: { el: 'Namárië!', literal: 'be well!', status: 'A', where: LOTR, note: 'Tolkien’s word for “farewell”, from Galadriel’s lament' },
  anamarie: { el: 'Á na márië!', literal: 'be well!', status: 'C', where: 'Parma Eldalamberon 17, p. 162', note: 'Tolkien’s own words, the full form of namárië' },
  navaer: { el: 'Navaer!', literal: 'be well!', status: 'N', where: 'Neo-Sindarin (Ryszard Derdziński)', note: 'Fan-made: a Sindarin copy of Tolkien’s Quenya namárië. Tolkien left no Sindarin “goodbye”' },
  novaer: { el: 'Novaer!', literal: 'be well!', status: 'N', where: 'Neo-Sindarin', note: 'Fan-made variant of navaer' },
  marienin: { el: 'Ná márië nin', literal: 'it is well with me', status: 'D', where: 'Parma Eldalamberon 22', note: 'Built from Tolkien’s nánë márië nin “it was well with me”, with the present ná “is”' },
  mae: { el: 'Mae', literal: 'well', status: 'A', where: LOTR, note: 'Tolkien’s word “well, excellent” (as in mae govannen) on its own. He left no Sindarin “I am fine”' },
  hannon: { el: 'Le hannon', literal: 'I thank you', status: 'N', where: 'Neo-Sindarin (David Salo, for the films)', note: 'Fan-made: Tolkien left no Sindarin verb “to thank”. This form is from the Lord of the Rings films' },
  hannad: { el: 'Hannad!', literal: 'thanks!', status: 'N', where: 'Neo-Sindarin', note: 'Fan-made noun “thanks”' },
  hantanyel: { el: 'Hantanyel', literal: 'I thank you', status: 'N', where: 'Neo-Quenya', note: 'Fan-made from the modern verb hanta- “thank”. Tolkien wrote only hantalë “thanksgiving”' },
  mecin: { el: 'Mecin', literal: 'please', status: 'A', where: 'Parma Eldalamberon 22, p. 166', note: 'Tolkien’s own word, as in á sac’ i fendë, mecin “close the door, please”' },
  listo: { el: 'Listo', literal: 'please', status: 'N', where: 'Neo-Sindarin (Elaran)', note: 'Fan-made: Tolkien left no Sindarin “please”' },
  galdol: { el: 'Galdol!', literal: 'welcome!', status: 'N', where: 'Neo-Sindarin (Fiona Jallings)', note: 'Fan-made word for “welcome”' },
  na: { el: 'Ná', literal: 'it is (so)', status: 'A', where: 'Parma Eldalamberon 22, p. 166', note: 'Tolkien’s Quenya “yes”: literally “it is”' },
  nato: { el: 'Náto', literal: 'it is that', status: 'A', where: 'Vinyar Tengwar 49, p. 28', note: 'Tolkien’s emphatic “yes”' },
  la: { el: 'Lá', literal: 'no, not', status: 'A', where: 'Parma Eldalamberon 22, p. 153', note: 'Tolkien’s Quenya “no”, also his word for “not”' },
  ui: { el: 'Ui', literal: 'no, it is not', status: 'A', where: 'Vinyar Tengwar 49, p. 28', note: 'Tolkien’s answer “no, it is not so”' },
  baw: { el: 'Baw!', literal: 'no! don’t!', status: 'A', where: 'Parma Eldalamberon 17, p. 143', note: 'Tolkien’s Sindarin “no!”, a refusal or “don’t!”' },
  diheno: { el: 'Díheno nin', literal: 'forgive me', status: 'D', where: 'Vinyar Tengwar 44 (Tolkien’s Sindarin Lord’s Prayer)', note: 'Built from Tolkien’s díheno ammen “forgive us”. Elves would ask forgiveness rather than say “sorry”' },
  apsene: { el: 'Á nin apsenë', literal: 'forgive me', status: 'D', where: 'Vinyar Tengwar 43 (Tolkien’s Quenya Lord’s Prayer)', note: 'Built like Tolkien’s ámen apsenë “forgive us”, with nin “me”. Elves would ask forgiveness rather than say “sorry”' },
  manen: { el: 'Manen nalyë?', literal: 'how are you?', status: 'N', where: 'Neo-Quenya, after Tolkien’s manen “how”', note: 'Fan-made, but built on Tolkien’s own question manen lambë Quendion ahyanë? “how did the language of the Elves change?” (The Peoples of Middle-earth). He never wrote “how are you”' },
  naw: { el: 'Naw', literal: 'yes', status: 'N', where: 'Neo-Sindarin', note: 'Fan-made: Tolkien left no Sindarin “yes” (Eldamo checked). Quenya has his ná' },
  eru: { el: 'Nai Eru tye mánata', literal: 'may God bless you', status: 'C', where: 'Parma Eldalamberon 17, p. 75', note: 'Tolkien’s own words' },
}

// [English forms, Sindarin answers, Quenya answers, what to say when a language has none]
const GROUPS = [
  { en: 'hello|hi|hey|hiya|howdy|greetings|hello there|hi there|hey there|hello friend|hi friend|yo|hail|good to see you all',
    S: ['suilad', 'govannen'], Q: ['aiya', 'alla'] },
  { en: 'goodbye|good bye|bye|bye bye|farewell|see you|see you later|see ya|so long|cheerio|later|until next time|till next time|until we meet again|take care|be well|fare well|safe travels|safe journey|travel safely',
    S: ['navaer', 'novaer'], Q: ['namarie', 'anamarie'] },
  { en: 'good luck|best of luck|good fortune|all the best',
    S: ['navaer'], Q: ['namarie', 'anamarie'],
    why: 'Tolkien left no “good luck” wish. He had words for good fortune (Quenya almë, Sindarin alwed “fortunate”) but never used them as a wish, so the closest he wrote is namárië, “be well”.' },
  { en: 'how are you|how are you doing|how are ya|how r u|hows it going|how is it going|how do you do|whats up|sup|how have you been|are you well|are you ok|are you okay|how are things|how goes it|you alright|you ok',
    S: ['govannen'], Q: ['anamarie', 'manen', 'aiya'],
    why: 'Tolkien never wrote “how are you”. He did ask questions with manen “how”, but his own closest greeting is this wish.' },
  { en: 'i am fine|im fine|i am good|im good|i am well|im well|i am ok|im ok|i am okay|im okay|fine|fine thanks|fine thank you|good thanks|good thank you|not bad|very well|all good|doing well|im doing well|i am doing well',
    S: ['mae'], Q: ['marienin'] },
  { en: 'nice to meet you|nice to see you|pleased to meet you|good to meet you|glad to meet you|good to see you|glad to see you|great to see you|lovely to meet you|lovely to see you|it is good to see you|its good to see you|its nice to meet you|it is nice to meet you|well met|nice meeting you',
    S: ['govannen'], Q: ['elen'] },
  { en: 'thank you|thanks|thank you very much|thanks a lot|many thanks|thank you so much|thanks so much|ty|thanks very much|cheers|much obliged',
    S: ['hannon', 'hannad'], Q: ['hantanyel'] },
  { en: 'please|pretty please|if you please',
    S: ['listo'], Q: ['mecin'] },
  { en: 'welcome|welcome home|welcome friend|welcome back|you are welcome here',
    S: ['govannen', 'galdol'], Q: ['alla'] },
  { en: 'yes|yeah|yep|yup|aye|indeed|it is so|of course|certainly|correct|thats right|that is right',
    S: ['naw'], Q: ['na', 'nato'] },
  { en: 'no|nope|nah|no way|not at all|certainly not|of course not',
    S: ['baw'], Q: ['la', 'ui'] },
  { en: 'sorry|im sorry|i am sorry|so sorry|i am so sorry|im so sorry|my apologies|i apologise|i apologize|pardon me|pardon|forgive me|please forgive me|excuse me',
    S: ['diheno'], Q: ['apsene'] },
  { en: 'bless you|god bless you|god bless|may god bless you',
    S: [], Q: ['eru'], missing: 'Tolkien’s Sindarin elia- means to bless a piece of work, not a person, and he left no Sindarin “bless you”. He wrote one in Quenya, nai Eru tye mánata “may God bless you”: try switching to Quenya.' },
]

const plain = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[!?.,;:]+/g, ' ').replace(/\s+/g, ' ').trim()
const BY_EN = new Map()
for (const g of GROUPS) for (const e of g.en.split('|')) BY_EN.set(e, g)

export function everyday(english, lang) {
  const t = plain(english)
  // allow a friendly name or “my friend” after the greeting: “hello friend”, “thank you, Sam”
  const g = BY_EN.get(t) || BY_EN.get(t.replace(/\s+(my )?(friend|friends|all|everyone)$/, ''))
  if (!g) return null
  const [first, ...rest] = (g[lang] || []).map((k) => W[k])
  if (!first) return { missing: g.missing || 'Tolkien left no way to say this.', english: t }
  return { choice: first, alternatives: rest, why: g.why || null, english: t }
}

// every English form, for tests and for the learning examples
export const EVERYDAY_ENGLISH = [...BY_EN.keys()]
