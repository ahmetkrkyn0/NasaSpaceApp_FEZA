// strings.mjs -> design-export/strings.json, design-export/strings-coverage-set.json
//
// The user-visible text of the frontend, from the TS/TSX AST:
//   (a) JSX text nodes
//   (b) visible JSX attribute values (title, aria-label, placeholder, alt, ...)
//   (c) string literals in the listed display files, plus a heuristic sweep of
//       features/** (contains a letter, and a space or a leading capital)
//   (d) template literals, static parts kept and ${...} written as {…}
// Strings rendered as JSX children through an expression ({cond ? 'A' : 'B'})
// and strings written imperatively into the DOM/canvas (textContent, fillText)
// are recorded too, with a context field.

import {
  OUT, SOURCE_SHA, SOURCE_BRANCH, sourceTsFiles, parseTs, walkTs, nodeLine, enclosingName,
  ts, writeJson, checkSourcePin, isMain, allCss, visitCss, selectorClasses,
} from './lib.mjs'

// ── Scope ────────────────────────────────────────────────────────────────────

const LISTED_FILES = new Set([
  'frontend/src/features/layer-picker/LayerDropdown.tsx',
  'frontend/src/components/Fleet/roverMeta.ts',
  'frontend/src/components/Fleet/FleetSelectionView.tsx',
  'frontend/src/features/registry.ts',
  'frontend/src/SplashScreen.tsx',
  'frontend/src/LandingPage.tsx',
  'frontend/src/components/TopBar/TopBar.tsx',
  'frontend/src/App.tsx',
  'frontend/src/i18n/reportCopy.ts',
])
const LISTED_PREFIXES = ['frontend/src/features/assistant/', 'frontend/src/features/mission-report/']
const isListed = (file) => LISTED_FILES.has(file) || LISTED_PREFIXES.some((p) => file.startsWith(p))

const VISIBLE_ATTRS = new Set([
  'title', 'aria-label', 'placeholder', 'alt', 'aria-description', 'aria-roledescription', 'label',
  'aria-valuetext', 'aria-placeholder', 'unit', 'heading', 'caption', 'hint', 'subtitle', 'emptyText',
])
const isVisibleAttr = (name) => VISIBLE_ATTRS.has(name) || /^[a-z][A-Za-z]*Label$/.test(name)

// Object keys whose string values are identifiers, codes or resources, not text.
const ID_KEYS = new Set([
  'id', 'key', 'image', 'src', 'icon', 'slot', 'tab', 'group', 'type', 'kind', 'href', 'className',
  'class', 'variant', 'mode', 'view', 'layer', 'layerName', 'field', 'color', 'agencyColor', 'fill',
  'stroke', 'background', 'format', 'method', 'endpoint', 'path', 'url', 'testId', 'role', 'tone',
  'severity', 'level', 'status', 'state', 'phase', 'stage', 'align', 'position', 'side', 'direction',
  'units', 'cursor', 'lang', 'locale', 'featureId', 'viewMode', 'backendLayer', 'name_id', 'code',
  'errorCode', 'intent', 'tool', 'action', 'target', 'rel', 'width', 'height', 'transform', 'easing',
])
const ID_VAR = /(_URL|_SRC|Url|Src|_PATH|Path|_KEY|Key|_ID|Id|ID|Class|CLASS|_QUERY|Query|Selector|SELECTOR)$/

// Calls whose string arguments are never shown.
const NON_DISPLAY_CALLEES = new Set([
  'addEventListener', 'removeEventListener', 'getItem', 'setItem', 'removeItem', 'querySelector',
  'querySelectorAll', 'getElementById', 'matchMedia', 'setAttribute', 'getAttribute', 'removeAttribute',
  'hasAttribute', 'createElement', 'createElementNS', 'getContext', 'includes', 'startsWith', 'endsWith',
  'indexOf', 'lastIndexOf', 'split', 'join', 'replace', 'replaceAll', 'padStart', 'padEnd', 'toLocaleString',
  'toLocaleDateString', 'toLocaleTimeString', 'NumberFormat', 'DateTimeFormat', 'fetch', 'getJson',
  'postJson', 'getFloat32', 'set', 'append', 'get', 'has', 'delete', 'URL', 'URLSearchParams', 'Symbol',
  'require', 'postMessage', 'Event', 'CustomEvent', 'dispatchEvent', 'Set', 'Map', 'register', 'add',
  'remove', 'toggle', 'contains', 'clsx', 'cx', 'classNames', 'load', 'loadAsync', 'fetchLayer',
  'fetchLayerF32', 'Worker', 'scrollIntoView', 'animate', 'getPropertyValue', 'setProperty', 'warn',
  'error', 'log', 'info', 'debug', 'test', 'match', 'exec', 'RegExp', 'localeCompare', 'atob', 'btoa',
  'encodeURIComponent', 'decodeURIComponent', 'parseFloat', 'parseInt', 'Number', 'BigInt', 'getByName',
  'getObjectByName', 'useRef', 'createContext', 'assertNever', 'invariant', 'closest', 'matches',
])

