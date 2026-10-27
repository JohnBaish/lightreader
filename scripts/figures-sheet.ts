// `npm run figures-sheet`: design/figures-sheet-2026-10-27.md, the spec's example figures
// for Reading (RG1) on Tuesday October 27th 2026, recomputed with Lightreader's own
// calculation (PLAN stage 1, item 9), so stage 2's sentences start from the right numbers.
//
// The sentence rules aren't built yet (stage 2), so the searches here are simple and
// written out beside each line: thresholds use the minute shown (rule C), records and
// "very earliest" use the exact time (rules A and G). Stage 2's code must agree with
// this sheet, or the sheet is corrected.

import { readFileSync, writeFileSync } from 'node:fs'
import { clock, duration, longDate, shownMinutes, compassPoint } from '../src/lib/format.ts'
import { dayFigures, daylight, daysFigures, type DayFigures } from '../src/lib/sun.ts'
import { addDays, ukParts } from '../src/lib/ukTime.ts'

const TODAY = '2026-10-27'
const outcodes = JSON.parse(readFileSync('src/data/outcodes.json', 'utf8')) as { outcodes: Record<string, [number, number, string]> }
const placeOf = (code: string) => ({ latitude: outcodes.outcodes[code][0], longitude: outcodes.outcodes[code][1] })
const RG1 = placeOf('RG1')

// Enough days either side for the records and "Coming up" searches.
const days = daysFigures(RG1, '2025-10-01', '2027-12-31')
const byDate = new Map(days.map((d) => [d.date, d]))
const day = (date: string) => byDate.get(date)!
const today = day(TODAY)
const past = days.filter((d) => d.date < TODAY).reverse() // most recent first
const ahead = days.filter((d) => d.date > TODAY)

/** Seconds after UK midnight by the clock, exactly (for comparing times of day). */
const clockSeconds = (at: Date) => {
  const p = ukParts(at)
  return p.hour * 3600 + p.minute * 60 + at.getUTCSeconds() + at.getUTCMilliseconds() / 1000
}
const exact = (at: Date | null) => (at ? at.toLocaleTimeString('en-GB', { timeZone: 'Europe/London' }) : 'none')
const t = (at: Date | null) => (at ? clock(at) : 'none')
const dl = (d: DayFigures) => duration(daylight(d))
const ld = (d: string) => longDate(d)
const ms = (s: number) => `${Math.floor(Math.abs(s) / 60)}m ${Math.round(Math.abs(s) % 60)}s`
/** A clock-time difference in words, from exact seconds: "1h 20m later". */
const later = (a: Date, b: Date) => {
  const s = clockSeconds(a) - clockSeconds(b)
  return `${duration(s * 1000)} ${s >= 0 ? 'later' : 'earlier'}`
}
/** The first run of consecutive days (from `list`) passing `test`, as [first, last]. */
function firstRun(list: DayFigures[], test: (d: DayFigures) => boolean): [DayFigures, DayFigures] | null {
  const start = list.findIndex(test)
  if (start < 0) return null
  let end = start
  while (end + 1 < list.length && test(list[end + 1])) end++
  return [list[start], list[end]]
}

type Line = { group: string; spec: string; ours: string; how: string }
const lines: Line[] = []
const add = (group: string, spec: string, ours: string, how: string) => lines.push({ group, spec, ours, how })

// Today
add('Today', 'Sunrise 06:49, sunset 16:46', `Sunrise ${t(today.sunrise)}, sunset ${t(today.sunset)}`, `exact ${exact(today.sunrise)} and ${exact(today.sunset)}`)
add('Today', '9h 57m of daylight', `${dl(today)} of daylight`, 'sunset minus sunrise, exact, then rounded')
add('Today', 'Very dark or true night from 18:00 to 05:36',
  `from ${t(today.nauticalDusk)} to ${t(day(addDays(TODAY, 1)).nauticalDawn)}`, 'the sun 12° below, this evening and tomorrow morning')
const change = (daylight(today) - daylight(day(addDays(TODAY, -1)))) / 1000
add('Today', 'Shortening by nearly 4m a day', `${ms(change)} shorter than yesterday ("nearly 4m" fits)`, 'today\'s daylight minus yesterday\'s')

// This fortnight
for (const [label, date, spec] of [['A week ago', addDays(TODAY, -7), 'rose 07:36, set 18:00; days were 26m longer'],
  ['Next Tuesday', addDays(TODAY, 7), 'rises 07:01, sets 16:33; 25m less daylight']] as const) {
  const d = day(date)
  add('This fortnight', `${label}: ${spec}`, `${ld(date)}: ${t(d.sunrise)} and ${t(d.sunset)}; ${duration(daylight(d) - daylight(today))} ${daylight(d) > daylight(today) ? 'longer' : 'less'}`, 'exact difference in daylight')
}

