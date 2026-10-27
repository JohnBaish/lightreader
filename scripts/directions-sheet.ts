// `npm run directions-sheet`: design/directions-sheet-<today>.md, the "roughly over …" places
// for John to check before they go on the page (PLAN stage 6): how often a place is found
// across every postcode district, and one district from each postcode area on today, the
// shortest day and the longest day.

import { writeFileSync } from 'node:fs'
import outcodes from '../src/data/outcodes.json' with { type: 'json' }
import { compassPoint, longDate } from '../src/lib/format.ts'
import { district } from '../src/lib/postcode.ts'
import { directionSentences } from '../src/lib/sentences/directions.ts'
import type { SkyContext } from '../src/lib/sentences/context.ts'
import { dayFigures } from '../src/lib/sun.ts'
import { BETWEEN_DEGREES, describeToward, TOWN_MILES, TOWN_WITHIN_DEGREES, townsBetween } from '../src/lib/towns.ts'
import { ukParts } from '../src/lib/ukTime.ts'

const now = new Date()
const today = ukParts(now).date
const year = Number(today.slice(0, 4))
const shortest = `${year}-12-21`
const longest = `${year + 1}-06-21`
const DATES = [today, shortest, longest]

const codes = Object.keys((outcodes as { outcodes: Record<string, unknown> }).outcodes)
const show = (d: { latitude: number; longitude: number }, az: number, own: string) => describeToward(d, az, own).replace(/^, /, '') || '—'

// How often each kind of wording is used, for every district: [between, roughly over, none]
// for sunrise and then sunset.
const found: Record<string, number[]> = {}
for (const date of DATES) found[date] = [0, 0, 0, 0, 0, 0]
for (const code of codes) {
  const d = district(code)!
  for (const date of DATES) {
    const f = dayFigures(d, date)
    ;[f.sunriseAzimuth!, f.sunsetAzimuth!].forEach((az, i) => {
      const kind = townsBetween(d, az, d.name) ? 0 : describeToward(d, az, d.name) ? 1 : 2
      found[date][i * 3 + kind]++
    })
  }
}
const pct = (n: number) => `${Math.round((n / codes.length) * 100)}%`

// One district per postcode area: the lowest-numbered.
const areas = new Map<string, string>()
for (const code of codes.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))) {
  const area = code.match(/^[A-Z]+/)![0]
  if (!areas.has(area)) areas.set(area, code)
}

const lines: string[] = [
  `# Where the sun rises and sets: the places, second version, for John to check (${longDate(today, true)})`,
  '',
  `The rule (John, 28 October, second version): "between" the nearest town or city on each side of the direction the sun rises or sets, each within ${BETWEEN_DEGREES}° of it and ${TOWN_MILES[0]} to ${TOWN_MILES[1]} miles away, named left then right as you face the sun; in brackets, the nearest smaller place (one a postcode district is named after) lying within ${TOWN_WITHIN_DEGREES}° of the line, if there is one. With no town on one side, "roughly over" the nearest town or city within ${TOWN_WITHIN_DEGREES}° of the line. With neither (often the sea), the compass point alone. Distances and directions are from the middle of the visitor's postcode district.`,
  '',
  `Made with \`npm run directions-sheet\`. Places from OS Open Names (${(await import('../src/data/towns.json', { with: { type: 'json' } })).default.places.length} near England).`,
  '',
  '## Which wording is used, across all ' + codes.length + ' English postcode districts',
  '',
  '| Day | Sunrise: between | roughly over | compass only | Sunset: between | roughly over | compass only |',
  '|---|---|---|---|---|---|---|',
  ...DATES.map((date) => `| ${longDate(date, true)} | ${found[date].map(pct).join(' | ')} |`),
  '',
  `## Today's sentence, one district from each postcode area`,
  '',
]
for (const code of areas.values()) {
  const d = district(code)!
  const ctx: SkyContext = { place: d, name: d.name, today, now, days: [dayFigures(d, today)] }
  lines.push(`- **${code} ${d.name}:** ${directionSentences(ctx, true)[0]}`)
}
lines.push('', '## The shortest and longest days', '')
lines.push(`| District | ${longDate(shortest, true)}: sunrise | sunset | ${longDate(longest, true)}: sunrise | sunset |`, '|---|---|---|---|---|')
for (const code of areas.values()) {
  const d = district(code)!
  const cellsFor = (date: string) => {
    const f = dayFigures(d, date)
    return [`${compassPoint(f.sunriseAzimuth!)}: ${show(d, f.sunriseAzimuth!, d.name)}`, `${compassPoint(f.sunsetAzimuth!)}: ${show(d, f.sunsetAzimuth!, d.name)}`]
  }
  lines.push(`| ${code} ${d.name} | ${[...cellsFor(shortest), ...cellsFor(longest)].join(' | ')} |`)
}
lines.push('')
const file = `design/directions-sheet-${today}.md`
writeFileSync(file, lines.join('\n'))
console.log(`${file}: ${areas.size} postcode areas`, found)
