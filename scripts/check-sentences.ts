// `npm run check`, second part: the sentence groups (src/lib/sentences/, PLAN stage 2).
// Places are real postcode-district centres; the expected sentences were worked out with
// the stage 1 figures (design/figures-sheet-2026-10-27.md) and read through by hand.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { allGroups, makeContext } from '../src/lib/sentences/index.ts'
import { acrossUkSentences } from '../src/lib/sentences/acrossUk.ts'
import { comingUpSentences } from '../src/lib/sentences/comingUp.ts'
import { darknessSentences } from '../src/lib/sentences/darkness.ts'
import { fortnightSentences } from '../src/lib/sentences/fortnight.ts'
import { lightAtSentences } from '../src/lib/sentences/lightAt.ts'
import { recordSentences } from '../src/lib/sentences/records.ts'
import { rateSentence, todaySentences } from '../src/lib/sentences/today.ts'
import { dayIn, daysIn, looseMinutes, plainText, sentenceParts } from '../src/lib/sentences/words.ts'

let passed = 0
function check(name: string, fn: () => void) {
  fn()
  passed++
  console.log(`ok  ${name}`)
}

const outcodes = JSON.parse(readFileSync('src/data/outcodes.json', 'utf8')) as { outcodes: Record<string, [number, number, string]> }
const ctxFor = (code: string, iso: string) => {
  const [latitude, longitude, name] = outcodes.outcodes[code]
  return makeContext({ latitude, longitude }, name, new Date(iso))
}

check('Reading, Tuesday October 27th 2026 at 09:02: every group', () => {
  const groups = allGroups(ctxFor('RG1', '2026-10-27T09:02:00Z'), ['07:30', '17:30'])
  assert.deepEqual(groups, [
    { heading: 'Today', sentences: [
      'Sunrise 06:48, sunset 16:46.',
      '9h\u00a058m of daylight.',
      'Days are shortening by nearly 4m a day, close to the fastest they ever change.',
    ] },
    { heading: 'This fortnight', sentences: [
      'A week ago, before the clocks went back, the sun rose at 07:36 (48m later) and set at 18:00 (1h\u00a014m later). Days were 26m longer.',
      'Next Tuesday the sun rises at 07:01 (12m later) and sets at 16:33 (13m earlier).',
    ] },
    { heading: 'Looking back', sentences: [
      'The earliest sunset since January 28th.',
      "Today's daylight matches February 14th's.",
    ] },
    { heading: 'Looking ahead', sentences: [
      'The sun rises after 07:00 from November 3rd to February 23rd.',
      'The sun sets before 16:00 from November 30th to December 25th.',
      'Earliest sunset: 15:55, every day from December 9th to December 16th. Within that period, the very earliest are on December 12th and December 13th, a fraction of a second apart.',
      'Shortest day: December 21st, 55 days from now, with 7h\u00a050m of daylight, 2h\u00a08m less than today.',
      'Latest sunrise: 08:09, every day from December 26th to January 4th. Within that period, the very latest are on December 30th and December 31st, a fraction of a second apart.',
      'Spring equinox: March 20th, 144 days from now.',
    ] },
    { heading: 'Is it light at 07:30?', sentences: [
      '07:30 is always at least half-light here. Even on the darkest mornings, December 31st and January 1st, half-light starts at 07:29.',
      'The sun is up by 07:30 until November 20th.',
    ] },
    { heading: 'Is it light at 17:30?', sentences: [
      'Half-light lasts past 17:30 from February 2nd.',
      'The sun is up at 17:30 again from February 22nd.',
    ] },
    { heading: 'Darkness', sentences: [
      'Very dark or true night from 18:00 to 05:36 (11h\u00a036m).',
      "Tonight's true night lasts 10h\u00a019m.",
    ] },
    { heading: 'Across the UK', sentences: [
      "There's an early sunset today in Norwich at 16:35 (16:21 in Lerwick), and a late one in Truro at 17:05 (17:08 in Penzance).",
      'Reading gets 33m more daylight than Inverness today, and 5m less than Truro.',
    ] },
    { heading: 'Direction of sunrise and sunset', sentences: [
      'The sun rises in the east-south-east, between Bracknell and Wokingham (near Bagshot).',
      'It sets in the west-south-west, roughly over Thatcham.',
    ] },
  ])
})

