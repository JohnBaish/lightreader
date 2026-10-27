// "Is it light at…?" (SPEC §6, mock-up option B of "your times"): for one of the visitor's
// times, the light at that time today (the pill) and on every day of the year (the thin
// strip), with the two sentences.
//
// The strip uses each change of light rounded to the minute shown, so a change shown as
// 07:30 counts as reached at 07:30 (rule C), and the strip never disagrees with the
// sentences or the tables.

import { bandAt, timeline, type Band } from './bands.ts'
import { roundToMinute } from './format.ts'
import { lightAtSentences } from './sentences/lightAt.ts'
import { daysBetween, type SkyContext } from './sentences/context.ts'
import { daysFigures, type Place } from './sun.ts'
import { addDays, ukInstant } from './ukTime.ts'
import { addMonths } from './year.ts'

export type LightAt = {
  time: string
  /** The light at this time today. */
  today: Band
  /** The light at this time on each day from `from`, six months back, to six months ahead. */
  strip: Band[]
  from: string
  /** Where today falls in the strip. */
  todayIndex: number
  /** The first of each month in the strip: its index and month (0 to 11). */
  months: { index: number; month: number }[]
  sentences: string[]
}

/** The moment UK clocks show `time` ("HH:MM") on `date`. */
export const instantAt = (date: string, time: string) =>
  new Date(ukInstant(date, Number(time.slice(0, 2))).getTime() + Number(time.slice(3, 5)) * 60_000)

/** The year's changes of light for a place, each at the minute shown. Worked out once per
 *  place and day, for all the visitor's times and the year ribbon; with `ctx`, from the
 *  figures the sentences already hold. */
export function yearChanges(place: Place, today: string, ctx?: SkyContext) {
  const from = addMonths(today, -6)
  const to = addMonths(today, 6)
  const days = ctx
    ? ctx.days.slice(daysBetween(ctx.days[0].date, addDays(from, -1)), daysBetween(ctx.days[0].date, addDays(to, 1)) + 1)
    : daysFigures(place, addDays(from, -1), addDays(to, 1))
  const changes = timeline(days).map((c) => ({ ...c, at: roundToMinute(c.at) }))
  return { from, to, changes }
}

export function lightAtYear(ctx: SkyContext, year: ReturnType<typeof yearChanges>, time: string): LightAt {
  const strip: Band[] = []
  const months: { index: number; month: number }[] = []
  let i = 0
  for (let d = year.from; d <= year.to; d = addDays(d, 1), i++) {
    strip.push(bandAt(year.changes, instantAt(d, time)))
    if (d.endsWith('-01')) months.push({ index: i, month: Number(d.slice(5, 7)) - 1 })
  }
  return {
    time,
    today: bandAt(year.changes, instantAt(ctx.today, time)),
    strip,
    from: year.from,
    todayIndex: Math.round((Date.parse(ctx.today) - Date.parse(year.from)) / 86_400_000),
    months,
    sentences: lightAtSentences(ctx, time),
  }
}
