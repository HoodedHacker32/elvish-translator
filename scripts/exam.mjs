// The exam: feed Tolkien's own English into the composer and compare with what Tolkien wrote.
// Usage: node scripts/exam.mjs [--lang S|Q] [--show 40] [--json report.json]
// Scores each sentence by how many of Tolkien's words the composer reproduced, in order.
import { writeFileSync } from 'node:fs'
import { compose } from '../src/engine/translate.js'
import { runExam } from '../src/engine/exam.js'

export { EXAM, score } from '../src/engine/exam.js'

const args = process.argv.slice(2)
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }

const isMain = import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/').split('/').pop())
if (isMain) {
  const onlyLang = opt('--lang', null)
  const show = Number(opt('--show', 25))
  const jsonOut = opt('--json', null)
  const { rows: all, summary } = runExam(compose)
  const rows = onlyLang ? all.filter((r) => r.lang === onlyLang) : all
  for (const l of ['S', 'Q']) {
    if (onlyLang && l !== onlyLang) continue
    const s = summary[l]
    console.log(`${l === 'S' ? 'Sindarin' : 'Quenya'}: ${s.n} sentences, average ${(s.avg * 100).toFixed(1)}%, exactly right ${s.exact}`)
  }
  const worst = [...rows].sort((a, b) => a.score - b.score).slice(0, show)
  for (const r of worst) console.log(`${(r.score * 100).toFixed(0).padStart(3)}% ${r.lang} | ${r.english}\n      tolkien: ${r.elvish}\n      ours:    ${r.got}`)
  if (jsonOut) writeFileSync(jsonOut, JSON.stringify(rows, null, 1))
}
