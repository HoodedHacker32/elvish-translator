import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { translate, LEXICON, CANON } from './engine/translate.js'
import { toTengwar } from './engine/tengwar.js'
import { respell, respellLine, pronunciationTips } from './engine/pronounce.js'
import { SOURCES, STATUS } from './data/sources.js'
import { TRUST } from './engine/trust.js'

const LANGS = { S: 'Sindarin', Q: 'Quenya' }
const EXAMPLES = {
  S: ['Speak, friend, and enter', 'The stars are bright', 'I will sing to the moon', 'Well met', 'Do not flee'],
  Q: ['A star shines on the hour of our meeting', 'Farewell! May you find Valimar', 'I see the old tower', 'Hail Eärendil, brightest of stars', 'My friend'],
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

export default function App() {
  const [lang, setLang] = useState(() => store.get('lang', 'S'))
  const [view, setView] = useState('translate')
  const [text, setText] = useState(() => store.get('draft', 'Speak, friend, and enter'))
  useEffect(() => store.set('lang', lang), [lang])
  useEffect(() => store.set('draft', text), [text])

  const useLine = (line, l) => { setLang(l); setText(line); setView('translate') }

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
          {[['translate', 'Translate'], ['lexicon', 'Lexicon'], ['canon', 'Canon phrases']].map(([k, label]) => (
            <button key={k} className={view === k ? 'on' : ''} aria-current={view === k ? 'page' : undefined} onClick={() => setView(k)}>{label}</button>
          ))}
        </nav>
      </header>
      <main>
        {view === 'translate' && <TranslateView lang={lang} setLang={setLang} text={text} setText={setText} />}
        {view === 'lexicon' && <LexiconView lang={lang} />}
        {view === 'canon' && <CanonView lang={lang} onUse={useLine} />}
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

function TranslateView({ lang, setLang, text, setText }) {
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

  const submit = (e) => { e?.preventDefault(); setLive(text); setPulse((p) => p + 1) }
  const isSaved = saved.some((s) => s.line === result.line && s.lang === lang)
  const toggleSave = () => {
    if (isSaved) setSaved(saved.filter((s) => !(s.line === result.line && s.lang === lang)))
    else setSaved([{ en: live.trim(), line: result.line, lang }, ...saved].slice(0, 12))
  }

  return (
    <section className="stage" ref={stageRef} key={pulse}>
      <form className="panel input" onSubmit={submit}>
        <label className="label" htmlFor="english">English</label>
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
            </div>
          )}
        </div>

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
              <span className="label">Say it</span>
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
            {result.mode === 'expletive' && (
              <div className="refusal__block">
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
            </li>
          ))}
        </ol>
      )}
      {!empty && !hidden && !multi && <Legend />}
      <Veins stageRef={stageRef} hover={hover} deps={[result, hover]} />
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

function CanonView({ lang, onUse }) {
  const sorted = [...CANON].sort((a, b) => (a.lang === lang ? -1 : 0) - (b.lang === lang ? -1 : 0))
  return (
    <section className="sheet">
      <div className="sheet__head">
        <h1 className="sheet__title">Canon phrases</h1>
        <p className="sheet__lede">Lines Tolkien himself wrote in Elvish. Type the English meaning in the translator and you get his words back exactly.</p>
      </div>
      <ul className="canon-list">
        {sorted.map((c) => (
          <li key={c.id} className="canon-card">
            <p className="canon-card__elv" lang={c.lang === 'S' ? 'sjn' : 'qya'}>{c.elvish}</p>
            <p className="canon-card__tg" aria-hidden="true">{toTengwar(c.elvish, c.lang)}</p>
            <p className="canon-card__say">{respellLine(c.elvish, c.lang)}</p>
            <p className="canon-card__en">{c.meaning}</p>
            <p className="canon-card__src">{LANGS[c.lang]} · {c.who} · <cite>{c.where}</cite></p>
            <button className="btn btn--quiet" onClick={() => onUse(c.keys[0], c.lang)}>Open in translator <Icon d={I.arrow} /></button>
          </li>
        ))}
      </ul>
    </section>
  )
}
