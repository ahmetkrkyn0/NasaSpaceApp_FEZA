// coverage.mjs -- acceptance checks for DESIGN.md against the extracted data.
//
//   node design-export/extract/coverage.mjs <path/to/DESIGN.md>
//
// Prints a pass/fail table and exits 1 when any check fails. Reads only the
// files under design-export/ and the frontend sources they cite; writes nothing.
//
// Checks (numbers follow the plan's acceptance criteria):
//   1  every top-level :root token: name and value on one DESIGN.md line, or in
//      tokens.css when DESIGN.md points the reader at tokens.css
//   2  every @keyframes name appears in DESIGN.md
//   3  every ramp / table name appears in DESIGN.md, and every stop row appears
//      in DESIGN.md or DESIGN.md references colormaps.json
//   4  every registry entry: one Markdown table row whose cells are exactly
//      id, slot, modesText, groupText and tabText (any column order)
//   5  every icon name appears in DESIGN.md
//   6  >= 98% of strings-coverage-set.json texts appear verbatim in DESIGN.md
//  11  every used asset is copied with a matching sha256; nothing unused is
//      copied except the flagged provenance documents
//  12  tokens.css / fonts.css / motion.css / vite-proxy.txt blocks byte-match
//      their @src source spans (fonts: url rewrite reversed); api-contract
//      copies match their sources

import fs from 'node:fs'
import path from 'node:path'
import { OUT, ROOT, sha256, walk, isMain } from './lib.mjs'

const STRINGS_THRESHOLD = 0.98

