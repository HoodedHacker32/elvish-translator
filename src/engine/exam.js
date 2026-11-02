// Scoring for the exam against Tolkien's own sentences (scripts/exam.mjs runs it; the About page shows it).
import { TOLKIEN_PHRASES } from '../data/eldamo-phrases.js'

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
  !/[A-Z]/.test(p.english.slice(1).replace(/\bI\b/g, '')))

export const examEnglish = (p) => p.english.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')

export function runExam(compose) {
  const rows = EXAM.map((p) => ({ ...p, got: compose(examEnglish(p), p.lang).line }))
  for (const r of rows) r.score = score(r.elvish, r.got)
  const summary = {}
  for (const l of ['S', 'Q']) {
    const rs = rows.filter((r) => r.lang === l)
    summary[l] = { n: rs.length, avg: rs.reduce((a, r) => a + r.score, 0) / Math.max(rs.length, 1), exact: rs.filter((r) => r.score === 1).length }
  }
  return { rows, summary }
}
