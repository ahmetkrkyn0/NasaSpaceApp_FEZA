// colormaps.mjs -> design-export/colormaps.json
//
// Every colour ramp, single colour and colour/dash lookup table the 2-D map,
// the overlays and the 3-D view paint with, parsed from the TS sources with
// the values exactly as written. Plus every hex literal in TS/TSX.

import {
  OUT, SRC, SOURCE_SHA, SOURCE_BRANCH, sourceTsFiles, parseTs, walkTs, nodeLine,
  enclosingName, ts, writeJson, checkSourcePin, isMain,
} from './lib.mjs'

const HEX_STR = /#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z_])/g
const HEX_NUM = /^0x[0-9a-fA-F]{6}$/
const CSS_FN_STR = /\b(?:rgba?|hsla?)\([^()]*\)/g

const isNum = (n) => ts.isNumericLiteral(n) || (ts.isPrefixUnaryExpression(n) && ts.isNumericLiteral(n.operand))
const isRgbTriple = (n) => ts.isArrayLiteralExpression(n) && n.elements.length === 3 && n.elements.every(isNum)
const isRamp = (n) => ts.isArrayLiteralExpression(n) && n.elements.length >= 2 && n.elements.every(isRgbTriple)
const strip = (n) => {
  let x = n
  while (x && (ts.isAsExpression(x) || ts.isParenthesizedExpression(x) || ts.isSatisfiesExpression?.(x) || ts.isTypeAssertionExpression?.(x))) x = x.expression
  return x
}

function tripleOf(sf, n) {
  return n.elements.map((e) => Number(e.getText(sf)))
}

function rampEntry(e, name, arr, extra = {}) {
  return {
    name,
    kind: 'ramp',
    stops: arr.elements.map((t) => tripleOf(e.sf, t)),
    stopsText: arr.elements.map((t) => t.getText(e.sf)),
    stopLines: arr.elements.map((t) => nodeLine(e.sf, t)),
    file: e.file,
    line: nodeLine(e.sf, arr.parent && ts.isVariableDeclaration(arr.parent) ? arr.parent : arr),
    ...extra,
  }
}

/** Human-readable path from a literal up to its nearest named binding. */
function describeContext(sf, node) {
  const segs = []
  let cur = node
  let identifier = null
  for (let depth = 0; depth < 8 && cur.parent; depth++) {
    const p = cur.parent
    if (ts.isArrayLiteralExpression(p)) segs.unshift(`[${p.elements.indexOf(cur)}]`)
    else if (ts.isPropertyAssignment(p)) {
      const nm = p.name.getText(sf)
      segs.unshift(`.${nm}`)
      if (!identifier) identifier = nm
    } else if (ts.isNewExpression(p) || ts.isCallExpression(p)) {
      segs.unshift(`${ts.isNewExpression(p) ? 'new ' : ''}${p.expression.getText(sf)}(…)`)
    } else if (ts.isVariableDeclaration(p)) {
      segs.unshift(p.name.getText(sf))
      identifier = p.name.getText(sf)
      break
    } else if (ts.isPropertyDeclaration(p)) {
      segs.unshift(p.name.getText(sf))
      identifier = p.name.getText(sf)
      break
    } else if (ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      segs.unshift(`${p.left.getText(sf)} =`)
      identifier = identifier || p.left.getText(sf)
      break
    } else if (ts.isReturnStatement(p)) {
      segs.unshift('return')
      break
    } else if (ts.isCaseClause(p)) {
      segs.unshift(`case ${p.expression.getText(sf)}`)
      break
    } else if (ts.isJsxAttribute(p)) {
      segs.unshift(`${p.name.getText(sf)}=`)
      identifier = identifier || p.name.getText(sf)
      break
    } else if (ts.isBlock(p) || ts.isSourceFile(p) || ts.isExpressionStatement(p)) break
    cur = p
  }
  return { identifier, path: segs.join(' '), enclosingFunction: enclosingName(node) }
}

