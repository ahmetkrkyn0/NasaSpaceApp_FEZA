// Shared helpers for the design-export extractors.
//
// Read-only with respect to the repository: every function here reads from
// frontend/ and writes only under design-export/. No dependencies beyond Node
// and the TypeScript compiler already installed in frontend/node_modules.

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

export const ROOT = path.resolve(HERE, '..', '..').replace(/\\/g, '/')
export const FRONTEND = `${ROOT}/frontend`
export const SRC = `${FRONTEND}/src`
export const OUT = `${ROOT}/design-export`

/** The commit every output is pinned to. */
export const SOURCE_SHA = '5aec750'
export const SOURCE_BRANCH = 'berke/backend-review'

const require = createRequire(import.meta.url)
export const ts = require(`${FRONTEND}/node_modules/typescript`)

// ── Source pin ───────────────────────────────────────────────────────────────

let pinChecked = false

/**
 * Abort when HEAD is not the pinned commit or tracked frontend files are
 * modified. Set DESIGN_EXPORT_ALLOW_DRIFT=1 to downgrade both to warnings.
 */
export function checkSourcePin() {
  if (pinChecked) return
  pinChecked = true
  const allowDrift = process.env.DESIGN_EXPORT_ALLOW_DRIFT === '1'
  const head = git(['rev-parse', '--short=7', 'HEAD']).trim()
  const dirty = git(['status', '--porcelain', '--', 'frontend/'])
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('??'))
  const problems = []
  if (head !== SOURCE_SHA) problems.push(`HEAD is ${head}, outputs are pinned to ${SOURCE_SHA}`)
  if (dirty.length) problems.push(`tracked frontend files are modified:\n  ${dirty.join('\n  ')}`)
  if (problems.length) {
    const msg = `[design-export] source pin check failed:\n- ${problems.join('\n- ')}`
    if (allowDrift) {
      console.warn(`${msg}\n(continuing because DESIGN_EXPORT_ALLOW_DRIFT=1)`)
    } else {
      console.error(`${msg}\nSet DESIGN_EXPORT_ALLOW_DRIFT=1 to run anyway.`)
      process.exit(2)
    }
  }
}

export function git(args, input) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    input,
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

// ── Files ────────────────────────────────────────────────────────────────────

export function rel(absPath) {
  return absPath.replace(/\\/g, '/').replace(`${ROOT}/`, '')
}

export function abs(relPath) {
  return `${ROOT}/${relPath}`
}

export function read(absPath) {
  return fs.readFileSync(absPath, 'utf8')
}

/**
 * Recursive file list, sorted, skipping dot-directories (frontend/src/.omc
 * exists and is untracked) and node_modules.
 */
export function walk(dir, { exts = null, skipDirs = [] } = {}) {
  const out = []
  const visit = (d) => {
    const entries = fs.readdirSync(d, { withFileTypes: true })
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    for (const e of entries) {
      const p = `${d}/${e.name}`
      if (e.isDirectory()) {
        if (e.name.startsWith('.') || e.name === 'node_modules') continue
        if (skipDirs.includes(e.name)) continue
        visit(p)
      } else if (e.isFile()) {
        if (!exts || exts.some((x) => e.name.endsWith(x))) out.push(p)
      }
    }
  }
  visit(dir.replace(/\\/g, '/'))
  return out
}

export function isTestFile(p) {
  return /\.test\.(ts|tsx)$/.test(p) || /\/__tests__\//.test(p) || /\/__fixtures__\//.test(p)
}

/** Non-test TS/TSX sources under frontend/src. */
export function sourceTsFiles() {
  return walk(SRC, { exts: ['.ts', '.tsx'] }).filter((p) => !isTestFile(p) && !p.endsWith('.d.ts'))
}

export function cssFiles() {
  return walk(SRC, { exts: ['.css'] })
}

export function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true })
}

export function writeText(absPath, text) {
  ensureDir(path.dirname(absPath))
  fs.writeFileSync(absPath, text, 'utf8')
}

export function writeJson(absPath, data) {
  writeText(absPath, `${JSON.stringify(data, null, 2)}\n`)
}

