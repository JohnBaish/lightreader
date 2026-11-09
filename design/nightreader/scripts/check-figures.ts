// `npm run check`: the night's figures (src/lib/night.ts, ahead.ts) and the postcode list.
// Expected values were worked out with Astronomy Engine 2.1.19 on November 9th 2026 and read
// through in design/figures-sheet-2026-11-09.md; Moon times were compared with MET Norway.
// A change of library version or of a rule shows up here.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { lunarEclipses, meteorShowers, moonPhases, oppositions, solarEclipses } from '../src/lib/ahead.ts'
import { clock, duration } from '../src/lib/format.ts'
import { LOW, WELL, fists, moonLook, moonUp, night, nights, sky, sunDepthNeeded } from '../src/lib/night.ts'
import type { Place } from '../src/lib/sun.ts'
import { describeToward } from '../src/lib/towns.ts'
import { ukParts } from '../src/lib/ukTime.ts'

let passed = 0
function check(name: string, fn: () => void) { fn(); passed++; console.log(`ok  ${name}`) }

const data = JSON.parse(readFileSync(new URL('../src/data/outcodes.json', import.meta.url), 'utf8')) as { credits: string[]; outcodes: Record<string, [number, number, string]> }
const place = (code: string): Place => { const [latitude, longitude] = data.outcodes[code]; return { latitude, longitude } }
const RG1 = place('RG1'), ZE1 = place('ZE1'), EH1 = place('EH1')
const hm = (ms: number) => duration(ms).replace(/ /g, ' ')

check('the postcode list covers Great Britain, not Northern Ireland', () => {
  assert.equal(Object.keys(data.outcodes).length, 2863)
  for (const code of ['RG1', 'ZE1', 'EH1', 'CF10', 'TR18']) assert.ok(data.outcodes[code], code)
  assert.ok(!Object.keys(data.outcodes).some((c) => c.startsWith('BT')))
  assert.equal(data.credits.length, 3)
})

check('Reading tonight (new Moon): true night 18:19 to 05:17, all of it Moon-free', () => {
  const n = night(RG1, '2026-11-09')
  assert.equal(n.darkest!.kind, 'true night')
  assert.equal(`${clock(n.darkest!.from)} ${clock(n.darkest!.to)}`, '18:19 05:17')
  assert.equal(hm(n.darkMs), '10h 59m')
  assert.equal(n.moonFreeMs, n.darkMs)
})

check('first quarter (November 17th): the Moon sets at 23:33 and 5h 56m is Moon-free', () => {
  const n = night(RG1, '2026-11-17')
  assert.equal(hm(n.moonFreeMs), '5h 56m')
  assert.equal(clock(n.moonUp[0].to), '23:33')
  // MET Norway gives moonrise 13:16 and moonset 23:32 (seconds dropped) for this day
  const up = moonUp(RG1, new Date('2026-11-17T00:00:00Z'), new Date('2026-11-18T00:00:00Z'))
  assert.equal(up.length, 1)
  assert.ok(Math.abs(up[0].from.getTime() - Date.parse('2026-11-17T13:16:30Z')) < 60_000)
  assert.ok(Math.abs(up[0].to.getTime() - Date.parse('2026-11-17T23:32:30Z')) < 60_000)
})

check('full Moon (November 24th): none of true night is Moon-free', () => {
  const n = night(RG1, '2026-11-24')
  assert.equal(n.moonFreeMs, 0)
  assert.ok(n.moonLit > 0.99)
})

check('Moon-free time is never more than the dark stretch, and never negative, for a year', () => {
  for (const n of nights(RG1, '2026-11-09', 365)) assert.ok(n.moonFreeMs >= 0 && n.moonFreeMs <= n.darkMs, n.date)
})

check('Reading has no true night from May 23rd to July 19th 2027 (as Lightreader), and falls back to very dark', () => {
  const all = nights(RG1, '2027-05-15', 75)
  const without = all.filter((n) => n.darkest?.kind !== 'true night')
  assert.equal(without[0].date, '2027-05-23')
  assert.equal(without[without.length - 1].date, '2027-07-19')
  assert.equal(without.length, 58)
  assert.ok(without.every((n) => n.darkest?.kind === 'very dark'))
})

check('further north the fallback goes one step more: Edinburgh and Lerwick only reach "dark" on June 21st', () => {
  assert.equal(night(EH1, '2027-06-21').darkest!.kind, 'dark')
  const lerwick = night(ZE1, '2027-06-21')
  assert.equal(lerwick.darkest!.kind, 'dark')
  assert.equal(hm(lerwick.darkMs), '1h 21m')
})

