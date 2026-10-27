// The year (SPEC §9, mock-ups option C then option B): the year ribbon, six months back to
// six months ahead, each day an upright strip of the light from midnight to midnight by the
// UK clock, and the day-by-day tables, a whole month at a time for the 13 months it touches.
//
// Everything is worked out in the worker (src/lib/sentences.worker.ts) from the same
// figures as the sentences, and each change of light is taken at the minute shown, so the
// ribbon, the tables and the sentences never disagree (rule C).

import { BAND_AFTER, bandAt, type Band, type Change } from './bands.ts'
import { clock, duration, longDate } from './format.ts'
import { clockChanges, dayOf, type SkyContext } from './sentences/context.ts'
import { daylight } from './sun.ts'
import { addDays, ukInstant, ukParts } from './ukTime.ts'

/** One stretch of a day's strip, in minutes after midnight by the clock (0 to 1440). On the
 *  day the clocks change the strip shows the clock as it reads, so the year's picture
 *  steps there. */
export type Stretch = { from: number; to: number; band: Band }

/** One row of a month's table, every time as shown on the page ("06:48"), or null where it
 *  doesn't happen (rule E; the page says so in words). */
export type DayRow = {
  date: string
  civilDawn: string | null
  sunrise: string | null
  sunset: string | null
  civilDusk: string | null
  nauticalDusk: string | null
  daylight: string
}

export type ClockMark = { date: string; text: string }

export type YearView = {
  /** The ribbon's first and last days (six months either side of today, both included). */
  from: string
  to: string
  today: string
  ribbon: Stretch[][]
  /** Each month the span touches ("2026-04" … "2027-04"), with every day of it. */
  months: { month: string; rows: DayRow[]; clockMarks: ClockMark[] }[]
}

const show = (at: Date | null) => (at ? clock(at) : null)

/** Minutes after midnight on the clock at `at` (minutes, as `at` is rounded to the minute). */
const clockMinutes = (at: Date) => {
  const p = ukParts(at)
  return p.hour * 60 + p.minute
}

/** One day's strip, from UK midnight to the next, from the year's changes. `first` is where
 *  to start looking in `changes` (the days are worked out in order); the strip and where
 *  the next day should start looking are returned. */
function dayStrip(changes: Change[], date: string, first: number): [Stretch[], number] {
  const start = ukInstant(date, 0)
  const end = ukInstant(addDays(date, 1), 0)
  // On an ordinary day the clock reads the minutes since midnight; only on the two days the
  // clocks change does it need looking up.
  const ordinary = end.getTime() - start.getTime() === 1440 * 60_000
  const minutesAt = (at: Date) => (ordinary ? Math.round((at.getTime() - start.getTime()) / 60_000) : clockMinutes(at))
  let i = first
  while (i < changes.length && changes[i].at <= start) i++
  const out: Stretch[] = []
  let band = bandAt(changes.slice(Math.max(0, i - 1), i), start)
  let from = 0
  for (; i < changes.length && changes[i].at < end; i++) {
    const c = changes[i]
    const at = minutesAt(c.at)
    // The hour the clocks go back runs twice; the strip can't show both, so the second
    // pass simply continues from where the first ended.
    if (at > from) out.push({ from, to: at, band })
    else if (out.length) out[out.length - 1].band = band
    band = BAND_AFTER[c.kind]
    from = Math.max(from, at)
  }
  out.push({ from, to: 1440, band })
  return [out, i]
}

/** "Clocks went back on Sunday October 25th. Times from here are GMT." */
export function clockMarkText(date: string, forward: boolean, today: string): string {
  const verb = date <= today ? (forward ? 'went forward' : 'went back') : (forward ? 'go forward' : 'go back')
  return `Clocks ${verb} on ${longDate(date)}. Times from here are ${forward ? 'BST' : 'GMT'}.`
}

export function yearView(ctx: SkyContext, from: string, to: string, changes: Change[]): YearView {
  const ribbon: Stretch[][] = []
  let next = 0
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const [strip, i] = dayStrip(changes, d, Math.max(0, next - 1))
    ribbon.push(strip)
    next = i
  }

  const months: YearView['months'] = []
  for (let m = from.slice(0, 7); m <= to.slice(0, 7); m = addDays(m + '-28', 7).slice(0, 7)) {
    const rows: DayRow[] = []
    for (let d = m + '-01'; d.startsWith(m); d = addDays(d, 1)) {
      const f = dayOf(ctx, d)
      rows.push({
        date: d,
        civilDawn: show(f.civilDawn),
        sunrise: show(f.sunrise),
        sunset: show(f.sunset),
        civilDusk: show(f.civilDusk),
        nauticalDusk: show(f.nauticalDusk),
        daylight: duration(daylight(f)),
      })
    }
    const clockMarks = clockChanges(m + '-01', rows[rows.length - 1].date)
      .map((c) => ({ date: c.date, text: clockMarkText(c.date, c.forward, ctx.today) }))
    months.push({ month: m, rows, clockMarks })
  }
  return { from, to, today: ctx.today, ribbon, months }
}

/** The detail card's line under the times: "9h 58m of daylight. Half-light 06:14 to 17:21;
 *  very dark from 18:00." Missing times are said in words (rule E). */
export function dayDetail(r: DayRow): string {
  const half = r.civilDawn && r.civilDusk ? `Half-light ${r.civilDawn} to ${r.civilDusk}` : 'Half-light all night'
  const dark = r.nauticalDusk ? `very dark from ${r.nauticalDusk}` : 'the sky never gets very dark'
  return `${r.daylight} of daylight. ${half}; ${dark}.`
}
