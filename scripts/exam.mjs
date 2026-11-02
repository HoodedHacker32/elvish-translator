// The exam: feed Tolkien's own English into the composer and compare with what Tolkien wrote.
// Usage: node scripts/exam.mjs [--lang S|Q] [--show 40] [--json report.json]
// Scores each sentence by how many of Tolkien's words the composer reproduced, in order.
import { writeFileSync } from 'node:fs'
import { TOLKIEN_PHRASES } from '../src/data/eldamo-phrases.js'
import { compose } from '../src/engine/translate.js'

const args = process.argv.slice(2)
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const onlyLang = opt('--lang', null)
const show = Number(opt('--show', 25))
const jsonOut = opt('--json', null)

export const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[’'·\-]/g, ' ').replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim()

// Two words match if they are the same or nearly so (laituvalmë ~ laituvalmet): spelling quirks
// in Tolkien's drafts should not count as grammar errors.
function edit(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  }
  return d[a.length][b.length]
}
const close = (a, b) => a === b || (Math.min(a.length, b.length) >= 4 && edit(a, b) <= Math.max(1, Math.floor(Math.max(a.length, b.length) / 6)))

// longest common subsequence of words: rewards right words in the right order
function lcs(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    dp[i][j] = close(a[i - 1], b[j - 1]) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
  }
  return dp[a.length][b.length]
}

export function score(target, got) {
  const t = norm(target).split(' ').filter(Boolean)
  const g = norm(got).split(' ').filter(Boolean)
  if (!t.length) return 1
  const m = lcs(t, g)
  const p = g.length ? m / g.length : 0
  const r = m / t.length
  return p + r ? (2 * p * r) / (p + r) : 0
}

// Exam set: sentences with an ordinary English gloss (no names-only lines, no editorial guesses)
export const EXAM = TOLKIEN_PHRASES.filter((p) =>
  !p.uncertain && p.english.split(' ').length >= 2 && p.english.split(' ').length <= 14 &&
  !/[A-Z]/.test(p.english.slice(1).replace(/\bI\b/g, '')) && (!onlyLang || p.lang === onlyLang))

const isMain = import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/').split('/').pop())
if (isMain) {
  const rows = EXAM.map((p) => {
    const r = compose(p.english.replace(/\([^)]*\)|\[[^\]]*\]/g, ' '), p.lang)
    return { ...p, got: r.line, score: score(p.elvish, r.line) }
  })
  const by = (l) => rows.filter((r) => r.lang === l)
  const avg = (rs) => (rs.reduce((a, r) => a + r.score, 0) / Math.max(rs.length, 1))
  const exact = (rs) => rs.filter((r) => r.score === 1).length
  for (const l of ['S', 'Q']) {
    const rs = by(l)
    if (!rs.length) continue
    console.log(`${l === 'S' ? 'Sindarin' : 'Quenya'}: ${rs.length} sentences, average ${(avg(rs) * 100).toFixed(1)}%, exactly right ${exact(rs)}`)
  }
  const worst = [...rows].sort((a, b) => a.score - b.score).slice(0, show)
  for (const r of worst) console.log(`${(r.score * 100).toFixed(0).padStart(3)}% ${r.lang} | ${r.english}\n      tolkien: ${r.elvish}\n      ours:    ${r.got}`)
  if (jsonOut) writeFileSync(jsonOut, JSON.stringify(rows, null, 1))
}
