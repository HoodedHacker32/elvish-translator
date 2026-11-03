import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { translate, compose, LEXICON, CANON } from './engine/translate.js'
import { toEnglish } from './engine/reverse.js'
import { tolkienUse, TOLKIEN_PHRASES } from './engine/phrasebook.js'
import { runExam } from './engine/exam.js'
import { toTengwar } from './engine/tengwar.js'
import { respell, respellLine, pronunciationTips } from './engine/pronounce.js'
import { SOURCES, STATUS } from './data/sources.js'
import { TRUST } from './engine/trust.js'

const LANGS = { S: 'Sindarin', Q: 'Quenya' }
const EXAMPLES = {
  S: ['Speak, friend, and enter', 'Hello', 'The stars are bright', 'I will sing to the moon', 'Nice to meet you', 'Do not flee'],
  Q: ['A star shines on the hour of our meeting', 'How are you?', 'Farewell! May you find Valimar', 'I see the old tower', 'Please', 'My friend'],
}
const STATUS_ORDER = ['C', 'A', 'D', 'E', 'N', 'P', 'G']

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage unavailable */ } },
}

// ——— icons (one stroke family) ———
const Icon = ({ d, size = 18 }) => (
  <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)
const I = {
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  save: <path d="M6 4h12v16l-6-4-6 4z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  swap: <><path d="M7 7h11l-3-3" /><path d="M17 17H6l3 3" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  print: <><path d="M7 9V4h10v5" /><rect x="4" y="9" width="16" height="7" rx="1.5" /><path d="M7 14h10v6H7z" /></>,
}

function LeafMark({ status }) {
  const k = STATUS[status]?.key || 'gap'
  return (
    <svg className={`leafmark leafmark--${k}`} width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 14C2 7 7 2 14 2c0 7-5 12-12 12Z" />
      <path className="vein" d="M2.5 13.5 10 6" />
    </svg>
  )
}

function useCopy() {
  const [copied, setCopied] = useState(null)
  const copy = useCallback(async (text, key) => {
    try { await navigator.clipboard.writeText(text) } catch {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove()
    }
    setCopied(key); setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600)
  }, [])
  return [copied, copy]
}

// A shared link carries the text, language and direction in the address: #l=S&d=to&t=...
function readShared() {
  try {
    const p = new URLSearchParams(window.location.hash.slice(1))
    const t = p.get('t')
    if (!t) return null
    return { text: t.slice(0, 400), lang: p.get('l') === 'Q' ? 'Q' : 'S', dir: p.get('d') === 'from' ? 'from' : 'to' }
  } catch { return null }
}
export function shareLink(text, lang, dir) {
  const p = new URLSearchParams({ l: lang, d: dir, t: text.trim() })
  return `${window.location.origin}${window.location.pathname}#${p.toString()}`
}

export default function App() {
  const shared = useMemo(readShared, [])
  const [lang, setLang] = useState(() => shared?.lang || store.get('lang', 'S'))
  const [dir, setDir] = useState(() => shared?.dir || store.get('dir', 'to'))
  const [view, setView] = useState('translate')
  const [text, setText] = useState(() => (shared?.dir !== 'from' && shared?.text) || store.get('draft', 'Speak, friend, and enter'))
  const [elvish, setElvish] = useState(() => (shared?.dir === 'from' && shared?.text) || store.get('draftElvish', 'Pedo mellon a minno'))
  useEffect(() => store.set('lang', lang), [lang])
  useEffect(() => store.set('dir', dir), [dir])
  useEffect(() => store.set('draft', text), [text])
  useEffect(() => store.set('draftElvish', elvish), [elvish])
  // once a shared link has been opened, tidy the address so later edits don’t look shared
  useEffect(() => { if (shared) history.replaceState(null, '', window.location.pathname) }, [shared])

  const useLine = (line, l) => { setLang(l); setDir('to'); setText(line); setView('translate') }
  const readLine = (line, l) => { setLang(l); setDir('from'); setElvish(line); setView('translate') }
  const swap = (fromText, toText) => {
    // swapping direction carries the current result across, like any translator
    if (dir === 'to') { if (toText) setElvish(toText); setDir('from') } else { if (toText) setText(toText); setDir('to') }
  }

  return (
    <div className="app">
      <header className="bar">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setView('translate') }}>
          <span className="brand__elv">Lam Edhellen</span>
          <span className="brand__sub">the Elvish tongue</span>
        </a>
        <div className="tabs" role="tablist" aria-label="Elvish language">
          {Object.entries(LANGS).map(([k, name]) => (
            <button key={k} role="tab" aria-selected={lang === k} className={lang === k ? 'on' : ''} onClick={() => setLang(k)}>{name}</button>
          ))}
        </div>
        <nav className="nav" aria-label="Sections">
          {[['translate', 'Translate'], ['lexicon', 'Lexicon'], ['canon', 'Tolkien’s lines'], ['about', 'How it works']].map(([k, label]) => (
            <button key={k} className={view === k ? 'on' : ''} aria-current={view === k ? 'page' : undefined} onClick={() => setView(k)}>{label}</button>
          ))}
        </nav>
      </header>
      <main>
        {view === 'translate' && dir === 'to' && <TranslateView lang={lang} setLang={setLang} text={text} setText={setText} onSwap={swap} />}
        {view === 'translate' && dir === 'from' && <ReverseView lang={lang} setLang={setLang} text={elvish} setText={setElvish} onSwap={swap} />}
        {view === 'lexicon' && <LexiconView lang={lang} />}
        {view === 'canon' && <CanonView lang={lang} onUse={useLine} onRead={readLine} />}
        {view === 'about' && <AboutView />}
      </main>
      <footer className="foot">
        Every word shows where it comes from: Tolkien’s finished language (solid leaf), his earlier drafts (dashed leaf),
        or Neo-Elvish words by later fans (gold). Gaps with no word at all are marked in rust.
        Tengwar set in Alcarin Tengwar by Toshi Omagari (SIL Open Font License).
        Most of the vocabulary comes from <a href="https://eldamo.org" target="_blank" rel="noreferrer">Eldamo</a>, the Elvish lexicon by Paul Strack (CC BY 4.0).
      </footer>
    </div>
  )
}

