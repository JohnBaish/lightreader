// `npm run uk-places <OS Open Names Data folder>`: writes src/data/ukPlaces.json, the big
// places "Across the UK" picks its ends from (SPEC §6).
//
// John, 27 October: the places shown should be the big places at the two ends of whatever
// is being compared that day, from a short list: every city in OS Open Names (Great
// Britain; Northern Ireland isn't included), plus five well-known towns at the edges
// (Lerwick, Stornoway, Penzance, Dover, Lowestoft). Penzance is at its postcode district
// centre (TR18, from src/data/outcodes.json), as John chose; the others are at their Open
// Names point. Welsh cities listed under their Welsh name first are given in English
// (Newport, Swansea, St Davids). London's two other "cities", the City of London and the
// City of Westminster, are left out, as London stands for them.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fromBritishGrid } from './lib/grid.ts'

const EDGE_TOWNS = ['Lerwick', 'Stornoway', 'Dover', 'Lowestoft']
const LEAVE_OUT = ['City of London', 'City of Westminster']

const folder = process.argv[2]
if (!folder) {
  console.error('Usage: npm run uk-places <OS Open Names Data folder>')
  process.exit(1)
}

/** One CSV line into cells (Open Names quotes cells holding commas). */
function cells(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (const ch of line) {
    if (ch === '"') quoted = !quoted
    else if (ch === ',' && !quoted) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

type Row = { name: string; type: string; e: number; n: number }
const rows: Row[] = []
for (const file of readdirSync(folder).filter((f) => f.endsWith('.csv'))) {
  for (const line of readFileSync(join(folder, file), 'utf8').split('\n')) {
    const c = cells(line)
    if (c[6] !== 'populatedPlace' || (c[7] !== 'City' && c[7] !== 'Town')) continue
    const name = c[3] === 'cym' && c[5] === 'eng' ? c[4] : c[2]
    rows.push({ name, type: c[7], e: Number(c[8]), n: Number(c[9]) })
  }
}

const chosen = rows.filter((r) => (r.type === 'City' && !LEAVE_OUT.includes(r.name)) || (r.type === 'Town' && EDGE_TOWNS.includes(r.name)))
for (const t of EDGE_TOWNS) {
  const found = chosen.filter((r) => r.name === t)
  if (found.length !== 1) throw new Error(`${t}: ${found.length} towns of that name`)
}

const outcodes = JSON.parse(readFileSync('src/data/outcodes.json', 'utf8')) as { outcodes: Record<string, [number, number, string]> }
const round = (x: number) => Math.round(x * 1e4) / 1e4
const places = chosen.map((r) => {
  const { latitude, longitude } = fromBritishGrid(r.e, r.n)
  return { name: r.name, latitude: round(latitude), longitude: round(longitude) }
})
const [lat, lon] = outcodes.outcodes.TR18
places.push({ name: 'Penzance', latitude: lat, longitude: lon })
places.sort((a, b) => a.name.localeCompare(b.name))

writeFileSync('src/data/ukPlaces.json', JSON.stringify({
  note: 'The big places "Across the UK" picks its ends from: every city in OS Open Names (Great Britain) and five towns at the edges. Built by scripts/build-uk-places.ts.',
  places,
}, null, 1) + '\n')
console.log(`${places.length} places written to src/data/ukPlaces.json`)
