// `npm run figures-sheet`: design/figures-sheet-<date>.md, real figures for John to read before
// any page is built (stage 1). Places are postcode-district centres from src/data/outcodes.json.

import { readFileSync, writeFileSync } from 'node:fs'
import { elongations, lunarEclipses, meteorShowers, moonPhases, oppositions, solarEclipses } from '../src/lib/ahead.ts'
import { clock, compassPoint, duration, longDate } from '../src/lib/format.ts'
import { fists, moonLook, night, nights, sky, type InView, type Night } from '../src/lib/night.ts'
import type { Place } from '../src/lib/sun.ts'
import { ukParts } from '../src/lib/ukTime.ts'

const TODAY = process.argv[2] ?? '2026-11-09'
const data = JSON.parse(readFileSync(new URL('../src/data/outcodes.json', import.meta.url), 'utf8')) as { outcodes: Record<string, [number, number, string]> }
const at = (code: string): Place & { label: string } => { const [latitude, longitude, name] = data.outcodes[code]; return { latitude, longitude, label: `${name} (${code})` } }
const PLACES = ['RG1', 'TR18', 'CF10', 'EH1', 'ZE1'].map(at)
const day = (d: Date) => longDate(ukParts(d).date)
const span = (s: { from: Date; to: Date }) => `${clock(s.from)} to ${clock(s.to)}`
const pct = (x: number) => `${Math.round(x * 100)}%`

function nightLine(n: Night): string {
  if (!n.darkest) return 'Half-light all night: the sky never gets dark.'
  const kind = n.darkest.kind === 'true night' ? 'True night' : n.darkest.kind === 'very dark' ? 'No true night. Very dark' : 'No true night. Dark'
  const free = n.moonFreeMs < 30_000 ? 'none of it Moon-free' : n.darkMs - n.moonFreeMs < 30_000 ? 'all of it Moon-free' : `${duration(n.moonFreeMs)} of it Moon-free`
  return `${kind} ${span(n.darkest)} (${duration(n.darkMs)}), ${free}. Moon ${pct(n.moonLit)} lit.`
}
function bodyLine(b: InView): string {
  const mag = b.magnitude === null ? '' : ` (brightness ${b.magnitude.toFixed(1)})`
  if (!b.level) return `${b.name}${mag}: not in view, ${b.why}.`
  const f = fists(b.best!.altitude)
  const well = b.wellPlaced.length ? `well placed ${b.wellPlaced.map(span).join(' and ')}` : 'low all the time it is in view'
  return `${b.name}${mag}: in view ${b.inView.map(span).join(' and ')}; ${well}; highest ${Math.round(b.best!.altitude)}° (${f} fist${f === 1 ? '' : 's'}) in the ${compassPoint(b.best!.azimuth)} at ${clock(b.best!.at)}.`
}

const out: string[] = []
out.push(`# Nightreader figures sheet, ${longDate(TODAY, true)}`, '',
  'Real figures from `src/lib/night.ts` and `src/lib/ahead.ts` (Astronomy Engine 2.1.19), for the middle of each postcode district.',
  'Times are UK clock time. Nothing here is on a page yet: it is for checking the rules.', '')

out.push('## 1. Tonight in five places', '')
for (const p of PLACES) {
  const n = night(p, TODAY)
  out.push(`### ${p.label}`, '', `- Sunset ${n.sunset ? clock(n.sunset) : 'none'}, sunrise ${n.sunrise ? clock(n.sunrise) : 'none'}.`, `- ${nightLine(n)}`)
  for (const b of sky(p, TODAY)) out.push(`- ${bodyLine(b)}`)
  out.push('')
}

out.push('## 2. The same five places on the shortest night (June 21st 2027)', '')
for (const p of PLACES) out.push(`- **${p.label}:** ${nightLine(night(p, '2027-06-21'))}`)
out.push('')

const RG1 = PLACES[0]
out.push('## 3. Reading: the Moon over the next fortnight', '', '| Night | Moon | Lit | Darkest part of the night | Moon-free |', '|---|---|---|---|---|')
for (const n of nights(RG1, TODAY, 16)) {
  const look = moonLook(RG1, n.darkest ? n.darkest.from : n.sunset!)
  out.push(`| ${longDate(n.date)} | ${look.phase} | ${pct(n.moonLit)} | ${n.darkest ? span(n.darkest) : 'none'} | ${duration(n.moonFreeMs)} |`)
}
out.push('')

out.push('## 4. Reading: looking ahead', '')
const from = new Date(TODAY + 'T12:00:00Z'), until = new Date(from.getTime() + 370 * 86_400_000)
out.push('**The Moon:** ' + moonPhases(from, 8).map((q) => `${q.phase} ${day(q.at)} ${clock(q.at)}`).join('; ') + '.', '')
out.push('**Eclipses of the Sun seen from Reading:**')
for (const e of solarEclipses(RG1, from, 3)) out.push(`- ${day(e.peak)} ${ukParts(e.peak).date.slice(0, 4)}: ${e.kind}, ${span({ from: e.begin, to: e.end })}, ${pct(e.covered)} of the Sun covered at ${clock(e.peak)}, Sun ${Math.round(e.altitude)}° up.`)
out.push('', '**Eclipses of the Moon with the Moon up:**')
for (const e of lunarEclipses(RG1, from, 4)) out.push(`- ${day(e.peak)} ${ukParts(e.peak).date.slice(0, 4)}: ${e.kind}, peak ${clock(e.peak)}, ${pct(e.covered)} covered, Moon ${Math.round(e.altitude)}° up.`)
out.push('', '**Planets at their best:**')
for (const o of oppositions(from)) out.push(`- ${o.name} opposite the Sun on ${day(o.at)} ${ukParts(o.at).date.slice(0, 4)} (brightness ${o.magnitude.toFixed(1)}).`)
for (const e of elongations(from, until)) out.push(`- ${e.name} furthest from the Sun on ${day(e.at)} ${ukParts(e.at).date.slice(0, 4)}: ${e.degrees.toFixed(0)}°, ${e.sky} sky.`)
out.push('', '**Meteor showers (the list of showers is still to check against the International Meteor Organization):**')
for (const m of meteorShowers(RG1, from)) out.push(`- ${m.name}, peak ${day(m.peak)} ${ukParts(m.peak).date.slice(0, 4)} at ${clock(m.peak)}; the night of ${longDate(m.night.date)}: ${nightLine(m.night)}`)
out.push('')

out.push('## 5. The year by month: Reading and Lerwick', '')
for (const p of [RG1, PLACES[4]]) {
  const all = nights(p, TODAY, 365)
  out.push(`### ${p.label}`, '', '| Month | Nights of true night | Very dark only | Dark only | Half-light all night | Average darkest stretch | Average Moon-free |', '|---|---|---|---|---|---|---|')
  const months = new Map<string, Night[]>()
  for (const n of all) { const k = n.date.slice(0, 7); months.set(k, [...(months.get(k) ?? []), n]) }
  for (const [k, v] of months) {
    const count = (kind: string | null) => v.filter((n) => (n.darkest?.kind ?? null) === kind).length
    const avg = (f: (n: Night) => number) => duration(v.reduce((s, n) => s + f(n), 0) / v.length)
    out.push(`| ${k} | ${count('true night')} | ${count('very dark')} | ${count('dark')} | ${count(null)} | ${avg((n) => n.darkMs)} | ${avg((n) => n.moonFreeMs)} |`)
  }
  out.push('')
}
const file = new URL(`../design/figures-sheet-${TODAY}.md`, import.meta.url)
writeFileSync(file, out.join('\n'))
console.log(out.join('\n'))
