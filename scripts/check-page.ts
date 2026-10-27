// `npm run check`, third part: the page's own logic (PLAN stage 3): the sky ribbon's
// stretches and labels, and the postcode box. Places are real postcode-district centres.

import assert from 'node:assert/strict'
import { bandAt, timeline } from '../src/lib/bands.ts'
import { district, outwardCode } from '../src/lib/postcode.ts'
import { headline } from '../src/lib/headline.ts'
import { placeLabels, ribbon, spreadLabels } from '../src/lib/ribbon.ts'
import { daysFigures } from '../src/lib/sun.ts'

let passed = 0
function check(name: string, fn: () => void) {
  fn()
  passed++
  console.log(`ok  ${name}`)
}

const RG1 = district('RG1')!

check('the ribbon covers the next 24 hours exactly, band by band, as bandAt says', () => {
  for (const iso of ['2026-10-27T09:02:00Z', '2026-12-21T15:40:00Z', '2027-06-21T21:30:00Z', '2027-03-28T04:30:00Z']) {
    const now = new Date(iso)
    const r = ribbon(RG1, now)
    assert.equal(r.segments[0].from.getTime(), now.getTime())
    assert.equal(r.segments.at(-1)!.to.getTime(), now.getTime() + 24 * 3_600_000)
    for (let i = 1; i < r.segments.length; i++) assert.equal(r.segments[i].from.getTime(), r.segments[i - 1].to.getTime())
    const changes = timeline(daysFigures(RG1, '2026-10-01', '2027-07-01'))
    for (const s of r.segments) {
      const mid = new Date((s.from.getTime() + s.to.getTime()) / 2)
      assert.equal(s.band, bandAt(changes, mid), `${iso} at ${mid.toISOString()}`)
    }
  }
})

check("the ribbon for Reading at 09:02 today: the mock-up's ticks, with the stage 1 times", () => {
  const r = ribbon(RG1, new Date('2026-10-27T09:02:00Z'))
  const shown = r.ticks.map((t) => `${t.at.toISOString().slice(11, 16)} ${t.label}`)
  assert.deepEqual(shown, [
    '11:47 Sun highest', '16:46 Sunset', '17:20 Dark', '17:59 Very dark', '18:38 True night',
    '04:57 Very dark', '05:36 Dark', '06:15 Half-light', '06:50 Sunrise',
  ]) // UTC, to the minute down; shown on the page as 11:48, 17:21, 18:00, 04:58 …
  assert.equal(r.midnight?.day, 'Wed')
})

check('labels: none overlap, and a far-row line never crosses a near-row label', () => {
  // A winter evening in Reading, the most crowded case, at a computer width.
  const r = ribbon(RG1, new Date('2026-12-21T15:40:00Z'))
  const width = 950
  const marks = r.ticks.map((t) => ((t.at.getTime() - r.from.getTime()) / (24 * 3_600_000)) * width)
  const spans = marks.map((x): [number, number] => [x - 30, x + 30])
  const place = placeLabels(spans, marks)
  for (let i = 0; i < spans.length; i++) {
    for (let j = i + 1; j < spans.length; j++) {
      if (place[i].side === place[j].side && place[i].row === place[j].row) {
        assert.ok(spans[i][1] <= spans[j][0] || spans[j][1] <= spans[i][0], `${i} and ${j} overlap`)
      }
      for (const [far, near] of [[i, j], [j, i]]) {
        if (place[far].side === place[near].side && place[far].row === 1 && place[near].row === 0) {
          assert.ok(marks[far] < spans[near][0] || marks[far] > spans[near][1], `${far}'s line crosses ${near}`)
        }
      }
    }
  }
  assert.deepEqual(spreadLabels([0, 5, 6, 100], 21), [-10.5, 10.5, 31.5, 89.5])
})

check('the postcode box: the first half of anything typed, England only', () => {
  assert.equal(outwardCode('rg1 8fr'), 'RG1')
  assert.equal(outwardCode(' RG47HN '), 'RG4')
  assert.equal(outwardCode('sw1a'), 'SW1A')
  assert.equal(outwardCode('reading'), null)
  assert.equal(district('RG1')?.name, 'Reading')
  assert.equal(district('CF10'), null) // Cardiff: not in England
})

check('the top of the page: today\'s sunrise and sunset until the sun is highest, then sunset and tomorrow\'s sunrise', () => {
  const [today, tomorrow] = daysFigures(RG1, '2026-10-27', '2026-10-28')
  assert.deepEqual(headline(new Date('2026-10-27T09:02:00Z'), today, tomorrow), [
    { kicker: 'Today · Tuesday October 27th', items: [{ label: 'Sunrise', time: '06:48' }, { label: 'Sunset', time: '16:46' }] },
  ])
  // The sun is highest at 11:47:44 UTC (GMT).
  const after = [
    { kicker: "Today's sunset · Tuesday October 27th", items: [{ label: 'Sunset', time: '16:46' }] },
    { kicker: "Tomorrow's sunrise · Wednesday October 28th", items: [{ label: 'Sunrise', time: '06:50' }] },
  ]
  assert.deepEqual(headline(new Date('2026-10-27T11:48:00Z'), today, tomorrow), after)
  assert.deepEqual(headline(new Date('2026-10-27T22:00:00Z'), today, tomorrow), after)
  assert.equal(headline(new Date('2026-10-27T11:47:00Z'), today, tomorrow).length, 1)
})

console.log(`\n${passed} checks passed`)
