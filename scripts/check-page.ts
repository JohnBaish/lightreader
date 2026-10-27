// `npm run check`, third part: the page's own logic (PLAN stages 3 to 5): the sky ribbon's
// stretches and labels, the postcode box, Compare, "Is it light at…?" and the year.
// Places are real postcode-district centres.

import assert from 'node:assert/strict'
import { bandAt, timeline } from '../src/lib/bands.ts'
import { district, outwardCode } from '../src/lib/postcode.ts'
import { clockNote, compareDate, comparePlace, readTarget } from '../src/lib/compare.ts'
import { headline } from '../src/lib/headline.ts'
import { lightAtYear, yearChanges } from '../src/lib/lightAtYear.ts'
import { makeContext } from '../src/lib/sentences/index.ts'
import { placeLabels, ribbon, spreadLabels } from '../src/lib/ribbon.ts'
import { dayFigures, daysFigures } from '../src/lib/sun.ts'
import { dayDetail, yearView } from '../src/lib/yearView.ts'

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

check('compare: what someone types, read as a date or a place', () => {
  const read = (s: string) => readTarget(s, RG1, '2026-10-27')
  assert.deepEqual(read('Christmas'), { kind: 'date', date: '2026-12-25' })
  assert.deepEqual(read('christmas day'), { kind: 'date', date: '2026-12-25' })
  assert.deepEqual(read('last Christmas'), { kind: 'date', date: '2025-12-25' })
  assert.deepEqual(read('last July 14th'), { kind: 'date', date: '2026-07-14' })
  assert.deepEqual(read('July 14th'), { kind: 'date', date: '2027-07-14' }) // a bare date means the next one
  assert.deepEqual(read('14/7'), { kind: 'date', date: '2027-07-14' }) // day before month
  assert.deepEqual(read('march 28'), { kind: 'date', date: '2027-03-28' }) // not March of the year 28
  assert.deepEqual(read('shortest day'), { kind: 'date', date: '2026-12-21' })
  assert.deepEqual(read('longest day'), { kind: 'date', date: '2027-06-21' })
  assert.equal((read('Aberdeen') as { name: string }).name, 'Aberdeen')
  assert.equal((read('tr18 1aa') as { name: string }).name, 'Penzance (TR18)')
  assert.equal(read('CF10').kind, 'error')
  assert.equal(read('Paris').kind, 'error')
  assert.equal(clockNote('2026-10-27', '2026-07-14'), "July times are in BST, an hour ahead of today's GMT.")
  assert.equal(clockNote('2027-06-21', '2026-12-25'), "December times are in GMT, an hour behind today's BST.")
  assert.equal(clockNote('2026-10-27', '2026-12-25'), null)
})

check("compare: the spec's three examples, with today's figures", () => {
  const here = dayFigures(RG1, '2026-10-27')
  assert.deepEqual(compareDate(here, dayFigures(RG1, '2026-12-25'), '2026-10-27'), [
    'On Friday December 25th the sun rises at 08:08, 1h 20m later than today.',
    'It sets at 15:59, 47m earlier.',
    'Half-light ends at 16:40, 41m earlier.',
    "That's 2h 7m less daylight: 7h 51m in all.",
  ])
  assert.deepEqual(compareDate(here, dayFigures(RG1, '2026-07-14'), '2026-10-27'), [
    'On Tuesday July 14th the sun rose at 05:03, 1h 45m earlier than today, and set at 21:15, 4h 29m later.',
    'Half-light ended at 22:00, 4h 39m later than today.',
    'There was 6h 14m more daylight: 16h 12m in all.',
    'There was no true night.',
  ])
  const ab = readTarget('Aberdeen', RG1, '2026-10-27') as { place: { latitude: number; longitude: number } }
  assert.deepEqual(comparePlace(here, dayFigures(ab.place, '2026-10-27'), 'Reading', 'Aberdeen', new Date('2026-10-27T09:02:00Z')), [
    'In Aberdeen today the sun rose at 07:08, 20m later than in Reading.',
    'It sets at 16:36, 11m earlier.',
    'Half-light ends at 17:16, 5m earlier.',
    "That's 31m less daylight: 9h 27m in all.",
  ])
})

