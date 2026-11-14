// motion.mjs -> design-export/motion.css, design-export/motion.json
//
// Every @keyframes block verbatim (unused ones marked), every
// @media (prefers-reduced-motion: reduce) block verbatim, and an inventory of
// transition/animation declarations in CSS and in TSX inline styles.

import {
  OUT, SOURCE_SHA, SOURCE_BRANCH, allCss, visitCss, atRuleChain, sliceLines, lineIndex,
  sourceTsFiles, parseTs, walkTs, nodeLine, enclosingName, ts, writeText, writeJson,
  checkSourcePin, isMain, classIndex, selectorClasses,
} from './lib.mjs'

const ANIM_PROP = /^(-webkit-)?animation(-[a-z-]+)?$/
const TRANS_PROP = /^(-webkit-)?transition(-[a-z-]+)?$/

function splitTopLevel(value, sep = ',') {
  const parts = []
  let depth = 0
  let cur = ''
  for (const c of value) {
    if (c === '(') depth++
    if (c === ')') depth--
    if (c === sep && depth === 0) {
      parts.push(cur.trim())
      cur = ''
    } else cur += c
  }
  if (cur.trim()) parts.push(cur.trim())
  return parts
}

/** Identifiers in an animation shorthand or animation-name value. */
function animationIdents(value) {
  const ids = []
  for (const item of splitTopLevel(value)) {
    for (const tok of item.replace(/\([^)]*\)/g, ' ').split(/\s+/)) {
      if (/^-?[A-Za-z_][A-Za-z0-9_-]*$/.test(tok)) ids.push(tok)
    }
  }
  return ids
}

/** Whole-line copy when the node owns its lines; null when other code shares them. */
function ownsLines(text, starts, startOffset, endOffset, startLine, endLine) {
  const lineStart = starts[startLine - 1]
  const lineEnd = endLine < starts.length ? starts[endLine] - 1 : text.length
  const before = text.slice(lineStart, startOffset)
  const after = text.slice(endOffset, lineEnd)
  return /^\s*$/.test(before) && /^\s*$/.test(after)
}

