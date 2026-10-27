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
import { TOWN_MILES, TOWN_WITHIN_DEGREES, townToward, type Toward } from '../src/lib/towns.ts'
import { ukParts } from '../src/lib/ukTime.ts'

const now = new Date()
const today = ukParts(now).date
const year = Number(today.slice(0, 4))
const shortest = `${year}-12-21`
const longest = `${year + 1}-06-21`
const DATES = [today, shortest, longest]

const codes = Object.keys((outcodes as { outcodes: Record<string, unknown> }).outcodes)
const show = (t: Toward | null) => (t ? `${t.name} (${Math.round(t.miles)} mi, ${Math.round(t.off)}° off)` : '—')

// How often a place is found, for every district.
const found: Record<string, [number, number]> = {}
for (const date of DATES) found[date] = [0, 0]
for (const code of codes) {
  const d = district(code)!
  for (const date of DATES) {
    const f = dayFigures(d, date)
    if (townToward(d, f.sunriseAzimuth!, d.name)) found[date][0]++
    if (townToward(d, f.sunsetAzimuth!, d.name)) found[date][1]++
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
  `# "Roughly over …": the places, for John to check (${longDate(today, true)})`,
  '',
  `The rule (John, 28 October): a town or city, or a place a postcode district is named after, lying within ${TOWN_WITHIN_DEGREES}° of the direction the sun rises or sets, between ${TOWN_MILES[0]} and ${TOWN_MILES[1]} miles away; the nearest first. Distances and directions are from the middle of the visitor's postcode district. Where none lies that way (often the sea), the sentence gives the compass point alone.`,
  '',
  `Made with \`npm run directions-sheet\`. Places from OS Open Names (${(await import('../src/data/towns.json', { with: { type: 'json' } })).default.places.length} near England). "° off" is how far the place's direction is from the sun's.`,
  '',
  '## How often a place is found, across all ' + codes.length + ' English postcode districts',
  '',
  '| Day | Sunrise | Sunset |',
  '|---|---|---|',
  ...DATES.map((date) => `| ${longDate(date, true)} | ${pct(found[date][0])} | ${pct(found[date][1])} |`),
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
    return [`${compassPoint(f.sunriseAzimuth!)}: ${show(townToward(d, f.sunriseAzimuth!, d.name))}`, `${compassPoint(f.sunsetAzimuth!)}: ${show(townToward(d, f.sunsetAzimuth!, d.name))}`]
  }
  lines.push(`| ${code} ${d.name} | ${[...cellsFor(shortest), ...cellsFor(longest)].join(' | ')} |`)
}
lines.push('')
const file = `design/directions-sheet-${today}.md`
writeFileSync(file, lines.join('\n'))
console.log(`${file}: ${areas.size} postcode areas`, found)