/** Remove a generated directory under design-export/ only. */
export function resetDir(absDir) {
  const norm = absDir.replace(/\\/g, '/')
  if (!norm.startsWith(`${OUT}/`)) throw new Error(`refusing to reset ${norm}: outside ${OUT}`)
  fs.rmSync(norm, { recursive: true, force: true })
  ensureDir(norm)
}

export function sha256(bufOrPath) {
  const buf = Buffer.isBuffer(bufOrPath) ? bufOrPath : fs.readFileSync(bufOrPath)
  return crypto.createHash('sha256').update(buf).digest('hex')
}

// ── Lines ────────────────────────────────────────────────────────────────────

export function lineIndex(text) {
  const starts = [0]
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1)
  return starts
}

export function lineAt(starts, offset) {
  let lo = 0
  let hi = starts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (starts[mid] <= offset) lo = mid
    else hi = mid - 1
  }
  return lo + 1
}

/** Text of 1-based lines [from, to] inclusive, joined with \n, no trailing newline. */
export function sliceLines(text, from, to) {
  return text.split('\n').slice(from - 1, to).join('\n')
}

// ── CSS ──────────────────────────────────────────────────────────────────────

/**
 * A small CSS parser: comments, strings and parentheses are respected, at-rules
 * nest, declarations carry their offsets. Enough for this codebase's plain CSS
 * (no preprocessors, no nesting syntax beyond at-rules).
 *
 * Node shapes:
 *   { type:'rule',   selector, start, end, bodyStart, bodyEnd, line, endLine, decls, children, parent }
 *   { type:'atrule', name, params, start, end, bodyStart, bodyEnd, line, endLine, decls, children, parent }
 *   { type:'atrule', name, params, start, end, line, endLine, statement:true }       (no block)
 *   decl: { prop, value, valueRaw, start, end, line, important, parent }
 */
export function parseCss(text, { lineOffset = 0 } = {}) {
  const starts = lineIndex(text)
  const L = (o) => lineAt(starts, o) + lineOffset
  const comments = []
  const root = { type: 'root', children: [], decls: [], parent: null }
  const stack = [root]
  let segStart = -1
  let paren = 0
  let i = 0
  const n = text.length

  const stripped = (a, b) => stripCommentsIn(text, a, b, comments)

  const flushDecl = (endOffset) => {
    if (segStart < 0) return
    const raw = text.slice(segStart, endOffset)
    const clean = stripped(segStart, endOffset).trim()
    const top = stack[stack.length - 1]
    if (clean) {
      if (clean.startsWith('@')) {
        const m = /^@([\w-]+)\s*([\s\S]*)$/.exec(clean)
        top.children.push({
          type: 'atrule',
          name: m ? m[1] : clean.slice(1),
          params: m ? m[2].trim() : '',
          start: segStart,
          end: endOffset + 1,
          line: L(segStart),
          endLine: L(endOffset),
          statement: true,
          parent: top,
          children: [],
          decls: [],
        })
      } else {
        const colon = findTopLevelColon(clean)
        if (colon > 0) {
          // Whitespace runs (including newlines inside multi-line values) collapse
          // to one space; valueRaw keeps the source text.
          let value = clean.slice(colon + 1).trim().replace(/\s+/g, ' ')
          let important = false
          const imp = /\s*!\s*important\s*$/i.exec(value)
          if (imp) {
            important = true
            value = value.slice(0, imp.index).trim()
          }
          top.decls.push({
            prop: clean.slice(0, colon).trim(),
            value,
            valueRaw: raw,
            start: segStart,
            end: endOffset,
            line: L(segStart),
            important,
            parent: top,
          })
        }
      }
    }
    segStart = -1
  }

  while (i < n) {
    const c = text[i]
    const c2 = text[i + 1]
    if (c === '/' && c2 === '*') {
      const close = text.indexOf('*/', i + 2)
      const end = close < 0 ? n : close + 2
      comments.push({ start: i, end, line: L(i), endLine: L(end - 1) })
      i = end
      continue
    }
    if (c === '"' || c === "'") {
      if (segStart < 0) segStart = i
      i = skipString(text, i)
      continue
    }
    if (c === '(') {
      if (segStart < 0) segStart = i
      paren++
      i++
      continue
    }
    if (c === ')') {
      paren = Math.max(0, paren - 1)
      i++
      continue
    }
    if (paren === 0 && c === '{') {
      const preludeStart = segStart < 0 ? i : segStart
      const prelude = stripped(preludeStart, i).trim().replace(/\s+/g, ' ')
      const top = stack[stack.length - 1]
      let node
      if (prelude.startsWith('@')) {
        const m = /^@([\w-]+)\s*([\s\S]*)$/.exec(prelude)
        node = { type: 'atrule', name: m[1], params: m[2].trim() }
      } else {
        node = { type: 'rule', selector: prelude }
      }
      Object.assign(node, {
        start: preludeStart,
        bodyStart: i + 1,
        line: L(preludeStart),
        decls: [],
        children: [],
        parent: top,
      })
      top.children.push(node)
      stack.push(node)
      segStart = -1
      i++
      continue
    }
    if (paren === 0 && c === ';') {
      flushDecl(i)
      i++
      continue
    }
    if (paren === 0 && c === '}') {
      flushDecl(i)
      const node = stack.pop()
      if (!node || node === root) throw new Error(`unbalanced } at line ${L(i)}`)
      node.bodyEnd = i
      node.end = i + 1
      node.endLine = L(i)
      i++
      continue
    }
    if (segStart < 0 && !/\s/.test(c)) segStart = i
    i++
  }
  if (stack.length !== 1) throw new Error('unterminated block at end of CSS input')
  return { root, comments, starts, text, lineOffset }
}

