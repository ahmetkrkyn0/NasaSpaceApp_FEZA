// icons.mjs -> design-export/icons/<name>.svg, design-export/icons.json
//
// The Material Symbols path data inlined in components/Fleet/SpecIcons.tsx.

import {
  OUT, SRC, SOURCE_SHA, SOURCE_BRANCH, parseTs, walkTs, nodeLine, ts, writeText, writeJson,
  resetDir, checkSourcePin, isMain,
} from './lib.mjs'

export function run() {
  checkSourcePin()
  const e = parseTs(`${SRC}/components/Fleet/SpecIcons.tsx`)
  let unionMembers = []
  let unionLine = null
  let pathsDecl = null
  let viewBox = null
  walkTs(e.sf, (n) => {
    if (ts.isTypeAliasDeclaration(n) && n.name.text === 'IconName' && ts.isUnionTypeNode(n.type)) {
      unionLine = nodeLine(e.sf, n)
      unionMembers = n.type.types
        .filter((t) => ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal))
        .map((t) => ({ name: t.literal.text, line: nodeLine(e.sf, t) }))
    }
    if (ts.isVariableDeclaration(n) && n.name.getText(e.sf) === 'PATHS') pathsDecl = n
    if (ts.isJsxAttribute(n) && n.name.getText(e.sf) === 'viewBox' && n.initializer && ts.isStringLiteral(n.initializer)) {
      viewBox = n.initializer.text
    }
  })
  if (!pathsDecl) throw new Error('PATHS not found in SpecIcons.tsx')
  let obj = pathsDecl.initializer
  while (obj && (ts.isAsExpression(obj) || ts.isSatisfiesExpression?.(obj))) obj = obj.expression
  const icons = []
  const firstByD = new Map()
  for (const p of obj.properties) {
    if (!ts.isPropertyAssignment(p)) continue
    const name = ts.isStringLiteral(p.name) ? p.name.text : p.name.getText(e.sf)
    const init = p.initializer
    if (!(ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init))) {
      throw new Error(`icon ${name} at line ${nodeLine(e.sf, p)} is not a string literal`)
    }
    const d = init.text
    const duplicateOf = firstByD.get(d) ?? null
    if (!duplicateOf) firstByD.set(d, name)
    icons.push({ name, d, file: e.file, line: nodeLine(e.sf, p), duplicateOf })
  }

  resetDir(`${OUT}/icons`)
  const vb = viewBox || '0 -960 960 960'
  for (const ic of icons) {
    writeText(`${OUT}/icons/${ic.name}.svg`,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="24" height="24" fill="currentColor"><path d="${ic.d}"/></svg>\n`)
  }

  const unionNames = unionMembers.map((u) => u.name)
  const pathNames = icons.map((i) => i.name)
  writeJson(`${OUT}/icons.json`, {
    source: { sha: SOURCE_SHA, branch: SOURCE_BRANCH },
    file: e.file,
    viewBox: vb,
    rendering: 'Rendered by the Icon component in the same file: <svg class="lp-icon ..." viewBox fill="currentColor" aria-hidden="true" focusable="false"><path d/></svg>; size comes from the parent font-size (1em, via .lp-icon CSS).',
    counts: {
      iconNameUnionMembers: unionNames.length,
      pathsEntries: pathNames.length,
      duplicates: icons.filter((i) => i.duplicateOf).length,
    },
    iconNameUnionLine: unionLine,
    inUnionNotInPaths: unionNames.filter((n) => !pathNames.includes(n)),
    inPathsNotInUnion: pathNames.filter((n) => !unionNames.includes(n)),
    icons,
  })
  return {
    'icons.union': unionNames.length,
    'icons.paths': pathNames.length,
    'icons.duplicates': icons.filter((i) => i.duplicateOf).length,
  }
}

if (isMain(import.meta.url)) console.log(run())
