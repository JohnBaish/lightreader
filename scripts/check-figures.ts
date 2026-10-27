// `npm run check`: the figures (src/lib/sun.ts, bands.ts, format.ts, year.ts) and the
// postcode list (src/data/outcodes.json). Places are real postcode-district centres; the
// expected times were worked out with Astronomy Engine 2.1.19 on 27 October 2026 and
// compared with the spec's examples and MET Norway (design/figures-sheet-2026-10-27.md),
// so a change of library version or of the rules shows up here.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bandAt, bandForAltitude, timeline } from '../src/lib/bands.ts'
import { clock, compassPoint, duration, longDate, ordinal, roundToMinute, shownMinutes } from '../src/lib/format.ts'
import { dayFigures, daylight, daysFigures, sunPosition, type Place } from '../src/lib/sun.ts'
import { addMonths, yearFigures } from '../src/lib/year.ts'
import { fromBritishGrid, toBritishGrid } from './lib/grid.ts'

let passed = 0
function check(name: string, fn: () => void) {
  fn()
  passed++
  console.log(`ok  ${name}`)
}

const outcodes = JSON.parse(readFileSync('src/data/outcodes.json', 'utf8')) as {
  credits: string[]
  outcodes: Record<string, [number, number, string]>
}
const place = (code: string): Place => {
  const [latitude, longitude] = outcodes.outcodes[code]
  return { latitude, longitude }
}
const RG1 = place('RG1')
const at = (iso: string) => new Date(iso)
/** Seconds between two instants. */
const gap = (a: Date | null, b: Date) => Math.abs(a!.getTime() - b.getTime()) / 1000

check('times: 24-hour UK clock time, rounded to the nearest minute (half a minute rounds up)', () => {
  assert.equal(clock(at('2026-10-27T06:48:29.999Z')), '06:48')
  assert.equal(clock(at('2026-10-27T06:48:30Z')), '06:49')
  assert.equal(clock(at('2026-07-14T20:15:27Z')), '21:15') // BST
  assert.equal(clock(at('2026-10-27T23:59:30Z')), '00:00')
  assert.equal(roundToMinute(at('2026-10-27T23:59:30Z')).toISOString(), '2026-10-28T00:00:00.000Z')
  assert.equal(shownMinutes(at('2026-10-27T06:48:22Z')), 6 * 60 + 48)
  // Sunday October 25th 2026: 00:59:59 BST is 23:59:59Z; 01:00 GMT comes an hour later.
  assert.equal(clock(at('2026-10-25T00:30:00Z')), '01:30')
  assert.equal(clock(at('2026-10-25T01:30:00Z')), '01:30')
})

check('dates: "Tuesday October 27th", with the year only when asked', () => {
  assert.equal(longDate('2026-10-27'), 'Tuesday October 27th')
  assert.equal(longDate('2026-12-25', true), 'Friday December 25th 2026')
  assert.equal(longDate('2027-02-02'), 'Tuesday February 2nd')
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 31].map(ordinal),
    ['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '31st'])
})

check('durations: "1h 20m", "47m", "2h", "less than a minute"', () => {
  const m = 60_000
  assert.equal(duration(80 * m), '1h 20m')
  assert.equal(duration(47 * m), '47m')
  assert.equal(duration(120 * m), '2h')
  assert.equal(duration(119.6 * m), '2h') // rounds to 120 minutes
  assert.equal(duration(59_999), 'less than a minute')
  assert.equal(duration(60_000), '1m')
  assert.equal(duration(-47 * m), '47m') // the sentence says which way
})

check('compass: 16 points', () => {
  assert.equal(compassPoint(109.72), 'east-south-east')
  assert.equal(compassPoint(250.04), 'west-south-west')
  assert.equal(compassPoint(48.97), 'north-east')
  assert.equal(compassPoint(359), 'north')
  assert.equal(compassPoint(11.24), 'north')
  assert.equal(compassPoint(11.26), 'north-north-east')
})

check('Reading (RG1), Tuesday October 27th 2026: every event, to the second', () => {
  const d = dayFigures(RG1, '2026-10-27')
  const expect: [keyof typeof d, string][] = [
    ['astronomicalDawn', '2026-10-27T04:56:03Z'], ['nauticalDawn', '2026-10-27T05:34:39Z'],
    ['civilDawn', '2026-10-27T06:13:45Z'], ['sunrise', '2026-10-27T06:48:22Z'], ['noon', '2026-10-27T11:47:44Z'],
    ['sunset', '2026-10-27T16:46:21Z'], ['civilDusk', '2026-10-27T17:20:56Z'], ['nauticalDusk', '2026-10-27T17:59:58Z'],
    ['astronomicalDusk', '2026-10-27T18:38:29Z'],
  ]
  for (const [k, iso] of expect) assert.ok(gap(d[k] as Date, at(iso)) < 1, `${k}: ${(d[k] as Date).toISOString()}`)
  // The spec's own Astronomy Engine figures (SPEC §3), from a slightly different point.
  assert.ok(gap(d.sunrise, at('2026-10-27T06:48:23Z')) < 2)
  assert.equal(clock(d.sunrise!), '06:48')
  assert.equal(clock(d.sunset!), '16:46')
  assert.equal(duration(daylight(d)), '9h 58m')
  assert.equal(compassPoint(d.sunriseAzimuth!), 'east-south-east')
  assert.equal(compassPoint(d.sunsetAzimuth!), 'west-south-west')
})