check('the rate of change, worded loosely', () => {
  assert.equal(looseMinutes(221), 'nearly 4m')
  assert.equal(looseMinutes(185), 'about 3m')
  assert.equal(looseMinutes(200), 'more than 3m')
  assert.equal(looseMinutes(-45), 'less than a minute')
  assert.equal(rateSentence(ctxFor('RG1', '2026-12-21T10:00:00Z')), 'Today is the shortest day of the year: days start lengthening tomorrow.')
  assert.equal(rateSentence(ctxFor('RG1', '2026-12-18T10:00:00Z')), 'Days are shortening by less than a minute a day, as the shortest day nears.')
  assert.equal(rateSentence(ctxFor('RG1', '2026-12-24T10:00:00Z')), 'Days are lengthening by less than a minute a day, just after the shortest day.')
  assert.equal(rateSentence(ctxFor('RG1', '2027-06-21T10:00:00Z')), 'Today is the longest day of the year: days start shortening tomorrow.')
  assert.match(rateSentence(ctxFor('RG1', '2027-03-20T10:00:00Z'))!, /^Days are lengthening by nearly 4m a day, close to the fastest/)
})

check('the clock-change line: ten weeks ahead, the day before and the day itself', () => {
  const line = (iso: string) => comingUpSentences(ctxFor('RG1', iso)).filter((s) => s.startsWith('Clocks'))
  assert.deepEqual(line('2027-01-16T10:00:00Z'), []) // 71 days before
  assert.deepEqual(line('2027-01-17T10:00:00Z'), ['Clocks go forward in 70 days, on March 28th: sunset jumps from 18:28 to 19:30.'])
  assert.deepEqual(line('2027-03-20T10:00:00Z'), ['Clocks go forward in eight days, on March 28th: sunset jumps from 18:28 to 19:30.'])
  assert.deepEqual(line('2027-03-27T10:00:00Z'), ['Clocks go forward tomorrow: sunset jumps from 18:28 to 19:30.'])
  assert.deepEqual(line('2027-03-28T10:00:00Z'), ['Clocks went forward today: sunset is at 19:30, not 18:28.'])
  assert.deepEqual(line('2027-03-28T19:00:00Z'), ['Clocks went forward today: sunset was at 19:30, not 18:28.'])
  assert.deepEqual(line('2026-10-25T07:00:00Z'), ['Clocks went back today: sunrise was at 06:45, not 07:43.'])
})

check('this fortnight names a clock change in between, either way', () => {
  assert.deepEqual(fortnightSentences(ctxFor('RG1', '2027-03-28T10:00:00Z'))[0],
    'A week ago, before the clocks went forward, the sun rose at 06:05 (44m earlier) and set at 18:18 (1h\u00a012m earlier). Days were 28m shorter.')
  assert.match(fortnightSentences(ctxFor('RG1', '2027-03-23T10:00:00Z'))[1], /^Next Tuesday, after the clocks go forward, the sun rises at /)
  assert.match(fortnightSentences(ctxFor('RG1', '2026-12-21T10:00:00Z'))[0], /^A week ago the sun rose at 08:02 \(5m earlier\)/)
})

check('records: rule A\'s 30 days, "since the clocks went back", and none against the trend', () => {
  // October 27th: the latest sunrise is only since the day before the clocks went back,
  // three days ago, so it's hidden.
  assert.ok(!recordSentences(ctxFor('RG1', '2026-10-27T09:02:00Z')).some((s) => s.includes('sunrise')))
  // November 24th: 31 days after the day before the clocks went back (sunrise 07:36,
  // against 07:43 on October 24th); by November 30th it goes back to January.
  assert.ok(recordSentences(ctxFor('RG1', '2026-11-24T10:00:00Z')).includes('The latest sunrise since the clocks went back.'))
  assert.ok(recordSentences(ctxFor('RG1', '2026-11-30T10:00:00Z')).includes('The latest sunrise since January 29th 2026.'))
  // October 25th, the clock-change day: sunrises are getting later, so "the earliest
  // sunrise since September" (the clocks' doing) isn't said.
  assert.ok(!recordSentences(ctxFor('RG1', '2026-10-25T07:00:00Z')).some((s) => s.includes('sunrise')))
})