check('the Moon as it looks: first quarter is half lit, bright edge down to the right in the evening', () => {
  const look = moonLook(RG1, new Date('2026-11-17T18:25:00Z'))
  assert.equal(look.phase, 'First quarter')
  assert.ok(Math.abs(look.lit - 0.53) < 0.01)
  assert.ok(look.tilt < -90 && look.tilt > -130, String(look.tilt))
})

check('the in-view rule: two heights, and a darker sky for fainter planets', () => {
  assert.deepEqual([WELL, LOW], [20, 10])
  assert.deepEqual([-4.6, -2.1, 0.4, 1.9].map(sunDepthNeeded), [3, 4.5, 6, 9])
  assert.deepEqual([40, 54, 12, 4].map(fists), [4, 5.5, 1, 0.5])
})

check('Reading tonight: Saturn well placed in the south, Venus only low, Mercury and the Moon not in view', () => {
  const s = Object.fromEntries(sky(RG1, '2026-11-09').map((b) => [b.name, b]))
  assert.equal(s.Saturn.level, 'well')
  assert.equal(`${clock(s.Saturn.best!.at)} ${Math.round(s.Saturn.best!.altitude)}`, '21:24 40')
  assert.equal(`${clock(s.Saturn.wellPlaced[0].from)} ${clock(s.Saturn.wellPlaced[0].to)}`, '17:32 01:16')
  assert.equal(s.Venus.level, 'low')
  assert.equal(s.Mars.level, 'well')
  assert.equal(s.Jupiter.level, 'well')
  assert.equal(s.Mercury.why, 'too close to the Sun')
  assert.equal(s.Moon.why, 'below the horizon all night')
})

check('the same planets stand lower from Lerwick', () => {
  const s = Object.fromEntries(sky(ZE1, '2026-11-09').map((b) => [b.name, b]))
  assert.equal(Math.round(s.Saturn.best!.altitude), 31)
  assert.equal(s.Venus.level, 'low')
})

check('looking ahead from Reading: phases, eclipses and oppositions', () => {
  const from = new Date('2026-11-09T12:00:00Z')
  const phases = moonPhases(from, 2)
  assert.equal(`${phases[1].phase} ${ukParts(phases[1].at).date} ${clock(phases[1].at)}`, 'Full Moon 2026-11-24 14:54')
  const sun = solarEclipses(RG1, from, 1)[0]
  assert.equal(`${ukParts(sun.peak).date} ${clock(sun.begin)} ${clock(sun.peak)} ${clock(sun.end)} ${Math.round(sun.covered * 100)}`, '2027-08-02 09:03 09:59 10:58 42')
  const moon = lunarEclipses(RG1, from, 3)
  assert.deepEqual(moon.map((e) => `${e.kind} ${ukParts(e.peak).date}`), ['partial 2028-01-12', 'total 2028-12-31', 'total 2029-06-26'])
  assert.deepEqual(oppositions(from).map((o) => `${o.name} ${ukParts(o.at).date}`), ['Jupiter 2027-02-11', 'Mars 2027-02-19', 'Saturn 2027-10-18'])
})

check('meteor showers fall on their usual dates, each with its night', () => {
  const m = Object.fromEntries(meteorShowers(RG1, new Date('2026-11-09T12:00:00Z')).map((s) => [s.name, s]))
  assert.equal(ukParts(m.Geminids.peak).date, '2026-12-14')
  assert.equal(m.Geminids.night.date, '2026-12-13')
  assert.equal(hm(m.Geminids.night.moonFreeMs), '9h 52m')
  assert.equal(ukParts(m.Perseids.peak).date, '2027-08-12')
  assert.equal(ukParts(m.Quadrantids.peak).date, '2027-01-03')
  assert.equal(m.Ursids.night.moonFreeMs, 0)
})

check('directions name real places across Great Britain, never your own place', () => {
  // Saturn at its highest tonight, due south
  assert.equal(describeToward(RG1, 181.7, 'Reading'), ', between Bordon and Alton (near Hook)')
  assert.ok(!describeToward(RG1, 0, 'Reading').includes('Reading'))
  assert.match(describeToward(EH1, 250, 'Edinburgh'), /between|roughly over/)
  assert.equal(describeToward(ZE1, 90, 'Lerwick'), '') // east of Lerwick is the sea
})

console.log(`\n${passed} checks passed`)
