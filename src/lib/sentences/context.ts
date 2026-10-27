// What every sentence group works from (PLAN stage 2): the place, today's UK date, the
// moment now, and the sun's figures for every day from about 13 months back to 13 months
// ahead, so the records ("since …") and "Coming up" can look far enough either way.
//
// The helpers here carry the rules shared by several groups: times compared by the clock
// to the second (rule A), the minute as shown (rule C), runs of days (rule B), near-ties
// (rule G) and clock changes.

import { roundToMinute } from '../format.ts'
import { daysFigures, type DayFigures, type Place } from '../sun.ts'
import { addDays, ukParts } from '../ukTime.ts'

export type SkyContext = {
  place: Place
  /** The place's name in sentences: "Reading". */
  name: string
  /** Today's UK date, "YYYY-MM-DD". */
  today: string
  now: Date
  /** Every day from `today` − LOOK_BACK to `today` + LOOK_AHEAD, in order. */
  days: DayFigures[]
}

export const LOOK_BACK = 400
export const LOOK_AHEAD = 400

export function makeContext(place: Place, name: string, now: Date): SkyContext {
  const today = ukParts(now).date
  return { place, name, today, now, days: daysFigures(place, addDays(today, -LOOK_BACK), addDays(today, LOOK_AHEAD)) }
}

/** The figures for `date`, which must be in the context's span. */
export function dayOf(ctx: SkyContext, date: string): DayFigures {
  const i = daysBetween(ctx.days[0].date, date)
  const d = ctx.days[i]
  if (!d || d.date !== date) throw new Error(`dayOf: ${date} is outside the span`)
  return d
}

/** Whole days from `a` to `b` (positive when `b` is later). */
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86_400_000)

/** Days after today, in order (`count` of them, from tomorrow). */
export const daysAhead = (ctx: SkyContext, count: number) => {
  const i = daysBetween(ctx.days[0].date, ctx.today)
  return ctx.days.slice(i + 1, i + 1 + count)
}

/** Days before today, most recent first (`count` of them, from yesterday). */
export const daysBack = (ctx: SkyContext, count: number) => {
  const i = daysBetween(ctx.days[0].date, ctx.today)
  return ctx.days.slice(Math.max(0, i - count), i).reverse()
}

/** Seconds after UK midnight by the clock, exactly: for comparing times of day (rule A). */
export function clockSeconds(at: Date): number {
  const p = ukParts(at)
  return p.hour * 3600 + p.minute * 60 + at.getUTCSeconds() + at.getUTCMilliseconds() / 1000
}

/** Minutes after UK midnight of the time as shown, rounded (rule C). Times shown as
 *  00:00 after a late evening count as 24:00. */
export function shown(at: Date, after = 0): number {
  const p = ukParts(roundToMinute(at))
  const m = p.hour * 60 + p.minute
  return m < after ? m + 24 * 60 : m
}

/** Minutes UK clocks are ahead of UTC on `date` at midday: 0 (GMT) or 60 (BST). */
export function offsetOn(date: string): number {
  const noon = new Date(date + 'T12:00:00Z')
  return ukParts(noon).hour * 60 + ukParts(noon).minute - 12 * 60
}

export const isBst = (date: string) => offsetOn(date) === 60

/** The clock changes (the Sunday the clocks change) from `from` to `to`, both included. */
export function clockChanges(from: string, to: string): { date: string; forward: boolean }[] {
  const out: { date: string; forward: boolean }[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const before = offsetOn(addDays(d, -1))
    const after = offsetOn(d)
    if (before !== after) out.push({ date: d, forward: after > before })
  }
  return out
}

/** The longest run of consecutive days around `centre` (an index into `list`) passing
 *  `test`, as [first, last] (rule B). */
export function runAround<T>(list: T[], centre: number, test: (d: T) => boolean): [T, T] {
  let a = centre
  let b = centre
  while (a > 0 && test(list[a - 1])) a--
  while (b < list.length - 1 && test(list[b + 1])) b++
  return [list[a], list[b]]
}

/** The days within a second of the best by `key` (lower is better), in date order:
 *  usually one, two when they're a near-tie (rule G). */
export function bestWithTies(list: DayFigures[], key: (d: DayFigures) => number): DayFigures[] {
  const best = Math.min(...list.map(key))
  return list.filter((d) => key(d) - best < 1)
}