check('is it light at…?: clock changes end a run and say so; always and never', () => {
  assert.deepEqual(lightAtSentences(ctxFor('RG1', '2027-03-20T10:00:00Z'), '06:00'), [
    "It's light at 06:00 until the clocks go forward on March 28th.",
    'The sun is up by 06:00 again from March 23rd (Tuesday).',
  ])
  assert.deepEqual(lightAtSentences(ctxFor('RG1', '2026-10-27T09:02:00Z'), '01:00'), [
    "It's always dark at 01:00 here.",
    'The sun is never up at 01:00 here.',
  ])
  // Daylight all year: one plain sentence (the fresh look, 3.2).
  assert.deepEqual(lightAtSentences(ctxFor('RG1', '2026-10-27T09:02:00Z'), '12:00'), ['12:00 is always daylight here.'])
  assert.deepEqual(lightAtSentences(ctxFor('RG1', '2026-10-27T09:02:00Z'), '16:00'), [
    '16:00 is always at least half-light here. Even on the darkest evenings, December 11th and December 12th, half-light ends at 16:35.',
    'The sun is still up at 16:00 until November 28th.',
  ])
  // J5: dark now, so when half-light first reaches the time (John, 28 October).
  assert.equal(lightAtSentences(ctxFor('RG1', '2026-10-27T09:02:00Z'), '05:15')[0], 'Half-light starts by 05:15 from April 24th.')
  assert.equal(lightAtSentences(ctxFor('RG1', '2026-10-27T09:02:00Z'), '19:00')[0], 'Half-light lasts past 19:00 from March 27th.')
})

check('is it light at…?: "from tomorrow" when today is the last day', () => {
  assert.equal(lightAtSentences(ctxFor('RG1', '2027-05-15T10:00:00Z'), '21:30')[0], "From tomorrow it's light at 21:30.")
})

check('rule E: no true night, and not even very dark in the far north at midsummer', () => {
  const berwick = ctxFor('TD15', '2027-06-21T10:00:00Z')
  assert.deepEqual(darknessSentences(berwick), [
    "The sky never reaches {{very-dark}} tonight: it's {{dark}} from 22:58 to 03:22.",
    'No true night tonight: at its darkest the sky only reaches {{dark}}.',
    'True night returns on Sunday August 8th.',
  ])
  assert.equal(darknessSentences(ctxFor('RG1', '2027-06-21T10:00:00Z'))[1], 'No true night tonight: at its darkest the sky only reaches {{very-dark}}.')
  assert.ok(!todaySentences(berwick).some((s) => s.includes('{{')))
  // In plain text (the sentence sheet), the tags are in quotation marks; the page gets parts.
  assert.equal(plainText(darknessSentences(berwick)[0]), 'The sky never reaches "very dark" tonight: it\'s "dark" from 22:58 to 03:22.')
  assert.deepEqual(sentenceParts('reaches {{dark}}.'), [{ text: 'reaches ' }, { band: 'dark' }, { text: '.' }])
})

check('across the UK: cities at the ends, edge towns in brackets; a place near the visitor left out', () => {
  assert.deepEqual(acrossUkSentences(ctxFor('RG1', '2027-06-21T10:00:00Z')), [
    "There's an early sunset today in Canterbury at 21:15 (21:14 in Dover), and a late one in Inverness at 22:19 (22:35 in Stornoway).",
    'Reading gets 13m more daylight than Truro today, and 1h\u00a024m less than Inverness.',
  ])
  // Penzance itself is left out, so Penzance is beyond both ends.
  assert.deepEqual(acrossUkSentences(ctxFor('TR18', '2026-10-27T09:02:00Z')), [
    "There's an early sunset today in Norwich at 16:35 (16:21 in Lerwick), and a late one in Truro at 17:05; Penzance's is later still, at 17:08.",
    'Penzance gets 39m more daylight than Inverness today, and about the same amount of daylight as Truro.',
  ])
})

check('coming up: only the soonest hour for sunrise and for sunset; the spring repeat in one line', () => {
  const march = comingUpSentences(ctxFor('RG1', '2027-03-20T10:00:00Z'))
  assert.ok(march.includes('First sunrise at 06:00 or earlier: March 23rd (Tuesday), and again after the clocks go forward, on April 20th.'))
  assert.equal(march.filter((s) => s.startsWith('First sunrise')).length, 1)
  // December: the same "first" a year on is next year's, not a repeat.
  assert.ok(comingUpSentences(ctxFor('RG1', '2026-12-21T10:00:00Z')).includes('First sunset at 16:00 or later: December 26th (Saturday).'))
})

check('looking ahead: the next equinox, whenever it is, in date order (John, 28 October)', () => {
  const eq = (iso: string) => comingUpSentences(ctxFor('RG1', iso)).filter((s) => /equinox|Longest day|Shortest day/.test(s))
  assert.deepEqual(eq('2027-03-19T10:00:00Z'), ['Spring equinox: tomorrow, March 20th (Saturday).'])
  assert.deepEqual(eq('2027-03-20T10:00:00Z'), ['Spring equinox: today.'])
  // After the longest day, which falls inside the three months.
  assert.deepEqual(eq('2027-06-01T10:00:00Z'), [
    'Longest day: June 21st, 20 days from now, with 16h\u00a038m of daylight, 20m more than today.',
    'Autumn equinox: September 23rd, 114 days from now.',
  ])
  assert.equal(eq('2027-09-22T10:00:00Z')[0], 'Autumn equinox: tomorrow, September 23rd (Thursday).')
})

