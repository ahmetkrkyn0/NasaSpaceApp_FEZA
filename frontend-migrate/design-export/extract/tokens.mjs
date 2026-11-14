// tokens.mjs -> design-export/tokens.css, design-export/tokens.json
//
// tokens.css: every `:root` block of frontend/src/**/*.css verbatim (with the
// comment directly above it, when there is one), then the custom properties
// declared on other selectors as clearly marked excerpts.
// tokens.json: every custom-property declaration, structured, with alias
// resolution through the :root chain and var() usage counts.

import {
  OUT, SOURCE_SHA, SOURCE_BRANCH, allCss, visitCss, atRuleChain, precedingComment,
  sourceTsFiles, parseTs, tsStringPieces, walkTs, nodeLine, enclosingName, ts,
  sliceLines, writeText, writeJson, checkSourcePin, stripCssComments, isMain,
} from './lib.mjs'

const VAR_USE = /var\(\s*(--[A-Za-z0-9_-]+)\s*(?=[,)\s])/g

export function run() {
  checkSourcePin()
  const css = allCss()
  const declarations = []
  const rootBlocks = []
  const scopedRules = []

  for (const f of css) {
    visitCss(f.parsed.root, (node) => {
      if (node.type !== 'rule') return
      const customs = node.decls.filter((d) => d.prop.startsWith('--'))
      const chain = atRuleChain(node)
      const isRoot = node.selector === ':root' && chain.length === 0
      if (isRoot) {
        const cm = precedingComment(f.parsed, node.start)
        const startLine = cm ? cm.line : node.line
        rootBlocks.push({
          file: f.file,
          selector: node.selector,
          startLine,
          blockLine: node.line,
          endLine: node.endLine,
          text: sliceLines(f.text, startLine, node.endLine),
        })
      } else if (customs.length) {
        scopedRules.push({ file: f.file, node, chain, customs, text: f.text })
      }
      for (const d of customs) {
        declarations.push({
          name: d.prop,
          value: d.value,
          selector: node.selector,
          atRules: chain,
          scope: isRoot ? 'root' : 'scoped',
          file: f.file,
          line: d.line,
          important: d.important,
        })
      }
    })
  }

  // ── Resolution through :root only ──────────────────────────────────────────
  const rootMap = new Map()
  for (const d of declarations) if (d.scope === 'root') rootMap.set(d.name, d.value)

  const resolve = (value, seen = new Set()) => {
    let unresolved = false
    const out = value.replace(/var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))*[^()]*))?\)/g, (m, name, fallback) => {
      if (seen.has(name)) {
        unresolved = true
        return m
      }
      if (rootMap.has(name)) {
        const next = new Set(seen)
        next.add(name)
        const r = resolve(rootMap.get(name), next)
        if (r.unresolved) unresolved = true
        return r.value
      }
      if (fallback !== undefined) return resolve(fallback.trim(), seen).value
      unresolved = true
      return m
    })
    return { value: out, unresolved }
  }

  for (const d of declarations) {
    const single = /^var\(\s*(--[A-Za-z0-9_-]+)\s*\)$/.exec(d.value)
    d.isAlias = Boolean(single)
    d.aliasOf = single ? single[1] : null
    const r = resolve(d.value)
    d.resolved = r.unresolved ? null : r.value
    if (r.unresolved) d.resolvedPartial = r.value
  }

  // ── Inline TSX custom properties (style={{ '--x': ... }}) ─────────────────
  const inlineTsx = []
  const tsFiles = sourceTsFiles().map(parseTs)
  for (const e of tsFiles) {
    walkTs(e.sf, (node) => {
      if (ts.isPropertyAssignment(node) && node.name &&
        (ts.isStringLiteral(node.name) || ts.isNoSubstitutionTemplateLiteral(node.name)) &&
        node.name.text.startsWith('--')) {
        inlineTsx.push({
          name: node.name.text,
          valueExpression: node.initializer.getText(e.sf),
          file: e.file,
          line: nodeLine(e.sf, node),
          component: enclosingName(node),
        })
      }
    })
  }

  // ── Usage counts ───────────────────────────────────────────────────────────
  const usage = new Map()
  const bump = (name, kind, site) => {
    if (!usage.has(name)) usage.set(name, { name, css: 0, ts: 0, sites: [] })
    const u = usage.get(name)
    u[kind]++
    u.sites.push(site)
  }
  for (const f of css) {
    const clean = stripCssComments(f.text)
    const lines = clean.split('\n')
    lines.forEach((ln, idx) => {
      for (const m of ln.matchAll(VAR_USE)) bump(m[1], 'css', `${f.file}:${idx + 1}`)
    })
  }
  for (const e of tsFiles) {
    for (const piece of tsStringPieces(e)) {
      for (const m of piece.text.matchAll(VAR_USE)) bump(m[1], 'ts', `${e.file}:${piece.line}`)
    }
  }

  for (const d of declarations) {
    const u = usage.get(d.name)
    d.usageCount = u ? u.css + u.ts : 0
  }

  const declaredNames = new Set(declarations.map((d) => d.name))
  const inlineNames = new Set(inlineTsx.map((d) => d.name))
  const usageList = [...new Set([...declaredNames, ...usage.keys(), ...inlineNames])]
    .sort()
    .map((name) => {
      const u = usage.get(name) || { css: 0, ts: 0, sites: [] }
      return {
        name,
        usageCount: u.css + u.ts,
        cssUses: u.css,
        tsUses: u.ts,
        declaredInCss: declaredNames.has(name),
        declaredInlineTsx: inlineNames.has(name),
        sites: u.sites,
      }
    })

  const tokensJson = {
    source: { sha: SOURCE_SHA, branch: SOURCE_BRANCH },
    notes: [
      'declarations: every custom-property declaration in frontend/src/**/*.css, file order.',
      'resolved follows var() chains through top-level :root declarations only; null when a reference cannot be resolved there (resolvedPartial then shows how far it got).',
      'usageCount counts var(--name) occurrences (boundary-matched) in comment-stripped CSS and in TS/TSX string literals of non-test files.',
      'inlineTsx: custom properties set from TSX style objects; they have no CSS declaration by design.',
    ],
    counts: {
      declarations: declarations.length,
      rootDeclarations: declarations.filter((d) => d.scope === 'root').length,
      scopedDeclarations: declarations.filter((d) => d.scope === 'scoped').length,
      uniqueNames: declaredNames.size,
      inlineTsx: inlineTsx.length,
      rootBlocks: rootBlocks.length,
    },
    declarations: declarations.map((d) => ({
      name: d.name,
      value: d.value,
      selector: d.selector,
      atRules: d.atRules,
      scope: d.scope,
      file: d.file,
      line: d.line,
      important: d.important,
      isAlias: d.isAlias,
      aliasOf: d.aliasOf,
      resolved: d.resolved,
      ...(d.resolvedPartial !== undefined ? { resolvedPartial: d.resolvedPartial } : {}),
      usageCount: d.usageCount,
    })),
    inlineTsx,
    usage: usageList,
    usedButNeverDeclared: usageList.filter((u) => !u.declaredInCss && !u.declaredInlineTsx).map((u) => u.name),
    declaredButNeverUsed: usageList.filter((u) => u.declaredInCss && u.usageCount === 0).map((u) => u.name),
  }

  // ── tokens.css ─────────────────────────────────────────────────────────────
  const out = []
  out.push('/* LunaPath design tokens, extracted verbatim from source.')
  out.push(`   Source: ${SOURCE_BRANCH} @ ${SOURCE_SHA}`)
  out.push('   Blocks:')
  for (const b of rootBlocks) out.push(`     ${b.file}:${b.startLine}-${b.endLine}  ${b.selector}`)
  out.push('   Scoped custom properties (excerpts, custom-property lines only):')
  for (const s of scopedRules) {
    const ctx = s.chain.length ? `${s.chain.join(' > ')} > ` : ''
    out.push(`     ${s.file}:${s.customs.map((d) => d.line).join(',')}  ${ctx}${s.node.selector}`)
  }
  out.push('   Regenerate: node design-export/extract/run-all.mjs')
  out.push('   Each block below is preceded by a machine-readable marker:')
  out.push('     @src <file>:<from>-<to>      the block is a byte-exact copy of those source lines')
  out.push('     @scoped <file> lines=<a,b>  the excerpt lines are byte-exact copies of those source lines */')
  out.push('')
  out.push('/* ===== :root blocks ===== */')
  for (const b of rootBlocks) {
    out.push('')
    out.push(`/* @src ${b.file}:${b.startLine}-${b.endLine} */`)
    out.push(b.text)
  }
  out.push('')
  out.push('/* ===== Scoped custom properties =====')
  out.push('   Declared on a selector other than a top-level :root. Each excerpt keeps')
  out.push('   only the custom-property declaration lines of that rule; other')
  out.push('   declarations of the rule are omitted. */')
  for (const s of scopedRules) {
    const lineNums = []
    for (const d of s.customs) {
      const endLine = s.text.slice(0, d.end).split('\n').length
      for (let l = d.line; l <= endLine; l++) lineNums.push(l)
    }
    const ctx = s.chain.length ? s.chain.join(' > ') : '(none)'
    out.push('')
    out.push(`/* @scoped ${s.file} lines=${lineNums.join(',')} selector="${s.node.selector}" atRules="${ctx}" */`)
    const lines = s.text.split('\n')
    const indentWrap = s.chain.length > 0
    if (indentWrap) out.push(`${s.chain.map((c) => `${c} {`).join(' ')}`)
    out.push(`${s.node.selector} {`)
    for (const l of lineNums) out.push(lines[l - 1])
    out.push('}')
    if (indentWrap) out.push(s.chain.map(() => '}').join(' '))
  }
  out.push('')

  writeText(`${OUT}/tokens.css`, out.join('\n'))
  writeJson(`${OUT}/tokens.json`, tokensJson)

  return {
    'tokens.declarations': declarations.length,
    'tokens.root': tokensJson.counts.rootDeclarations,
    'tokens.scoped': tokensJson.counts.scopedDeclarations,
    'tokens.rootBlocks': rootBlocks.length,
    'tokens.inlineTsx': inlineTsx.length,
    'tokens.usedButNeverDeclared': tokensJson.usedButNeverDeclared.length,
    'tokens.declaredButNeverUsed': tokensJson.declaredButNeverUsed.length,
  }
}

if (isMain(import.meta.url)) console.log(run())
