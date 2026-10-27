// "Records and runs" (SPEC §6, rule A): "The earliest sunset since Wednesday January 28th."
//
// Rule A: compared to the second, by the clock; shown only when the day it goes back to is
// at least 30 days ago. When that day is the one just before a clock change (so the record
// is only there because the clocks changed), it says "since the clocks went back" instead
// of the date; with today's examples that's always less than 30 days, so it's hidden. A
// record against the way the times are going (the clocks' doing) isn't shown at all.
// "Today's daylight matches …'s" replaces "The shortest (longest) day since …" when both
// would show.

import { duration } from '../format.ts'
import { daylight, type DayFigures } from '../sun.ts'
import { addDays } from '../ukTime.ts'
import { clockSeconds, dayOf, daysBack, daysBetween, offsetOn, runAround, type SkyContext } from './context.ts'
import { dateIn } from './words.ts'

export const RECORD_MIN_DAYS = 30

type Measure = { key: (d: DayFigures) => number | null; low: string; high: string }

const MEASURES: Measure[] = [
  { key: (d) => (d.sunset ? clockSeconds(d.sunset) : null), low: 'earliest sunset', high: 'latest sunset' },
  { key: (d) => (d.sunrise && d.sunset ? daylight(d) / 1000 : null), low: 'shortest day', high: 'longest day' },
  { key: (d) => (d.sunrise ? clockSeconds(d.sunrise) : null), low: 'earliest sunrise', high: 'latest sunrise' },
]

export function recordSentences(ctx: SkyContext): string[] {
  const today = dayOf(ctx, ctx.today)
  const past = daysBack(ctx, ctx.days.length)
  const out: string[] = []

  for (const m of MEASURES) {
    const now = m.key(today)
    if (now === null) continue
    // The way it's going: from yesterday, or on a clock-change day, towards tomorrow.
    const changeToday = offsetOn(addDays(ctx.today, -1)) !== offsetOn(ctx.today)
    const other = m.key(dayOf(ctx, addDays(ctx.today, changeToday ? 1 : -1)))
    const falling = other !== null && (changeToday ? other < now : other > now)
    for (const [label, beats, low] of [[m.low, (v: number) => v < now, true], [m.high, (v: number) => v > now, false]] as const) {
      // A record against the way it's going is only the clocks changing ("the earliest
      // sunrise since September" just after they go back, while sunrises get later).
      if (low !== falling) continue
      const d = past.find((p) => {
        const v = m.key(p)
        return v !== null && beats(v)
      })
      if (!d || daysBetween(d.date, ctx.today) < RECORD_MIN_DAYS) continue
      const acrossChange = offsetOn(d.date) !== offsetOn(addDays(d.date, 1))
      if (acrossChange) {
        out.push(`The ${label} since the clocks went ${offsetOn(d.date) > offsetOn(addDays(d.date, 1)) ? 'back' : 'forward'}.`)
      } else if (daysBetween(d.date, ctx.today) >= 365) {
        // A year or more back: "The shortest day for a year." (John, 27 October)
        out.push(`The ${label} for ${daysBetween(d.date, ctx.today) > 366 ? 'more than a year' : 'a year'}.`)
      } else {
        out.push(`The ${label} since ${dateIn(ctx, d.date)}.`)
      }
    }
  }

  // "Today's daylight matches Saturday February 14th's." The most recent day from 30 to
  // 300 days ago (the other side of the solstice, not last year) with the same daylight
  // as shown; in a run of such days, the closest exactly.
  const shownToday = duration(daylight(today))
  const recent = past.filter((p) => daysBetween(p.date, ctx.today) >= RECORD_MIN_DAYS && daysBetween(p.date, ctx.today) <= 300)
  const i = recent.findIndex((p) => duration(daylight(p)) === shownToday)
  if (i >= 0) {
    const [a, b] = runAround(recent, i, (p) => duration(daylight(p)) === shownToday)
    const run = recent.slice(recent.indexOf(a), recent.indexOf(b) + 1)
    const closest = run.sort((x, y) => Math.abs(daylight(x) - daylight(today)) - Math.abs(daylight(y) - daylight(today)))[0]
    // It says what "the shortest day since …" says, better (John, 27 October), so that
    // one goes.
    return [...out.filter((s) => !/^The (shortest|longest) day since /.test(s)), `Today's daylight matches ${dateIn(ctx, closest.date)}'s.`]
  }
  return out
}