const PUBLIC_DIRS = /^\/(api|fonts|rovers|models|textures|videos|data|ui|src)\b|^\/starimg|^https?:\/\//

const TR_CHARS = /[çğıöşüÇĞİÖŞÜ]/
const TR_WORDS = new Set(['ve', 'bir', 'bu', 'ile', 'ne', 'neden', 'hangi', 'olarak', 'daha', 'yok', 'var', 'rota',
  'icin', 'için', 'değil', 'nasıl', 'göre', 'çok', 'şu', 'kadar', 'sonra', 'önce', 'şimdi', 'tüm', 'her', 'hiç',
  'soru', 'cevap', 'yanıt', 'rapor', 'görev', 'araç', 'harita', 'mi', 'mı', 'mu', 'mü', 'ki', 'da', 'de',
  'rehber', 'rehberi', 'planlama', 'bilgi', 'dikkat', 'kritik', 'basit', 'teknik', 'analiz', 'asistan', 'veri',
  'sen', 'hata', 'tamam', 'kapat', 'yeniden', 'dene', 'katman', 'enerji', 'profil', 'hedef', 'rota', 'ozet'])
const HTML_TAGS = new Set(['a', 'button', 'input', 'textarea', 'select', 'label', 'div', 'span', 'svg', 'canvas', 'img', 'option', 'summary', 'details'])
const EN_WORDS = new Set(['the', 'and', 'of', 'is', 'are', 'with', 'for', 'this', 'that', 'from', 'not', 'was',
  'has', 'have', 'will', 'can', 'into', 'over', 'when', 'what', 'why', 'how', 'which', 'your', 'you'])

// ── Text helpers ─────────────────────────────────────────────────────────────

const NAMED_ENTITIES = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", middot: '·', rarr: '→',
  larr: '←', uarr: '↑', darr: '↓', times: '×', mdash: '—', ndash: '–',
  hellip: '…', deg: '°', plusmn: '±', le: '≤', ge: '≥', minus: '−',
  bull: '•', copy: '©', thinsp: ' ', ensp: ' ', emsp: ' ', lsquo: '‘',
  rsquo: '’', ldquo: '“', rdquo: '”', sup2: '²', micro: 'µ', sigma: 'σ',
  Delta: 'Δ', asymp: '≈', check: '✓', cross: '✗', laquo: '«', raquo: '»',
}
function decodeEntities(s, unknown) {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|[A-Za-z][A-Za-z0-9]*);/g, (m, body) => {
    if (body[0] === '#') {
      const cp = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
      return String.fromCodePoint(cp)
    }
    if (Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, body)) return NAMED_ENTITIES[body]
    unknown.add(m)
    return m
  })
}
const collapse = (s) => s.replace(/[ \t\r\n]+/g, ' ').trim()
const hasLetter = (s) => /\p{L}/u.test(s)

function langOf(text, defaultLang = 'en') {
  const words = text.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean)
  const tr = TR_CHARS.test(text) || words.some((w) => TR_WORDS.has(w))
  const en = words.some((w) => EN_WORDS.has(w))
  if (tr && en) return 'mixed'
  if (tr) return 'tr'
  // Inside the Turkish-language assistant, unmarked text is Turkish unless it
  // carries English function words.
  return en ? 'en' : defaultLang
}

const WRAPPERS = (n) => ts.isParenthesizedExpression(n) || ts.isAsExpression(n) || ts.isNonNullExpression(n) ||
  (ts.isSatisfiesExpression && ts.isSatisfiesExpression(n)) ||
  (ts.isConditionalExpression(n)) ||
  (ts.isBinaryExpression(n) && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.PlusToken].includes(n.operatorToken.kind))

/** Climb through transparent wrappers (parens, ternaries, ||, ??, &&, +). */
function climb(node) {
  let cur = node
  while (cur.parent && WRAPPERS(cur.parent)) {
    const p = cur.parent
    if (ts.isConditionalExpression(p) && p.condition === cur) break
    if (ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken && p.left === cur) break
    cur = p
  }
  return cur
}

