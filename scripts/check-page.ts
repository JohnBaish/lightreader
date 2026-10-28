// `npm run check`, third part: the page's own logic (PLAN stages 3 to 5): the sky ribbon's
// stretches and labels, the postcode box, Compare, "Is it light at…?" and the year.
// Places are real postcode-district centres.

import assert from 'node:assert/strict'
import { bandAt, timeline } from '../src/lib/bands.ts'
import { district, outwardCode } from '../src/lib/postcode.ts'
import { addComparison } from '../src/lib/comparisons.ts'
import { clockNote, compareDate, comparePlace, readTarget } from '../src/lib/compare.ts'
import { headline } from '../src/lib/headline.ts'
import { lightAtYear, yearChanges } from '../src/lib/lightAtYear.ts'
import { makeContext } from '../src/lib/sentences/index.ts'
import { placeLabels, ribbon, spreadLabels, nowLight } from '../src/lib/ribbon.ts'
import { dayFigures, daysFigures } from '../src/lib/sun.ts'
import { dayDetail, yearView } from '../src/lib/yearView.ts'
import { describeToward, townsBetween } from '../src/lib/towns.ts'
import { arrange, bestSplit } from '../src/lib/layout.ts'
import { pace, rate } from '../src/lib/pace.ts'
import { addMonths } from '../src/lib/year.ts'

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

check('the top of the page: today\'s sunrise and sunset until sunset, then its sunset and tomorrow\'s sunrise, then once dark tomorrow\'s sunrise and sunset', () => {
  const [today, tomorrow] = daysFigures(RG1, '2026-10-27', '2026-10-28')
  const before = [
    { kicker: 'Today · Tuesday October 27th', items: [{ label: 'Sunrise', time: '06:48' }, { label: 'Sunset', time: '16:46' }] },
  ]
  assert.deepEqual(headline(new Date('2026-10-27T09:02:00Z'), today, tomorrow), before)
  // Sunset is 16:46:21 GMT, shown 16:46 (John, 28 October: from sunset, not once the sun is highest).
  assert.deepEqual(headline(new Date('2026-10-27T11:48:00Z'), today, tomorrow), before)
  assert.deepEqual(headline(new Date('2026-10-27T16:45:00Z'), today, tomorrow), before)
  const after = [
    { kicker: "Today's sunset · Tuesday October 27th", items: [{ label: 'Sunset', time: '16:46' }] },
    { kicker: "Tomorrow's sunrise · Wednesday October 28th", items: [{ label: 'Sunrise', time: '06:50' }] },
  ]
  assert.deepEqual(headline(new Date('2026-10-27T16:46:00Z'), today, tomorrow), after)
  // Half-light ends at 17:20:56, shown as 17:21: from then, tomorrow's sunrise and sunset.
  assert.deepEqual(headline(new Date('2026-10-27T17:20:00Z'), today, tomorrow), after)
  const dark = [{ kicker: 'Tomorrow · Wednesday October 28th', items: [{ label: 'Sunrise', time: '06:50' }, { label: 'Sunset', time: '16:44' }] }]
  assert.deepEqual(headline(new Date('2026-10-27T17:21:00Z'), today, tomorrow), dark)
  assert.deepEqual(headline(new Date('2026-10-27T22:00:00Z'), today, tomorrow), dark)
})

check('the light now and how long it has left, beside "Now" (John, 28 October)', () => {
  const at = (iso: string) => nowLight(ribbon(district('RG4')!, new Date(iso)))
  // Half-light begins at 06:15:27 (shown 06:15); sunset 16:44:22; very dark ends 04:59:12.
  assert.deepEqual(at('2026-10-28T05:46:00Z'), { band: 'Dark', left: '29m left' })
  assert.deepEqual(at('2026-10-28T13:00:00Z'), { band: 'Light', left: '3h\u00a044m left' })
  assert.deepEqual(at('2026-10-28T20:00:00Z'), { band: 'True night', left: '8h\u00a059m left' })
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
    'On Friday December 25th the sun rises at 08:08, 1h\u00a020m later than today.',
    'It sets at 15:59, 47m earlier.',
    'Half-light ends at 16:40, 41m earlier.',
    "That's 2h\u00a07m less daylight: 7h\u00a051m in all.",
  ])
  assert.deepEqual(compareDate(here, dayFigures(RG1, '2026-07-14'), '2026-10-27'), [
    'On Tuesday July 14th the sun rose at 05:03, 1h\u00a045m earlier than today, and set at 21:15, 4h\u00a029m later.',
    'Half-light ended at 22:00, 4h\u00a039m later than today.',
    'There was 6h\u00a014m more daylight: 16h\u00a012m in all.',
    'There was no true night.',
  ])
  const ab = readTarget('Aberdeen', RG1, '2026-10-27') as { place: { latitude: number; longitude: number } }
  assert.deepEqual(comparePlace(here, dayFigures(ab.place, '2026-10-27'), 'Reading', 'Aberdeen', new Date('2026-10-27T09:02:00Z')), [
    'In Aberdeen today the sun rose at 07:08, 20m later than in Reading.',
    'It sets at 16:36, 11m earlier.',
    'Half-light ends at 17:16, 5m earlier.',
    "That's 31m less daylight: 9h\u00a027m in all.",
  ])
})