// ——— Translate ———

// “English → Sindarin” / “Sindarin → English”, with a swap button between
function DirSwitch({ lang, dir, onSwap, htmlFor }) {
  const from = dir === 'to' ? 'English' : LANGS[lang]
  const to = dir === 'to' ? LANGS[lang] : 'English'
  return (
    <div className="dir">
      <label className="label" htmlFor={htmlFor}>{from}</label>
      <button type="button" className="dir__swap" onClick={onSwap} aria-label={`Swap to ${to} → ${from}`} title="Swap direction">
        <Icon d={I.swap} size={16} />
      </button>
      <span className="label dir__to">{to}</span>
    </div>
  )
}

function TranslateView({ lang, setLang, text, setText, onSwap }) {
  const [live, setLive] = useState(text)
  const [hover, setHover] = useState(null)
  const [saved, setSaved] = useState(() => store.get('saved', []))
  const [copied, copy] = useCopy()
  const [pulse, setPulse] = useState(0)
  const stageRef = useRef(null)

  // translate once the visitor pauses typing, not on every keystroke
  const TYPING_PAUSE = 800
  useEffect(() => { const t = setTimeout(() => setLive(text), TYPING_PAUSE); return () => clearTimeout(t) }, [text])
  const typing = text.trim() !== live.trim()
  useEffect(() => store.set('saved', saved), [saved])

  const result = useMemo(() => translate(live, lang), [live, lang])
  const tengwar = useMemo(() => toTengwar(result.line, lang), [result.line, lang])
  const sayIt = useMemo(() => result.items.filter((it) => it.status !== 'G').map((it) => ({ el: it.el, say: respell(it.el, lang) })), [result, lang])
  const tips = useMemo(() => pronunciationTips(result.line, lang), [result.line, lang])
  const empty = !live.trim()
  const [reveal, setReveal] = useState(false)
  useEffect(() => setReveal(false), [live, lang])
  const level = result.trust.level
  const multi = result.mode === 'multi'
  const hidden = level === 'unsafe' && !reveal && !multi
  const useEnglish = (en) => { setText(en); setLive(en) }
  const [printing, setPrinting] = useState(false)
  // only lines worth carving: Tolkien's own, or built purely from his words and grammar
  const printable = ['exact', 'safe', 'idiom'].includes(level) && !multi

  const submit = (e) => { e?.preventDefault(); setLive(text); setPulse((p) => p + 1) }
  const isSaved = saved.some((s) => s.line === result.line && s.lang === lang)
  const toggleSave = () => {
    if (isSaved) setSaved(saved.filter((s) => !(s.line === result.line && s.lang === lang)))
    else setSaved([{ en: live.trim(), line: result.line, lang }, ...saved].slice(0, 12))
  }

  return (
    <section className="stage" ref={stageRef} key={pulse}>
      <form className="panel input" onSubmit={submit}>
        <DirSwitch lang={lang} dir="to" htmlFor="english" onSwap={() => onSwap(text, !empty && !hidden ? result.line : '')} />
        <textarea
          id="english" value={text} rows={4} spellCheck="true" maxLength={400}
          placeholder="Type something to say in Elvish…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e) }}
        />
        <div className="input__row">
          <button type="submit" className="btn btn--primary">Translate <Icon d={I.arrow} /></button>
          {text && <button type="button" className="btn btn--ghost" onClick={() => setText('')}>Clear</button>}
        </div>

        {result.english.length > 0 && (
          <div className="parsed" aria-label="How the English was read">
            {result.english.filter((t) => !t.punct).map((t) => (
              <span
                key={t.i}
                data-en={t.item ?? undefined}
                className={'chip' + (t.dropped ? ' chip--dropped' : '') + (t.item != null && hover === t.item ? ' is-lit' : '')}
                title={t.dropped || undefined}
                onMouseEnter={() => t.item != null && setHover(t.item)}
                onMouseLeave={() => setHover(null)}
              >{t.text}</span>
            ))}
          </div>
        )}
        {result.english.some((t) => t.dropped) && <p className="hint">Faded words have no Elvish equivalent and are left out. Hover one to see why.</p>}

        <div className="examples">
          <span className="hint">Try</span>
          {EXAMPLES[lang].map((ex) => <button type="button" key={ex} className="link" onClick={() => { setText(ex); setLive(ex) }}>{ex}</button>)}
        </div>

        {saved.length > 0 && (
          <div className="saved">
            <h3 className="label">Saved</h3>
            <ul>
              {saved.map((s, i) => (
                <li key={i}>
                  <button type="button" className="saved__item" onClick={() => { setLang(s.lang); setText(s.en); setLive(s.en) }}>
                    <span className="saved__elv">{s.line}</span>
                    <span className="saved__en">{s.en} · {LANGS[s.lang]}</span>
                  </button>
                  <button type="button" className="icon-btn" aria-label={`Remove ${s.line}`} onClick={() => setSaved(saved.filter((_, k) => k !== i))}><Icon d={I.close} size={14} /></button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>

      <div className={'panel output' + (typing ? ' is-typing' : '')} aria-live="polite" aria-busy={typing}>
        <div className="output__head">
          <span className="label">{LANGS[lang]}{typing && <span className="typing-hint"> · waiting for you to finish typing…</span>}</span>
          {!empty && !hidden && (
            <div className="output__actions">
              <button className="btn btn--quiet" onClick={() => copy(result.line, 'line')}><Icon d={copied === 'line' ? I.check : I.copy} />{copied === 'line' ? 'Copied' : 'Copy'}</button>
              <button className="btn btn--quiet" onClick={() => copy(tengwar, 'teng')}><Icon d={copied === 'teng' ? I.check : I.copy} />{copied === 'teng' ? 'Copied' : 'Copy Tengwar'}</button>
              <button className="btn btn--quiet" aria-pressed={isSaved} onClick={toggleSave}><Icon d={isSaved ? I.check : I.save} />{isSaved ? 'Saved' : 'Save'}</button>
              <button className="btn btn--quiet" onClick={() => copy(shareLink(live, lang, 'to'), 'link')}><Icon d={copied === 'link' ? I.check : I.link} />{copied === 'link' ? 'Link copied' : 'Share link'}</button>
              <button
                className="btn btn--quiet" onClick={() => setPrinting(true)} disabled={!printable}
                title={printable ? 'A clean sheet to print, frame or take to a tattoo artist' : 'Only lines rated “Tolkien’s exact words” or “Built from Tolkien’s words” can be printed'}
              ><Icon d={I.print} />Print</button>
            </div>
          )}
        </div>
        {printing && <PrintSheet result={result} lang={lang} english={live.trim()} tengwar={tengwar} onClose={() => setPrinting(false)} />}

        {empty ? (
          <p className="output__empty">Your Elvish will appear here, word by word, with where each word comes from.</p>
        ) : hidden ? (
          <Refusal result={result} lang={lang} onUse={useEnglish} onReveal={() => setReveal(true)} />
        ) : multi ? (
          <Segments segments={result.segments} lang={lang} onUse={useEnglish} />
        ) : (
          <>
            <TrustBanner trust={result.trust} />
            {level === 'unsafe' && <p className="guess-tag">Best guess only. Do not use this for anything that matters.</p>}
            <p className={'elvish' + (level === 'unsafe' ? ' is-guess' : '')} lang={lang === 'S' ? 'sjn' : 'qya'}>
              {result.items.map((it, i) => (
                <span key={i}>
                  <span
                    data-el={i}
                    className={`w w--${STATUS[it.status]?.key}` + (hover === i ? ' is-lit' : '')}
                    onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                  >{it.el}</span>{it.punct || ''}{i < result.items.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>
            {tengwar && <p className="tengwar" aria-label="Tengwar script">{tengwar}</p>}

            <div className="say">
              <div className="say__head">
                <span className="label">Say it</span>
              </div>
              <p className="say__line">
                {sayIt.map((s, i) => (
                  <span key={i} className="say__word" title={s.el}>{s.say}</span>
                ))}
              </p>
              {tips.length > 0 && <ul className="say__tips">{tips.map((t) => <li key={t}>{t}</li>)}</ul>}
              <p className="hint">CAPITALS mark the stressed part of each word.</p>
            </div>

            {result.mode === 'canon' && (
              <div className="canon-note">
                <LeafMark status="C" />
                <div>
                  <strong>Tolkien wrote this exact line.</strong> {result.canon.meaning}. {result.canon.who}, <cite>{result.canon.where}</cite>.
                </div>
              </div>
            )}
            {result.mode === 'tolkien' && (
              <div className="canon-note">
                <LeafMark status="C" />
                <div>
                  <strong>Tolkien wrote this exact line.</strong> His translation: “{result.canon.meaning}”. <cite>{result.canon.where}</cite>.
                  {result.canon.uncertain && ' Part of the English is a scholar’s reading of his notes.'}
                </div>
              </div>
            )}
            {result.mode === 'everyday' && (
              <>
                <div className="canon-note">
                  <LeafMark status={result.everyday.status} />
                  <div>
                    <strong>Literally: “{result.everyday.literal}”.</strong> {result.everyday.why ? result.everyday.why + ' ' : ''}{result.everyday.note}. <cite>{result.everyday.where}</cite>.
                  </div>
                </div>
                {result.everyday.alternatives.length > 0 && (
                  <div className="refusal__block">
                    <span className="label">Other ways to say it</span>
                    <ul className="closest">
                      {result.everyday.alternatives.map((a) => (
                        <li key={a.el} className="closest__btn closest__btn--static">
                          <span className="closest__elv" lang={lang === 'S' ? 'sjn' : 'qya'}>{a.el}</span>
                          <span className="closest__en">literally “{a.literal}” · {respell(a.el, lang)} · {a.status === 'N' ? 'fan-made · ' : ''}{a.note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            {result.mode === 'expletive' && (
              <div className="refusal__block">
                <p className="hint">Elvish has no swear words: Tolkien’s Elves never cursed lightly. This says the same feeling with a word Tolkien wrote.</p>
                <span className="label">Other ways an Elf might put it</span>
                <ul className="closest">
                  {result.expletive.alternatives.map((a) => (
                    <li key={a.el} className="closest__btn closest__btn--static">
                      <span className="closest__elv" lang={lang === 'S' ? 'sjn' : 'qya'}>{a.el}</span>
                      <span className="closest__en">“{a.gloss}” · {respell(a.el, lang)} · {a.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.mode === 'composed' && <Summary summary={result.summary} />}
            {level !== 'exact' && <Closest lines={result.closest} onUse={useEnglish} />}
            {result.canonElsewhere.map((c) => (
              <div key={c.id} className="canon-note canon-note--other">
                <LeafMark status="C" />
                <div>
                  Tolkien wrote this line in {LANGS[c.lang]}: <span className="canon-note__elv">{c.elvish}</span> <cite>{c.where}</cite>.
                  <button className="btn btn--quiet" onClick={() => setLang(c.lang)}><Icon d={I.swap} />Show in {LANGS[c.lang]}</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {!empty && !hidden && !multi && (
        <ol className="leaves" aria-label="Word by word">
          {result.items.map((it, i) => (
            <li
              key={i}
              data-leaf={i}
              className={`leaf leaf--${STATUS[it.status]?.key}` + (hover === i ? ' is-lit' : '')}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)} onBlur={() => setHover(null)}
              tabIndex={0}
            >
              <span className="leaf__w">{it.el}</span>
              <span className="leaf__g">{it.gloss}</span>
              <span className="leaf__say">{it.status !== 'G' ? respell(it.el, lang) : '—'}</span>
              <span className="leaf__pos">{it.pos}</span>
              {it.steps.length > 0 && <span className="leaf__steps">{it.steps.join(' · ')}</span>}
              <span className="leaf__tag"><LeafMark status={it.status} />{STATUS[it.status]?.label}</span>
              {it.sourceLabel && <span className="leaf__src">{it.sourceLabel}</span>}
              <TolkienUse word={it.el} lang={lang} />
            </li>
          ))}
        </ol>
      )}
      {!empty && !hidden && !multi && <Legend />}
      <Veins stageRef={stageRef} hover={hover} deps={[result, hover]} />
    </section>
  )
}

// “Tolkien used it: …” — the shortest of his own lines with this exact word
function TolkienUse({ word, lang }) {
  const p = useMemo(() => tolkienUse(word, lang), [word, lang])
  if (!p) return null
  return (
    <span className="leaf__use" title={`${p.elvish} — “${p.english}” (${p.where})`}>
      Tolkien used it: <i lang={lang === 'S' ? 'sjn' : 'qya'}>{p.elvish}</i> “{p.english}”
    </span>
  )
}

// A clean sheet to print: the line, large Tengwar, how to say it, and where it comes from
function PrintSheet({ result, lang, english, tengwar, onClose }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    document.body.classList.add('is-printing')
    return () => { window.removeEventListener('keydown', esc); document.body.classList.remove('is-printing') }
  }, [onClose])
  const source = result.canon?.where || (result.mode === 'composed' ? 'Composed from Tolkien’s own words and grammar by Lam Edhellen' : '')
  return (
    <div className="print-sheet" role="dialog" aria-label="Print view">
      <div className="print-sheet__bar">
        <span className="hint">Print it, save it as a PDF, or take it to an artist. Check the spelling letter by letter before any tattoo.</span>
        <div>
          <button className="btn btn--primary" onClick={() => window.print()}><Icon d={I.print} />Print</button>
          <button className="btn btn--ghost" onClick={onClose}>Close</button>
        </div>
      </div>
      <div className="print-sheet__page">
        <p className="print-sheet__tg" aria-label="Tengwar">{tengwar}</p>
        <p className="print-sheet__elv" lang={lang === 'S' ? 'sjn' : 'qya'}>{result.line}</p>
        <p className="print-sheet__say">{respellLine(result.line, lang)}</p>
        <p className="print-sheet__en">“{english}”</p>
        <p className="print-sheet__meta">{LANGS[lang]} · {TRUST[result.trust.level].label}{source ? ` · ${source}` : ''}</p>
      </div>
    </div>
  )
}

// ——— Elvish → English ———

const READ_EXAMPLES = {
  S: ['Pedo mellon a minno', 'Le melin', 'I gor nín', 'Mae govannen, mellon', 'Ú-linnathon'],
  Q: ['Namárië! Nai hiruvalyë Valimar.', 'Hiruvalyë Valimar', 'Melinyel', 'I Eldar lindar nu i eleni', 'Polin quetë'],
}

function ReverseView({ lang, setLang, text, setText, onSwap }) {
  const [live, setLive] = useState(text)
  const [copied, copy] = useCopy()
  useEffect(() => { const t = setTimeout(() => setLive(text), 800); return () => clearTimeout(t) }, [text])
  const typing = text.trim() !== live.trim()
  const result = useMemo(() => toEnglish(live, lang), [live, lang])
  const empty = !live.trim()
  const tengwar = useMemo(() => toTengwar(live, result.lang || lang), [live, lang, result.lang])
  const submit = (e) => { e?.preventDefault(); setLive(text) }
  const t = TRUST[result.trust.level]

  return (
    <section className="stage">
      <form className="panel input" onSubmit={submit}>
        <DirSwitch lang={lang} dir="from" htmlFor="elvish-in" onSwap={() => onSwap(text, !empty ? result.english : '')} />
        <textarea
          id="elvish-in" className="input--elvish" value={text} rows={4} spellCheck="false" maxLength={400} lang={lang === 'S' ? 'sjn' : 'qya'}
          placeholder={`Paste or type ${LANGS[lang]}…`}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e) }}
        />
        <div className="input__row">
          <button type="submit" className="btn btn--primary">Translate <Icon d={I.arrow} /></button>
          {text && <button type="button" className="btn btn--ghost" onClick={() => setText('')}>Clear</button>}
        </div>
        <p className="hint">Accents are optional: “namarie” finds “namárië”. Use ’ for a dropped letter (lúmenn’).</p>
        <div className="examples">
          <span className="hint">Try</span>
          {READ_EXAMPLES[lang].map((ex) => <button type="button" key={ex} className="link" onClick={() => { setText(ex); setLive(ex) }}>{ex}</button>)}
        </div>
      </form>

      <div className={'panel output' + (typing ? ' is-typing' : '')} aria-live="polite" aria-busy={typing}>
        <div className="output__head">
          <span className="label">English{typing && <span className="typing-hint"> · waiting for you to finish typing…</span>}</span>
          {!empty && (
            <div className="output__actions">
              <button className="btn btn--quiet" onClick={() => copy(result.english, 'en')}><Icon d={copied === 'en' ? I.check : I.copy} />{copied === 'en' ? 'Copied' : 'Copy'}</button>
              <button className="btn btn--quiet" onClick={() => copy(shareLink(live, lang, 'from'), 'link')}><Icon d={copied === 'link' ? I.check : I.link} />{copied === 'link' ? 'Link copied' : 'Share link'}</button>
            </div>
          )}
        </div>
        {empty ? (
          <p className="output__empty">The English meaning will appear here, with every Elvish word explained.</p>
        ) : (
          <>
            <div className={`trust trust--${result.trust.level}`} role="status">
              <TrustMark level={result.trust.level} />
              <div>
                <strong>{t.label}.</strong> <span>{t.blurb}</span>
                {result.trust.reasons.length > 0 && <ul className="trust__list">{result.trust.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
              </div>
            </div>
            <p className="english-out">{result.english}</p>
            {tengwar && <p className="tengwar tengwar--small" aria-label="Tengwar script">{tengwar}</p>}
            <div className="say">
              <div className="say__head">
                <span className="label">Say it</span>
              </div>
              <p className="say__line">{respellLine(live, result.lang || lang)}</p>
            </div>
            {result.tolkien && (
              <div className="canon-note">
                <LeafMark status="C" />
                <div><strong>Tolkien wrote this line</strong> and translated it himself. <cite>{result.tolkien.where}</cite>.</div>
              </div>
            )}
            {result.looksLike && (
              <div className="canon-note canon-note--other">
                <div>
                  This reads better as {LANGS[result.looksLike]}.
                  <button className="btn btn--quiet" onClick={() => setLang(result.looksLike)}><Icon d={I.swap} />Read as {LANGS[result.looksLike]}</button>
                </div>
              </div>
            )}
            {result.closest?.length > 0 && (
              <div className="refusal__block">
                <span className="label">Tolkien lines with these words</span>
                <ul className="closest">
                  {result.closest.map((p) => (
                    <li key={p.lang + p.elvish}>
                      <button className="closest__btn" onClick={() => { setLang(p.lang); setText(p.elvish); setLive(p.elvish) }}>
                        <span className="closest__elv">{p.elvish}</span>
                        <span className="closest__en">“{p.english}” · {LANGS[p.lang]} · <cite>{p.where}</cite></span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {!empty && (
        <ol className="leaves" aria-label="Word by word">
          {result.words.map((w, i) => (
            <li key={i} className={`leaf leaf--${STATUS[w.status]?.key || 'gap'}`} tabIndex={0}>
              <span className="leaf__w">{w.el}</span>
              <span className="leaf__g">{w.status === 'G' ? 'not found' : w.gloss}</span>
              {w.base && plainBase(w.base) !== plainBase(w.el) && <span className="leaf__say">from {w.base}</span>}
              {w.note && <span className="leaf__steps">{w.note}</span>}
              {w.alternatives?.length > 0 && <span className="leaf__steps">can also mean: {w.alternatives.join(', ')}</span>}
              <span className="leaf__tag"><LeafMark status={w.status} />{STATUS[w.status]?.label || 'Unknown'}</span>
              {w.sourceLabel && <span className="leaf__src">{w.sourceLabel}</span>}
              {w.status !== 'G' && <TolkienUse word={w.el} lang={result.lang || lang} />}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
const plainBase = (s) => s.toLowerCase().replace(/^-/, '')

// ——— How it works ———

function AboutView() {
  const [exam, setExam] = useState(null)
  // run the exam after the page paints: it translates ~250 of Tolkien's sentences
  useEffect(() => { const id = setTimeout(() => setExam(runExam(compose)), 50); return () => clearTimeout(id) }, [])
  const pct = (x) => `${Math.round(x * 100)}%`
  return (
    <section className="sheet about">
      <div className="sheet__head">
        <h1 className="sheet__title">How it works</h1>
        <p className="sheet__lede">Tolkien never finished his languages, and he left only a few hundred sentences. So this translator tells you, every time, how much of what it shows is really his.</p>
      </div>

      <h2 className="about__h">The ratings</h2>
      <dl className="about__list">
        {['exact', 'safe', 'idiom', 'caution', 'unsafe', 'gloss'].map((k) => (
          <div key={k} className={`about__row trust--${k}`}>
            <dt><TrustMark level={k} /> {TRUST[k].label}</dt>
            <dd>{TRUST[k].blurb}{k === 'unsafe' && ' The app shows why, offers a safe way to say it, and keeps the guess hidden unless you ask.'}</dd>
          </div>
        ))}
      </dl>

      <h2 className="about__h">Where each word comes from</h2>
      <dl className="about__list">
        {['C', 'A', 'D', 'E', 'N', 'P', 'G'].map((k) => (
          <div key={k} className="about__row">
            <dt><LeafMark status={k} /> {STATUS[k].label}</dt>
            <dd>{STATUS[k].blurb}</dd>
          </div>
        ))}
      </dl>

      <h2 className="about__h">How good is it?</h2>
      <p className="about__p">
        The app is tested against Tolkien himself: it is given the English of {exam ? exam.rows.length : 'about 250'} sentences Tolkien translated,
        and its Elvish is compared with what he actually wrote, word by word and in order.
      </p>
      {exam ? (
        <div className="about__score">
          {['S', 'Q'].map((l) => (
            <div key={l} className="about__stat">
              <span className="about__num">{pct(exam.summary[l].avg)}</span>
              <span className="hint">of Tolkien’s {LANGS[l]} words reproduced, in order, across {exam.summary[l].n} sentences; {exam.summary[l].exact} exactly right</span>
            </div>
          ))}
        </div>
      ) : <p className="hint">Running the test…</p>}
      <p className="about__p">
        That is far from perfect, and it is meant to be read honestly: much of the gap comes from Tolkien changing his own grammar over sixty years,
        so no single rulebook matches all of it. When you type one of his lines, you get his exact words instead of a composed one.
      </p>

      <h2 className="about__h">Elvish to English</h2>
      <p className="about__p">
        Paste any Sindarin or Quenya. Lines Tolkien wrote come back with his own translation. Anything else is read word by word: the app undoes
        Sindarin sound changes (<i>i gor</i> is <i>cor</i>, “ring”, softened after “the”) and Quenya endings (<i>elenion</i>, “of stars”),
        then puts the meanings into English order. Words it cannot find are marked, never guessed.
      </p>

      <h2 className="about__h">Credits</h2>
      <p className="about__p">
        Vocabulary and Tolkien’s phrases: <a href="https://eldamo.org" target="_blank" rel="noreferrer">Eldamo</a> by Paul Strack (CC BY 4.0).
        Tengwar: Alcarin Tengwar by Toshi Omagari (SIL Open Font License). The languages are J.R.R. Tolkien’s; this is an unofficial fan project.
      </p>
    </section>
  )
}

// A message with several sentences: each one is rated and shown on its own, so one weak part
// does not hide the rest.
function Segments({ segments, lang, onUse }) {
  const [shown, setShown] = useState({})
  return (
    <div className="segs">
      <p className="hint segs__intro">Rated sentence by sentence. Copy and Save use only the parts that translate reliably.</p>
      <ol className="segs__list">
        {segments.map((s, i) => {
          const r = s.result
          const lvl = r.trust.level
          const withheld = lvl === 'unsafe' && !shown[i]
          return (
            <li key={i} className={`seg-row seg-row--${lvl}`}>
              <div className="seg-row__head">
                <span className="seg-row__en">“{s.english}”</span>
                <span className={`trust-badge trust-badge--${lvl}`}><TrustMark level={lvl} />{TRUST[lvl].label}</span>
              </div>
              {withheld ? (
                <>
                  <ul className="trust__list">{r.trust.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
                  {r.trust.suggestions?.map((sg) => (
                    <button key={sg.english} className="suggest__btn seg-row__suggest" onClick={() => onUse(sg.english)}>
                      <span className="suggest__elv">{sg.line}</span>
                      <span className="suggest__en">Say “{sg.english}” instead · {TRUST[sg.level].label}</span>
                    </button>
                  ))}
                  <button className="btn btn--quiet seg-row__reveal" onClick={() => setShown({ ...shown, [i]: true })}>Show the best guess anyway</button>
                </>
              ) : (
                <>
                  <p className={'seg-row__elv' + (lvl === 'unsafe' ? ' is-guess' : '')} lang={lang === 'S' ? 'sjn' : 'qya'}>{r.line}</p>
                  <p className="seg-row__tg" aria-hidden="true">{toTengwar(r.line, lang)}</p>
                  <p className="seg-row__say">{respellLine(r.line, lang)}</p>
                  {lvl !== 'exact' && r.trust.reasons.length > 0 && <ul className="trust__list">{r.trust.reasons.map((x) => <li key={x}>{x}</li>)}</ul>}
                  {(r.mode === 'tolkien' || r.mode === 'canon') && <p className="hint">Tolkien’s own line · <cite>{r.canon.where}</cite></p>}
                </>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function TrustBanner({ trust }) {
  const t = TRUST[trust.level]
  return (
    <div className={`trust trust--${trust.level}`} role="status">
      <TrustMark level={trust.level} />
      <div>
        <strong>{t.label}.</strong> <span>{t.blurb}</span>
        {trust.level !== 'exact' && trust.reasons.length > 0 && (
          <ul className="trust__list">{trust.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        )}
      </div>
    </div>
  )
}

function TrustMark({ level }) {
  return (
    <svg className="trustmark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {level === 'exact' && <><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>}
      {level === 'safe' && <><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z" /></>}
      {level === 'idiom' && <><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9.5h8M8 12.5h5" /></>}
      {level === 'gloss' && <><path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5z" /><path d="M12 6v13.5" /></>}
      {level === 'caution' && <><path d="M12 4 2.5 20h19z" /><path d="M12 10v4.5M12 17.5v.01" /></>}
      {level === 'unsafe' && <><circle cx="12" cy="12" r="9" /><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" /></>}
    </svg>
  )
}

function Refusal({ result, lang, onUse, onReveal }) {
  const { trust } = result
  return (
    <div className="refusal">
      <div className="refusal__head">
        <TrustMark level="unsafe" />
        <h2 className="refusal__title">I can’t translate this reliably.</h2>
      </div>
      <ul className="trust__list">{trust.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      {trust.cautions?.length > 0 && <ul className="trust__list trust__list--soft">{trust.cautions.map((r) => <li key={r}>{r}</li>)}</ul>}

      {trust.suggestions.length > 0 && (
        <div className="refusal__block">
          <span className="label">Say this instead</span>
          <ul className="suggest">
            {trust.suggestions.map((s) => (
              <li key={s.english}>
                <button className="suggest__btn" onClick={() => onUse(s.english)}>
                  <span className="suggest__elv" lang={lang === 'S' ? 'sjn' : 'qya'}>{s.line}</span>
                  <span className="suggest__en">“{s.english}” · {TRUST[s.level].label}</span>
                </button>
                <span className="suggest__why">{s.why}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.canonElsewhere.map((c) => (
        <p key={c.id} className="hint">Tolkien wrote this in {LANGS[c.lang]}: <span className="canon-note__elv">{c.elvish}</span> <cite>{c.where}</cite>.</p>
      ))}
      <Closest lines={result.closest} onUse={onUse} />
      <button className="btn btn--ghost refusal__reveal" onClick={onReveal}>Show the best guess anyway</button>
    </div>
  )
}

function Closest({ lines, onUse }) {
  if (!lines?.length) return null
  return (
    <div className="refusal__block">
      <span className="label">Closest lines Tolkien wrote</span>
      <ul className="closest">
        {lines.map((p) => (
          <li key={p.lang + p.elvish}>
            <button className="closest__btn" onClick={() => onUse(p.english)} title="Use Tolkien’s own line">
              <span className="closest__elv" lang={p.lang === 'S' ? 'sjn' : 'qya'}>{p.elvish}</span>
              <span className="closest__en">“{p.english}” · {LANGS[p.lang]} · <cite>{p.where}</cite></span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Summary({ summary }) {
  const parts = STATUS_ORDER.filter((k) => summary[k])
  if (!parts.length) return null
  return (
    <p className="summary">
      {parts.map((k) => (
        <span key={k} className="summary__part"><LeafMark status={k} />{summary[k]} {STATUS[k].label.toLowerCase()}</span>
      ))}
    </p>
  )
}

function Legend() {
  return (
    <dl className="legend">
      {STATUS_ORDER.map((k) => (
        <div key={k}><dt><LeafMark status={k} />{STATUS[k].label}</dt><dd>{STATUS[k].blurb}</dd></div>
      ))}
    </dl>
  )
}

// Silver veins from a hovered leaf up to its Elvish word, and from there back to the English.
function Veins({ stageRef, hover, deps }) {
  const [paths, setPaths] = useState([])
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage || hover == null) { setPaths([]); return }
    const measure = () => {
      const s = stage.getBoundingClientRect()
      const rel = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height } }
      const leaf = stage.querySelector(`[data-leaf="${hover}"]`)
      const word = stage.querySelector(`[data-el="${hover}"]`)
      const ens = [...stage.querySelectorAll(`[data-en="${hover}"]`)]
      const out = []
      if (word && leaf) {
        const a = rel(leaf); const b = rel(word)
        const x1 = a.x + a.w / 2; const y1 = a.y; const x2 = b.x + b.w / 2; const y2 = b.y + b.h
        const my = (y1 + y2) / 2
        out.push(`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`)
      }
      if (word) {
        for (const en of ens) {
          const a = rel(en); const b = rel(word)
          const sideBySide = a.x + a.w < b.x
          if (sideBySide) {
            const x1 = a.x + a.w; const y1 = a.y + a.h / 2; const x2 = b.x; const y2 = b.y + b.h * 0.6
            const mx = (x1 + x2) / 2
            out.push(`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`)
          } else {
            const x1 = a.x + a.w / 2; const y1 = a.y + a.h; const x2 = b.x + b.w / 2; const y2 = b.y
            const my = (y1 + y2) / 2
            out.push(`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`)
          }
        }
      }
      setBox({ w: s.width, h: s.height })
      setPaths(out)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  if (!paths.length) return null
  return (
    <svg className="veins" width={box.w} height={box.h} aria-hidden="true">
      {paths.map((d, i) => <path key={d + i} d={d} pathLength="1" />)}
    </svg>
  )
}

// ——— Lexicon ———

function LexiconView({ lang }) {
  const [q, setQ] = useState('')
  const [only, setOnly] = useState('all')
  const [limit, setLimit] = useState(200)
  useEffect(() => setLimit(200), [q, only, lang])
  const counts = useMemo(() => LEXICON[lang].reduce((c, r) => ((c[r[3]] = (c[r[3]] || 0) + 1), c), {}), [lang])
  const rows = useMemo(() => {
    const plain = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const n = plain(q.trim())
    const hits = LEXICON[lang].filter(([keys, el, , st]) => (only === 'all' || st === only) && (!n || keys.toLowerCase().includes(n) || plain(el).includes(n)))
    // exact English matches first, so searching “star” shows star before starfish
    if (n) hits.sort((a, b) => (a[0].split('|').includes(n) ? 0 : 1) - (b[0].split('|').includes(n) ? 0 : 1))
    return hits
  }, [q, only, lang])
  return (
    <section className="sheet">
      <div className="sheet__head">
        <h1 className="sheet__title">{LANGS[lang]} lexicon</h1>
        <p className="sheet__lede">
          {LEXICON[lang].length.toLocaleString()} words. {(counts.A || 0) + (counts.D || 0)} are Tolkien’s own from his finished language,{' '}
          {counts.E || 0} come from his earlier drafts, and {counts.N || 0} are Neo-Elvish words by later fans, marked in gold.
        </p>
      </div>
      <div className="filters">
        <label className="search">
          <Icon d={I.search} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search English or Elvish" aria-label="Search the lexicon" />
        </label>
        <div className="seg" role="group" aria-label="Filter by provenance">
          {[['all', 'All'], ['A', 'Attested'], ['D', 'Derived'], ['E', 'Earlier Tolkien'], ['N', 'Neo-Elvish']].map(([k, label]) => (
            <button key={k} className={only === k ? 'on' : ''} aria-pressed={only === k} onClick={() => setOnly(k)}>{label}</button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="output__empty">No word matches “{q}”. Tolkien’s vocabulary is small; try a simpler or older English word.</p>
      ) : (
        <table className="lex">
          <thead><tr><th>English</th><th>{LANGS[lang]}</th><th>Say it</th><th>Kind</th><th>Provenance</th></tr></thead>
          <tbody>
            {rows.slice(0, limit).map(([keys, el, pos, st, src, ex], i) => (
              <tr key={i} className={`lex--${STATUS[st].key}`}>
                <td>{keys.split('|').join(', ')}</td>
                <td className="lex__el">{el}</td>
                <td className="lex__say">{respell(el, lang)}</td>
                <td>{({ n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', prep: 'preposition', conj: 'conjunction', pron: 'pronoun', poss: 'possessive', dem: 'this/that', num: 'number', interj: 'interjection', 'v-cop': 'to be' })[pos] || pos}</td>
                <td>
                  <span className="leaf__tag"><LeafMark status={st} />{STATUS[st].label} · {SOURCES[src] || src}</span>
                  {ex?.note && <span className="lex__note">{ex.note}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {rows.length > limit && (
        <div className="more">
          <span className="hint">Showing {limit.toLocaleString()} of {rows.length.toLocaleString()}. Search to narrow it down.</span>
          <button className="btn btn--ghost" onClick={() => setLimit((l) => l + 400)}>Show more</button>
        </div>
      )}
    </section>
  )
}

// ——— Canon ———

function CanonView({ lang, onUse, onRead }) {
  const [q, setQ] = useState('')
  const [only, setOnly] = useState('here')
  const [limit, setLimit] = useState(60)
  useEffect(() => setLimit(60), [q, only, lang])
  const plain = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const n = plain(q.trim())
  const match = (elvish, english) => !n || plain(elvish).includes(n) || plain(english).includes(n)
  const famous = [...CANON]
    .filter((c) => (only === 'all' || c.lang === lang) && match(c.elvish, c.meaning))
    .sort((a, b) => (a.lang === lang ? -1 : 0) - (b.lang === lang ? -1 : 0))
  const famousSet = new Set(CANON.map((c) => plain(c.elvish).replace(/[^a-z ]/g, '')))
  const rest = TOLKIEN_PHRASES
    .filter((p) => (only === 'all' || p.lang === lang) && match(p.elvish, p.english) && !famousSet.has(plain(p.elvish).replace(/[^a-z ]/g, '')))
  return (
    <section className="sheet">
      <div className="sheet__head">
        <h1 className="sheet__title">Tolkien’s lines</h1>
        <p className="sheet__lede">Everything Tolkien himself wrote in Sindarin and Quenya that the app knows: {CANON.length} famous lines and {TOLKIEN_PHRASES.length} more from his books, letters and notes. Type the English in the translator and you get his words back exactly.</p>
      </div>
      <div className="filters">
        <label className="search">
          <Icon d={I.search} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Elvish or English, e.g. star, mellon" aria-label="Search Tolkien’s lines" />
        </label>
        <div className="seg" role="group" aria-label="Which language">
          {[['here', LANGS[lang]], ['all', 'Both languages']].map(([k, label]) => (
            <button key={k} className={only === k ? 'on' : ''} aria-pressed={only === k} onClick={() => setOnly(k)}>{label}</button>
          ))}
        </div>
      </div>
      {famous.length > 0 && <h2 className="about__h">Famous lines</h2>}
      <ul className="canon-list">
        {famous.map((c) => (
          <li key={c.id} className="canon-card">
            <p className="canon-card__elv" lang={c.lang === 'S' ? 'sjn' : 'qya'}>{c.elvish}</p>
            <p className="canon-card__tg" aria-hidden="true">{toTengwar(c.elvish, c.lang)}</p>
            <p className="canon-card__say">{respellLine(c.elvish, c.lang)}</p>
            <p className="canon-card__en">{c.meaning}</p>
            <p className="canon-card__src">{LANGS[c.lang]} · {c.who} · <cite>{c.where}</cite></p>
            <div className="canon-card__actions">
              <button className="btn btn--quiet" onClick={() => onUse(c.keys[0], c.lang)}>Translate the English <Icon d={I.arrow} /></button>
              <button className="btn btn--quiet" onClick={() => onRead(c.elvish, c.lang)}>Read word by word</button>
            </div>
          </li>
        ))}
      </ul>
      <h2 className="about__h">From Tolkien’s books, letters and notes <span className="hint">({rest.length})</span></h2>
      {rest.length === 0 ? (
        <p className="output__empty">Nothing matches “{q}”. Try a single word, in English or Elvish.</p>
      ) : (
        <ul className="lines">
          {rest.slice(0, limit).map((p) => (
            <li key={p.lang + p.elvish} className="lines__row">
              <button className="lines__btn" onClick={() => onRead(p.elvish, p.lang)} title="Read it word by word">
                <span className="lines__elv" lang={p.lang === 'S' ? 'sjn' : 'qya'}>{p.elvish}</span>
                <span className="lines__en">“{p.english}”{p.uncertain && <span className="hint"> · English partly a scholar’s reading</span>}</span>
                <span className="lines__src">{LANGS[p.lang]} · <cite>{p.where}</cite></span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {rest.length > limit && (
        <div className="more">
          <span className="hint">Showing {limit} of {rest.length}.</span>
          <button className="btn btn--ghost" onClick={() => setLimit((l) => l + 120)}>Show more</button>
        </div>
      )}
    </section>
  )
}
