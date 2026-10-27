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
import { compassPoint } from '../src/lib/format.ts'
import { addDays } from '../src/lib/ukTime.ts'

const YEAR = 2027
const CODES = ['TR18', 'RG1', 'NR1', 'M1', 'NE1', 'TD15'] // Penzance to Berwick
const AGENT = 'Lightreader/0.1 (+https://github.com/JohnBaish/lightreader)'

type Answer = { sunrise: { time: string; azimuth: number } | null; sunset: { time: string; azimuth: number } | null }

const outcodes = JSON.parse(readFileSync('src/data/outcodes.json', 'utf8')) as { outcodes: Record<string, [number, number, string]> }
const cache = process.argv[2]
if (cache) mkdirSync(cache, { recursive: true })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const cacheFile = (code: string, date: string) => (cache ? join(cache, `${code}-${date}.json`) : null)
const cached = (code: string, date: string) => { const f = cacheFile(code, date); return f !== null && existsSync(f) }

async function ask(code: string, place: Place, date: string): Promise<Answer> {
  const file = cacheFile(code, date)
  if (file && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as Answer
  const url = `https://api.met.no/weatherapi/sunrise/3.0/sun?lat=${place.latitude}&lon=${place.longitude}&date=${date}&offset=+00:00`
  for (let attempt = 1; ; attempt++) {
    // A dropped connection is retried like a refused request.
    const res = await fetch(url, { headers: { 'User-Agent': AGENT } }).catch((e: Error) => {
      if (attempt === 3) throw e
      return null
    })
    if (res?.ok) {
      const body = (await res.json()) as { properties: Answer }
      const answer = { sunrise: body.properties.sunrise ?? null, sunset: body.properties.sunset ?? null }
      if (file) writeFileSync(file, JSON.stringify(answer))
      return answer
    }
    if (attempt === 3) throw new Error(`MET Norway ${res?.status} for ${code} ${date}`)
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
    if (!cached(code, date)) {
      const start = Math.max(Date.now(), lastStart + 250)
      lastStart = start
      if (start > Date.now()) await sleep(start - Date.now())
    }
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

// MET Norway's minute turns out to be the time with its seconds dropped (its times run from
// about 60 seconds before ours to a few seconds after), so its "06:48" means some time from
// 06:48:00 to 06:48:59. "Outside" is how far our exact time lies outside that minute, in
// seconds: 0 when it is inside, negative when ours is earlier, positive when later.
const MINUTE = 60_000
const outside = (r: Row) => {
  const from = r.theirs.getTime()
  const t = r.ours.getTime()
  return t < from ? (t - from) / 1000 : t >= from + MINUTE ? (t - from - MINUTE) / 1000 : 0
}
const raw = (r: Row) => (r.theirs.getTime() - r.ours.getTime()) / 1000
const lines: string[] = [
  `# Lightreader against MET Norway, ${YEAR}`,
  '',
  `Made by \`npm run compare-metno\` on ${new Date().toISOString().slice(0, 10)}: every sunrise and sunset of ${YEAR}`,
  'for six postcode districts, from Lightreader\'s calculation (Astronomy Engine) and from MET Norway\'s',
  'Sunrise 3.0 API. MET Norway gives times to the minute; ours are to the second.',
  '',
  'MET Norway\'s times run from about a minute before ours to a few seconds after, so it drops the',
  'seconds rather than rounding: its "06:48" means some time from 06:48:00 to 06:48:59. So the fair',
  'test is whether our exact time falls inside MET Norway\'s minute, and if not, by how many seconds',
  'it misses. Lightreader itself rounds to the nearest minute (SPEC §4), so the page will often show',
  'a minute later than MET Norway\'s own pages; that is the rounding, not a disagreement.',
  '',
  '| District | Place | Times | MET Norway minus ours | Outside MET Norway\'s minute | By at most | Direction, largest difference |',
  '|---|---|---|---|---|---|---|',
]
let worst: Row | null = null
for (const code of CODES) {
  const mine = rows.filter((r) => r.code === code)
  const out = mine.filter((r) => outside(r) !== 0)
  const most = Math.max(0, ...mine.map((r) => Math.abs(outside(r))))
  const az = Math.max(...mine.map((r) => Math.abs(r.azOurs - r.azTheirs)))
  for (const r of mine) if (!worst || Math.abs(outside(r)) > Math.abs(outside(worst))) worst = r
  lines.push(`| ${code} | ${outcodes.outcodes[code][2]} | ${mine.length} | ${Math.min(...mine.map(raw)).toFixed(0)} to ${Math.max(...mine.map(raw)).toFixed(0)} seconds | ${out.length} | ${most.toFixed(1)} seconds | ${az.toFixed(2)}° |`)
}
const misses = rows.filter((r) => outside(r) !== 0)
lines.push(
  '',
  `**Largest difference:** our ${worst!.event} in ${worst!.code} on ${worst!.date} is ${Math.abs(outside(worst!)).toFixed(1)} seconds`,
  `${outside(worst!) < 0 ? 'before' : 'after'} MET Norway's minute (ours ${worst!.ours.toISOString().slice(11, 19)} UTC, MET Norway ${worst!.theirs.toISOString().slice(11, 16)} UTC).`,
  '',
  `**Outside MET Norway's minute:** ${misses.length} of ${rows.length} times; ${misses.filter((r) => outside(r) < 0).length} earlier, ${misses.filter((r) => outside(r) > 0).length} later.`,
  '',
  `**Directions:** the 16-point compass word differs on ${rows.filter((r) => compassPoint(r.azOurs) !== compassPoint(r.azTheirs)).length} of ${rows.length} times`,
  '(an azimuth within a few hundredths of a degree of a boundary between two points):',
  '',
  ...rows.filter((r) => compassPoint(r.azOurs) !== compassPoint(r.azTheirs))
    .map((r) => `- ${r.code} ${r.date} ${r.event}: ours ${r.azOurs.toFixed(3)}° (${compassPoint(r.azOurs)}), MET Norway ${r.azTheirs.toFixed(2)}° (${compassPoint(r.azTheirs)})`),
  '',
)
writeFileSync('design/metno-comparison.md', lines.join('\n'))
console.log(lines.slice(11).join('\n'))
