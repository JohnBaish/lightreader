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
import { looseMinutes, plainText, sentenceParts } from '../src/lib/sentences/words.ts'

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
      '9h 58m of daylight.',
      'Days are shortening by nearly 4m a day, close to the fastest they ever change.',
    ] },
    { heading: 'This fortnight', sentences: [
      'A week ago, before the clocks went back, the sun rose at 07:36 (48m later) and set at 18:00 (1h 14m later). Days were 26m longer.',
      'Next Tuesday the sun rises at 07:01 (12m later) and sets at 16:33 (13m earlier).',
    ] },
    { heading: 'Records and runs', sentences: [
      'The earliest sunset since Wednesday January 28th.',
      "Today's daylight matches Saturday February 14th's.",
    ] },
    { heading: 'Looking ahead', sentences: [
      'The sun rises after 07:00 from Tuesday November 3rd to Tuesday February 23rd.',
      'The sun sets before 16:00 from Monday November 30th to Friday December 25th.',
      'Earliest sunset: 15:55, every day from Wednesday December 9th to Wednesday December 16th. Within that period, the very earliest are on Saturday December 12th and Sunday December 13th, a fraction of a second apart.',
      'Shortest day: Monday December 21st, 55 days from now, with 7h 50m of daylight, 2h 8m less than today.',
      'Latest sunrise: 08:09, every day from Saturday December 26th to Monday January 4th. Within that period, the very latest are on Wednesday December 30th and Thursday December 31st, a fraction of a second apart.',
      'Spring equinox: Saturday March 20th, 144 days from now, with sunset at 18:16.',
    ] },
    { heading: 'Is it light at 07:30?', sentences: [
      '07:30 is always at least half-light here. Even on the darkest mornings, Thursday December 31st and Friday January 1st, half-light starts at 07:29.',
      'The sun is up by 07:30 until Friday November 20th.',
    ] },
    { heading: 'Is it light at 17:30?', sentences: [
      'Half-light lasts past 17:30 from Tuesday February 2nd.',
      'The sun is up at 17:30 again from Monday February 22nd.',
    ] },
    { heading: 'Darkness', sentences: [
      'Very dark or true night from 18:00 to 05:36 (11h 36m).',
      "Tonight's true night lasts 10h 19m.",
    ] },
    { heading: 'Across the UK', sentences: [
      "There's an early sunset today in Norwich at 16:35 (16:21 in Lerwick), and a late one in Truro at 17:05 (17:08 in Penzance). Reading's is at 16:46.",
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
  assert.deepEqual(line('2027-01-17T10:00:00Z'), ['Clocks go forward in 70 days, on Sunday March 28th: sunset jumps from 18:28 to 19:30.'])
  assert.deepEqual(line('2027-03-20T10:00:00Z'), ['Clocks go forward in eight days, on Sunday March 28th: sunset jumps from 18:28 to 19:30.'])
  assert.deepEqual(line('2027-03-27T10:00:00Z'), ['Clocks go forward tomorrow: sunset jumps from 18:28 to 19:30.'])
  assert.deepEqual(line('2027-03-28T10:00:00Z'), ['Clocks went forward today: sunset is at 19:30, not 18:28.'])
  assert.deepEqual(line('2027-03-28T19:00:00Z'), ['Clocks went forward today: sunset was at 19:30, not 18:28.'])
  assert.deepEqual(line('2026-10-25T07:00:00Z'), ['Clocks went back today: sunrise was at 06:45, not 07:43.'])
})

check('this fortnight names a clock change in between, either way', () => {
  assert.deepEqual(fortnightSentences(ctxFor('RG1', '2027-03-28T10:00:00Z'))[0],
    'A week ago, before the clocks went forward, the sun rose at 06:05 (44m earlier) and set at 18:18 (1h 12m earlier). Days were 28m shorter.')
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
  assert.ok(recordSentences(ctxFor('RG1', '2026-11-30T10:00:00Z')).includes('The latest sunrise since Thursday January 29th 2026.'))
  // October 25th, the clock-change day: sunrises are getting later, so "the earliest
  // sunrise since September" (the clocks' doing) isn't said.
  assert.ok(!recordSentences(ctxFor('RG1', '2026-10-25T07:00:00Z')).some((s) => s.includes('sunrise')))
})