function templateText(sf, tpl) {
  if (ts.isNoSubstitutionTemplateLiteral(tpl)) return { text: tpl.text, expressions: [] }
  let text = tpl.head.text
  const expressions = []
  for (const span of tpl.templateSpans) {
    text += '{…}' + span.literal.text
    expressions.push(span.expression.getText(sf))
  }
  return { text, expressions }
}

/** Strings an expression can render as-is: literals, templates, both arms of ?:, sides of || ?? &&. */
function renderedStrings(expr) {
  const out = []
  const visit = (n) => {
    if (!n) return
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n)) out.push(n)
    else if (ts.isParenthesizedExpression(n) || ts.isAsExpression(n) || ts.isNonNullExpression(n)) visit(n.expression)
    else if (ts.isConditionalExpression(n)) {
      visit(n.whenTrue)
      visit(n.whenFalse)
    } else if (ts.isBinaryExpression(n)) {
      const k = n.operatorToken.kind
      if (k === ts.SyntaxKind.AmpersandAmpersandToken) visit(n.right)
      else if (k === ts.SyntaxKind.BarBarToken || k === ts.SyntaxKind.QuestionQuestionToken) {
        visit(n.left)
        visit(n.right)
      } else if (k === ts.SyntaxKind.PlusToken) {
        visit(n.left)
        visit(n.right)
      }
    }
  }
  visit(expr)
  return out
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function run() {
  checkSourcePin()

  // Every class defined in CSS, to spot class lists passed around as strings.
  const cssClasses = new Set()
  for (const f of allCss()) visitCss(f.parsed.root, (n) => { if (n.type === 'rule') for (const c of selectorClasses(n.selector)) cssClasses.add(c) })

  const records = []
  const seen = new Set()
  const unknownEntities = new Set()
  const consumed = new Set()

  const push = (rec) => {
    const key = `${rec.text}\u0000${rec.file}\u0000${rec.line}`
    if (seen.has(key)) return
    seen.add(key)
    records.push(rec)
  }

  for (const p of sourceTsFiles()) {
    const e = parseTs(p)
    const { sf, file } = e
    const listed = isListed(file)
    const inFeatures = file.startsWith('frontend/src/features/')
    const isReportCopy = file === 'frontend/src/i18n/reportCopy.ts'
    const isRegistry = file === 'frontend/src/features/registry.ts'
    const defaultLang = file.startsWith('frontend/src/features/assistant/') ? 'tr' : 'en'

    const langFor = (node, text) => {
      if (isReportCopy) {
        let cur = node
        while (cur.parent) {
          const par = cur.parent
          if (ts.isConditionalExpression(par) && /\blang\s*===\s*'tr'/.test(par.condition.getText(sf))) {
            if (par.whenTrue === cur) return 'tr'
            if (par.whenFalse === cur) return 'en'
          }
          if (ts.isConditionalExpression(par) && /\blang\s*===\s*'en'/.test(par.condition.getText(sf))) {
            if (par.whenTrue === cur) return 'en'
            if (par.whenFalse === cur) return 'tr'
          }
          if (ts.isPropertyAssignment(par)) {
            const k = par.name.getText(sf)
            if (k === 'tr' || k === 'en') return k
          }
          cur = par
        }
      }
      return langOf(text, defaultLang)
    }

    const base = (node, text, kind, extra = {}) => ({
      text,
      kind,
      // Rejected tokens are identifiers, not prose: no file-level default.
      lang: kind === 'uncertain' && !isReportCopy ? langOf(text) : langFor(node, text),
      file,
      line: nodeLine(sf, node),
      component: enclosingName(node),
      ...extra,
    })

    const fromLiteralNode = (n) => {
      if (ts.isTemplateExpression(n)) {
        const t = templateText(sf, n)
        return { text: t.text, kind: 'template', expressions: t.expressions }
      }
      return { text: n.text, kind: ts.isNoSubstitutionTemplateLiteral(n) ? 'template' : 'literal' }
    }

    walkTs(sf, (node) => {
      // (a) JSX text
      if (ts.isJsxText(node)) {
        if (node.containsOnlyTriviaWhiteSpaces) return
        const raw = collapse(node.text)
        if (!raw) return
        const text = decodeEntities(raw, unknownEntities)
        // A lone &nbsp; decodes to whitespace: spacing, not text.
        if (!text.trim()) return
        const lead = node.text.search(/\S/)
        const line = sf.getLineAndCharacterOfPosition(node.getStart(sf) + Math.max(0, lead)).line + 1
        push({
          text, ...(raw !== text ? { raw } : {}), kind: 'jsxText', lang: langOf(text, defaultLang), file, line,
          component: enclosingName(node), source: 'jsx',
        })
        return
      }
      // (b) visible JSX attributes
      if (ts.isJsxAttribute(node)) {
        const name = node.name.getText(sf)
        if (!isVisibleAttr(name) || !node.initializer) return
        const lits = ts.isStringLiteral(node.initializer)
          ? [node.initializer]
          : ts.isJsxExpression(node.initializer) ? renderedStrings(node.initializer.expression) : []
        for (const lit of lits) {
          consumed.add(lit)
          const { text, expressions } = fromLiteralNode(lit)
          const decoded = ts.isStringLiteral(node.initializer) ? decodeEntities(text, unknownEntities) : text
          if (!decoded.trim()) continue
          push(base(lit, decoded, `attr:${name}`, { source: 'jsx', ...(expressions && expressions.length ? { expressions } : {}), ...(decoded !== text ? { raw: text } : {}) }))
        }
        return
      }
      // JSX children rendered through an expression: {cond ? 'A' : 'B'}
      if (ts.isJsxExpression(node) && node.expression && node.parent && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
        for (const lit of renderedStrings(node.expression)) {
          consumed.add(lit)
          const { text, kind, expressions } = fromLiteralNode(lit)
          if (!text.trim()) continue
          push(base(lit, text, kind, { source: 'jsx', context: 'jsxChild', ...(expressions && expressions.length ? { expressions } : {}) }))
        }
        return
      }
      // Imperative DOM / canvas text.
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(node.left) && /^(textContent|innerText|title|placeholder|ariaLabel)$/.test(node.left.name.text)) {
        for (const lit of renderedStrings(node.right)) {
          consumed.add(lit)
          const { text, kind, expressions } = fromLiteralNode(lit)
          if (!hasLetter(text)) continue
          push(base(lit, text, kind, { source: 'imperative', context: `imperative:${node.left.getText(sf)}`, ...(expressions && expressions.length ? { expressions } : {}) }))
        }
      }
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'fillText' && node.arguments[0]) {
        for (const lit of renderedStrings(node.arguments[0])) {
          consumed.add(lit)
          const { text, kind, expressions } = fromLiteralNode(lit)
          if (!hasLetter(text)) continue
          push(base(lit, text, kind, { source: 'imperative', context: 'imperative:fillText', ...(expressions && expressions.length ? { expressions } : {}) }))
        }
      }
    })

    // (c)/(d) remaining literals and templates
    walkTs(sf, (node, parents) => {
      const isLit = ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)
      if (!isLit || consumed.has(node)) return

      const heuristicScope = !listed && inFeatures ? 'features' : null
      if (!listed && !heuristicScope) return

      const { text, kind, expressions } = fromLiteralNode(node)
      const reject = (reason) => {
        if (listed && hasLetter(text)) {
          push(base(node, text, 'uncertain', { originalKind: kind, reason, source: 'listed', ...(expressions && expressions.length ? { expressions } : {}) }))
        }
      }

      // Hard exclusions: never text, dropped silently.
      if (parents.some((x) => ts.isImportDeclaration(x) || ts.isExportDeclaration(x) || ts.isImportTypeNode?.(x))) return
      if (ts.isExternalModuleReference?.(node.parent)) return
      if (parents.some((x) => ts.isTypeNode(x))) return
      const par = node.parent
      if (par && (ts.isPropertyAssignment(par) || ts.isPropertySignature?.(par) || ts.isMethodDeclaration(par) || ts.isPropertyDeclaration(par) || ts.isEnumMember(par)) && par.name === node) return
      if (par && ts.isComputedPropertyName(par)) return
      if (par && ts.isElementAccessExpression(par) && par.argumentExpression === node) return
      if (parents.some((x) => ts.isJsxAttribute(x))) return // non-visible JSX attribute (className, style, key, data-*, ...)
      if (!text.trim()) return

      // Registry: only RAIL_TABS labels are display text.
      if (isRegistry) {
        if (!(par && ts.isPropertyAssignment(par) && par.name.getText(sf) === 'label')) return
      }

      const top = climb(node)
      const tp = top.parent
      // Comparison operands, case labels.
      if (tp && ts.isBinaryExpression(tp) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(tp.operatorToken.kind)) return reject('comparison operand')
      if (tp && ts.isCaseClause(tp) && tp.expression === top) return reject('case label')
      if (tp && ts.isBinaryExpression(tp) && tp.operatorToken.kind === ts.SyntaxKind.InKeyword) return reject('in-operator key')
      // Members of an array used as a membership set: ['a','b'].includes(x), new Set([...]).
      if (tp && ts.isArrayLiteralExpression(tp)) {
        const arr = tp
        const ap = arr.parent
        if (ap && ts.isPropertyAccessExpression(ap) && ap.expression === arr && /^(includes|indexOf|has)$/.test(ap.name.text)) return reject('membership-test array')
        if (ap && (ts.isNewExpression(ap) || ts.isCallExpression(ap)) && /^(Set|Map)$/.test(ap.expression.getText(sf))) return reject('Set/Map member')
      }
      // console.* and other non-display calls.
      if (tp && (ts.isCallExpression(tp) || ts.isNewExpression(tp)) && tp.arguments && tp.arguments.includes(top)) {
        const callee = tp.expression.getText(sf)
        const last = callee.split('.').pop()
        if (callee.startsWith('console.')) return
        if (NON_DISPLAY_CALLEES.has(last)) return reject(`argument of ${callee}()`)
        if (ts.isNewExpression(tp) && /Error$/.test(callee)) return reject('error message (new Error)')
      }
      if (tp && ts.isThrowStatement(tp)) return reject('thrown value')
      // Values under id-like keys.
      if (tp && ts.isPropertyAssignment(tp) && tp.initializer === top) {
        const k = tp.name.getText(sf).replace(/^['"]|['"]$/g, '')
        if (ID_KEYS.has(k)) return reject(`value of id-like key "${k}"`)
      }
      if (tp && ts.isVariableDeclaration(tp) && tp.initializer === top && ID_VAR.test(tp.name.getText(sf))) return reject(`value of id-like const ${tp.name.getText(sf)}`)
      if (tp && ts.isParameter(tp)) return reject('parameter default')

      // Shape-based exclusions.
      if (/^#[0-9a-fA-F]{3,8}$/.test(text) || /^(var\(|calc\(|rgba?\(|hsla?\(|url\(|translate|rotate|scale|linear-gradient|radial-gradient|cubic-bezier)/i.test(text)) return reject('css value')
      if (/^-?\d+(\.\d+)?(px|rem|em|vh|vw|ms|s|deg|%)?( -?\d+(\.\d+)?(px|rem|em|vh|vw|ms|s|deg|%)?)*$/.test(text)) return reject('numeric / css length')
      if (PUBLIC_DIRS.test(text) && !/\s/.test(text)) return reject('fetched url or asset path')
      if (/^[a-z0-9]+([-_][a-z0-9]+)+$/.test(text)) return reject('lowercase hyphen/underscore identifier')
      const toks = text.trim().split(/\s+/)
      if (toks.length > 1 && toks.every((t) => cssClasses.has(t) || /^is-[a-z0-9-]+$/.test(t))) return reject('css class list')
      if (/^[a-z0-9]+$/.test(text) && /[a-z]/.test(text)) return reject('single lowercase token')
      if ([...text.trim()].length === 1) return reject('single character')
      if (/^[a-z]{2}-[A-Z]{2}$/.test(text)) return reject('locale code')
      if (/^[\w{}…-]+\.(csv|json|pdf|png|jpg|txt|glb)$/i.test(text)) return reject('file name')
      if (kind === 'template' && /^[MLHVCSQTAZmlhvcsqtaz0-9.,\s-]*$/.test(text.replace(/\{…\}/g, '')) && /[MLHVCSQTAZ]/.test(text)) return reject('svg path data')
      if (kind === 'template' && /^(px|rem|em|vh|vw|%|deg|ms|s|fr)?$/.test(text.replace(/\{…\}/g, '').trim()) && !/\s/.test(text)) return reject('css value template')
      if (/^[a-z]+(\s*,\s*[a-z]+)+$/.test(text) && text.split(/\s*,\s*/).every((t) => HTML_TAGS.has(t))) return reject('css selector list')
      if (/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/.test(text)) return reject('SCREAMING_CASE code')
      if (/^[a-z]+([A-Z][a-z0-9]*)+$/.test(text)) return reject('camelCase identifier')
      if (/^[.#[][\w-]/.test(text) && !/\s\p{Ll}{3,}/u.test(text)) return reject('css selector')
      if (!hasLetter(text)) return

      if (listed) {
        push(base(node, text, kind, { source: 'listed', ...(expressions && expressions.length ? { expressions } : {}) }))
      } else {
        // Heuristic sweep: a letter, and a space or a leading capital.
        if (!(/\s/.test(text.trim()) || /^\p{Lu}/u.test(text))) return
        push(base(node, text, kind, { source: 'heuristic', heuristicScope, ...(expressions && expressions.length ? { expressions } : {}) }))
      }
    })
  }

  records.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line || (a.text < b.text ? -1 : a.text > b.text ? 1 : 0)))

  const inCoverage = (r) => r.kind !== 'uncertain' && (
    r.kind === 'jsxText' || r.kind.startsWith('attr:') || r.context === 'jsxChild' || r.source === 'imperative' ||
    (r.source === 'listed' && (r.kind === 'literal' || r.kind === 'template')))
  const coverage = records.filter(inCoverage)

  const tallyBy = (arr, fn) => {
    const m = {}
    for (const r of arr) {
      const k = fn(r)
      m[k] = (m[k] || 0) + 1
    }
    return Object.fromEntries(Object.entries(m).sort())
  }

  writeJson(`${OUT}/strings.json`, {
    source: { sha: SOURCE_SHA, branch: SOURCE_BRANCH },
    scope: 'frontend/src/**/*.{ts,tsx}, excluding *.test.ts(x), __tests__/, __fixtures__/, *.d.ts and dot-directories.',
    rules: {
      jsxText: 'JSX text nodes; whitespace runs (space, tab, newline) collapsed, trimmed; entities decoded (raw keeps the undecoded form when it differs).',
      attr: `JSX attribute values for: ${[...VISIBLE_ATTRS].join(', ')}, and any *Label prop; expression values contribute every string they can render (both ?: arms, || ?? && sides).`,
      jsxChild: 'context "jsxChild": string/template rendered as a JSX child through an expression ({cond ? "A" : "B"}).',
      imperative: 'source "imperative": strings assigned to textContent/innerText/title/placeholder/ariaLabel or passed to canvas fillText.',
      listed: `source "listed": every remaining literal/template in ${[...LISTED_FILES].join(', ')}, ${LISTED_PREFIXES.join(', ')} (registry.ts: RAIL_TABS labels only), after exclusions.`,
      heuristic: 'source "heuristic": remaining literals in other frontend/src/features/** files that contain a letter and either whitespace or a leading capital.',
      template: 'kind "template": static parts kept, each ${...} written as {…}; expressions lists the substituted source text.',
      uncertain: 'kind "uncertain": a literal from a listed file rejected by a filter (reason says which); excluded from the coverage set.',
      excluded: 'never recorded: import specifiers, type positions, property names, non-visible JSX attributes (className, style, key, data-*, ...), console.* arguments.',
      lang: 'reportCopy.ts takes language from its enclosing en/tr key or lang === "tr" ternary; elsewhere tr when Turkish letters or common Turkish words appear, mixed when English function words appear as well.',
    },
    counts: {
      total: records.length,
      byKind: tallyBy(records, (r) => r.kind),
      byLang: tallyBy(records, (r) => r.lang),
      bySource: tallyBy(records, (r) => r.source),
      coverageSet: coverage.length,
    },
    unknownEntities: [...unknownEntities].sort(),
    strings: records,
  })
  writeJson(`${OUT}/strings-coverage-set.json`, {
    source: { sha: SOURCE_SHA, branch: SOURCE_BRANCH },
    definition: 'Acceptance criterion 6 set: kind jsxText and attr:*, jsxChild and imperative strings anywhere, and literal/template records from the listed display files (source "listed"). Excludes heuristic and uncertain records.',
    count: coverage.length,
    uniqueTexts: new Set(coverage.map((r) => r.text)).size,
    byKind: tallyBy(coverage, (r) => r.kind),
    byLang: tallyBy(coverage, (r) => r.lang),
    strings: coverage.map(({ text, kind, lang, file, line, component, context, source }) => ({ text, kind, lang, file, line, component, ...(context ? { context } : {}), source })),
  })

  return {
    'strings.total': records.length,
    'strings.byKind': JSON.stringify(tallyBy(records, (r) => r.kind)),
    'strings.byLang': JSON.stringify(tallyBy(records, (r) => r.lang)),
    'strings.coverageSet': coverage.length,
    'strings.unknownEntities': unknownEntities.size,
  }
}

if (isMain(import.meta.url)) console.log(run())