/** switch(level.toUpperCase()) { case 'X': return <literal> } -> table rows */
function switchTable(e, fn) {
  const rows = []
  let defaultValue = null
  let defaultLine = null
  walkTs(fn.body, (n) => {
    if (!ts.isSwitchStatement(n)) return
    for (const clause of n.caseBlock.clauses) {
      const ret = clause.statements.find(ts.isReturnStatement)
      const valueText = ret && ret.expression ? ret.expression.getText(e.sf) : null
      let value = valueText
      if (ret && ret.expression && ts.isStringLiteral(ret.expression)) value = ret.expression.text
      else if (ret && ret.expression && ts.isArrayLiteralExpression(ret.expression)) value = ret.expression.elements.map((x) => Number(x.getText(e.sf)))
      if (ts.isCaseClause(clause)) {
        rows.push({ case: ts.isStringLiteral(clause.expression) ? clause.expression.text : clause.expression.getText(e.sf), value, valueText, line: nodeLine(e.sf, clause) })
      } else {
        defaultValue = value
        defaultLine = nodeLine(e.sf, clause)
      }
    }
  })
  return { rows, defaultValue, defaultLine }
}

export function run() {
  checkSourcePin()
  const entries = []
  const anomalies = []

  // ── colormap.ts ────────────────────────────────────────────────────────────
  const cm = parseTs(`${SRC}/colormap.ts`)
  const riskHex = {}
  for (const st of cm.sf.statements) {
    if (ts.isVariableStatement(st)) {
      const exported = Boolean(st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
      for (const d of st.declarationList.declarations) {
        const name = d.name.getText(cm.sf)
        const init = strip(d.initializer)
        if (!init) continue
        if (isRamp(init)) entries.push(rampEntry(cm, name, init, { exported, line: nodeLine(cm.sf, d) }))
        else if (isRgbTriple(init)) {
          entries.push({ name, kind: 'color', format: 'rgb', value: tripleOf(cm.sf, init), valueText: init.getText(cm.sf), exported, file: cm.file, line: nodeLine(cm.sf, d) })
        } else if (ts.isStringLiteral(init) && /^#[0-9a-fA-F]{3,8}$/.test(init.text)) {
          entries.push({ name, kind: 'color', format: 'hex', value: init.text, exported, file: cm.file, line: nodeLine(cm.sf, d) })
        }
      }
    }
    if (ts.isFunctionDeclaration(st) && st.name && st.body) {
      const fname = st.name.text
      const tbl = switchTable(cm, st)
      if (tbl.rows.length) {
        entries.push({
          name: fname,
          kind: 'table',
          tableKind: fname === 'riskToDash' ? 'dash' : 'color',
          rows: tbl.rows,
          default: tbl.defaultValue,
          defaultLine: tbl.defaultLine,
          file: cm.file,
          line: nodeLine(cm.sf, st),
        })
        if (fname === 'riskToHex') {
          for (const r of tbl.rows) riskHex[r.case] = r.value
        }
      }
      // if (percent > N) return riskToHex('X') ... return riskToHex('Y')
      const thresholds = []
      for (const s of st.body.statements) {
        if (ts.isIfStatement(s)) {
          const thenRet = ts.isBlock(s.thenStatement) ? s.thenStatement.statements.find(ts.isReturnStatement) : (ts.isReturnStatement(s.thenStatement) ? s.thenStatement : null)
          if (thenRet && thenRet.expression && ts.isCallExpression(thenRet.expression) && thenRet.expression.expression.getText(cm.sf) === 'riskToHex') {
            thresholds.push({ condition: s.expression.getText(cm.sf), returns: thenRet.expression.getText(cm.sf), level: thenRet.expression.arguments[0].text, line: nodeLine(cm.sf, s) })
          }
        } else if (ts.isReturnStatement(s) && thresholds.length && s.expression && ts.isCallExpression(s.expression)) {
          thresholds.push({ condition: 'otherwise', returns: s.expression.getText(cm.sf), level: s.expression.arguments[0]?.text, line: nodeLine(cm.sf, s) })
        }
      }
      if (thresholds.length) {
        entries.push({ name: fname, kind: 'table', tableKind: 'threshold', rows: thresholds, file: cm.file, line: nodeLine(cm.sf, st) })
      }
      // Inline RGB returns (the colour drawn for a non-finite value, etc.).
      walkTs(st.body, (n) => {
        if (ts.isReturnStatement(n) && n.expression && isRgbTriple(n.expression)) {
          entries.push({
            name: `${fname}#return@${nodeLine(cm.sf, n)}`,
            kind: 'color',
            format: 'rgb',
            value: tripleOf(cm.sf, n.expression),
            valueText: n.expression.getText(cm.sf),
            note: 'inline return value inside the function (e.g. the colour for a null / non-finite reading)',
            condition: n.parent && ts.isBlock(n.parent) && n.parent.parent && ts.isIfStatement(n.parent.parent) ? n.parent.parent.expression.getText(cm.sf) : null,
            file: cm.file,
            line: nodeLine(cm.sf, n),
          })
        }
      })
    }
  }
  for (const t of entries.filter((x) => x.tableKind === 'threshold')) {
    for (const r of t.rows) r.resolved = riskHex[r.level] ?? null
  }

  // ── safe-haven/overlays.ts DARK_HOURS_STOPS ────────────────────────────────
  const sh = parseTs(`${SRC}/features/safe-haven/overlays.ts`)
  // ── time-axis/overlays.ts RAMP_STOPS ───────────────────────────────────────
  const ta = parseTs(`${SRC}/features/time-axis/overlays.ts`)
  for (const e of [sh, ta]) {
    for (const st of e.sf.statements) {
      if (!ts.isVariableStatement(st)) continue
      for (const d of st.declarationList.declarations) {
        const name = d.name.getText(e.sf)
        const init = strip(d.initializer)
        if (!init) continue
        if (isRamp(init)) entries.push(rampEntry(e, name, init, { line: nodeLine(e.sf, d) }))
        else if (ts.isObjectLiteralExpression(init)) {
          const rows = []
          for (const p of init.properties) {
            if (!ts.isPropertyAssignment(p)) continue
            const v = strip(p.initializer)
            const key = p.name.getText(e.sf)
            if (isRamp(v)) rows.push({ key, kind: 'ramp', stops: v.elements.map((t) => tripleOf(e.sf, t)), stopsText: v.elements.map((t) => t.getText(e.sf)), line: nodeLine(e.sf, p) })
            else rows.push({ key, kind: 'alias', aliasOf: v.getText(e.sf), line: nodeLine(e.sf, p) })
          }
          if (rows.length) entries.push({ name, kind: 'table', tableKind: 'ramp-by-key', rows, file: e.file, line: nodeLine(e.sf, d) })
        }
      }
    }
  }

  // ── TerrainCanvas3D.tsx RAMP / FALLBACK_RAMP / module-level colours ────────
  const tc = parseTs(`${SRC}/TerrainCanvas3D.tsx`)
  const colorArg = (n) => {
    const x = strip(n)
    if (ts.isNewExpression(x) && x.arguments && x.arguments.length === 1) {
      const a = x.arguments[0]
      if (ts.isNumericLiteral(a) && HEX_NUM.test(a.getText(tc.sf))) return a.getText(tc.sf)
      if (ts.isStringLiteral(a)) return a.text
    }
    return null
  }
  for (const st of tc.sf.statements) {
    if (!ts.isVariableStatement(st)) continue
    for (const d of st.declarationList.declarations) {
      const name = d.name.getText(tc.sf)
      const init = strip(d.initializer)
      if (!init) continue
      if (ts.isObjectLiteralExpression(init)) {
        const rows = []
        for (const p of init.properties) {
          if (!ts.isPropertyAssignment(p)) continue
          const v = strip(p.initializer)
          if (ts.isArrayLiteralExpression(v) && v.elements.every((x) => colorArg(x))) {
            rows.push({ key: p.name.getText(tc.sf), values: v.elements.map(colorArg), valueText: v.getText(tc.sf), line: nodeLine(tc.sf, p) })
          }
        }
        if (rows.length) entries.push({ name, kind: 'table', tableKind: 'ramp-by-key', note: 'two-stop [low, high] THREE.Color ramps', rows, file: tc.file, line: nodeLine(tc.sf, d) })
      } else if (ts.isArrayLiteralExpression(init) && init.elements.length >= 2 && init.elements.every((x) => colorArg(x))) {
        entries.push({ name, kind: 'ramp', values: init.elements.map(colorArg), valueText: init.getText(tc.sf), stopLines: init.elements.map((x) => nodeLine(tc.sf, x)), file: tc.file, line: nodeLine(tc.sf, d) })
      } else if (colorArg(init)) {
        entries.push({ name, kind: 'color', format: 'hex-number', value: colorArg(init), valueText: init.getText(tc.sf), file: tc.file, line: nodeLine(tc.sf, d) })
      }
    }
  }

  // Ramp-shaped consts nested anywhere in TerrainCanvas3D (e.g. ROCK_DISTANCE_STOPS).
  walkTs(tc.sf, (n) => {
    if (ts.isVariableDeclaration(n) && n.initializer && isRamp(strip(n.initializer))) {
      entries.push(rampEntry(tc, n.name.getText(tc.sf), strip(n.initializer), { line: nodeLine(tc.sf, n), enclosingFunction: ts.isSourceFile(n.parent.parent.parent) ? null : enclosingName(n.parent) }))
    }
  })

  // ── Every hex literal (and rgb()/hsl() string) in TS/TSX ───────────────────
  const hexLiterals = []
  const cssColorStrings = []
  const otherRamps = []
  const covered = new Set(entries.filter((x) => x.kind === 'ramp').map((x) => `${x.file}:${x.line}`))
  for (const t of entries.filter((x) => x.kind === 'table')) for (const r of t.rows) if (r.kind === 'ramp') covered.add(`${t.file}:${r.line}`)
  for (const p of sourceTsFiles()) {
    const e = parseTs(p)
    walkTs(e.sf, (n) => {
      if (ts.isNumericLiteral(n) && HEX_NUM.test(n.getText(e.sf))) {
        hexLiterals.push({ value: n.getText(e.sf), form: 'number', file: e.file, line: nodeLine(e.sf, n), ...describeContext(e.sf, n) })
      } else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) {
        const ctxNode = ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n) ? n.parent.parent ?? n : n
        for (const m of n.text.matchAll(HEX_STR)) {
          hexLiterals.push({ value: m[0], form: n.text === m[0] ? 'string' : 'embedded-in-string', string: n.text === m[0] ? undefined : n.text, file: e.file, line: nodeLine(e.sf, n), ...describeContext(e.sf, ctxNode) })
        }
        for (const m of n.text.matchAll(CSS_FN_STR)) {
          cssColorStrings.push({ value: m[0], string: n.text === m[0] ? undefined : n.text, file: e.file, line: nodeLine(e.sf, n), ...describeContext(e.sf, ctxNode) })
        }
      } else if (isRamp(n)) {
        const parentDecl = n.parent && ts.isVariableDeclaration(n.parent) ? n.parent : null
        const line = nodeLine(e.sf, parentDecl || n)
        if (!covered.has(`${e.file}:${line}`)) {
          const inRange = n.elements.every((t) => tripleOf(e.sf, t).every((v) => Number.isInteger(v) && v >= 0 && v <= 255))
          otherRamps.push({ file: e.file, line, stopsText: n.elements.map((t) => t.getText(e.sf)), rgbRange: inRange, ...describeContext(e.sf, n) })
        }
      }
    })
  }

  const ramps = entries.filter((x) => x.kind === 'ramp')
  const colors = entries.filter((x) => x.kind === 'color')
  const tables = entries.filter((x) => x.kind === 'table')

  writeJson(`${OUT}/colormaps.json`, {
    source: { sha: SOURCE_SHA, branch: SOURCE_BRANCH },
    notes: [
      'kind ramp: stops (parsed numbers) and stopsText (exactly as written). TerrainCanvas3D ramps carry values as written hex numbers (0x......).',
      'kind color: format rgb (triple), hex (string) or hex-number (0x...... THREE.Color argument).',
      'kind table: tableKind color|dash (switch tables), threshold (batteryToHex), ramp-by-key (object of ramps; an alias row references another ramp by name and is not inlined).',
      'hexLiterals: every #hex in a TS/TSX string and every 0x literal with exactly six hex digits (8-digit hash seeds and 7-digit constants are excluded), with the nearest named binding and a path from the literal to it.',
      'otherRampLiterals: arrays of >= 2 numeric triples outside the files parsed above; rgbRange=false means they are probably geometry, not colour.',
    ],
    counts: {
      ramps: ramps.length,
      colors: colors.length,
      tables: tables.length,
      hexLiterals: hexLiterals.length,
      uniqueHexLiterals: new Set(hexLiterals.map((h) => h.value.toLowerCase())).size,
      uniqueHexStrings: new Set(hexLiterals.filter((h) => h.form !== 'number').map((h) => h.value.toLowerCase())).size,
      uniqueHexNumbers: new Set(hexLiterals.filter((h) => h.form === 'number').map((h) => h.value.toLowerCase())).size,
      cssColorStrings: cssColorStrings.length,
      otherRampLiterals: otherRamps.length,
    },
    anomalies,
    entries,
    hexLiterals,
    cssColorStrings,
    otherRampLiterals: otherRamps,
  })
  return {
    'colormaps.ramps': ramps.length,
    'colormaps.colors': colors.length,
    'colormaps.tables': tables.length,
    'colormaps.hexLiterals': hexLiterals.length,
    'colormaps.otherRamps': otherRamps.length,
  }
}

if (isMain(import.meta.url)) console.log(run())
