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
  outcodes: Record<string, { e: number; n: number; place: string }>
}

const from = process.argv[2]
if (!from) {
  console.error('Usage: npm run outcodes <path to Hindcaster data/outcodes.json>')
  process.exit(1)
}
const source = JSON.parse(readFileSync(from, 'utf8')) as Source

const outcodes: Record<string, [number, number, string]> = {}
for (const [code, d] of Object.entries(source.outcodes).sort(([a], [b]) => a.localeCompare(b))) {
  const { latitude, longitude } = fromBritishGrid(d.e, d.n)
  outcodes[code] = [Math.round(latitude * 1e4) / 1e4, Math.round(longitude * 1e4) / 1e4, d.place]
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
