// css-inventory.mjs -> design-export/css-inventory.json
//
// Media queries (with the selectors inside), z-index ladder, colour literals,
// font sizes, radii, shadows, a few typography counts, and every class selector
// with its TS/TSX reference status for dead-class detection.

import {
  OUT, SOURCE_SHA, SOURCE_BRANCH, allCss, indexHtmlStyles, visitCss, atRuleChain,
  sourceTsFiles, parseTs, walkTs, nodeLine, enclosingName, ts, writeJson, checkSourcePin,
  isMain, classIndex, selectorClasses, lineAt,
} from './lib.mjs'

// Colour literals. color-mix() and rgb()/hsl() may nest one level of parens.
const COLOR_RE = /#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z_-])|\b(?:rgba?|hsla?)\([^()]*\)|\bcolor-mix\((?:[^()]|\([^()]*\))*\)/g
const NAMED_RE = /(?<![\w-])(transparent|currentColor|currentcolor|white|black|inherit)(?![\w-])/g

function tally(map, value, s) {
  if (!map.has(value)) map.set(value, { value, count: 0, sites: [] })
  const e = map.get(value)
  e.count++
  e.sites.push(s)
}

const sortTally = (map) => [...map.values()].sort((a, b) => b.count - a.count || (a.value < b.value ? -1 : a.value > b.value ? 1 : 0))