// Records and runs (rule A: to the second)
const earlierSunset = past.find((d) => clockSeconds(d.sunset!) < clockSeconds(today.sunset!))!
add('Records', 'The earliest sunset since Wednesday January 28th', `since ${ld(earlierSunset.date)}`,
  `the most recent day with an earlier sunset by the clock (${exact(earlierSunset.sunset)} against ${exact(today.sunset)})`)
const shorterDay = past.find((d) => daylight(d) < daylight(today))!
add('Records', 'The shortest day since Saturday February 14th', `since ${ld(shorterDay.date)}`,
  `the most recent day with less daylight (${dl(shorterDay)})`)
const laterSunrise = past.find((d) => clockSeconds(d.sunrise!) > clockSeconds(today.sunrise!))!
add('Records', 'The latest sunrise since the clocks went back (hidden: less than 30 days)', `since ${ld(laterSunrise.date)}, sunrise ${t(laterSunrise.sunrise)}`,
  'the most recent day with a later sunrise by the clock: the day before the clocks went back')
const sameDaylight = past.filter((d) => d.date >= '2026-01-01' && dl(d) === dl(today)).map((d) => ld(d.date))
add('Records', 'Today\'s daylight matches Sunday February 14th\'s', sameDaylight.join('; ') || 'none',
  'past days in 2026 with the same daylight, to the minute shown (February 14th 2026 was a Saturday)')

// Coming up (the next three months)
const window = ahead.filter((d) => d.date <= '2027-01-27')
const after7 = firstRun(ahead, (d) => shownMinutes(d.sunrise!) > 7 * 60)!
add('Coming up', 'The sun rises after 07:00 from Tuesday November 3rd to Tuesday February 23rd', `after 07:00 from ${ld(after7[0].date)} to ${ld(after7[1].date)}`,
  'sunrise shown as 07:01 or later')
const minSet = Math.min(...window.map((d) => shownMinutes(d.sunset!)))
const earliestRun = firstRun(window, (d) => shownMinutes(d.sunset!) === minSet)!
const veryEarliest = [...window].sort((a, b) => clockSeconds(a.sunset!) - clockSeconds(b.sunset!))[0]
add('Coming up', 'Earliest sunset: 15:55, every day from Monday December 7th to Friday December 18th; the very earliest on Saturday December 12th',
  `${t(earliestRun[0].sunset)}, every day from ${ld(earliestRun[0].date)} to ${ld(earliestRun[1].date)}; the very earliest ${ld(veryEarliest.date)} (${exact(veryEarliest.sunset)})`,
  'the earliest minute shown, then the earliest exact time')
const shortest = [...window].sort((a, b) => daylight(a) - daylight(b))[0]
add('Coming up', 'Shortest day: Monday December 21st, with 7h 49m of daylight', `${ld(shortest.date)}, ${dl(shortest)}`, 'least daylight, exact')
const maxRise = Math.max(...window.map((d) => shownMinutes(d.sunrise!)))
const latestRun = firstRun(window, (d) => shownMinutes(d.sunrise!) === maxRise)!
const byRise = [...window].sort((a, b) => clockSeconds(b.sunrise!) - clockSeconds(a.sunrise!))
const tied = byRise.filter((d) => clockSeconds(byRise[0].sunrise!) - clockSeconds(d.sunrise!) < 1)
add('Coming up', 'Latest sunrise: 08:10, every day from Monday December 28th to Saturday January 2nd; the very latest on Wednesday December 30th and Thursday December 31st, a fraction of a second apart',
  `${t(latestRun[0].sunrise)}, every day from ${ld(latestRun[0].date)} to ${ld(latestRun[1].date)}; the very latest ${tied.map((d) => `${ld(d.date)} (${exact(d.sunrise)}.${String(d.sunrise!.getUTCMilliseconds()).padStart(3, '0')})`).join(' and ')}`,
  'the latest minute shown; then every day within a second of the latest exact time (rule G)')
const at17 = ahead.find((d) => d.date > shortest.date && shownMinutes(d.sunset!) >= 17 * 60)!
add('Coming up', 'First sunset at 17:00 or later: Friday February 5th', `${ld(at17.date)} (${t(at17.sunset)})`, 'sunset shown as 17:00 or later; on the hour counts (rule C)')
add('Coming up', 'Clocks go forward on Sunday March 28th: sunset jumps from 18:28 to 19:30', `March 28th: ${t(day('2027-03-27').sunset)} to ${t(day('2027-03-28').sunset)}`, 'Saturday March 27th and Sunday March 28th 2027')

