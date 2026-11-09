// `npm run towns <Refueller's data/places.json>`: writes src/data/towns.json, the places the
// Moon and planets can be said to stand "between" or "roughly over" (SPEC §6), for all of
// Great Britain. Lightreader's rule (its scripts/build-towns.ts): every town and city, plus
// the place each postcode district is named after, at its own point. Refueller's list is
// made from OS Open Names and already gives Welsh and Gaelic places their English names.

import { readFileSync, writeFileSync } from 'node:fs'
import { bearingAndMiles } from '../src/lib/geo.ts'

const file = process.argv[2]
if (!file) { console.error("Usage: npm run towns <Refueller's data/places.json>"); process.exit(1) }

type Row = [name: string, other: string, area: string, lat: number, lon: number, kind: 'c' | 't' | 's' | 'v', district: string]
const source = JSON.parse(readFileSync(file, 'utf8')) as { credit: string; made: string; places: Row[] }
const outcodes = JSON.parse(readFileSync(new URL('../src/data/outcodes.json', import.meta.url), 'utf8')) as { credits: string[]; outcodes: Record<string, [number, number, string | null]> }

const plain = (s: string) => s.toLowerCase().replace(/-/g, ' ').trim()
const byName = new Map<string, Row[]>()
for (const r of source.places) for (const n of [r[0], r[1]]) if (n) byName.set(plain(n), [...(byName.get(plain(n)) ?? []), r])

const kept = new Map<Row, 0 | 1>()
for (const r of source.places) if (r[5] === 'c' || r[5] === 't') kept.set(r, 1)

// The place each district is named after: the place of that name nearest the district's
// middle, within 10 miles. Either half of a double name counts ("Cardiff / Caerdydd").
let named = 0, unnamed = 0
for (const [lat, lon, name] of Object.values(outcodes.outcodes)) {
  if (!name) { unnamed++; continue }
  let best: { row: Row; miles: number } | null = null
  for (const half of name.split('/')) for (const row of byName.get(plain(half)) ?? []) {
    const { miles } = bearingAndMiles({ latitude: lat, longitude: lon }, { latitude: row[3], longitude: row[4] })
    if (miles <= 10 && (!best || miles < best.miles)) best = { row, miles }
  }
  if (!best) { unnamed++; continue }
  named++
  if (!kept.has(best.row)) kept.set(best.row, 0)
}

const places = [...kept].map(([r, big]) => [r[0], r[3], r[4], big] as const).sort((a, b) => a[0].localeCompare(b[0]) || a[1] - b[1])
writeFileSync(new URL('../src/data/towns.json', import.meta.url), JSON.stringify({
  note: 'Towns, cities and the places postcode districts are named after, in Great Britain: [name, latitude, longitude, 1 for a town or city] (WGS84, from OS Open Names by way of Refueller\'s data/places.json). Built by scripts/build-towns.ts.',
  credits: outcodes.credits, made: source.made, places,
}).replace('"places":[', '"places":[\n').replace(/\],\[/g, '],\n['))
console.log(`${places.length} places: ${places.filter((p) => p[3]).length} towns and cities, ${places.filter((p) => !p[3]).length} smaller places districts are named after; ${named} districts matched, ${unnamed} not`)