check('is it light at…?: clock changes end a run and say so; always and never', () => {
  assert.deepEqual(lightAtSentences(ctxFor('RG1', '2027-03-20T10:00:00Z'), '06:00'), [
    "It's light at 06:00 until the clocks go forward on Sunday March 28th.",
    'The sun is up by 06:00 again from Tuesday March 23rd.',
  ])
  assert.deepEqual(lightAtSentences(ctxFor('RG1', '2026-10-27T09:02:00Z'), '01:00'), [
    "It's always dark at 01:00 here.",
    'The sun is never up at 01:00 here.',
  ])
  // Daylight all year: one plain sentence (the fresh look, 3.2).
  assert.deepEqual(lightAtSentences(ctxFor('RG1', '2026-10-27T09:02:00Z'), '12:00'), ['12:00 is always daylight here.'])
  assert.deepEqual(lightAtSentences(ctxFor('RG1', '2026-10-27T09:02:00Z'), '16:00'), [
    '16:00 is always at least half-light here. Even on the darkest evenings, Friday December 11th and Saturday December 12th, half-light ends at 16:35.',
    'The sun is still up at 16:00 until Saturday November 28th.',
  ])
  // J5: dark now, so when half-light first reaches the time (John, 28 October).
  assert.equal(lightAtSentences(ctxFor('RG1', '2026-10-27T09:02:00Z'), '05:15')[0], 'Half-light starts by 05:15 from Saturday April 24th.')
  assert.equal(lightAtSentences(ctxFor('RG1', '2026-10-27T09:02:00Z'), '19:00')[0], 'Half-light lasts past 19:00 from Saturday March 27th.')
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
    "There's an early sunset today in Canterbury at 21:15 (21:14 in Dover), and a late one in Inverness at 22:19 (22:35 in Stornoway). Reading's is at 21:25.",
    'Reading gets 13m more daylight than Truro today, and 1h 24m less than Inverness.',
  ])
  // Penzance itself is left out, so Penzance is beyond both ends.
  assert.deepEqual(acrossUkSentences(ctxFor('TR18', '2026-10-27T09:02:00Z')), [
    "There's an early sunset today in Norwich at 16:35 (16:21 in Lerwick), and a late one in Truro at 17:05; Penzance's is later still, at 17:08.",
    'Penzance gets 39m more daylight than Inverness today, and about the same amount of daylight as Truro.',
  ])
})

check('coming up: only the soonest hour for sunrise and for sunset; the spring repeat in one line', () => {
  const march = comingUpSentences(ctxFor('RG1', '2027-03-20T10:00:00Z'))
  assert.ok(march.includes('First sunrise at 06:00 or earlier: Tuesday March 23rd, and again after the clocks go forward, on Tuesday April 20th.'))
  assert.equal(march.filter((s) => s.startsWith('First sunrise')).length, 1)
  // December: the same "first" a year on is next year's, not a repeat.
  assert.ok(comingUpSentences(ctxFor('RG1', '2026-12-21T10:00:00Z')).includes('First sunset at 16:00 or later: Saturday December 26th.'))
})

check('looking ahead: the next equinox, whenever it is, in date order (John, 28 October)', () => {
  const eq = (iso: string) => comingUpSentences(ctxFor('RG1', iso)).filter((s) => /equinox|Longest day|Shortest day/.test(s))
  assert.deepEqual(eq('2027-03-19T10:00:00Z'), ['Spring equinox: tomorrow, Saturday March 20th, with sunset at 18:16.'])
  assert.deepEqual(eq('2027-03-20T10:00:00Z'), ['Spring equinox: today, with sunset at 18:16.'])
  // After the longest day, a week inside the three months; sunset 18:00:34 GMT, 19:01 BST.
  assert.deepEqual(eq('2027-06-01T10:00:00Z'), [
    'Longest day: Monday June 21st, 20 days from now, with 16h 38m of daylight, 20m more than today.',
    'Autumn equinox: Thursday September 23rd, 114 days from now, with sunset at 19:01.',
  ])
  assert.equal(eq('2027-09-22T10:00:00Z')[0], 'Autumn equinox: tomorrow, Thursday September 23rd, with sunset at 19:01.')
})

check('records: a year or more back says "for a year"', () => {
  assert.ok(recordSentences(ctxFor('RG1', '2026-12-21T10:00:00Z')).includes('The shortest day for a year.'))
  assert.ok(recordSentences(ctxFor('RG1', '2026-12-21T10:00:00Z')).includes('The latest sunrise since Thursday January 8th 2026.'))
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
  assert.ok(recordSentences(ctxFor('RG1', '2027-02-17T10:00:00Z')).includes('The longest day since Saturday October 24th.'))
  // 4.4 is in check-page.ts.
  // 3.1: only the first run of near-tied darkest days, never the same days a year on.
  assert.equal(lightAtSentences(ctxFor('RG1', '2026-12-11T10:00:00Z'), '16:00')[0],
    '16:00 is always at least half-light here. Even on the darkest evenings, Friday December 11th and Saturday December 12th, half-light ends at 16:35.')
  assert.equal(lightAtSentences(ctxFor('RG1', '2026-12-12T10:00:00Z'), '16:00')[0],
    '16:00 is always at least half-light here. Even on the darkest evening, Saturday December 12th, half-light ends at 16:35.')
  // J1: the daylight line only across a clock change.
  assert.deepEqual(fortnightSentences(ctxFor('RG1', '2026-11-10T10:00:00Z')), [
    'A week ago the sun rose at 07:01 (12m earlier) and set at 16:33 (12m later).',
    'Next Tuesday the sun rises at 07:25 (12m later) and sets at 16:12 (10m earlier).',
  ])
  assert.equal(fortnightSentences(ctxFor('RG1', '2026-10-20T10:00:00Z'))[1],
    "Next Tuesday, after the clocks go back, the sun rises at 06:48 (48m earlier) and sets at 16:46 (1h 14m earlier). That's 26m less daylight.")
  // 2.2 and J8: around the equinox, one plain sentence.
  assert.equal(acrossUkSentences(ctxFor('RG1', '2027-03-18T10:00:00Z'))[1], 'Today every place in the UK gets about the same amount of daylight.')
  assert.equal(acrossUkSentences(ctxFor('RG1', '2027-03-17T10:00:00Z'))[1], 'Reading gets 2m more daylight than Inverness today, and about the same amount of daylight as Truro.')
})

console.log(`\n${passed} checks passed`)