// Is it light at…? (rule C: the minute shown; on the minute counts as reached)
const dark1730 = firstRun([today, ...ahead], (d) => shownMinutes(d.civilDusk!) <= 17 * 60 + 30)!
add('Is it light at…?', 'It\'s dark at 17:30 until Tuesday February 2nd', `dark at 17:30 until ${ld(dark1730[1].date)} (half-light ends ${t(dark1730[1].civilDusk)}; next day ${t(day(addDays(dark1730[1].date, 1)).civilDusk)})`,
  'half-light ends at or before 17:30, as shown')
const year = days.filter((d) => d.date >= '2026-04-27' && d.date <= '2027-04-27')
const latestDawn = [...year].sort((a, b) => clockSeconds(b.civilDawn!) - clockSeconds(a.civilDawn!))
const dawnTied = latestDawn.filter((d) => clockSeconds(latestDawn[0].civilDawn!) - clockSeconds(d.civilDawn!) < 1)
const always = year.every((d) => shownMinutes(d.civilDawn!) <= 7 * 60 + 30)
add('Is it light at…?', '07:30 is always at least half-light; the darkest morning is Friday January 1st, half-light starts at 07:29',
  `07:30 is ${always ? 'always' : 'not always'} at least half-light; the darkest morning ${dawnTied.map((d) => `${ld(d.date)} (${exact(d.civilDawn)})`).join(' and ')}, half-light starts ${t(latestDawn[0].civilDawn)}`,
  'over the year shown (April 27th 2026 to April 27th 2027)')
const up730 = firstRun([today, ...ahead], (d) => shownMinutes(d.sunrise!) <= 7 * 60 + 30)!
add('Is it light at…?', 'The sun is up by 07:30 until Friday November 20th', `until ${ld(up730[1].date)} (sunrise ${t(up730[1].sunrise)})`, 'sunrise shown as 07:30 or earlier')
const up1730 = ahead.find((d) => shownMinutes(d.sunset!) > 17 * 60 + 30)!
add('Is it light at…?', 'The sun is up at 17:30 again from Monday February 22nd', `up at 17:30 from ${ld(up1730.date)} (sunset ${t(up1730.sunset)})`, 'sunset shown as 17:31 or later')

// Darkness
const tomorrow = day(addDays(TODAY, 1))
add('Darkness', 'Tonight\'s true night lasts 10h 19m', duration(tomorrow.astronomicalDawn!.getTime() - today.astronomicalDusk!.getTime()),
  `from ${exact(today.astronomicalDusk)} to ${exact(tomorrow.astronomicalDawn)}`)
const noTrue = firstRun(days.filter((d) => d.date >= '2027-01-01'), (d) => d.astronomicalDusk === null)!
add('Darkness', 'No true night from Monday May 17th to Thursday July 22nd (next summer)', `from ${ld(noTrue[0].date)} to ${ld(noTrue[1].date)} 2027`,
  'evenings on which the sun doesn\'t reach 18° below')

// Across the UK (Penzance only: Lerwick needs its fixed point agreed, PLAN question 7)
const pz = dayFigures(placeOf('TR18'), TODAY)
add('Across the UK', 'Sunset in Penzance 17:07', `Penzance (TR18) ${t(pz.sunset)}`, `TR18 district centre, exact ${exact(pz.sunset)}. Lerwick (16:21 in the spec) waits for its point to be agreed (PLAN question 7)`)
add('Across the UK', 'Reading gets 6m less daylight than Penzance', `${duration(daylight(pz) - daylight(today))} ${daylight(pz) > daylight(today) ? 'less' : 'more'}`, 'exact difference')

// Where the sun rises and sets
const longest = day('2027-06-21')
add('Directions', 'Rises in the east-south-east, sets in the west-south-west', `${compassPoint(today.sunriseAzimuth!)}, ${compassPoint(today.sunsetAzimuth!)}`, `${today.sunriseAzimuth!.toFixed(1)}° and ${today.sunsetAzimuth!.toFixed(1)}° from north`)
add('Directions', 'On the longest day, north-east and north-west', `${compassPoint(longest.sunriseAzimuth!)}, ${compassPoint(longest.sunsetAzimuth!)}`, `June 21st 2027: ${longest.sunriseAzimuth!.toFixed(1)}° and ${longest.sunsetAzimuth!.toFixed(1)}°`)

