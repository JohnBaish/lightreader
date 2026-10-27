// `npm run towns <OS Open Names Data folder>`: writes src/data/towns.json, the places the sun
// can be said to rise or set "roughly over" (SPEC §6, PLAN stage 6).
//
// John, 28 October: every town and city in OS Open Names, plus every place a postcode
// district in England is named after (src/data/outcodes.json), at its own Open Names point.
// Only places within 45 km of an English postcode district's middle are kept, as the rule
// looks no further than 25 miles. Welsh places listed under their Welsh name first are
// given in English (Caerleon, not Caerllion; John, 28 October), as in build-uk-places.ts.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fromBritishGrid, toBritishGrid } from './lib/grid.ts'

const folder = process.argv[2]
if (!folder) {
  console.error('Usage: npm run towns <OS Open Names Data folder>')
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

type Row = { name: string; welsh: string | null; type: string; e: number; n: number }
const rows: Row[] = []
for (const file of readdirSync(folder).filter((f) => f.endsWith('.csv'))) {
  for (const line of readFileSync(join(folder, file), 'utf8').split('\n')) {
    const c = cells(line)
    if (c[6] !== 'populatedPlace') continue
    const welshFirst = c[3] === 'cym' && c[5] === 'eng'
    rows.push({ name: welshFirst ? c[4] : c[2], welsh: welshFirst ? c[2] : null, type: c[7], e: Number(c[8]), n: Number(c[9]) })
  }
}

const outcodes = JSON.parse(readFileSync('src/data/outcodes.json', 'utf8'))
const centres = Object.values(outcodes.outcodes as Record<string, [number, number, string | null]>)
  .map(([lat, lon, name]) => ({ ...toBritishGrid(lat, lon), name }))

const dist = (a: { e: number; n: number }, b: { easting: number; northing: number }) => Math.hypot(a.e - b.easting, a.n - b.northing)

// Towns and cities.
const kept = new Map<Row, string>()
for (const r of rows) if (r.type === 'Town' || r.type === 'City') kept.set(r, r.type)

// The place each district is named after, at the Open Names point of that name nearest the
// district's middle. Either half of a double name counts ("St Just / St Just in Penwith",
// "Y Gelli Gandryll / Hay-on-Wye"), and hyphens are ignored ("Bradford-on-Avon").
const plain = (s: string) => s.toLowerCase().replace(/-/g, ' ')
const notFound = new Set<string>()
for (const c of centres) {
  if (!c.name) continue
  const names = c.name.split(' / ').map(plain)
  let best: Row | null = null
  for (const r of rows) {
    if ((names.includes(plain(r.name)) || (r.welsh && names.includes(plain(r.welsh)))) && (!best || dist(r, c) < dist(best, c))) best = r
  }
  if (best && dist(best, c) < 15_000) { if (!kept.has(best)) kept.set(best, 'district') } else notFound.add(c.name)
}

// Near England only, and one of each name within 2 km.
const near = [...kept.keys()].filter((r) => centres.some((c) => dist(r, c) <= 45_000))
const places: Row[] = []
for (const r of near.sort((a, b) => a.name.localeCompare(b.name))) {
  if (!places.some((p) => p.name === r.name && Math.hypot(p.e - r.e, p.n - r.n) < 2000)) places.push(r)
}

// How the two London "cities" read in a sentence: "roughly over Westminster", "roughly over
// the City of London".
const SAID_AS: Record<string, string> = { 'City of Westminster': 'Westminster', 'City of London': 'the City of London' }

const out = {
  note: 'Towns, cities and the places postcode districts in England are named after, near England: [name, latitude, longitude, 1 for a town or city] (WGS84, from OS Open Names). For "roughly over …" (SPEC §6). Built by scripts/build-towns.ts.',
  credits: outcodes.credits,
  places: places.map((r) => {
    const { latitude, longitude } = fromBritishGrid(r.e, r.n)
    return [SAID_AS[r.name] ?? r.name, Number(latitude.toFixed(4)), Number(longitude.toFixed(4)), r.type === 'Town' || r.type === 'City' ? 1 : 0]
  }),
}
writeFileSync('src/data/towns.json', JSON.stringify(out) + '\n')
console.log(`towns.json: ${places.length} places (${[...kept.values()].filter((t) => t !== 'district').length} towns and cities in GB before trimming); ${notFound.size} district names with no Open Names place within 15 km: ${[...notFound].join(', ')}`)
