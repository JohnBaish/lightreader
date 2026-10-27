// Compare (SPEC §8, mock-up option C): one box takes a date or a place, and the page
// compares today with it, in sentences only.
//
// Dates are read with chrono (en-GB, day before month), plus the spec's own words:
// "Christmas", "Christmas Day", "longest day" and "shortest day" (the longest and shortest
// for the place, worked out, not fixed dates). A bare date means the next one; "last"
// before it means the one before. Places: an English postcode, or one of the big places in
// src/data/ukPlaces.json by name (John, 27 October: places outside England "if easily
// done", each at its town centre).

import { en } from 'chrono-node'
import { clock, duration, longDate } from './format.ts'
import { district, outwardCode } from './postcode.ts'
import { clockSeconds, isBst } from './sentences/context.ts'
import { daylight, daysFigures, type DayFigures, type Place } from './sun.ts'
import { UK_PLACES } from './ukPlaces.ts'
import { addDays, ukParts } from './ukTime.ts'

export type Target =
  | { kind: 'date'; date: string }
  | { kind: 'place'; place: Place; name: string }
  | { kind: 'error'; message: string }

const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

/** The next (or, with `last`, the previous) longest or shortest day for `place`, from the
 *  daylight of the 11 days around each solstice. */
function solsticeDay(place: Place, today: string, longest: boolean, last: boolean): string {
  const year = Number(today.slice(0, 4))
  const month = longest ? '06' : '12'
  const candidates: string[] = []
  for (const y of [year - 1, year, year + 1]) {
    const days = daysFigures(place, `${y}-${month}-16`, `${y}-${month}-26`)
    const best = days.reduce((a, b) => ((daylight(b) > daylight(a)) === longest ? b : a))
    candidates.push(best.date)
  }
  return last ? candidates.filter((d) => d < today).at(-1)! : candidates.find((d) => d >= today)!
}

/** What someone typed, as a date or a place to compare with. */
export function readTarget(typed: string, place: Place, today: string): Target {
  const raw = typed.trim()
  if (!raw) return { kind: 'error', message: 'Type a date or a place first.' }
  let text = raw.toLowerCase().replace(/\s+/g, ' ')

  // A place: an English postcode, or a big place by name. A saved comparison keeps a
  // postcode district under its name, "Penzance (TR18)".
  const code = outwardCode(raw.match(/\(([A-Za-z0-9 ]+)\)$/)?.[1] ?? raw)
  if (code) {
    const d = district(code)
    if (d) return { kind: 'place', place: d, name: `${d.name} (${d.code})` }
    if (/\d/.test(raw)) return { kind: 'error', message: `${code} isn't a postcode district in England. Try a place name, such as Aberdeen.` }
  }
  const named = UK_PLACES.find((p) => p.name.toLowerCase() === text)
  if (named) return { kind: 'place', place: named, name: named.name }

  // "last …": the one before, not the next.
  const last = text.startsWith('last ')
  if (last) text = text.slice(5)

  if (text === 'christmas' || text === 'christmas day') {
    const year = Number(today.slice(0, 4))
    const thisYear = iso(year, 12, 25)
    if (last) return { kind: 'date', date: thisYear < today ? thisYear : iso(year - 1, 12, 25) }
    return { kind: 'date', date: thisYear >= today ? thisYear : iso(year + 1, 12, 25) }
  }
  if (text === 'longest day' || text === 'shortest day') return { kind: 'date', date: solsticeDay(place, today, text === 'longest day', last) }

  // "march 28" would be read as March of the year 28; "28 march" is meant.
  text = text.replace(/^([a-z]+) (\d{1,2})$/, '$2 $1')

  const ref = new Date(today + 'T12:00:00Z')
  const found = en.GB.parse(text, ref, { forwardDate: !last })[0]
  if (!found || found.text.length < text.length - 1) {
    return { kind: 'error', message: "That isn't a date or place Lightreader knows. Try one like Christmas, 14/7 or TR18." }
  }
  const s = found.start
  let date = iso(s.get('year')!, s.get('month')!, s.get('day')!)
  // "last July 14th": the most recent one before today.
  if (last && !s.isCertain('year')) {
    const y = Number(date.slice(0, 4))
    for (const yy of [y + 1, y, y - 1, y - 2]) {
      const d = iso(yy, s.get('month')!, s.get('day')!)
      if (d < today) { date = d; break }
    }
  }
  return { kind: 'date', date }
}


// ---------------------------------------------------------------------------------------
// The sentences (SPEC §8): from exact times, by the clock (rule H); tense follows the date
// and the time of day (rule F).