function skipString(text, i) {
  const q = text[i]
  let j = i + 1
  while (j < text.length) {
    if (text[j] === '\\') {
      j += 2
      continue
    }
    if (text[j] === q || text[j] === '\n') return j + 1
    j++
  }
  return j
}

function findTopLevelColon(s) {
  let paren = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '"' || c === "'") {
      i = skipString(s, i) - 1
      continue
    }
    if (c === '(') paren++
    else if (c === ')') paren--
    else if (c === ':' && paren === 0) return i
  }
  return -1
}

function stripCommentsIn(text, a, b, comments) {
  // Comments are discovered left to right; any that overlap [a,b) are already
  // recorded by the time a segment is flushed.
  let out = ''
  let pos = a
  for (const cm of comments) {
    if (cm.end <= a || cm.start >= b) continue
    out += text.slice(pos, Math.max(pos, cm.start))
    pos = Math.max(pos, cm.end)
  }
  out += text.slice(pos, b)
  return out
}

/** Depth-first visit of every node. */
export function visitCss(node, fn) {
  for (const child of node.children || []) {
    fn(child)
    visitCss(child, fn)
  }
}

/** "@media (max-width: 980px) > @supports ..." chain of enclosing at-rules. */
export function atRuleChain(node) {
  const chain = []
  let p = node.parent
  while (p && p.type !== 'root') {
    if (p.type === 'atrule') chain.unshift(`@${p.name}${p.params ? ` ${p.params}` : ''}`)
    p = p.parent
  }
  return chain
}

/** Comment ranges removed; used for value scans over a whole file. */
export function stripCssComments(text) {
  let out = ''
  let i = 0
  while (i < text.length) {
    if (text[i] === '/' && text[i + 1] === '*') {
      const close = text.indexOf('*/', i + 2)
      const end = close < 0 ? text.length : close + 2
      // Keep newlines so offsets map to the same lines.
      out += text.slice(i, end).replace(/[^\n]/g, ' ')
      i = end
      continue
    }
    if (text[i] === '"' || text[i] === "'") {
      const j = skipString(text, i)
      out += text.slice(i, j)
      i = j
      continue
    }
    out += text[i]
    i++
  }
  return out
}

/** The first comment that ends right before `offset` (only whitespace between). */
export function precedingComment(parsed, offset) {
  const { comments, text } = parsed
  for (let k = comments.length - 1; k >= 0; k--) {
    const cm = comments[k]
    if (cm.end > offset) continue
    if (/^\s*$/.test(text.slice(cm.end, offset))) return cm
    return null
  }
  return null
}

/** Every parsed CSS file under frontend/src, in path order. */
let cssCache = null
export function allCss() {
  if (cssCache) return cssCache
  cssCache = cssFiles().map((p) => {
    const text = read(p)
    return { abs: p, file: rel(p), text, parsed: parseCss(text) }
  })
  return cssCache
}

