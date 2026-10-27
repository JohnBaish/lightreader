// `npm run outcodes <Hindcaster's data/outcodes.json>`: writes src/data/outcodes.json,
// the postcode districts Lightreader can look up (PLAN stage 1).
//
// Hindcaster's file (built from OS Open Names by its scripts/build-outcodes.ts) has
// every postcode district with at least half its postcodes in England (2,210), each
// with the middle of its postcodes in British National Grid metres and the place most
// of them are in. Lightreader needs only latitude and longitude, so this converts each
// middle and keeps four decimal places (about 10 metres; a sun time moves by a second
// for about 300 metres east or west). The file is bundled with the site, so looking up
// a postcode sends nothing anywhere (SPEC §2). Its credit lines come with it.

import { readFileSync, writeFileSync } from 'node:fs'
import { fromBritishGrid } from './lib/grid.ts'

type Source = {
  note: string
  credits: string[]
  made: string
  outcodes: Record<string, { e: number; n: number; place: string | null }>
}

const from = process.argv[2]
if (!from) {
  console.error('Usage: npm run outcodes <path to Hindcaster data/outcodes.json>')
  process.exit(1)
}
const source = JSON.parse(readFileSync(from, 'utf8')) as Source

// Districts Open Names gives no place for (the fresh look, 6.1; John, 28 October): TR22 is
// St Agnes in the Isles of Scilly (its middle is 0.5 km from the village); MK20 is a small
// district beside Newport Pagnell (1.5 km away); SO97 is a business-only district in
// Southampton, between North Stoneham and Swaythling.
const NAMED: Record<string, string> = { TR22: 'St Agnes', MK20: 'Newport Pagnell', SO97: 'Southampton' }

/** One name for a place given two ways (6.2): the English half of a Welsh and English pair
 *  (John's rule for Welsh names), otherwise the shorter ("St Just / St Just in Penwith" is
 *  "St Just"). */
function oneName(place: string): string {
  const [a, b] = place.split(' / ')
  if (!b) return place
  if (place === 'Y Gelli Gandryll / Hay-on-Wye') return b
  return a.length <= b.length ? a : b
}

const outcodes: Record<string, [number, number, string]> = {}
for (const [code, d] of Object.entries(source.outcodes).sort(([a], [b]) => a.localeCompare(b))) {
  const { latitude, longitude } = fromBritishGrid(d.e, d.n)
  const name = NAMED[code] ?? (d.place ? oneName(d.place) : null)
  if (!name) throw new Error(`${code} has no place name: add it to NAMED`)
  outcodes[code] = [Math.round(latitude * 1e4) / 1e4, Math.round(longitude * 1e4) / 1e4, name]
}

const out = {
  note:
    'Postcode districts with at least half their postcodes in England: [latitude, longitude, main place]. ' +
    'The latitude and longitude (WGS84) are the middle of the district\'s postcodes, converted from ' +
    'Hindcaster\'s data/outcodes.json (made from OS Open Names). Built by scripts/build-outcodes.ts.',
  credits: source.credits,
  sourceMade: source.made,
  outcodes,
}
writeFileSync('src/data/outcodes.json', JSON.stringify(out) + '\n')
console.log(`${Object.keys(outcodes).length} districts written to src/data/outcodes.json`)
