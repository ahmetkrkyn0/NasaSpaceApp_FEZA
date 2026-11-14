// assets.mjs -> design-export/assets-manifest.json, design-export/assets/
//
// Inventory of frontend/public: size, sha256, git tracking, whether a
// .gitignore rule matches the path, and where the frontend references it.
// Every referenced file is copied to design-export/assets/<same path> and the
// copy is re-hashed. public/cesium/ is recorded as one aggregate entry.

import fs from 'node:fs'
import path from 'node:path'
import {
  OUT, FRONTEND, SOURCE_SHA, SOURCE_BRANCH, walk, rel, abs, read, git, sha256, sourceTsFiles, parseTs,
  tsStringPieces, cssFiles, stripCssComments, writeJson, ensureDir, checkSourcePin, isMain,
} from './lib.mjs'

const PUBLIC = `${FRONTEND}/public`
const ASSETS = `${OUT}/assets`
const PROVENANCE_DOCS = ['fonts/README.md', 'videos/README.md', 'textures/NAC_SITE11_PROVENANCE.md']

export function run() {
  checkSourcePin()
  const all = walk(PUBLIC)
  const cesium = all.filter((p) => p.startsWith(`${PUBLIC}/cesium/`))
  const files = all.filter((p) => !p.startsWith(`${PUBLIC}/cesium/`))

  const tracked = new Set(git(['ls-files', '--', 'frontend/public']).split('\n').filter(Boolean))
  // --no-index so tracked files are checked against the rules as well.
  const relFiles = files.map(rel)
  // One cesium file stands in for the directory rule.
  const cesiumProbe = cesium.length ? rel(cesium[0]) : null
  const ignoreOut = (() => {
    try {
      return git(['check-ignore', '--no-index', '-v', '--stdin'], `${[...relFiles, ...(cesiumProbe ? [cesiumProbe] : [])].join('\n')}\n`)
    } catch (err) {
      // Exit status 1 means "nothing matched".
      return err.stdout || ''
    }
  })()
  const ignoreRule = new Map()
  for (const line of ignoreOut.split('\n').filter(Boolean)) {
    const [rule, p] = line.split('\t')
    if (p) ignoreRule.set(p.trim(), rule)
  }

  // Reference sites: TS/TSX string pieces (comments never scanned), CSS with
  // comments stripped, index.html with HTML comments stripped.
  const tsPieces = sourceTsFiles().map((p) => {
    const e = parseTs(p)
    return { file: e.file, pieces: tsStringPieces(e).filter((x) => !x.jsxText) }
  })
  const cssLines = cssFiles().map((p) => ({ file: rel(p), lines: stripCssComments(read(p)).split('\n') }))
  const htmlPath = `${FRONTEND}/index.html`
  const htmlLines = read(htmlPath).replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' ')).split('\n')

  const contains = (hay, needle) => {
    let i = hay.indexOf(needle)
    while (i >= 0) {
      const after = hay[i + needle.length]
      if (after === undefined || !/[\w.-]/.test(after)) return true
      i = hay.indexOf(needle, i + 1)
    }
    return false
  }

  // Dynamic references: templates whose head starts with a public directory.
  const topDirs = [...new Set(relFiles.map((r) => r.replace('frontend/public/', '').split('/')[0]))]
  const dynamicReferences = []
  for (const { file, pieces } of tsPieces) {
    for (const piece of pieces) {
      if (!piece.template) continue
      const head = piece.template.head
      if (piece.node !== head) continue
      const m = /^\/([\w-]+)\//.exec(head.text)
      if (m && topDirs.includes(m[1])) {
        dynamicReferences.push({ file, line: piece.line, template: piece.template.getText() })
      }
    }
  }

  const bySha = new Map()
  const entries = files.map((p) => {
    const r = rel(p)
    const sub = r.replace('frontend/public/', '')
    const url = `/${sub}`
    const usedAt = []
    for (const { file, pieces } of tsPieces) {
      for (const piece of pieces) if (contains(piece.text, url)) usedAt.push(`${file}:${piece.line}`)
    }
    for (const { file, lines } of cssLines) lines.forEach((ln, i) => { if (contains(ln, url)) usedAt.push(`${file}:${i + 1}`) })
    htmlLines.forEach((ln, i) => { if (contains(ln, url)) usedAt.push(`frontend/index.html:${i + 1}`) })
    const hash = sha256(p)
    if (!bySha.has(hash)) bySha.set(hash, [])
    bySha.get(hash).push(r)
    const rule = ignoreRule.get(r) || null
    return {
      path: r,
      url,
      bytes: fs.statSync(p).size,
      sha256: hash,
      tracked: tracked.has(r),
      matchesIgnoreRule: Boolean(rule),
      ignoreRule: rule,
      used: usedAt.length > 0,
      usedAt: [...new Set(usedAt)],
    }
  })
  for (const e of entries) {
    const group = bySha.get(e.sha256)
    e.identicalTo = group.filter((x) => x !== e.path)
  }

  // ── Copy ───────────────────────────────────────────────────────────────────
  ensureDir(ASSETS)
  const expected = new Set()
  let bytesCopied = 0
  for (const e of entries) {
    const sub = e.path.replace('frontend/public/', '')
    const isProv = PROVENANCE_DOCS.includes(sub)
    if (!e.used && !isProv) continue
    const dest = `${ASSETS}/${sub}`
    expected.add(dest)
    ensureDir(path.dirname(dest))
    if (!(fs.existsSync(dest) && sha256(dest) === e.sha256)) fs.copyFileSync(abs(e.path), dest)
    const copyHash = sha256(dest)
    if (copyHash !== e.sha256) throw new Error(`copy hash mismatch for ${e.path}`)
    e.copiedTo = `design-export/assets/${sub}`
    e.copySha256Match = true
    if (isProv) e.copiedAs = 'provenance'
    bytesCopied += e.bytes
  }
  // Drop stale copies (only inside design-export/assets).
  for (const f of walk(ASSETS)) {
    if (!expected.has(f)) fs.rmSync(f)
  }
  removeEmptyDirs(ASSETS)

  const cesiumBytes = cesium.reduce((s, p) => s + fs.statSync(p).size, 0)
  const cesiumRefs = []
  for (const { file, pieces } of tsPieces) for (const piece of pieces) if (/\/cesium\//i.test(piece.text)) cesiumRefs.push(`${file}:${piece.line}`)
  for (const { file, lines } of cssLines) lines.forEach((ln, i) => { if (/\/cesium\//i.test(ln)) cesiumRefs.push(`${file}:${i + 1}`) })

  const used = entries.filter((e) => e.used)
  const manifest = {
    source: { sha: SOURCE_SHA, branch: SOURCE_BRANCH },
    notes: [
      'used: the public URL path (e.g. /rovers/lpr_1.jpg) appears in a string of a non-test TS/TSX file, in comment-stripped CSS, or in comment-stripped frontend/index.html, followed by a non-path character.',
      'matchesIgnoreRule/ignoreRule: git check-ignore --no-index, so tracked files are checked against the rules too. The copies under design-export/assets/ match the same extension rules (*.mp4, *.glb, ...).',
      'identicalTo: other public files with the same sha256 (byte-identical duplicates).',
      'copiedAs "provenance": not referenced by the app; copied because it documents where the assets came from.',
      'dynamicReferences: template literals that build a public path at run time; files matching them would be used without appearing verbatim.',
    ],
    counts: {
      files: entries.length,
      used: used.length,
      unused: entries.length - used.length,
      usedBytes: used.reduce((s, e) => s + e.bytes, 0),
      copiedFiles: entries.filter((e) => e.copiedTo).length,
      copiedBytes: bytesCopied,
      cesiumFiles: cesium.length,
      cesiumBytes,
    },
    aggregates: [
      {
        path: 'frontend/public/cesium/',
        files: cesium.length,
        bytes: cesiumBytes,
        used: cesiumRefs.length > 0,
        usedAt: cesiumRefs,
        ignoreRule: cesiumProbe ? ignoreRule.get(cesiumProbe) || null : null,
        note: 'Cesium static build output, not hashed per file. No frontend source references /cesium/; nothing in the current UI loads it.',
      },
    ],
    dynamicReferences,
    files: entries,
  }
  writeJson(`${OUT}/assets-manifest.json`, manifest)
  return {
    'assets.files': entries.length,
    'assets.used': used.length,
    'assets.unused': entries.length - used.length,
    'assets.copied': manifest.counts.copiedFiles,
    'assets.copiedBytes': bytesCopied,
    'assets.cesiumFiles': cesium.length,
    'assets.dynamicRefs': dynamicReferences.length,
  }
}

function removeEmptyDirs(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      const p = `${dir}/${e.name}`
      removeEmptyDirs(p)
      if (fs.readdirSync(p).length === 0) fs.rmdirSync(p)
    }
  }
}

if (isMain(import.meta.url)) console.log(run())