check('compare: saved comparisons read back as they were added', () => {
  const tr18 = readTarget('tr18', RG1, '2026-10-27')
  assert.equal(tr18.kind === 'place' && tr18.name, 'Penzance (TR18)')
  const again = readTarget('Penzance (TR18)', RG1, '2026-10-27')
  assert.equal(again.kind === 'place' && again.name, 'Penzance (TR18)')
  assert.deepEqual(addComparison(['Christmas'], '  christmas '), ['Christmas'])
  assert.deepEqual(addComparison(['Christmas'], 'last  july 14th'), ['Christmas', 'Last july 14th'])
  const last = readTarget('Last july 14th', RG1, '2026-10-27')
  assert.equal(last.kind === 'date' && last.date, '2026-07-14')
})

check('directions: between two towns, roughly over one, or the compass point alone', () => {
  const rg1 = dayFigures(RG1, '2026-10-27')
  assert.equal(describeToward(RG1, rg1.sunriseAzimuth!, 'Reading'), ', between Bracknell and Wokingham (near Bagshot)')
  assert.equal(describeToward(RG1, rg1.sunsetAzimuth!, 'Reading'), ', roughly over Thatcham')
  // Brighton's sunset is over the sea.
  const bn1 = district('BN1')!
  assert.equal(describeToward(bn1, dayFigures(bn1, '2026-10-27').sunsetAzimuth!, 'Brighton'), '')
  // The visitor's own place is never named.
  const b = townsBetween(RG1, rg1.sunriseAzimuth!, 'Bracknell')!
  assert.ok(b.left.name !== 'Bracknell' && b.right.name !== 'Bracknell')
})

check('is it light at…?: the strip agrees with the sentences, day by day', () => {
  const ctx = makeContext(RG1, 'Reading', new Date('2026-10-27T09:02:00Z'))
  const year = yearChanges(RG1, ctx.today)
  const at = lightAtYear(ctx, year, '17:30')
  assert.equal(at.today, 'dark')
  assert.deepEqual(at.sentences, ['Half-light lasts past 17:30 from February 2nd.', 'The sun is up at 17:30 again from February 22nd.'])
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
  assert.deepEqual(oct.rows[26], { date: '2026-10-27', civilDawn: '06:14', sunrise: '06:48', sunset: '16:46', civilDusk: '17:21', nauticalDusk: '18:00', daylight: '9h\u00a058m' })
  assert.equal(dayDetail(oct.rows[26]), '9h\u00a058m of daylight. Half-light 06:14 to 17:21; very dark from 18:00.')
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
  assert.equal(dayDetail(june21), '17h\u00a033m of daylight. Half-light 03:22 to 22:58; the sky never gets very dark.')
})

check('fresh look: names for every district; "last Friday"; towns by postcode (28 October)', () => {
  assert.equal(district('TR22')!.name, 'St Agnes')
  assert.equal(district('MK20')!.name, 'Newport Pagnell')
  assert.equal(district('SO97')!.name, 'Southampton')
  assert.equal(district('HR3')!.name, 'Hay-on-Wye')
  assert.equal(district('TR19')!.name, 'St Just')
  const t = (typed: string) => readTarget(typed, RG1, '2026-10-27')
  assert.deepEqual(t('last friday'), { kind: 'date', date: '2026-10-23' })
  assert.deepEqual(t('Last friday'), { kind: 'date', date: '2026-10-23' })
  assert.deepEqual(t('last july 14th'), { kind: 'date', date: '2026-07-14' })
  assert.deepEqual(t('25.12'), { kind: 'date', date: '2026-12-25' })
  assert.deepEqual(t('14-7-2027'), { kind: 'date', date: '2027-07-14' })
  const reading = t('Reading')
  assert.ok(reading.kind === 'error' && reading.message.includes('type its postcode'))
})

check('the sentence cards split into two even columns, in order (John, 28 October)', () => {
  // Today, This fortnight and Records on the left; the tall Looking ahead on the right.
  assert.deepEqual(arrange([176, 176, 122, 420], 16), { split: 3, lastWide: false })
  assert.deepEqual(arrange([100, 100], 16), { split: 1, lastWide: false })
  // Darkness and Across the UK side by side, Direction across the foot: 70 empty beside
  // Darkness, against 185 beside Direction in columns.
  assert.deepEqual(arrange([122, 192, 145], 16), { split: 1, lastWide: true })
  assert.deepEqual(bestSplit([122, 192, 145], 16), { split: 2, empty: 185 })
})

check('pace of change: the day\'s change, the next week, and the fastest, past or to come (John, 28 October)', () => {
  const at = (iso: string) => {
    const ctx = makeContext(district('RG4')!, 'Caversham', new Date(iso + 'T12:00:00Z'))
    return pace(ctx, addMonths(iso, -6), addMonths(iso, 6))
  }
  const now = at('2026-10-28')
  assert.equal(now.rows.length, 366)
  assert.equal(rate(now.rows.find((r) => r.date === '2026-10-28')!.change), '3m\u00a040s') // 219.8 s
  // The fastest shrinking (234.5 s, September 24th to 26th) has passed, so it was; then spring's
  // fastest growing (238.2 s, March 18th and 19th; checked separately with SearchRiseSet).
  assert.deepEqual(now.sentences, [
    'Daylight is reducing by 3m\u00a040s a day, and by 4.2% (25m) over the next week.',
    'The most it reduces is 3m\u00a054s a day, which happened this year around September 25th.',
    'It will increase fastest around March 18th, by 3m\u00a058s a day.',
  ])
  assert.deepEqual(at('2026-09-01').sentences.slice(1), ['The most it reduces in a year is 3m\u00a054s a day, around September 25th.'])
  assert.deepEqual(at('2026-12-25').sentences, [
    'Daylight is increasing by 20s a day, and by 1.1% (5m) over the next week.',
    'The most it increases in a year is 3m\u00a058s a day, around March 18th.',
  ])
})

console.log(`\n${passed} checks passed`)