/** index.html inline <style> blocks, parsed with their real line numbers. */
export function indexHtmlStyles() {
  const p = `${FRONTEND}/index.html`
  const text = read(p)
  const starts = lineIndex(text)
  const out = []
  const re = /<style[^>]*>([\s\S]*?)<\/style>/g
  let m
  while ((m = re.exec(text))) {
    const bodyOffset = m.index + m[0].indexOf('>') + 1
    const lineOffset = lineAt(starts, bodyOffset) - 1
    // Pad so the inner text keeps the same line numbering inside the block.
    const inner = m[1]
    out.push({ file: rel(p), text: inner, parsed: parseCss(inner, { lineOffset }) })
  }
  return out
}

// ── TypeScript ───────────────────────────────────────────────────────────────

const tsCache = new Map()

export function parseTs(absPath) {
  if (tsCache.has(absPath)) return tsCache.get(absPath)
  const text = read(absPath)
  const kind = absPath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const sf = ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, true, kind)
  const entry = { abs: absPath, file: rel(absPath), text, sf }
  tsCache.set(absPath, entry)
  return entry
}

/** 1-based line of a node's first token (not its leading trivia). */
export function nodeLine(sf, node) {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
}

export function walkTs(node, fn, parents = []) {
  fn(node, parents)
  parents.push(node)
  ts.forEachChild(node, (child) => walkTs(child, fn, parents))
  parents.pop()
}

/** Nearest enclosing named function / variable / class / method, for context. */
export function enclosingName(node) {
  let p = node.parent
  while (p) {
    if (ts.isFunctionDeclaration(p) && p.name) return p.name.text
    if (ts.isClassDeclaration(p) && p.name) return p.name.text
    if ((ts.isMethodDeclaration(p) || ts.isPropertyDeclaration(p)) && p.name && ts.isIdentifier(p.name)) {
      return p.name.text
    }
    if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) {
      const init = p.initializer
      // Prefer component-like names: arrow functions and function expressions.
      if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) return p.name.text
      // Otherwise keep walking up for a function, but remember the variable.
      const outer = enclosingFunctionName(p)
      return outer ? `${outer}.${p.name.text}` : p.name.text
    }
    p = p.parent
  }
  return null
}

function enclosingFunctionName(node) {
  let p = node.parent
  while (p) {
    if (ts.isFunctionDeclaration(p) && p.name) return p.name.text
    if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name) && p.initializer &&
      (ts.isArrowFunction(p.initializer) || ts.isFunctionExpression(p.initializer))) {
      return p.name.text
    }
    if (ts.isMethodDeclaration(p) && p.name && ts.isIdentifier(p.name)) return p.name.text
    p = p.parent
  }
  return null
}

/** Every string piece of a TS/TSX file (literals, template parts, JSX attr strings, JSX text). */
export function tsStringPieces(entry) {
  const { sf } = entry
  const out = []
  walkTs(sf, (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      out.push({ text: node.text, node, line: nodeLine(sf, node) })
    } else if (ts.isTemplateExpression(node)) {
      out.push({ text: node.head.text, node: node.head, line: nodeLine(sf, node), template: node })
      for (const span of node.templateSpans) {
        out.push({ text: span.literal.text, node: span.literal, line: nodeLine(sf, span.literal), template: node })
      }
    } else if (ts.isJsxText(node)) {
      out.push({ text: node.text, node, line: nodeLine(sf, node), jsxText: true })
    }
  })
  return out
}

// ── Misc ─────────────────────────────────────────────────────────────────────

export function site(file, line) {
  return `${file}:${line}`
}

export function byFileLine(a, b) {
  if (a.file !== b.file) return a.file < b.file ? -1 : 1
  return (a.line ?? 0) - (b.line ?? 0)
}

export function countBy(items, keyFn) {
  const m = new Map()
  for (const it of items) {
    const k = keyFn(it)
    m.set(k, (m.get(k) || 0) + 1)
  }
  return m
}

export function header(lines) {
  return lines.map((l) => l).join('\n')
}

/** True when the calling module was started directly with `node <file>`. */
export function isMain(metaUrl) {
  if (!process.argv[1]) return false
  return pathToFileURL(path.resolve(process.argv[1])).href.toLowerCase() === metaUrl.toLowerCase()
}

// ── Class-name references from TS/TSX ────────────────────────────────────────

