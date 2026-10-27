// `npm run compare-metno [<cache folder>]`: compares a whole year of sunrises and sunsets
// for six English places with MET Norway's Sunrise 3.0 API (SPEC §3, "Before launch"),
// and writes design/metno-comparison.md.
//
// MET Norway gives each time to the minute only, and no twilight times, so this compares
// sunrise, sunset and their compass directions. One request per place per day (2,190 for
// a year), four at a time and at most four a second (MET Norway's limit is 20), identified
// as its terms ask.
// With a cache folder, each answer is kept there and not asked for again.
// Times are compared on the UTC date, which always holds an English sunrise and sunset.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { dayFigures, type Place } from '../src/lib/sun.ts'
import { clock, compassPoint } from '../src/lib/format.ts'
import { addDays } from '../src/lib/ukTime.ts'

const YEAR = 2027
const CODES = ['TR18', 'RG1', 'NR1', 'M1', 'NE1', 'TD15'] // Penzance to Berwick
const AGENT = 'Lightreader/0.1 (+https://github.com/JohnBaish/lightreader)'

type Answer = { sunrise: { time: string; azimuth: number } | null; sunset: { time: string; azimuth: number } | null }

const outcodes = JSON.parse(readFileSync('src/data/outcodes.json', 'utf8')) as { outcodes: Record<string, [number, number, string]> }
const cache = process.argv[2]
if (cache) mkdirSync(cache, { recursive: true })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function ask(code: string, place: Place, date: string): Promise<Answer> {
  const file = cache ? join(cache, `${code}-${date}.json`) : null
  if (file && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as Answer
  const url = `https://api.met.no/weatherapi/sunrise/3.0/sun?lat=${place.latitude}&lon=${place.longitude}&date=${date}&offset=+00:00`
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': AGENT } })
    if (res.ok) {
      const body = (await res.json()) as { properties: Answer }
      const answer = { sunrise: body.properties.sunrise ?? null, sunset: body.properties.sunset ?? null }
      if (file) writeFileSync(file, JSON.stringify(answer))
      return answer
    }
    if (attempt === 3) throw new Error(`MET Norway ${res.status} for ${code} ${date}`)
    await sleep(5000 * attempt)
  }
}

const placeOf = (code: string) => ({ latitude: outcodes.outcodes[code][0], longitude: outcodes.outcodes[code][1] })
const dates: string[] = []
for (let date = `${YEAR}-01-01`; date <= `${YEAR}-12-31`; date = addDays(date, 1)) dates.push(date)

// Ask four at a time, each starting at least a quarter of a second after the last.
const answers = new Map<string, Answer>()
const queue = CODES.flatMap((code) => dates.map((date) => ({ code, date })))
let next = 0
let lastStart = 0
await Promise.all([1, 2, 3, 4].map(async () => {
  while (next < queue.length) {
    const { code, date } = queue[next++]
    const start = Math.max(Date.now(), lastStart + 250)
    lastStart = start
    if (start > Date.now()) await sleep(start - Date.now())
    answers.set(`${code} ${date}`, await ask(code, placeOf(code), date))
    if (answers.size % 200 === 0) console.log(`${answers.size} of ${queue.length}`)
  }
}))

type Row = { code: string; date: string; event: 'sunrise' | 'sunset'; ours: Date; theirs: Date; azOurs: number; azTheirs: number }
const rows: Row[] = []
for (const code of CODES) {
  const name = outcodes.outcodes[code][2]
  const place = placeOf(code)
  for (const date of dates) {
    const met = answers.get(`${code} ${date}`)!
    // dayFigures works by UK day; the UTC date's sunrise and sunset are the UK day's too.
    const ours = dayFigures(place, date)
    for (const event of ['sunrise', 'sunset'] as const) {
      const theirs = met[event]
      const mine = ours[event]
      const az = event === 'sunrise' ? ours.sunriseAzimuth : ours.sunsetAzimuth
      if (!theirs || !mine || az === null) throw new Error(`${code} ${date}: no ${event}`)
      rows.push({ code, date, event, ours: mine, theirs: new Date(theirs.time), azOurs: az, azTheirs: theirs.azimuth })
    }
  }
  console.log(`${code} (${name}): ${YEAR} compared`)
}

// Theirs (to the minute) minus ours (exact), in seconds.
const diff = (r: Row) => (r.theirs.getTime() - r.ours.getTime()) / 1000
const lines: string[] = [
  `# Lightreader against MET Norway, ${YEAR}`,
  '',
  `Made by \`npm run compare-metno\` on ${new Date().toISOString().slice(0, 10)}: every sunrise and sunset of ${YEAR}`,
  'for six postcode districts, from Lightreader\'s calculation (Astronomy Engine) and from MET Norway\'s',
  'Sunrise 3.0 API. MET Norway gives times to the minute; ours are to the second.',
  '',
  '"Difference" is MET Norway\'s time minus ours. "Shown differently" counts the days on which',
  'Lightreader, rounding to the nearest minute, would show a different minute from MET Norway.',
  '',
  '| District | Place | Days | Difference, smallest to largest | Shown differently | Direction, largest difference |',
  '|---|---|---|---|---|---|',
]
let worst: Row | null = null
for (const code of CODES) {
  const mine = rows.filter((r) => r.code === code)
  const d = mine.map(diff)
  const shownDiff = mine.filter((r) => clock(r.ours) !== clock(r.theirs))
  const az = Math.max(...mine.map((r) => Math.abs(r.azOurs - r.azTheirs)))
  for (const r of mine) if (!worst || Math.abs(diff(r)) > Math.abs(diff(worst))) worst = r
  lines.push(`| ${code} | ${outcodes.outcodes[code][2]} | ${mine.length / 2} | ${Math.min(...d).toFixed(0)} to ${Math.max(...d).toFixed(0)} seconds | ${shownDiff.length} of ${mine.length} | ${az.toFixed(2)}° |`)
}
const all = rows.map(diff)
const within30 = all.filter((s) => Math.abs(s) <= 30).length
const shownAll = rows.filter((r) => clock(r.ours) !== clock(r.theirs))
lines.push(
  '',
  `**Largest difference:** ${diff(worst!).toFixed(0)} seconds, ${worst!.event} in ${worst!.code} on ${worst!.date}`,
  `(ours ${worst!.ours.toISOString().slice(11, 19)} UTC, MET Norway ${worst!.theirs.toISOString().slice(11, 16)} UTC).`,
  '',
  `**Within half a minute:** ${within30} of ${all.length} times. If MET Norway rounds to the nearest minute, as`,
  'this suggests, a difference of up to 30 seconds is only its rounding.',
  '',
  `**Shown differently:** ${shownAll.length} of ${rows.length} times would show a different minute.`,
  shownAll.length ? 'Each one, with our exact time:' : '',
  '',
  ...shownAll.map((r) => `- ${r.code} ${r.date} ${r.event}: ours ${r.ours.toISOString().slice(11, 19)} UTC (${clock(r.ours)}), MET Norway ${clock(r.theirs)}`),
  '',
  `**Directions:** the 16-point compass word differs on ${rows.filter((r) => compassPoint(r.azOurs) !== compassPoint(r.azTheirs)).length} of ${rows.length} times.`,
  '',
)
writeFileSync('design/metno-comparison.md', lines.join('\n'))
console.log(lines.slice(-12).join('\n'))
