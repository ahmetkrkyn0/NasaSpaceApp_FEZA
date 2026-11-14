// run-all.mjs -- regenerate every machine-readable file under design-export/.
//
//   node design-export/extract/run-all.mjs                       extract only
//   node design-export/extract/run-all.mjs --coverage DESIGN.md  extract, then run coverage checks
//
// Aborts when HEAD is not the pinned commit or tracked frontend files are
// modified (set DESIGN_EXPORT_ALLOW_DRIFT=1 to override). Outputs are
// deterministic: two runs on the same tree produce byte-identical files.

import path from 'node:path'
import { checkSourcePin, SOURCE_SHA, SOURCE_BRANCH } from './lib.mjs'
import * as tokens from './tokens.mjs'
import * as fonts from './fonts.mjs'
import * as motion from './motion.mjs'
import * as cssInventory from './css-inventory.mjs'
import * as colormaps from './colormaps.mjs'
import * as icons from './icons.mjs'
import * as registry from './registry.mjs'
import * as strings from './strings.mjs'
import * as assets from './assets.mjs'
import * as api from './api.mjs'
import { runCoverage, printTable } from './coverage.mjs'

const STEPS = [
  ['tokens', tokens],
  ['fonts', fonts],
  ['motion', motion],
  ['css-inventory', cssInventory],
  ['colormaps', colormaps],
  ['icons', icons],
  ['registry', registry],
  ['strings', strings],
  ['assets', assets],
  ['api', api],
]

checkSourcePin()
console.log(`design-export: extracting from ${SOURCE_BRANCH} @ ${SOURCE_SHA}`)
const summary = {}
for (const [name, mod] of STEPS) {
  const t0 = Date.now()
  const counts = mod.run()
  Object.assign(summary, counts)
  console.log(`  ${name.padEnd(14)} ok  (${Date.now() - t0} ms)`)
}
console.log('\nSummary of counts:')
const width = Math.max(...Object.keys(summary).map((k) => k.length))
for (const [k, v] of Object.entries(summary)) console.log(`  ${k.padEnd(width)}  ${v}`)

const ci = process.argv.indexOf('--coverage')
if (ci >= 0) {
  const target = process.argv[ci + 1]
  if (!target) {
    console.error('--coverage needs a path to DESIGN.md')
    process.exit(2)
  }
  console.log(`\nCoverage against ${target}:`)
  const results = runCoverage(path.resolve(target))
  printTable(results)
  const failed = results.filter((r) => !r.pass).length
  console.log(`\n${results.length - failed}/${results.length} checks passed`)
  process.exit(failed ? 1 : 0)
}