check('dates in Looking back, Looking ahead and Is it light at…?: the weekday only one to six days ahead, in brackets (John, 28 October)', () => {
  const ctx = ctxFor('RG1', '2026-10-28T10:00:00Z') // a Wednesday
  assert.equal(dayIn(ctx, '2026-10-28'), 'October 28th')
  assert.equal(dayIn(ctx, '2026-10-29'), 'October 29th (Thursday)')
  assert.equal(dayIn(ctx, '2026-11-03'), 'November 3rd (Tuesday)')
  assert.equal(dayIn(ctx, '2026-11-04'), 'November 4th')
  assert.equal(dayIn(ctx, '2026-10-27'), 'October 27th')
  assert.equal(dayIn(ctx, '2026-01-08'), 'January 8th') // 293 days back: no year
  assert.equal(dayIn(ctx, '2025-12-20'), 'December 20th 2025') // 312 days back
  assert.deepEqual(daysIn(ctx, '2026-11-01', '2027-09-01'), ['November 1st 2026 (Sunday)', 'September 1st 2027'])
})

check('records: a year or more back says "for a year"', () => {
  assert.ok(recordSentences(ctxFor('RG1', '2026-12-21T10:00:00Z')).includes('The shortest day for a year.'))
  assert.ok(recordSentences(ctxFor('RG1', '2026-12-21T10:00:00Z')).includes('The latest sunrise since January 8th 2026.'))
})

check('coming up: no threshold lasting most of the year; both years when either is needed', () => {
  const lines = comingUpSentences(ctxFor('TD15', '2027-06-21T10:00:00Z'))
  assert.ok(!lines.some((s) => s.includes('after 05:00')))
})

check('darkness: "No true night from …" only when it starts within ten weeks (John, 28 October)', () => {
  const run = (iso: string) => darknessSentences(ctxFor('RG1', iso)).find((s) => s.startsWith('No true night from'))
  assert.equal(run('2027-08-15T21:00:00Z'), undefined)
  assert.equal(run('2028-03-12T21:00:00Z'), undefined) // 71 days ahead
  assert.equal(run('2028-03-13T21:00:00Z'), 'No true night from Monday May 22nd to Wednesday July 19th.') // 70 days
})

check('the fresh look and John\'s amendments (28 October)', () => {
  // 2.3: daylight records give the date, never "since the clocks went back".
  assert.ok(recordSentences(ctxFor('RG1', '2027-02-17T10:00:00Z')).includes('The longest day since October 24th.'))
  // 4.4 is in check-page.ts.
  // 3.1: only the first run of near-tied darkest days, never the same days a year on.
  // On December 11th the 12th is tomorrow, so it keeps its weekday in brackets (John, 28 October).
  assert.equal(lightAtSentences(ctxFor('RG1', '2026-12-11T10:00:00Z'), '16:00')[0],
    '16:00 is always at least half-light here. Even on the darkest evenings, December 11th and December 12th (Saturday), half-light ends at 16:35.')
  assert.equal(lightAtSentences(ctxFor('RG1', '2026-12-12T10:00:00Z'), '16:00')[0],
    '16:00 is always at least half-light here. Even on the darkest evening, December 12th, half-light ends at 16:35.')
  // J1: the daylight line only across a clock change.
  assert.deepEqual(fortnightSentences(ctxFor('RG1', '2026-11-10T10:00:00Z')), [
    'A week ago the sun rose at 07:01 (12m earlier) and set at 16:33 (12m later).',
    'Next Tuesday the sun rises at 07:25 (12m later) and sets at 16:12 (10m earlier).',
  ])
  assert.equal(fortnightSentences(ctxFor('RG1', '2026-10-20T10:00:00Z'))[1],
    "Next Tuesday, after the clocks go back, the sun rises at 06:48 (48m earlier) and sets at 16:46 (1h\u00a014m earlier). That's 26m less daylight.")
  // 2.2 and J8: around the equinox, one plain sentence.
  assert.equal(acrossUkSentences(ctxFor('RG1', '2027-03-18T10:00:00Z'))[1], 'Today every place in the UK gets about the same amount of daylight.')
  assert.equal(acrossUkSentences(ctxFor('RG1', '2027-03-17T10:00:00Z'))[1], 'Reading gets 2m more daylight than Inverness today, and about the same amount of daylight as Truro.')
})

console.log(`\n${passed} checks passed`)