/** "1h 20m later", "47m earlier", by the clock, from exact times. */
function by(a: Date, b: Date): string {
  const s = clockSeconds(a) - clockSeconds(b)
  if (Math.abs(s) < 60) return 'at the same time'
  return `${duration(s * 1000)} ${s > 0 ? 'later' : 'earlier'}`
}

/** The BST note, when the two dates are on different clocks (SPEC §8): "July times are in
 *  BST, an hour ahead of today's GMT." */
export function clockNote(today: string, other: string): string | null {
  if (isBst(today) === isBst(other)) return null
  const month = longDate(other).split(' ')[1]
  return isBst(other) ? `${month} times are in BST, an hour ahead of today's GMT.` : `${month} times are in GMT, an hour behind today's BST.`
}

/** Comparing today with another date, here (SPEC §8). */
export function compareDate(here: DayFigures, there: DayFigures, today: string): string[] {
  if (!here.sunrise || !here.sunset || !there.sunrise || !there.sunset) return []
  const name = longDate(there.date)
  const diff = daylight(there) - daylight(here)
  const more = Math.abs(diff) < 60_000 ? null : `${duration(diff)} ${diff > 0 ? 'more' : 'less'}`
  if (there.date > today) {
    const out = [
      `On ${name} the sun rises at ${clock(there.sunrise)}, ${by(there.sunrise, here.sunrise)} than today.`,
      `It sets at ${clock(there.sunset)}, ${by(there.sunset, here.sunset)}.`,
    ]
    if (there.civilDusk && here.civilDusk) out.push(`Half-light ends at ${clock(there.civilDusk)}, ${by(there.civilDusk, here.civilDusk)}.`)
    else if (!there.civilDusk) out.push('Half-light lasts all night.')
    out.push(more ? `That's ${more} daylight: ${duration(daylight(there))} in all.` : `That's much the same daylight: ${duration(daylight(there))} in all.`)
    if (!there.astronomicalDusk) out.push("There's no true night.")
    return out.map(tidy)
  }
  const out = [`On ${name} the sun rose at ${clock(there.sunrise)}, ${by(there.sunrise, here.sunrise)} than today, and set at ${clock(there.sunset)}, ${by(there.sunset, here.sunset)}.`]
  if (there.civilDusk && here.civilDusk) out.push(`Half-light ended at ${clock(there.civilDusk)}, ${by(there.civilDusk, here.civilDusk)} than today.`)
  else if (!there.civilDusk) out.push('Half-light lasted all night.')
  out.push(more ? `There was ${more} daylight: ${duration(daylight(there))} in all.` : `There was much the same daylight: ${duration(daylight(there))} in all.`)
  if (!there.astronomicalDusk) out.push('There was no true night.')
  return out.map(tidy)
}

/** Comparing here with another place, today (SPEC §8). Each verb's tense follows whether
 *  that moment has passed there yet (rule F). */
export function comparePlace(here: DayFigures, there: DayFigures, hereName: string, thereName: string, now: Date): string[] {
  if (!here.sunrise || !here.sunset || !there.sunrise || !there.sunset) return []
  const past = (at: Date) => at <= now
  const rose = past(there.sunrise) ? 'rose' : 'rises'
  const sets = past(there.sunset) ? 'set' : 'sets'
  const out = [
    `In ${thereName} today the sun ${rose} at ${clock(there.sunrise)}, ${by(there.sunrise, here.sunrise)} than in ${hereName}.`,
    `It ${sets} at ${clock(there.sunset)}, ${by(there.sunset, here.sunset)}.`,
  ]
  if (there.civilDusk && here.civilDusk) out.push(`Half-light ${past(there.civilDusk) ? 'ended' : 'ends'} at ${clock(there.civilDusk)}, ${by(there.civilDusk, here.civilDusk)}.`)
  else if (!there.civilDusk) out.push('Half-light lasts all night there.')
  const diff = daylight(there) - daylight(here)
  out.push(Math.abs(diff) < 60_000 ? `That's much the same daylight: ${duration(daylight(there))} in all.` : `That's ${duration(diff)} ${diff > 0 ? 'more' : 'less'} daylight: ${duration(daylight(there))} in all.`)
  return out.map(tidy)
}

/** "at the same time than today" reads badly; say it plainly. */
const tidy = (s: string) => s.replace(/at the same time than (today|in [^.,]+)/g, 'at the same time as $1')

/** The day a date stands for, with its neighbours, for the paired ribbons. */
export function dayWithNeighbours(place: Place, date: string): DayFigures[] {
  return daysFigures(place, addDays(date, -1), addDays(date, 1))
}

/** Today's UK date. */
export const ukToday = (now: Date) => ukParts(now).date