check('is it light at…?: the strip agrees with the sentences, day by day', () => {
  const ctx = makeContext(RG1, 'Reading', new Date('2026-10-27T09:02:00Z'))
  const year = yearChanges(RG1, ctx.today)
  const at = lightAtYear(ctx, year, '17:30')
  assert.equal(at.today, 'dark')
  assert.deepEqual(at.sentences, ["It's dark at 17:30 until Monday February 1st.", 'The sun is up at 17:30 again from Monday February 22nd.'])
  const day = (date: string) => at.strip[Math.round((Date.parse(date) - Date.parse(at.from)) / 86_400_000)]
  const light = (b: string) => b === 'daylight' || b === 'half-light'
  assert.ok(!light(day('2027-02-01')))
  assert.ok(light(day('2027-02-02')))
  assert.notEqual(day('2027-02-21'), 'daylight')
  assert.equal(day('2027-02-22'), 'daylight')
  assert.equal(at.strip.length, 366)
  assert.equal(at.todayIndex, 183)
  const morning = lightAtYear(ctx, year, '07:30')
  assert.equal(morning.today, 'daylight')
  assert.ok(morning.strip.every(light)) // "07:30 is always at least half-light here"
})

check('the year: every day from midnight to midnight, agreeing with the tables', () => {
  const ctx = makeContext(RG1, 'Reading', new Date('2026-10-27T09:02:00Z'))
  const year = yearChanges(RG1, ctx.today, ctx)
  // The same changes, whether from the sentences' figures or worked out afresh.
  assert.deepEqual(year.changes, yearChanges(RG1, ctx.today).changes)
  const v = yearView(ctx, year.from, year.to, year.changes)
  assert.equal(v.ribbon.length, 366)
  assert.deepEqual(v.months.map((m) => m.month), ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04'])
  assert.equal(v.months[0].rows.length, 30)
  const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
  v.ribbon.forEach((day, i) => {
    assert.equal(day[0].from, 0)
    assert.equal(day.at(-1)!.to, 1440)
    for (let j = 1; j < day.length; j++) assert.equal(day[j].from, day[j - 1].to)
    // The daylight on the strip runs from the sunrise to the sunset in the table.
    const date = new Date(Date.parse(year.from) + i * 86_400_000).toISOString().slice(0, 10)
    const row = v.months.find((m) => date.startsWith(m.month))!.rows.find((r) => r.date === date)!
    const light = day.find((s) => s.band === 'daylight')!
    assert.equal(light.from, minutes(row.sunrise!), date)
    assert.equal(light.to, minutes(row.sunset!), date)
  })
  const oct = v.months.find((m) => m.month === '2026-10')!
  assert.deepEqual(oct.rows[26], { date: '2026-10-27', civilDawn: '06:14', sunrise: '06:48', sunset: '16:46', civilDusk: '17:21', nauticalDusk: '18:00', daylight: '9h 58m' })
  assert.equal(dayDetail(oct.rows[26]), '9h 58m of daylight. Half-light 06:14 to 17:21; very dark from 18:00.')
  assert.deepEqual(oct.clockMarks, [{ date: '2026-10-25', text: 'Clocks went back on Sunday October 25th. Times from here are GMT.' }])
  assert.deepEqual(v.months.find((m) => m.month === '2027-03')!.clockMarks, [{ date: '2027-03-28', text: 'Clocks go forward on Sunday March 28th. Times from here are BST.' }])
  // May 20th: true night begins after midnight (SPEC §9's "to check").
  assert.deepEqual(v.ribbon[23].slice(0, 2), [{ from: 0, to: 17, band: 'very-dark' }, { from: 17, to: 103, band: 'true-night' }])
  // Berwick at midsummer: it never gets very dark, and the page says so (rule E).
  const td15 = district('TD15')!
  const far = makeContext(td15, 'Berwick-upon-Tweed', new Date('2026-10-27T09:02:00Z'))
  const fy = yearChanges(td15, far.today, far)
  const june21 = yearView(far, fy.from, fy.to, fy.changes).months[2].rows[20]
  assert.equal(june21.nauticalDusk, null)
  assert.equal(dayDetail(june21), '17h 33m of daylight. Half-light 03:22 to 22:58; the sky never gets very dark.')
})

console.log(`\n${passed} checks passed`)
