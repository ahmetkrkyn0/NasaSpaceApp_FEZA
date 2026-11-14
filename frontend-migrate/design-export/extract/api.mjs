// api.mjs -> design-export/api-contract/
//
// The backend contract the UI consumes: endpoints called from frontend/src,
// response header names read, verbatim copies of the response types and of the
// recorded fixtures, and the Vite dev/preview proxy configuration.

import fs from 'node:fs'
import {
  OUT, SRC, FRONTEND, SOURCE_SHA, SOURCE_BRANCH, sourceTsFiles, parseTs, walkTs, nodeLine,
  enclosingName, ts, walk, rel, read, writeText, writeJson, resetDir, ensureDir, sha256,
  sliceLines, checkSourcePin, isMain,
} from './lib.mjs'

const AC = `${OUT}/api-contract`
const HELPERS = {
  getJson: { method: 'GET', binary: false },
  postJson: { method: 'POST', binary: false },
  getFloat32: { method: 'GET', binary: true },
}

function enclosingFunction(node) {
  let p = node.parent
  while (p) {
    if (ts.isFunctionDeclaration(p) || ts.isFunctionExpression(p) || ts.isArrowFunction(p) || ts.isMethodDeclaration(p)) return p
    p = p.parent
  }
  return null
}

function functionName(fn) {
  if (!fn) return null
  if (fn.name && ts.isIdentifier(fn.name)) return fn.name.text
  if (fn.parent && ts.isVariableDeclaration(fn.parent) && ts.isIdentifier(fn.parent.name)) return fn.parent.name.text
  return null
}

function unwrapPromise(text) {
  const m = /^Promise<([\s\S]+)>$/.exec(text.trim())
  return m ? m[1].trim() : text.trim()
}

/**
 * Turn a URL expression into { raw, path, queryKeys, queryDynamic }.
 * `${BASE}` / BASE resolve to /api; other substitutions become {name}.
 */