function load(rel) {
  return JSON.parse(fs.readFileSync(`${OUT}/${rel}`, 'utf8'))
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const wordRe = (w) => new RegExp(`(?<![A-Za-z0-9_-])${escapeRe(w)}(?![A-Za-z0-9_-])`)
// A CSS value on a boundary: "2px" must not match inside "12px", "#111" not inside "#1112".
const valueRe = (v) => new RegExp(`(?<![A-Za-z0-9_.#-])${escapeRe(v)}(?![A-Za-z0-9_.%-])`)

function lineHasAll(lines, needles) {
  return lines.some((ln) => needles.every((n) => (n instanceof RegExp ? n.test(ln) : ln.includes(n))))
}

function srcLines(relFile) {
  return fs.readFileSync(`${ROOT}/${relFile}`, 'utf8').split('\n')
}

/** Verify every "@src file:a-b" marker block in an output file. */
function checkSrcBlocks(outRel, { reverse = (s) => s, skipLine = () => false } = {}) {
  const text = fs.readFileSync(`${OUT}/${outRel}`, 'utf8')
  const lines = text.split('\n')
  const problems = []
  let blocks = 0
  for (let i = 0; i < lines.length; i++) {
    const m = /@src (\S+):(\d+)-(\d+)/.exec(lines[i])
    if (!m || /<file>/.test(lines[i])) continue
    const [, file, a, b] = m
    const from = Number(a)
    const to = Number(b)
    let j = i + 1
    while (j < lines.length && skipLine(lines[j])) j++
    const got = lines.slice(j, j + (to - from + 1)).map(reverse).join('\n')
    const want = srcLines(file).slice(from - 1, to).join('\n')
    blocks++
    if (got !== want) problems.push(`${outRel}: block ${file}:${from}-${to} differs from source`)
  }
  // @scoped excerpts: each listed source line, in order.
  for (let i = 0; i < lines.length; i++) {
    const m = /@scoped (\S+) lines=([\d,]+)/.exec(lines[i])
    if (!m) continue
    const src = srcLines(m[1])
    const nums = m[2].split(',').map(Number)
    let j = i + 1
    while (j < lines.length && !lines[j].startsWith('/* @')) j++
    const excerpt = lines.slice(i + 1, j)
    let k = 0
    for (const n of nums) {
      while (k < excerpt.length && excerpt[k] !== src[n - 1]) k++
      if (k >= excerpt.length) problems.push(`${outRel}: scoped line ${m[1]}:${n} not found in excerpt`)
      k++
    }
    blocks++
  }
  return { blocks, problems }
}

export function runCoverage(designPath) {
  const design = fs.readFileSync(designPath, 'utf8')
  const dLines = design.split('\n')
  const tokensCss = fs.readFileSync(`${OUT}/tokens.css`, 'utf8').split('\n')
  const refs = (name) => design.includes(name)
  const results = []
  const add = (id, name, pass, detail, missing = []) => results.push({ id, name, pass, detail, missing })

  // 1 ── tokens
  {
    const tokens = load('tokens.json').declarations.filter((d) => d.scope === 'root')
    const fallback = refs('tokens.css')
    let inDesign = 0
    const missing = []
    for (const t of tokens) {
      const needles = [wordRe(t.name), valueRe(t.value)]
      if (lineHasAll(dLines, needles)) inDesign++
      else if (!(fallback && lineHasAll(tokensCss, needles))) missing.push(`${t.name}: ${t.value} (${t.file}:${t.line})`)
    }
    add(1, ':root tokens (name + value)', missing.length === 0,
      `${tokens.length} tokens; ${inDesign} on a DESIGN.md line; ${tokens.length - inDesign - missing.length} via tokens.css${fallback ? '' : ' (DESIGN.md does not reference tokens.css)'}; ${missing.length} missing`, missing)
  }

  // 2 ── keyframes
  {
    const kf = load('motion.json').keyframes
    const missing = kf.filter((k) => !wordRe(k.name).test(design)).map((k) => `${k.name} (${k.file}:${k.line}${k.used ? '' : ', unused'})`)
    add(2, '@keyframes names', missing.length === 0, `${kf.length} keyframes; ${missing.length} missing`, missing)
  }

  // 3 ── colormaps
  {
    const cm = load('colormaps.json')
    const named = cm.entries.filter((e) => e.kind === 'ramp' || e.kind === 'table')
    const fallback = refs('colormaps.json')
    const missingNames = named.filter((e) => !wordRe(e.name).test(design)).map((e) => `${e.name} (${e.file}:${e.line})`)
    let rows = 0
    let rowsInDesign = 0
    const missingRows = []
    const checkRow = (label, row) => {
      rows++
      if (design.includes(row)) rowsInDesign++
      else if (!fallback) missingRows.push(`${label}: ${row}`)
    }
    for (const e of cm.entries) {
      if (e.kind === 'ramp') for (const r of e.stopsText || e.values || []) checkRow(e.name, r)
      if (e.kind === 'table') {
        for (const r of e.rows) {
          if (r.stopsText) for (const s of r.stopsText) checkRow(`${e.name}.${r.key}`, s)
          if (r.values) for (const v of r.values) checkRow(`${e.name}.${r.key}`, v)
          if (typeof r.value === 'string') checkRow(`${e.name}.${r.case}`, r.value)
        }
      }
      if (e.kind === 'color') checkRow(e.name, typeof e.value === 'string' ? e.value : e.valueText)
    }
    const missing = [...missingNames, ...missingRows]
    add(3, 'colour ramps, tables and single colours', missing.length === 0,
      `${named.length} ramp/table names (${missingNames.length} missing); ${rows} stop rows/colours, ${rowsInDesign} verbatim in DESIGN.md${fallback ? ', rest via colormaps.json' : ''}; ${missingRows.length} missing`, missing)
  }

  // 4 ── registry
  {
    const reg = load('registry.json').features
    const missing = []
    for (const f of reg) {
      // Exact cell equality in one table row; values may repeat (modes and tab
      // can both be "(none)"), so the row must hold each needed cell as often
      // as it is needed.
      const needed = [f.id, f.slot, f.modesText, f.groupText, f.tabText]
      const ok = dLines.some((ln) => {
        if (!ln.includes('|')) return false
        const cells = ln.split('|').map((c) => c.replace(/`/g, '').trim())
        const pool = new Map()
        for (const c of cells) pool.set(c, (pool.get(c) || 0) + 1)
        for (const n of needed) {
          if (!pool.get(n)) return false
          pool.set(n, pool.get(n) - 1)
        }
        return true
      })
      if (!ok) missing.push(`${f.id}: expected one table row with cells "${f.id}" | "${f.slot}" | "${f.modesText}" | "${f.groupText}" | "${f.tabText}"`)
    }
    add(4, 'registry entries (id/slot/modes/group/tab)', missing.length === 0, `${reg.length} entries; ${missing.length} missing or mismatched`, missing)
  }

  // 5 ── icons
  {
    const icons = load('icons.json').icons
    const missing = icons.filter((i) => !wordRe(i.name).test(design)).map((i) => i.name)
    add(5, 'icon names', missing.length === 0, `${icons.length} icons; ${missing.length} missing`, missing)
  }

  // 6 ── strings
  {
    const set = load('strings-coverage-set.json').strings
    const texts = [...new Set(set.map((s) => s.text))]
    // Whitespace (NBSP and thin spaces included) collapses to one space on both
    // sides, and the needle is trimmed: a writer typing a plain space, or a
    // literal whose source carries a leading/trailing space, still matches.
    const norm = (s) => s.replace(/[\s   ]+/g, ' ')
    const hay = norm(design)
    const missing = texts.filter((t) => !hay.includes(norm(t).trim()))
    const pct = texts.length ? (texts.length - missing.length) / texts.length : 1
    add(6, `visible strings (>= ${STRINGS_THRESHOLD * 100}% verbatim)`, pct >= STRINGS_THRESHOLD,
      `${texts.length} unique texts (${set.length} records); ${(pct * 100).toFixed(2)}% found; ${missing.length} missing`,
      missing.map((t) => {
        const r = set.find((s) => s.text === t)
        return `${JSON.stringify(t)} (${r.file}:${r.line})`
      }))
  }

  // 11 ── assets
  {
    const man = load('assets-manifest.json')
    const problems = []
    const expected = new Set()
    for (const f of man.files) {
      const sub = f.path.replace('frontend/public/', '')
      const dest = `${OUT}/assets/${sub}`
      if (f.used || f.copiedAs === 'provenance') {
        expected.add(path.resolve(dest))
        if (!fs.existsSync(dest)) problems.push(`missing copy: ${sub}`)
        else if (sha256(dest) !== f.sha256) problems.push(`sha256 mismatch: ${sub}`)
        else if (sha256(`${ROOT}/${f.path}`) !== f.sha256) problems.push(`source changed since extraction: ${f.path}`)
      }
    }
    const extra = fs.existsSync(`${OUT}/assets`) ? walk(`${OUT}/assets`).filter((p) => !expected.has(path.resolve(p))) : []
    for (const x of extra) problems.push(`unexpected copy (unused asset): ${x.replace(`${OUT}/`, '')}`)
    add(11, 'asset copies (sha256, used only)', problems.length === 0,
      `${man.counts.used} used + ${man.files.filter((f) => f.copiedAs === 'provenance').length} provenance docs expected; ${problems.length} problems`, problems)
  }

  // 12 ── verbatim blocks
  {
    const problems = []
    let blocks = 0
    const t = checkSrcBlocks('tokens.css')
    const f = checkSrcBlocks('fonts.css', { reverse: (s) => s.replace(/url\((['"]?)assets\/fonts\//g, 'url($1/fonts/') })
    const m = checkSrcBlocks('motion.css', { skipLine: (s) => s === '/* UNUSED */' })
    const v = checkSrcBlocks('api-contract/vite-proxy.txt')
    for (const r of [t, f, m, v]) {
      blocks += r.blocks
      problems.push(...r.problems)
    }
    const ep = load('api-contract/endpoints.json')
    for (const c of ep.copies) {
      if (!fs.existsSync(`${ROOT}/${c.to}`)) problems.push(`missing copy ${c.to}`)
      else if (sha256(`${ROOT}/${c.to}`) !== sha256(`${ROOT}/${c.from}`)) problems.push(`copy differs from source: ${c.to}`)
    }
    add(12, 'verbatim blocks and contract copies', problems.length === 0,
      `${blocks} marked blocks (tokens ${t.blocks}, fonts ${f.blocks}, motion ${m.blocks}, vite ${v.blocks}); ${ep.copies.length} contract copies; ${problems.length} problems`, problems)
  }

  return results
}

export function printTable(results) {
  const rows = results.map((r) => [String(r.id), r.pass ? 'PASS' : 'FAIL', r.name, r.detail])
  const w = [5, 6, Math.max(...rows.map((r) => r[2].length)), 0]
  console.log(`${'#'.padEnd(w[0])}${'RESULT'.padEnd(w[1] + 1)}${'CHECK'.padEnd(w[2] + 2)}DETAIL`)
  for (const r of rows) console.log(`${r[0].padEnd(w[0])}${r[1].padEnd(w[1] + 1)}${r[2].padEnd(w[2] + 2)}${r[3]}`)
  for (const r of results.filter((x) => !x.pass && x.missing.length)) {
    console.log(`\n[${r.id}] ${r.name}: ${r.missing.length} item(s)`)
    for (const m of r.missing.slice(0, 40)) console.log(`  - ${m}`)
    if (r.missing.length > 40) console.log(`  ... ${r.missing.length - 40} more`)
  }
}

if (isMain(import.meta.url)) {
  const target = process.argv[2]
  if (!target) {
    console.error('usage: node design-export/extract/coverage.mjs <path/to/DESIGN.md>')
    process.exit(2)
  }
  const results = runCoverage(path.resolve(target))
  printTable(results)
  const failed = results.filter((r) => !r.pass).length
  console.log(`\n${results.length - failed}/${results.length} checks passed`)
  process.exit(failed ? 1 : 0)
}
