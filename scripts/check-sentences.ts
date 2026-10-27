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
      'Sunrise 06:48, sunset 16:46: 9h 58m of daylight.',
      'Very dark or true night from 18:00 to 05:36.',
      'Days are shortening by nearly 4m a day, close to the fastest they ever change.',
    ] },
    { heading: 'This fortnight', sentences: [
      'A week ago, before the clocks went back, the sun rose at 07:36 and set at 18:00. Days were 26m longer.',
      "Next Tuesday the sun rises at 07:01 and sets at 16:33. That's 25m less daylight.",
    ] },
    { heading: 'Records and runs', sentences: [
      'The earliest sunset since Wednesday January 28th.',
      "Today's daylight matches Saturday February 14th's.",
    ] },
    { heading: 'Coming up', sentences: [
      'The sun rises after 07:00 from Tuesday November 3rd to Tuesday February 23rd.',
      'The sun sets before 16:00 from Monday November 30th to Friday December 25th.',
      'Earliest sunset: 15:55, every day from Wednesday December 9th to Wednesday December 16th. Within that period, the very earliest are on Saturday December 12th and Sunday December 13th, a fraction of a second apart.',
      'Shortest day: Monday December 21st, with 7h 50m of daylight.',
      'Latest sunrise: 08:09, every day from Saturday December 26th to Monday January 4th. Within that period, the very latest are on Wednesday December 30th and Thursday December 31st, a fraction of a second apart.',
    ] },
    { heading: 'Is it light at 07:30?', sentences: [
      '07:30 is always at least half-light here. Even on the darkest mornings, Thursday December 31st and Friday January 1st, half-light starts at 07:29.',
      'The sun is up by 07:30 until Friday November 20th.',
    ] },
    { heading: 'Is it light at 17:30?', sentences: [
      "It's dark at 17:30 until Monday February 1st.",
      'The sun is up at 17:30 again from Monday February 22nd.',
    ] },
    { heading: 'Darkness', sentences: [
      "Tonight's true night lasts 10h 19m.",
      'No true night from Sunday May 23rd to Monday July 19th.',
    ] },
    { heading: 'Across the UK', sentences: [
      "Sunset today runs from 16:21 in Lerwick to 17:08 in Penzance. Reading's is at 16:46.",
      'Reading gets 51m more daylight than Lerwick today, and 6m less than Penzance.',
    ] },
    { heading: 'Where the sun rises and sets', sentences: [
      'The sun rises in the east-south-east and sets in the west-south-west.',
      'On the longest day it rises in the north-east and sets in the north-west.',
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
    'A week ago, before the clocks went forward, the sun rose at 06:05 and set at 18:18. Days were 28m shorter.')
  assert.match(fortnightSentences(ctxFor('RG1', '2027-03-23T10:00:00Z'))[1], /^Next Tuesday, after the clocks go forward, the sun rises at /)
  assert.match(fortnightSentences(ctxFor('RG1', '2026-12-21T10:00:00Z'))[0], /^A week ago the sun rose at 08:02/)
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
  assert.deepEqual(lightAtSentences(ctxFor('RG1', '2026-10-27T09:02:00Z'), '12:00'), [
    '12:00 is always at least half-light here. Even on the darkest evenings, Friday December 11th and Saturday December 12th, half-light ends at 16:35.',
    'The sun is always up at 12:00 here.',
  ])
})

check('is it light at…?: "from tomorrow" when today is the last day', () => {
  assert.equal(lightAtSentences(ctxFor('RG1', '2027-05-15T10:00:00Z'), '21:30')[0], "From tomorrow it's light at 21:30.")
})

check('rule E: no true night, and not even very dark in the far north at midsummer', () => {
  const berwick = ctxFor('TD15', '2027-06-21T10:00:00Z')
  assert.deepEqual(darknessSentences(berwick), ['No true night tonight: at its darkest the sky only reaches {{dark}}.', 'True night returns on Sunday August 8th.'])
  assert.equal(todaySentences(berwick)[1], "The sky never reaches {{very-dark}} tonight: it's {{dark}} from 22:58 to 03:22.")
  assert.equal(darknessSentences(ctxFor('RG1', '2027-06-21T10:00:00Z'))[0], 'No true night tonight: at its darkest the sky only reaches {{very-dark}}.')
  // In plain text (the sentence sheet), the tags are in quotation marks; the page gets parts.
  assert.equal(plainText(todaySentences(berwick)[1]), 'The sky never reaches "very dark" tonight: it\'s "dark" from 22:58 to 03:22.')
  assert.deepEqual(sentenceParts('reaches {{dark}}.'), [{ text: 'reaches ' }, { band: 'dark' }, { text: '.' }])
})

check('across the UK: the ends change with the season; a place near the visitor is left out', () => {
  assert.deepEqual(acrossUkSentences(ctxFor('RG1', '2027-06-21T10:00:00Z')), [
    "Sunset today runs from 21:14 in Dover to 22:35 in Stornoway. Reading's is at 21:25.",
    'Reading gets 14m more daylight than Penzance today, and 2h 18m less than Lerwick.',
  ])
  // Penzance itself is left out, so Penzance is beyond both ends.
  assert.deepEqual(acrossUkSentences(ctxFor('TR18', '2026-10-27T09:02:00Z')), [
    "Sunset today runs from 16:21 in Lerwick to 17:05 in Truro, and Penzance's is later still, at 17:08.",
    'Penzance gets 57m more daylight than Lerwick today, and about the same daylight as Truro.',
  ])
})

check('coming up: only the soonest hour for sunrise and for sunset; the spring repeat in one line', () => {
  const march = comingUpSentences(ctxFor('RG1', '2027-03-20T10:00:00Z'))
  assert.ok(march.includes('First sunrise at 06:00 or earlier: Tuesday March 23rd, and again after the clocks go forward, on Tuesday April 20th.'))
  assert.equal(march.filter((s) => s.startsWith('First sunrise')).length, 1)
  // December: the same "first" a year on is next year's, not a repeat.
  assert.ok(comingUpSentences(ctxFor('RG1', '2026-12-21T10:00:00Z')).includes('First sunset at 16:00 or later: Saturday December 26th.'))
})

check('records: a year or more back says "for a year"', () => {
  assert.ok(recordSentences(ctxFor('RG1', '2026-12-21T10:00:00Z')).includes('The shortest day for a year.'))
  assert.ok(recordSentences(ctxFor('RG1', '2026-12-21T10:00:00Z')).includes('The latest sunrise since Thursday January 8th 2026.'))
})

check('coming up: no threshold lasting most of the year; both years when either is needed', () => {
  const lines = comingUpSentences(ctxFor('TD15', '2027-06-21T10:00:00Z'))
  assert.ok(!lines.some((s) => s.includes('after 05:00')))
  assert.deepEqual(darknessSentences(ctxFor('RG1', '2027-08-15T21:00:00Z'))[1], 'No true night from Monday May 22nd 2028 to Wednesday July 19th 2028.')
})

console.log(`\n${passed} checks passed`)