function describeUrl(sf, expr, prefixApi) {
  const parts = []
  const exprs = []
  const visit = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) parts.push(n.text)
    else if (ts.isTemplateExpression(n)) {
      parts.push(n.head.text)
      for (const span of n.templateSpans) {
        const t = span.expression.getText(sf)
        if (t === 'BASE') parts.push('/api')
        else {
          parts.push(`\u0000${exprs.length}\u0000`)
          exprs.push(span.expression)
        }
        parts.push(span.literal.text)
      }
    } else if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      visit(n.left)
      visit(n.right)
    } else if (ts.isIdentifier(n) && n.text === 'BASE') parts.push('/api')
    else {
      parts.push(`\u0000${exprs.length}\u0000`)
      exprs.push(n)
    }
  }
  visit(expr)
  let raw = parts.join('')
  if (prefixApi && !raw.startsWith('/api')) raw = `/api${raw}`
  const qIdx = raw.indexOf('?')
  let pathPart = qIdx >= 0 ? raw.slice(0, qIdx) : raw
  const queryPart = qIdx >= 0 ? raw.slice(qIdx + 1) : ''
  const queryKeys = []
  const queryExprs = []
  let queryDynamic = false
  // A trailing substitution in the path that itself builds "?..." is a query.
  pathPart = pathPart.replace(/\u0000(\d+)\u0000/g, (m, i) => {
    const t = exprs[Number(i)].getText(sf)
    if (/[`'"]\?/.test(t) || /^(suffix|query|qs|params)/i.test(t)) {
      queryDynamic = true
      queryExprs.push(t)
      return ''
    }
    const id = (t.match(/[A-Za-z_$][\w$]*$/) || [t])[0]
    return `{${id}}`
  })
  for (const seg of queryPart.split('&')) {
    if (!seg) continue
    const m = /^([\w.-]+)=/.exec(seg)
    if (m) queryKeys.push(m[1])
    else if (/\u0000\d+\u0000/.test(seg)) {
      queryDynamic = true
      for (const mm of seg.matchAll(/\u0000(\d+)\u0000/g)) queryExprs.push(exprs[Number(mm[1])].getText(sf))
    }
  }
  const pretty = raw.replace(/\u0000(\d+)\u0000/g, (m, i) => `\${${exprs[Number(i)].getText(sf)}}`)
  return { raw: pretty, path: pathPart, queryKeys, queryExprs, queryDynamic }
}

/** Keys set on URLSearchParams objects inside a function body. */
function searchParamKeys(sf, fn) {
  const keys = new Set()
  if (!fn || !fn.body) return []
  const paramVars = new Set()
  walkTs(fn.body, (n) => {
    if (ts.isVariableDeclaration(n) && n.initializer && ts.isNewExpression(n.initializer) &&
      n.initializer.expression.getText(sf) === 'URLSearchParams') {
      paramVars.add(n.name.getText(sf))
      const arg = n.initializer.arguments?.[0]
      if (arg && ts.isObjectLiteralExpression(arg)) {
        for (const p of arg.properties) if (p.name) keys.add(p.name.getText(sf).replace(/^['"]|['"]$/g, ''))
      }
    }
  })
  walkTs(fn.body, (n) => {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) &&
      /^(set|append)$/.test(n.expression.name.text) && paramVars.has(n.expression.expression.getText(sf))) {
      const a = n.arguments[0]
      if (a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a))) keys.add(a.text)
    }
  })
  return [...keys].sort()
}

export function run() {
  checkSourcePin()
  const files = sourceTsFiles().map(parseTs)
  const calls = []
  const literalMentions = []
  const headers = []
  const typeDecls = new Map()

  for (const e of files) {
    const { sf } = e
    walkTs(sf, (n) => {
      if ((ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) && n.name) {
        if (!typeDecls.has(n.name.text)) typeDecls.set(n.name.text, [])
        typeDecls.get(n.name.text).push(`${e.file}:${nodeLine(sf, n)}`)
      }
      // Header names read (X-Layer-*, X-Series-*, any X-*).
      if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && /^x-[a-z0-9-]+$/i.test(n.text)) {
        const call = n.parent && ts.isCallExpression(n.parent) ? n.parent.expression.getText(sf) : null
        headers.push({ name: n.text, file: e.file, line: nodeLine(sf, n), via: call, function: enclosingName(n) })
      }
      if (!ts.isCallExpression(n)) return
      const callee = n.expression.getText(sf)
      const helper = HELPERS[callee]
      const isFetch = callee === 'fetch'
      if (!helper && !isFetch) return
      const fn = enclosingFunction(n)
      const fnName = functionName(fn)
      // The helpers' own fetch calls are the transport, not endpoints.
      if (isFetch && /\/(net|api)\/client\.ts$/.test(e.file)) return
      const arg0 = n.arguments[0]
      if (!arg0) return
      let method = helper ? helper.method : 'GET'
      let binary = helper ? helper.binary : false
      const opts = n.arguments[isFetch ? 1 : helper && callee === 'postJson' ? 2 : 1]
      if (isFetch && opts && ts.isObjectLiteralExpression(opts)) {
        for (const p of opts.properties) {
          if (ts.isPropertyAssignment(p) && p.name.getText(sf) === 'method' && ts.isStringLiteral(p.initializer)) method = p.initializer.text
        }
      }
      let responseType = null
      let responseTypeSource = null
      if (helper && n.typeArguments && n.typeArguments.length) {
        responseType = n.typeArguments[0].getText(sf)
        responseTypeSource = 'generic'
      }
      if (fn && fn.body) {
        const bodyText = fn.body.getText(sf)
        if (/\.arrayBuffer\(\)/.test(bodyText)) binary = true
        if (!responseType) {
          // First `<expr>.json() as T` in the calling function.
          walkTs(fn.body, (m) => {
            if (!responseType && ts.isAsExpression(m) && /\.json\(\)/.test(m.expression.getText(sf))) {
              responseType = unwrapPromise(m.type.getText(sf))
              responseTypeSource = 'cast'
            }
          })
        }
        if (!responseType && fn.type) {
          responseType = unwrapPromise(fn.type.getText(sf))
          responseTypeSource = 'returnType'
        }
      }
      const site = `${e.file}:${nodeLine(sf, n)}`
      const isLiteralish = ts.isStringLiteral(arg0) || ts.isNoSubstitutionTemplateLiteral(arg0) || ts.isTemplateExpression(arg0) || ts.isBinaryExpression(arg0)
      if (!isLiteralish) {
        // Variable URL: say where it comes from instead of guessing a path.
        let urlSource = null
        if (ts.isIdentifier(arg0) && fn) {
          const param = fn.parameters?.find((p) => p.name.getText(sf) === arg0.text)
          if (param) urlSource = `parameter "${param.getText(sf)}" of ${fnName ?? '(anonymous)'}`
          walkTs(fn.body, (m) => {
            if (!urlSource && ts.isVariableDeclaration(m) && m.name.getText(sf) === arg0.text && m.initializer) {
              urlSource = `const ${arg0.text} = ${m.initializer.getText(sf)}`
            }
          })
        }
        if (!urlSource) urlSource = arg0.getText(sf)
        calls.push({ dynamic: true, method, urlExpression: arg0.getText(sf), urlSource, prefixedWithApi: Boolean(helper), binary, responseType, responseTypeSource, site, file: e.file, line: nodeLine(sf, n), function: fnName })
        return
      }
      const url = describeUrl(sf, arg0, Boolean(helper))
      if (/format=f32/.test(url.raw)) binary = true
      const qKeys = new Set(url.queryKeys)
      if (url.queryDynamic) for (const k of searchParamKeys(sf, fn)) qKeys.add(k)
      calls.push({
        dynamic: false, method, path: url.path, urlTemplate: url.raw, queryParams: [...qKeys].sort(),
        queryDynamic: url.queryDynamic, queryExpressions: url.queryExprs, binary, responseType, responseTypeSource,
        site, file: e.file, line: nodeLine(sf, n), function: fnName,
      })
    })
    // '/api...' literals not passed straight to fetch/helpers.
    walkTs(sf, (n) => {
      if (!(ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n))) return
      const text = ts.isTemplateExpression(n) ? n.head.text : n.text
      if (!text.startsWith('/api')) return
      let p = n.parent
      while (p && (ts.isParenthesizedExpression(p) || ts.isBinaryExpression(p))) p = p.parent
      const direct = p && ts.isCallExpression(p) && (p.expression.getText(sf) === 'fetch' || HELPERS[p.expression.getText(sf)])
      if (direct) return
      literalMentions.push({ text: n.getText(sf), file: e.file, line: nodeLine(sf, n), function: enclosingName(n) })
    })
  }

  // Consumers of each wrapper function (who calls fetchX), by identifier use.
  const wrapperNames = new Set(calls.map((c) => c.function).filter(Boolean))
  const consumers = new Map()
  for (const e of files) {
    walkTs(e.sf, (n) => {
      if (!ts.isIdentifier(n) || !wrapperNames.has(n.text)) return
      const par = n.parent
      if (!par) return
      if (ts.isImportSpecifier(par) || ts.isExportSpecifier(par)) return
      if ((ts.isFunctionDeclaration(par) || ts.isVariableDeclaration(par)) && par.name === n) return
      if (!consumers.has(n.text)) consumers.set(n.text, new Set())
      consumers.get(n.text).add(`${e.file}:${nodeLine(e.sf, n)}`)
    })
  }

  // Group by method + path.
  const groups = new Map()
  for (const c of calls.filter((x) => !x.dynamic)) {
    const key = `${c.method} ${c.path}`
    if (!groups.has(key)) {
      groups.set(key, { method: c.method, path: c.path, queryParams: new Set(), queryDynamic: false, binary: false, responseTypes: new Set(), callers: [], urlTemplates: new Set(), wrappers: new Set() })
    }
    const g = groups.get(key)
    for (const q of c.queryParams) g.queryParams.add(q)
    g.queryDynamic = g.queryDynamic || c.queryDynamic
    g.binary = g.binary || c.binary
    if (c.responseType) g.responseTypes.add(`${c.responseType} (${c.responseTypeSource})`)
    g.callers.push(c.site)
    g.urlTemplates.add(c.urlTemplate)
    if (c.function) g.wrappers.add(c.function)
  }
  const endpoints = [...groups.values()]
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : a.method < b.method ? -1 : 1))
    .map((g) => {
      const types = [...g.responseTypes]
      return {
        method: g.method,
        path: g.path,
        queryParams: [...g.queryParams].sort(),
        queryDynamic: g.queryDynamic,
        binary: g.binary,
        responseType: types.length ? types.map((t) => t.replace(/ \((generic|cast|returnType)\)$/, '')).filter((v, i, a) => a.indexOf(v) === i).join(' | ') : null,
        responseTypeSources: types,
        responseTypeDeclaredAt: Object.fromEntries(types.map((t) => t.replace(/ \((generic|cast|returnType)\)$/, ''))
          .filter((t) => /^[A-Z]\w*$/.test(t)).map((t) => [t, typeDecls.get(t) || []])),
        urlTemplates: [...g.urlTemplates].sort(),
        callers: g.callers,
        wrappers: [...g.wrappers].sort().map((w) => ({ name: w, consumers: [...(consumers.get(w) || [])].sort() })),
      }
    })

  const headerNames = [...new Set(headers.map((h) => h.name))].sort()

  // ── Verbatim copies ────────────────────────────────────────────────────────
  resetDir(`${AC}/types`)
  resetDir(`${AC}/fixtures`)
  const copies = []
  const copy = (src, dest) => {
    ensureDir(dest.replace(/\/[^/]+$/, ''))
    fs.copyFileSync(src, dest)
    const ok = sha256(src) === sha256(dest)
    if (!ok) throw new Error(`copy mismatch ${src}`)
    copies.push({ from: rel(src), to: rel(dest), sha256: sha256(dest), bytes: fs.statSync(dest).size })
  }
  copy(`${SRC}/net/types.ts`, `${AC}/types/net-types.ts`)
  copy(`${SRC}/api/assistant.ts`, `${AC}/types/assistant.ts`)
  copy(`${SRC}/api/client.ts`, `${AC}/types/client.ts`)
  const fixtureFiles = walk(`${SRC}/net/__fixtures__`)
  for (const f of fixtureFiles) copy(f, `${AC}/fixtures/${f.split('/').pop()}`)

  // ── Vite proxy, verbatim ───────────────────────────────────────────────────
  const vitePath = `${FRONTEND}/vite.config.ts`
  const vite = parseTs(vitePath)
  const blocks = []
  walkTs(vite.sf, (n) => {
    if (ts.isPropertyAssignment(n) && /^(server|preview)$/.test(n.name.getText(vite.sf)) && ts.isObjectLiteralExpression(n.initializer)) {
      const from = nodeLine(vite.sf, n)
      const to = vite.sf.getLineAndCharacterOfPosition(n.getEnd()).line + 1
      blocks.push({ name: n.name.getText(vite.sf), from, to, text: sliceLines(vite.text, from, to) })
    }
  })
  const viteOut = [
    `# Vite dev/preview server configuration, verbatim from ${rel(vitePath)} (${SOURCE_BRANCH} @ ${SOURCE_SHA}).`,
    '# Each block is preceded by "@src <file>:<from>-<to>".',
    '',
  ]
  for (const b of blocks) viteOut.push(`@src ${rel(vitePath)}:${b.from}-${b.to}`, b.text, '')
  writeText(`${AC}/vite-proxy.txt`, viteOut.join('\n'))

  writeJson(`${AC}/endpoints.json`, {
    source: { sha: SOURCE_SHA, branch: SOURCE_BRANCH },
    notes: [
      'Found by AST over non-test frontend/src: calls to fetch() and to the net/client.ts helpers getJson (GET), postJson (POST), getFloat32 (GET, binary). Helper paths are relative to BASE = "/api" and are shown with /api prefixed.',
      'path: template substitutions written as {name}; a substitution that builds the query string is dropped from the path and marks queryDynamic, with keys recovered from URLSearchParams .set/.append/object literals in the same function.',
      'binary: getFloat32, an arrayBuffer() read in the calling function, or format=f32 in the URL.',
      'responseType: helper generic, else a `.json() as T` cast, else the calling function\'s return type (Promise unwrapped); responseTypeSources says which.',
      'dynamicCalls: fetches whose URL is a variable (manifest-supplied binary_url, constructed asset URLs); urlSource says where it comes from.',
      'literalMentions: /api... literals not passed directly to fetch/helpers (they may be built into a URL elsewhere, or displayed).',
      'headers: every X-* header name string in frontend/src, with the call that reads it.',
      'Vite proxy: see vite-proxy.txt (/api -> http://127.0.0.1:8000, dev and preview).',
    ],
    counts: {
      endpoints: endpoints.length,
      callSites: calls.length,
      dynamicCalls: calls.filter((c) => c.dynamic).length,
      literalMentions: literalMentions.length,
      headerNames: headerNames.length,
    },
    endpoints,
    dynamicCalls: calls.filter((c) => c.dynamic),
    literalMentions,
    headers: { names: headerNames, reads: headers },
    copies,
  })

  return {
    'api.endpoints': endpoints.length,
    'api.callSites': calls.length,
    'api.dynamicCalls': calls.filter((c) => c.dynamic).length,
    'api.headerNames': headerNames.length,
    'api.copies': copies.length,
  }
}

if (isMain(import.meta.url)) console.log(run())