// Compare
const xmas = day('2026-12-25')
add('Compare', 'Christmas: rises 08:09, 1h 20m later; sets 15:59, 47m earlier; half-light ends 16:40, 41m earlier; 2h 7m less daylight, 7h 50m in all',
  `rises ${t(xmas.sunrise)}, ${later(xmas.sunrise!, today.sunrise!)}; sets ${t(xmas.sunset)}, ${later(xmas.sunset!, today.sunset!)}; half-light ends ${t(xmas.civilDusk)}, ${later(xmas.civilDusk!, today.civilDusk!)}; ${duration(daylight(today) - daylight(xmas))} less, ${dl(xmas)} in all`,
  'differences by the clock, from exact times (rule H)')
const july = day('2026-07-14')
add('Compare', 'Last July 14th: rose 05:04, 1h 45m earlier; set 21:15, 4h 29m later; half-light ended 22:01, 4h 39m later; 6h 14m more, 16h 12m in all; no true night',
  `rose ${t(july.sunrise)}, ${later(july.sunrise!, today.sunrise!)}; set ${t(july.sunset)}, ${later(july.sunset!, today.sunset!)}; half-light ended ${t(july.civilDusk)}, ${later(july.civilDusk!, today.civilDusk!)}; ${duration(daylight(july) - daylight(today))} more, ${dl(july)} in all; ${july.astronomicalDusk ? 'a true night' : 'no true night'}`,
  'differences by the clock (July in BST, today in GMT)')

// The year: the detail card
add('Year ribbon card', 'Sunrise 06:48 · Sunset 16:46 · 9h 58m of daylight. Half-light 06:14 to 17:21; very dark from 18:00',
  `Sunrise ${t(today.sunrise)} · Sunset ${t(today.sunset)} · ${dl(today)}. Half-light ${t(today.civilDawn)} to ${t(today.civilDusk)}; very dark from ${t(today.nauticalDusk)}`, '')

// The sky ribbon mock-up (from 09:02)
add('Sky ribbon mock-up', 'Sun highest 11:48; sunset 16:46; dark 17:21; very dark 18:00; true night 18:39',
  `${t(today.noon)}; ${t(today.sunset)}; ${t(today.civilDusk)}; ${t(today.nauticalDusk)}; ${t(today.astronomicalDusk)}`, `true night starts ${exact(today.astronomicalDusk)}`)
add('Sky ribbon mock-up', 'Wednesday: very dark 04:57; dark 05:36; half-light 06:15; sunrise 06:50',
  `${t(tomorrow.astronomicalDawn)}; ${t(tomorrow.nauticalDawn)}; ${t(tomorrow.civilDawn)}; ${t(tomorrow.sunrise)}`, `very dark from ${exact(tomorrow.astronomicalDawn)}`)

// Write the sheet. A line counts as the same when every time, date and length in the
// spec's wording appears in ours.
const tokens = (s: string) => s.match(/\d{2}:\d{2}|\d+h \d+m|\d+h|\d+m|(January|February|March|April|May|June|July|August|September|October|November|December) \d+(st|nd|rd|th)/g) ?? []
const same = (l: Line) => tokens(l.spec).every((tok) => l.ours.includes(tok))
const out = [
  '# Lightreader figures sheet, Tuesday October 27th 2026',
  '',
  'Every example figure in `SPEC.md` for Reading (RG1), recomputed with Lightreader\'s own',
  'calculation (Astronomy Engine 2.1.19, for the RG1 district centre, 51.4517° N, 0.9698° W).',
  'Made by `npm run figures-sheet`. Times are UK clock time; "exact" times are to the second.',
  '',
  'A line marked **differs** has at least one figure that comes out differently. Most are',
  'a minute either side, because some of the spec\'s figures came from another library',
  '(Astral) and a time near the half-minute can round either way.',
  '',
  '| | Group | The spec says | Lightreader gives | How it was worked out |',
  '|---|---|---|---|---|',
  ...lines.map((l) => `| ${same(l) ? 'same' : '**differs**'} | ${l.group} | ${l.spec} | ${l.ours} | ${l.how} |`),
  '',
  `${lines.filter(same).length} of ${lines.length} lines are the same; ${lines.filter((l) => !same(l)).length} differ.`,
  '',
]
writeFileSync('design/figures-sheet-2026-10-27.md', out.join('\n'))
for (const l of lines) console.log(same(l) ? 'same   ' : 'DIFFERS', '|', l.spec, '|', l.ours)