export function run() {
  checkSourcePin()
  const sources = [
    ...allCss().map((f) => ({ file: f.file, parsed: f.parsed })),
    ...indexHtmlStyles().map((s) => ({ file: s.file, parsed: s.parsed, inlineStyle: true })),
  ]

  const mediaQueries = []
  const zIndex = []
  const colors = new Map()
  const named = new Map()
  const fontSizes = new Map()
  const radii = new Map()
  const shadows = new Map()
  const textShadows = new Map()
  const fontWeights = new Map()
  const letterSpacing = new Map()
  const fontFamilies = new Map()
  const lineHeights = new Map()
  const classDefs = new Map()

  for (const src of sources) {
    visitCss(src.parsed.root, (node) => {
      if (node.type === 'atrule' && node.name === 'media' && !node.statement) {
        const selectors = []
        visitCss(node, (c) => {
          if (c.type === 'rule' && !atRuleChain(c).some((a) => /^@(-webkit-)?keyframes/.test(a))) {
            selectors.push(c.selector)
          }
        })
        mediaQueries.push({
          query: node.params,
          file: src.file,
          line: node.line,
          endLine: node.endLine,
          atRules: atRuleChain(node),
          selectors,
        })
      }
      if (node.type === 'rule') {
        const inKeyframes = atRuleChain(node).some((a) => /^@(-webkit-)?keyframes/.test(a))
        if (!inKeyframes) {
          for (const cls of selectorClasses(node.selector)) {
            if (!classDefs.has(cls)) classDefs.set(cls, [])
            classDefs.get(cls).push(`${src.file}:${node.line}`)
          }
        }
      }
      for (const d of node.decls || []) {
        const s = `${src.file}:${d.line}`
        const selector = node.type === 'rule' ? node.selector : `@${node.name} ${node.params}`
        if (d.prop === 'z-index') {
          zIndex.push({ selector, atRules: atRuleChain(node), value: d.value, file: src.file, line: d.line })
        }
        // Site of a colour literal: its own line inside a multi-line declaration.
        for (const m of d.value.matchAll(COLOR_RE)) {
          const idx = src.parsed.text.indexOf(m[0], d.start)
          const ln = idx >= 0 && idx < d.end ? lineAt(src.parsed.starts, idx) + src.parsed.lineOffset : d.line
          tally(colors, m[0], `${src.file}:${ln}`)
        }
        for (const m of d.value.matchAll(NAMED_RE)) {
          if (/color|background|border|fill|stroke|shadow|outline|caret|accent/.test(d.prop) || d.prop.startsWith('--')) tally(named, m[0], s)
        }
        if (d.prop === 'font-size') tally(fontSizes, d.value, s)
        if (/^border(-(top|bottom)-(left|right))?-radius$/.test(d.prop)) tally(radii, `${d.prop}: ${d.value}`, s)
        if (d.prop === 'box-shadow') tally(shadows, d.value, s)
        if (d.prop === 'text-shadow') tally(textShadows, d.value, s)
        if (d.prop === 'font-weight') tally(fontWeights, d.value, s)
        if (d.prop === 'letter-spacing') tally(letterSpacing, d.value, s)
        if (d.prop === 'font-family') tally(fontFamilies, d.value, s)
        if (d.prop === 'line-height') tally(lineHeights, d.value, s)
        if (d.prop === 'font') tally(fontFamilies, `font: ${d.value}`, s)
      }
    })
  }

  zIndex.sort((a, b) => {
    const na = Number.parseFloat(a.value)
    const nb = Number.parseFloat(b.value)
    const fa = Number.isFinite(na)
    const fb = Number.isFinite(nb)
    if (fa && fb && na !== nb) return na - nb
    if (fa !== fb) return fa ? -1 : 1
    if (a.file !== b.file) return a.file < b.file ? -1 : 1
    return a.line - b.line
  })

  // Inline TSX zIndex values ({ zIndex: 5 }).
  const inlineZIndex = []
  for (const p of sourceTsFiles()) {
    const e = parseTs(p)
    walkTs(e.sf, (node) => {
      if (ts.isPropertyAssignment(node) && node.name && ts.isIdentifier(node.name) && node.name.text === 'zIndex') {
        inlineZIndex.push({ expression: node.initializer.getText(e.sf), file: e.file, line: nodeLine(e.sf, node), component: enclosingName(node) })
      }
    })
  }

  const ci = classIndex()
  const classes = [...classDefs.keys()].sort().map((name) => {
    const st = ci.classStatus(name)
    return {
      name,
      definedAt: classDefs.get(name),
      unreferenced: st.status === 'unreferenced',
      dynamicMaybe: st.status === 'dynamicMaybe',
      ...(st.status === 'referenced' ? { referencedAt: st.sites.slice(0, 5) } : {}),
      ...(st.via ? { via: st.via } : {}),
    }
  })

  const queryCounts = new Map()
  for (const m of mediaQueries) tally(queryCounts, m.query, `${m.file}:${m.line}`)
  const widthValues = new Map()
  for (const m of mediaQueries) {
    for (const w of m.query.matchAll(/\((max|min)-width:\s*([\d.]+px)\)/g)) tally(widthValues, `${w[1]}-width: ${w[2]}`, `${m.file}:${m.line}`)
  }

  const zValues = [...new Set(zIndex.map((z) => z.value))]

  const data = {
    source: { sha: SOURCE_SHA, branch: SOURCE_BRANCH },
    scope: 'frontend/src/**/*.css (dot-directories excluded) plus the inline <style> of frontend/index.html. Values are taken from comment-stripped declarations only.',
    counts: {
      mediaQueryBlocks: mediaQueries.length,
      uniqueMediaQueries: queryCounts.size,
      widthBreakpoints: widthValues.size,
      zIndexDeclarations: zIndex.length,
      uniqueZIndexValues: zValues.length,
      uniqueColorLiterals: colors.size,
      uniqueHex: [...colors.keys()].filter((v) => v.startsWith('#')).length,
      uniqueHexCaseInsensitive: new Set([...colors.keys()].filter((v) => v.startsWith('#')).map((v) => v.toLowerCase())).size,
      uniqueFontSizes: fontSizes.size,
      uniqueRadii: radii.size,
      uniqueBoxShadows: shadows.size,
      classes: classes.length,
      classesUnreferenced: classes.filter((c) => c.unreferenced).length,
      classesDynamicMaybe: classes.filter((c) => c.dynamicMaybe).length,
    },
    mediaQueries,
    mediaQuerySummary: sortTally(queryCounts),
    widthBreakpoints: sortTally(widthValues),
    zIndex,
    zIndexValues: zValues,
    inlineTsxZIndex: inlineZIndex,
    colors: sortTally(colors),
    namedColors: sortTally(named),
    fontSizes: sortTally(fontSizes),
    borderRadius: sortTally(radii),
    boxShadows: sortTally(shadows),
    textShadows: sortTally(textShadows),
    typography: {
      fontWeights: sortTally(fontWeights),
      letterSpacing: sortTally(letterSpacing),
      fontFamilies: sortTally(fontFamilies),
      lineHeights: sortTally(lineHeights),
    },
    classNotes: [
      'definedAt: every rule whose selector names the class (rules inside @keyframes excluded).',
      'unreferenced: the class name never appears as a token inside any string of a non-test TS/TSX file or in index.html.',
      'dynamicMaybe: not found verbatim, but a template-literal or concatenation fragment in TS/TSX can build it (via lists the fragments); treat as possibly live.',
      'Class names that appear only in comments count as unreferenced: comments are not scanned.',
    ],
    classes,
  }
  writeJson(`${OUT}/css-inventory.json`, data)
  return {
    'css.mediaQueryBlocks': mediaQueries.length,
    'css.uniqueMediaQueries': queryCounts.size,
    'css.widthBreakpoints': widthValues.size,
    'css.zIndexDecls': zIndex.length,
    'css.zIndexValues': zValues.length,
    'css.colorLiterals': colors.size,
    'css.classes': classes.length,
    'css.unreferenced': data.counts.classesUnreferenced,
    'css.dynamicMaybe': data.counts.classesDynamicMaybe,
  }
}

if (isMain(import.meta.url)) console.log(run())
