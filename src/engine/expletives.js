// Swearing. Tolkien's Elves do not swear casually: curses and oaths are grave things in his world
// (the Oath of Fëanor, the Curse of Mandos). So a swear word on its own is answered with the way an Elf
// would actually vent, using only words Tolkien wrote, and the result says plainly that this is an
// equivalent, not a translation.

const W = {
  ai: { el: 'Ai!', gloss: 'ah! alas!', status: 'A', where: 'The Lord of the Rings', note: 'Tolkien’s own cry of dismay, used by Legolas and Galadriel' },
  rhach: { el: 'Rhach!', gloss: 'curse!', status: 'D', where: 'Morgoth’s Ring', note: 'Tolkien’s word for a curse, as in Narn e·’Rach Morgoth “Tale of the Curse of Morgoth”' },
  saw: { el: 'Saw!', gloss: 'filth!', status: 'A', where: 'Parma Eldalamberon 17', note: 'Tolkien’s word for filth or rot' },
  drego: { el: 'Drego!', gloss: 'flee! begone!', status: 'A', where: 'Unfinished Tales', note: 'Tolkien’s command “flee!”, from the battle-cry Lacho calad! Drego morn!' },
  ogron: { el: 'Ogron!', gloss: 'evil one!', status: 'A', where: 'Parma Eldalamberon 17', note: 'Tolkien’s word for a wicked person' },
  glamhoth: { el: 'Gurth an Glamhoth!', gloss: 'death to the orc-horde!', status: 'C', where: 'Unfinished Tales, p. 39', note: 'A war-cry Tolkien wrote' },
  huna: { el: 'Húna!', gloss: 'accursed!', status: 'A', where: 'Parma Eldalamberon 17', note: 'Tolkien’s word for “cursed, accursed”' },
  soa: { el: 'Söa!', gloss: 'filth!', status: 'A', where: 'Parma Eldalamberon 17', note: 'Tolkien’s word for filth' },
  saura: { el: 'Saura!', gloss: 'foul! vile!', status: 'A', where: 'Parma Eldalamberon 17', note: 'Tolkien’s word for foul and stinking, the root of the name Sauron' },
  heca: { el: 'Heca!', gloss: 'begone! stand aside!', status: 'A', where: 'The War of the Jewels', note: 'Tolkien’s own word for “begone!”' },
  uvanimo: { el: 'Úvanimo!', gloss: 'monster!', status: 'A', where: 'Parma Eldalamberon 17', note: 'Tolkien’s word for a monster or corrupt creature' },
}

// feeling → [Sindarin choices, Quenya choices], best first
const FEELINGS = {
  anger: { S: ['rhach', 'saw', 'ai', 'glamhoth'], Q: ['huna', 'saura', 'soa', 'ai'], sense: 'anger' },
  filth: { S: ['saw', 'rhach', 'ai'], Q: ['soa', 'saura', 'ai'], sense: 'disgust or dismay' },
  curse: { S: ['rhach', 'ai', 'saw'], Q: ['huna', 'ai', 'saura'], sense: 'a curse' },
  dismay: { S: ['ai', 'rhach'], Q: ['ai', 'huna'], sense: 'dismay' },
  begone: { S: ['drego', 'rhach'], Q: ['heca', 'huna'], sense: '“go away!”' },
  insult: { S: ['ogron', 'saw'], Q: ['uvanimo', 'saura'], sense: 'an insult' },
}

const PATTERNS = [
  [/^(?:(?:oh|ah|aw|well) )?(?:fuck|fucking|fuckin|fck|f\*+k)(?: (?:off|you|yourself|away))$|^(?:go away|get lost|piss off|bugger off|sod off|get out|begone|shove off|get stuffed|screw you|sod you|bugger you|naff off|eff off)$/, 'begone'],
  // “to hell with you” and friends are brush-offs, not swearing at the world: same as “fuck off”
  [/^(?:(?:oh|ah|well) )?(?:(?:go|get) to hell|to hell with (?:you|ye|it|this|that|them|him|her|all of you|everything)|go to the devil|the devil take you|be damned|go and be damned)$/, 'begone'],
  [/^(?:(?:oh|ah|aw|well|holy) )?(?:fuck|fucking hell|fuckin hell|fuck it|fuck this|fuck me|fuck that|fucking|motherfucker|fck|f\*+k|wtf|what the fuck|what the hell)$/, 'anger'],
  [/^(?:(?:oh|ah|aw|well|holy) )?(?:shit|shite|bullshit|crap|oh crap|sh\*t|shitty|ugh|yuck|gross)$/, 'filth'],
  [/^(?:(?:oh|ah|well) )?(?:god ?damn(?: it)?|goddamn(?:it)?|damn(?: it| you| this)?|dammit|damnit|darn(?: it)?|curse(?:s| it| you)?|bugger|bollocks|blast(?: it)?|son of a bitch)$/, 'curse'],
  [/^(?:(?:oh|ah|well) )?(?:hell|bloody hell|oh hell|oh no|oh god|oh my god|omg|alas|dang|drat)$/, 'dismay'],
  [/^(?:you )?(?:bastard|asshole|arsehole|jerk|prick|dick|dickhead|scumbag|bitch|idiot|moron|wanker|twat|piece of shit)$/, 'insult'],
]

const plain = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[!?.,]+/g, ' ').replace(/\s+/g, ' ').trim()

export function expletive(english, lang) {
  const t = plain(english)
  const hit = PATTERNS.find(([re]) => re.test(t))
  if (!hit) return null
  const feeling = FEELINGS[hit[1]]
  const [first, ...rest] = feeling[lang].map((k) => W[k])
  return {
    feeling: feeling.sense,
    choice: first,
    alternatives: rest,
  }
}

export function isSwear(word) {
  return /^(fuck\w*|shit\w*|damn\w*|goddamn\w*|crap|bastard|asshole|arsehole|bitch|wank\w*|twat|prick|dick)$/.test(word)
}
