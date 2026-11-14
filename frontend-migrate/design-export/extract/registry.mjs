// registry.mjs -> design-export/registry.json
//
// features/registry.ts parsed: FEATURES in order, RAIL_TABS, the FeatureSlot,
// FeatureGroup and RailTab unions, and the per-mode selection the shell derives
// from them (same rule as selectFeatures / selectSystemsFeatures).

import {
  OUT, SRC, SOURCE_SHA, SOURCE_BRANCH, parseTs, walkTs, nodeLine, ts, writeJson,
  checkSourcePin, isMain,
} from './lib.mjs'

function unionOf(sf, name, root) {
  let out = null
  walkTs(root, (n) => {
    if (ts.isTypeAliasDeclaration(n) && n.name.text === name && ts.isUnionTypeNode(n.type)) {
      out = {
        line: nodeLine(sf, n),
        members: n.type.types.filter((t) => ts.isLiteralTypeNode(t)).map((t) => t.literal.text),
      }
    } else if (ts.isTypeAliasDeclaration(n) && n.name.text === name && ts.isLiteralTypeNode(n.type)) {
      out = { line: nodeLine(sf, n), members: [n.type.literal.text] }
    }
  })
  return out
}

const listText = (v) => (v === null ? '(all)' : v.length === 0 ? '(none)' : v.join(', '))

export function run() {
  checkSourcePin()
  const e = parseTs(`${SRC}/features/registry.ts`)
  const types = parseTs(`${SRC}/mission/types.ts`)
  const slotUnion = unionOf(e.sf, 'FeatureSlot', e.sf)
  const groupUnion = unionOf(e.sf, 'FeatureGroup', e.sf)
  const tabUnion = unionOf(e.sf, 'RailTab', e.sf)
  const modeUnion = unionOf(types.sf, 'MissionMode', types.sf)

  let featuresArr = null
  let featuresLine = null
  let railTabs = []
  let railTabsLine = null
  walkTs(e.sf, (n) => {
    if (!ts.isVariableDeclaration(n) || !n.initializer) return
    const name = n.name.getText(e.sf)
    if (name === 'FEATURES') {
      featuresArr = n.initializer
      featuresLine = nodeLine(e.sf, n)
    }
    if (name === 'RAIL_TABS' && ts.isArrayLiteralExpression(n.initializer)) {
      railTabsLine = nodeLine(e.sf, n)
      railTabs = n.initializer.elements.map((el) => {
        const o = {}
        for (const p of el.properties) o[p.name.getText(e.sf)] = p.initializer.text
        return { ...o, line: nodeLine(e.sf, el) }
      })
    }
  })
  if (!featuresArr || !ts.isArrayLiteralExpression(featuresArr)) throw new Error('FEATURES array not found')

  const features = featuresArr.elements.map((el, idx) => {
    const props = {}
    for (const p of el.properties) {
      if (!ts.isPropertyAssignment(p)) throw new Error(`unexpected property shape at line ${nodeLine(e.sf, p)}`)
      props[p.name.getText(e.sf)] = p.initializer
    }
    const str = (k) => (props[k] ? props[k].text : null)
    const modes = props.modes ? props.modes.elements.map((m) => m.text) : null
    const ranges = ts.getLeadingCommentRanges(e.text, el.getFullStart()) || []
    const comment = ranges.length ? e.text.slice(ranges[0].pos, ranges[ranges.length - 1].end) : null
    const commentLines = ranges.length
      ? [e.sf.getLineAndCharacterOfPosition(ranges[0].pos).line + 1, e.sf.getLineAndCharacterOfPosition(ranges[ranges.length - 1].end).line + 1]
      : null
    const group = str('group')
    const tab = str('tab')
    return {
      order: idx + 1,
      id: str('id'),
      slot: str('slot'),
      modes,
      group,
      tab,
      component: props.Component ? props.Component.getText(e.sf) : null,
      file: e.file,
      line: nodeLine(e.sf, el),
      comment,
      commentLines,
      effectiveGroup: group ?? 'primary',
      reachable: modes === null || modes.length > 0,
      modesText: listText(modes),
      groupText: group ?? 'primary',
      tabText: tab ?? '(none)',
    }
  })

  // Derived placement, by the same rule as selectFeatures / selectSystemsFeatures.
  const modes = modeUnion ? modeUnion.members : ['plan', 'analyze']
  const inMode = (f, m) => f.modes === null || f.modes.includes(m)
  const placement = {}
  for (const m of modes) {
    placement[m] = { slots: {}, systemsDrawer: [], railTabs: {} }
    for (const s of slotUnion.members) {
      placement[m].slots[s] = features.filter((f) => f.slot === s && inMode(f, m) && f.effectiveGroup === 'primary').map((f) => f.id)
    }
    placement[m].systemsDrawer = features.filter((f) => f.group === 'systems' && inMode(f, m)).map((f) => f.id)
    for (const t of tabUnion.members) {
      placement[m].railTabs[t] = features.filter((f) => f.slot === 'rightRail' && f.effectiveGroup === 'primary' && inMode(f, m) && f.tab === t).map((f) => f.id)
    }
    placement[m].railTabs['(untabbed)'] = features.filter((f) => f.slot === 'rightRail' && f.effectiveGroup === 'primary' && inMode(f, m) && !f.tab).map((f) => f.id)
  }

  writeJson(`${OUT}/registry.json`, {
    source: { sha: SOURCE_SHA, branch: SOURCE_BRANCH },
    file: e.file,
    notes: [
      'modes: null = property absent (every mode); [] = present and empty (no mode, retired). group/tab: null = absent.',
      'modesText/groupText/tabText are the canonical spellings DESIGN.md uses for coverage check 4: modes "(all)" | "(none)" | "plan, analyze"; group absent -> "primary"; tab absent -> "(none)".',
      'comment: the comment block directly above the entry, verbatim (from the first comment character to the last).',
      'placement: derived with the selectFeatures / selectSystemsFeatures rules (registry.ts) for each MissionMode.',
    ],
    counts: {
      features: features.length,
      reachable: features.filter((f) => f.reachable).length,
      systems: features.filter((f) => f.group === 'systems').length,
      tabbed: features.filter((f) => f.tab).length,
    },
    featureSlot: slotUnion,
    featureGroup: groupUnion,
    railTab: tabUnion,
    missionMode: { file: types.file, ...modeUnion },
    railTabs: { line: railTabsLine, tabs: railTabs },
    featuresLine,
    features,
    placement,
  })
  return {
    'registry.features': features.length,
    'registry.reachable': features.filter((f) => f.reachable).length,
    'registry.systems': features.filter((f) => f.group === 'systems').length,
    'registry.railTabs': railTabs.length,
  }
}

if (isMain(import.meta.url)) console.log(run())