let classIndexCache = null

/**
 * Index of every identifier-like token that appears inside a string of a
 * non-test TS/TSX file (literals, template parts, JSX attribute strings) or in
 * index.html, plus the template/concatenation fragments that can build a class
 * name at run time (`space-backdrop--${stage}`, 'is-' + x).
 *
 * classStatus(name) -> { status: 'referenced'|'dynamicMaybe'|'unreferenced', sites, via }
 */
export function classIndex() {
  if (classIndexCache) return classIndexCache
  const tokens = new Map() // token -> [site]
  const prefixes = [] // { frag, site }
  const suffixes = []
  const addTok = (t, s) => {
    if (!tokens.has(t)) tokens.set(t, [])
    const arr = tokens.get(t)
    if (arr.length < 12 && !arr.includes(s)) arr.push(s)
  }
  for (const p of sourceTsFiles()) {
    const e = parseTs(p)
    for (const piece of tsStringPieces(e)) {
      if (piece.jsxText) continue
      const s = `${e.file}:${piece.line}`
      for (const t of piece.text.split(/[^A-Za-z0-9_-]+/)) if (t) addTok(t, s)
      const n = piece.node
      if (piece.template) {
        // head / middle pieces precede a ${...}; middle / tail pieces follow one.
        const isHead = ts.isTemplateHead(n)
        const isMiddle = ts.isTemplateMiddle(n)
        const isTail = ts.isTemplateTail(n)
        // Only fragments in class-list position (start of string or after
        // whitespace) count, so URL templates like `/terrain${q}` do not.
        if (isHead || isMiddle) {
          const m = /(?:^|\s)([A-Za-z0-9_-]+)$/.exec(piece.text)
          if (m) prefixes.push({ frag: m[1], site: s })
        }
        if (isMiddle || isTail) {
          const m = /^([A-Za-z0-9_-]+)(?:\s|$)/.exec(piece.text)
          if (m) suffixes.push({ frag: m[1], site: s })
        }
      } else if (n.parent && ts.isBinaryExpression(n.parent) && n.parent.operatorToken.kind === ts.SyntaxKind.PlusToken) {
        if (n.parent.left === n) {
          const m = /(?:^|\s)([A-Za-z0-9_-]+)$/.exec(piece.text)
          if (m) prefixes.push({ frag: m[1], site: s })
        } else {
          const m = /^([A-Za-z0-9_-]+)(?:\s|$)/.exec(piece.text)
          if (m) suffixes.push({ frag: m[1], site: s })
        }
      }
    }
  }
  const html = read(`${FRONTEND}/index.html`).replace(/<!--[\s\S]*?-->/g, '')
  html.split('\n').forEach((ln, i) => {
    for (const t of ln.split(/[^A-Za-z0-9_-]+/)) if (t) addTok(t, `frontend/index.html:${i + 1}`)
  })

  const classStatus = (name) => {
    if (tokens.has(name)) return { status: 'referenced', sites: tokens.get(name) }
    const via = []
    for (const p of prefixes) {
      const usable = /[-_]$/.test(p.frag) ? p.frag.length >= 2 : p.frag.length >= 3
      if (usable && name.length > p.frag.length && name.startsWith(p.frag)) via.push(`prefix "${p.frag}" @ ${p.site}`)
    }
    for (const sfx of suffixes) {
      if (/^[-_]/.test(sfx.frag) && name.length > sfx.frag.length && name.endsWith(sfx.frag)) via.push(`suffix "${sfx.frag}" @ ${sfx.site}`)
    }
    if (via.length) return { status: 'dynamicMaybe', sites: [], via: [...new Set(via)].slice(0, 6) }
    return { status: 'unreferenced', sites: [] }
  }
  classIndexCache = { tokens, prefixes, suffixes, classStatus }
  return classIndexCache
}

/** Class names in a selector, e.g. ".a .b:hover > .c" -> ["a","b","c"]. */
export function selectorClasses(selector) {
  const out = []
  // Drop attribute selectors and strings so [class*="x"] does not produce x.
  const s = selector.replace(/\[[^\]]*\]/g, ' ').replace(/(["'])(?:\.|(?!\1).)*\1/g, ' ')
  for (const m of s.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)) out.push(m[1])
  return [...new Set(out)]
}
