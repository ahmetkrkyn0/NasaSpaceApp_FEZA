// fonts.mjs -> design-export/fonts.css, design-export/fonts.json
//
// Every @font-face block verbatim, with the comment line directly above it.
// The only edit is the url rewrite /fonts/x.woff2 -> assets/fonts/x.woff2, so
// the file works next to design-export/assets/.

import {
  OUT, SOURCE_SHA, SOURCE_BRANCH, allCss, visitCss, precedingComment, sliceLines,
  writeText, writeJson, checkSourcePin, isMain,
} from './lib.mjs'

export const FONT_URL_RE = /url\((['"]?)\/fonts\//g
export const rewriteFontUrls = (s) => s.replace(FONT_URL_RE, 'url($1assets/fonts/')

export function run() {
  checkSourcePin()
  const blocks = []
  for (const f of allCss()) {
    visitCss(f.parsed.root, (node) => {
      if (node.type !== 'atrule' || node.name !== 'font-face' || node.statement) return
      const cm = precedingComment(f.parsed, node.start)
      const startLine = cm ? cm.line : node.line
      const get = (prop) => {
        const d = node.decls.find((x) => x.prop === prop)
        return d ? d.value : null
      }
      const src = get('src')
      const verbatim = sliceLines(f.text, startLine, node.endLine)
      blocks.push({
        family: (get('font-family') || '').replace(/^['"]|['"]$/g, ''),
        style: get('font-style'),
        weight: get('font-weight'),
        weightRange: (get('font-weight') || '').split(/\s+/).map(Number),
        display: get('font-display'),
        unicodeRange: get('unicode-range'),
        src,
        srcRewritten: src ? rewriteFontUrls(src) : null,
        url: src ? (/url\(['"]?([^'")]+)['"]?\)/.exec(src) || [])[1] || null : null,
        comment: cm ? f.text.slice(cm.start, cm.end) : null,
        file: f.file,
        line: node.line,
        startLine,
        endLine: node.endLine,
        verbatim,
      })
    })
  }

  const out = []
  out.push('/* LunaPath @font-face declarations, extracted verbatim from source.')
  out.push(`   Source: ${SOURCE_BRANCH} @ ${SOURCE_SHA}`)
  out.push('   The only change from source: url(\'/fonts/...\') is rewritten to')
  out.push('   url(\'assets/fonts/...\') so this file resolves next to design-export/assets/.')
  out.push('   Each block is preceded by "@src <file>:<from>-<to>"; reversing the url rewrite')
  out.push('   gives a byte-exact copy of those source lines.')
  out.push('   Regenerate: node design-export/extract/run-all.mjs */')
  for (const b of blocks) {
    out.push('')
    out.push(`/* @src ${b.file}:${b.startLine}-${b.endLine} */`)
    out.push(rewriteFontUrls(b.verbatim))
  }
  out.push('')
  writeText(`${OUT}/fonts.css`, out.join('\n'))

  writeJson(`${OUT}/fonts.json`, {
    source: { sha: SOURCE_SHA, branch: SOURCE_BRANCH },
    count: blocks.length,
    families: [...new Set(blocks.map((b) => b.family))],
    fontFaces: blocks.map(({ verbatim, ...rest }) => rest),
  })
  return { 'fonts.fontFace': blocks.length }
}

if (isMain(import.meta.url)) console.log(run())