check('Reading, Saturday December 12th 2026: sunset 15:54:58, as the spec found (15:54:59)', () => {
  const d = dayFigures(RG1, '2026-12-12')
  assert.ok(gap(d.sunset, at('2026-12-12T15:54:59Z')) < 2)
  assert.equal(clock(d.sunset!), '15:55')
})

check('the sunrise rule puts the sun\'s centre 0.833° below the horizon, within 0.005°', () => {
  for (const date of ['2026-10-27', '2026-12-21', '2027-03-20', '2027-06-21']) {
    const d = dayFigures(RG1, date)
    for (const t of [d.sunrise!, d.sunset!]) assert.ok(Math.abs(sunPosition(RG1, t).altitude + 0.833) < 0.005, date)
  }
})

check('rule E: no true night in midsummer, and no error; further north, no "very dark" either', () => {
  const reading = dayFigures(RG1, '2027-06-21')
  assert.equal(reading.astronomicalDusk, null)
  assert.equal(reading.astronomicalDawn, null)
  assert.notEqual(reading.nauticalDusk, null)
  const berwick = dayFigures(place('TD15'), '2027-06-21')
  assert.equal(berwick.nauticalDusk, null)
  assert.notEqual(berwick.civilDusk, null)
  // A test point at 62°N (not a place Lightreader offers): half-light all night.
  const north = dayFigures({ latitude: 62, longitude: -1 }, '2027-06-21')
  assert.equal(north.civilDusk, null)
  assert.notEqual(north.sunset, null)
})

check('"tonight" belongs to the evening it starts: a true night starting after midnight in May', () => {
  // In Reading, true night's start reaches midnight in May; it stays with the evening.
  const days = daysFigures(RG1, '2027-05-01', '2027-05-20')
  const late = days.find((d) => d.astronomicalDusk && d.astronomicalDusk.getTime() > Date.parse(d.date + 'T23:00:00Z'))
  assert.ok(late, 'a true night that starts after midnight BST')
  assert.ok(late.astronomicalDusk!.getTime() < late.midnight.getTime())
})

check('clock changes: sunrise moves an hour by the clock on Sunday October 25th 2026, sunset on Sunday March 28th 2027', () => {
  const [sat, sun] = daysFigures(RG1, '2026-10-24', '2026-10-25')
  assert.equal(clock(sat.sunrise!), '07:43')
  assert.equal(clock(sun.sunrise!), '06:45')
  const [before, after] = daysFigures(RG1, '2027-03-27', '2027-03-28')
  assert.equal(clock(before.sunset!), '18:28')
  assert.equal(clock(after.sunset!), '19:30')
})

check('bands: bandAt agrees with the sun\'s altitude all year, except within five seconds of a change', () => {
  const year = yearFigures(RG1, '2026-10-27')
  const times = year.changes.map((c) => c.at.getTime())
  let compared = 0
  const start = Date.parse(year.from + 'T12:00:00Z')
  const end = Date.parse(year.to + 'T12:00:00Z')
  for (let t = start; t < end; t += 7 * 60_000 + 13_000) {
    if (times.some((c) => Math.abs(c - t) < 5000)) continue
    assert.equal(bandAt(year.changes, new Date(t)), bandForAltitude(sunPosition(RG1, new Date(t)).altitude), new Date(t).toISOString())
    compared++
  }
  assert.ok(compared > 70_000)
})

check('bands: a midsummer night goes from very dark back to dark, with no true night', () => {
  const changes = timeline(daysFigures(RG1, '2027-06-20', '2027-06-22'))
  assert.equal(bandAt(changes, at('2027-06-21T23:30:00Z')), 'very-dark')
  assert.ok(!changes.some((c) => c.band === 'true-night'))
})

check('the year: six months back to six ahead, every day once', () => {
  assert.equal(addMonths('2026-10-27', -6), '2026-04-27')
  assert.equal(addMonths('2026-10-27', 6), '2027-04-27')
  assert.equal(addMonths('2026-08-31', 6), '2027-02-28')
  assert.equal(addMonths('2027-08-31', 6), '2028-02-29')
  const year = yearFigures(RG1, '2026-10-27')
  assert.equal(year.days.length, 366)
  assert.equal(year.days[0].date, '2026-04-27')
  assert.equal(year.days.at(-1)!.date, '2027-04-27')
  for (let i = 1; i < year.days.length; i++) {
    assert.ok(year.days[i].date > year.days[i - 1].date)
    assert.ok(year.days[i].noon.getTime() - year.days[i - 1].noon.getTime() < 86_400_000 + 60_000)
  }
})

check('postcode districts: 2,210 in England, converted from the National Grid to within a metre', () => {
  const codes = Object.keys(outcodes.outcodes)
  assert.equal(codes.length, 2210)
  assert.ok(outcodes.credits.length === 3 && outcodes.credits[0].startsWith('Contains OS data'))
  for (const code of codes) {
    const [lat, lon] = outcodes.outcodes[code]
    assert.ok(lat > 49.8 && lat < 55.9 && lon > -6.5 && lon < 1.8, code)
  }
  // fromBritishGrid undoes toBritishGrid
  for (const [e, n] of [[471682, 173031], [146900, 30500], [400000, 650000], [630000, 310000]]) {
    const g = fromBritishGrid(e, n)
    const back = toBritishGrid(g.latitude, g.longitude)
    assert.ok(Math.hypot(back.easting - e, back.northing - n) < 1, `${e},${n}`)
  }
})

console.log(`\n${passed} checks passed`)