export function run() {
  checkSourcePin()
  const css = allCss()
  const keyframes = []
  const reducedMotion = []
  const transitions = []
  const animations = []
  const anomalies = []

  for (const f of css) {
    const starts = lineIndex(f.text)
    visitCss(f.parsed.root, (node) => {
      if (node.type === 'atrule' && /^(-webkit-)?keyframes$/.test(node.name) && !node.statement) {
        if (!ownsLines(f.text, starts, node.start, node.end, node.line, node.endLine)) {
          anomalies.push(`@keyframes ${node.params} at ${f.file}:${node.line} shares its lines with other code`)
        }
        keyframes.push({
          name: node.params,
          file: f.file,
          line: node.line,
          endLine: node.endLine,
          stops: node.children.map((c) => ({
            selector: c.selector,
            line: c.line,
            declarations: c.decls.map((d) => `${d.prop}: ${d.value}${d.important ? ' !important' : ''}`),
          })),
          verbatim: sliceLines(f.text, node.line, node.endLine),
          usedBy: [],
          tsMentions: [],
        })
      }
      if (node.type === 'atrule' && node.name === 'media' && /prefers-reduced-motion\s*:\s*reduce/.test(node.params) && !node.statement) {
        if (!ownsLines(f.text, starts, node.start, node.end, node.line, node.endLine)) {
          anomalies.push(`reduced-motion block at ${f.file}:${node.line} shares its lines with other code`)
        }
        const selectors = []
        visitCss(node, (c) => {
          if (c.type === 'rule') selectors.push({ selector: c.selector, line: c.line, declarations: c.decls.map((d) => `${d.prop}: ${d.value}${d.important ? ' !important' : ''}`) })
        })
        reducedMotion.push({
          query: node.params,
          file: f.file,
          line: node.line,
          endLine: node.endLine,
          atRules: atRuleChain(node),
          rules: selectors,
          verbatim: sliceLines(f.text, node.line, node.endLine),
        })
      }
      if (node.type === 'rule' || node.type === 'atrule') {
        for (const d of node.decls) {
          const rec = {
            selector: node.type === 'rule' ? node.selector : `@${node.name} ${node.params}`,
            atRules: atRuleChain(node),
            property: d.prop,
            value: d.value,
            important: d.important,
            file: f.file,
            line: d.line,
          }
          if (TRANS_PROP.test(d.prop)) transitions.push(rec)
          if (ANIM_PROP.test(d.prop)) {
            // A declaration inside a keyframe stop is not an animation reference.
            const inKeyframes = rec.atRules.some((a) => /^@(-webkit-)?keyframes/.test(a))
            if (!inKeyframes) animations.push(rec)
          }
        }
      }
    })
  }

  // ── TSX inline styles: { animation: '...' }, { transition: '...' } ─────────
  const inlineAnimations = []
  const inlineTransitions = []
  const tsEntries = sourceTsFiles().map(parseTs)
  const kfNames = new Set(keyframes.map((k) => k.name))
  for (const e of tsEntries) {
    walkTs(e.sf, (node) => {
      let prop = null
      let valueNode = null
      if (ts.isPropertyAssignment(node) && node.name && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))) {
        prop = node.name.text
        valueNode = node.initializer
      } else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(node.left)) {
        prop = node.left.name.text
        valueNode = node.right
      }
      if (!prop || !valueNode) return
      const isAnim = /^(animation|animationName|WebkitAnimation)$/.test(prop)
      const isTrans = /^(transition|transitionProperty|transitionDuration|transitionTimingFunction|transitionDelay)$/.test(prop)
      if (!isAnim && !isTrans) return
      const rec = {
        property: prop,
        expression: valueNode.getText(e.sf),
        file: e.file,
        line: nodeLine(e.sf, node),
        component: enclosingName(node),
      }
      if (isAnim) inlineAnimations.push(rec)
      else inlineTransitions.push(rec)
    })
    // Whole-identifier mentions of keyframe names in any string (informational).
    walkTs(e.sf, (node) => {
      if (!(ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) ||
        ts.isTemplateMiddle(node) || ts.isTemplateTail(node))) return
      for (const name of kfNames) {
        const re = new RegExp(`(?<![A-Za-z0-9_-])${name.replace(/[-]/g, '\\-')}(?![A-Za-z0-9_-])`)
        if (re.test(node.text)) {
          const k = keyframes.find((x) => x.name === name)
          k.tsMentions.push({ file: e.file, line: nodeLine(e.sf, node), text: node.text })
        }
      }
    })
  }

  // ── Wire keyframes to their users ──────────────────────────────────────────
  const ci = classIndex()
  for (const a of animations) {
    const ids = animationIdents(a.value)
    for (const id of ids) {
      const k = keyframes.find((x) => x.name === id)
      if (!k) continue
      const classes = selectorClasses(a.selector)
      k.usedBy.push({
        kind: 'css',
        selector: a.selector,
        atRules: a.atRules,
        file: a.file,
        line: a.line,
        declaration: `${a.property}: ${a.value}${a.important ? ' !important' : ''}`,
        selectorClassStatus: Object.fromEntries(classes.map((c) => [c, ci.classStatus(c).status])),
      })
    }
  }
  for (const a of inlineAnimations) {
    for (const k of keyframes) {
      const re = new RegExp(`(?<![A-Za-z0-9_-])${k.name.replace(/[-]/g, '\\-')}(?![A-Za-z0-9_-])`)
      if (re.test(a.expression)) {
        k.usedBy.push({ kind: 'tsx-inline', selector: a.component, file: a.file, line: a.line, declaration: `${a.property}: ${a.expression}` })
      }
    }
  }

  for (const k of keyframes) {
    const cssUsers = k.usedBy.filter((u) => u.kind === 'css')
    const allNonReduced = k.usedBy.length > 0 && k.usedBy.every((u) => !(u.atRules || []).some((r) => /prefers-reduced-motion/.test(r)))
    k.used = k.usedBy.length > 0
    // A keyframe whose every CSS user sits on a selector with no class referenced
    // from TS/TSX is "referenced in CSS, possibly never rendered".
    k.onlyUnreferencedSelectors = cssUsers.length > 0 && k.usedBy.every((u) =>
      u.kind === 'css' && Object.keys(u.selectorClassStatus).length > 0 &&
      Object.values(u.selectorClassStatus).some((s) => s === 'unreferenced'))
    k.usedOutsideReducedMotion = allNonReduced
  }

  // ── motion.css ─────────────────────────────────────────────────────────────
  const out = []
  out.push('/* LunaPath motion: every @keyframes and every prefers-reduced-motion block,')
  out.push('   extracted verbatim from source.')
  out.push(`   Source: ${SOURCE_BRANCH} @ ${SOURCE_SHA}`)
  out.push('   Each block is preceded by "@src <file>:<from>-<to>"; the block is a byte-exact')
  out.push('   copy of those source lines. Keyframes that no animation / animation-name')
  out.push('   declaration (CSS) or inline TSX animation style references carry /* UNUSED */.')
  out.push('   Regenerate: node design-export/extract/run-all.mjs */')
  out.push('')
  out.push(`/* ===== @keyframes (${keyframes.length}: ${keyframes.filter((k) => k.used).length} used, ${keyframes.filter((k) => !k.used).length} unused) ===== */`)
  for (const k of keyframes) {
    out.push('')
    out.push(`/* @src ${k.file}:${k.line}-${k.endLine} */`)
    if (!k.used) out.push('/* UNUSED */')
    out.push(k.verbatim)
  }
  out.push('')
  out.push(`/* ===== @media (prefers-reduced-motion: reduce) (${reducedMotion.length}) ===== */`)
  for (const r of reducedMotion) {
    out.push('')
    out.push(`/* @src ${r.file}:${r.line}-${r.endLine} */`)
    out.push(r.verbatim)
  }
  out.push('')
  writeText(`${OUT}/motion.css`, out.join('\n'))

  writeJson(`${OUT}/motion.json`, {
    source: { sha: SOURCE_SHA, branch: SOURCE_BRANCH },
    counts: {
      keyframes: keyframes.length,
      keyframesUsed: keyframes.filter((k) => k.used).length,
      keyframesUnused: keyframes.filter((k) => !k.used).length,
      reducedMotionBlocks: reducedMotion.length,
      transitions: transitions.length,
      animations: animations.length,
      inlineTsxTransitions: inlineTransitions.length,
      inlineTsxAnimations: inlineAnimations.length,
    },
    notes: [
      'usedBy: CSS animation/animation-name declarations (outside @keyframes) and TSX inline animation styles whose value names the keyframe as a whole identifier.',
      'selectorClassStatus: whether each class in the using selector is referenced from TS/TSX strings (referenced | dynamicMaybe | unreferenced); see css-inventory.json classes.',
      'onlyUnreferencedSelectors: every user selector contains a class never referenced from TS/TSX, so the animation may never render.',
      'tsMentions: informational whole-identifier mentions in TS strings; not counted as usage.',
    ],
    anomalies,
    keyframes: keyframes.map(({ verbatim, ...rest }) => rest),
    reducedMotion: reducedMotion.map(({ verbatim, ...rest }) => rest),
    transitions,
    animations,
    inlineTsx: { animations: inlineAnimations, transitions: inlineTransitions },
  })

  return {
    'motion.keyframes': keyframes.length,
    'motion.keyframesUsed': keyframes.filter((k) => k.used).length,
    'motion.keyframesUnused': keyframes.filter((k) => !k.used).map((k) => k.name).join(','),
    'motion.reducedMotion': reducedMotion.length,
    'motion.transitions': transitions.length,
    'motion.animations': animations.length,
    'motion.anomalies': anomalies.length,
  }
}

if (isMain(import.meta.url)) console.log(run())
