// "Pace of change" (John, 28 October, option A): how much daylight each day gains or loses
// against the day before, over the year card's span, and two or three sentences about it.
// Worked out in the worker with the year, from the same figures as everything else.

import { duration } from './format.ts'
import { dayOf, type SkyContext } from './sentences/context.ts'
import { dayIn } from './sentences/words.ts'
import { daylight } from './sun.ts'
import { addDays } from './ukTime.ts'

/** Days within this many seconds of the fastest count as tied with it (rule G), so the
 *  sentence says "around" the middle one. */
const NEAR_TIE_SECONDS = 0.5

export type Pace = {
  /** Each day of the span, with its daylight against the day before's, in seconds. */
  rows: { date: string; change: number }[]
  today: string
  sentences: string[]
}

/** "3m 40s", "40s": a day's change, to the second, kept on one line. */
export function rate(seconds: number): string {
  const s = Math.round(Math.abs(seconds))
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

export function pace(ctx: SkyContext, from: string, to: string): Pace {
  const change = (date: string) => (daylight(dayOf(ctx, date)) - daylight(dayOf(ctx, addDays(date, -1)))) / 1000
  const rows: Pace['rows'] = []
  for (let d = from; d <= to; d = addDays(d, 1)) rows.push({ date: d, change: change(d) })
  return { rows, today: ctx.today, sentences: paceSentences(ctx, change) }
}

function paceSentences(ctx: SkyContext, change: (date: string) => number): string[] {
  const today = ctx.today
  const now = change(today)
  const growing = now > 0
  const word = growing ? 'growing' : 'shrinking'
  const week = daylight(dayOf(ctx, addDays(today, 7))) - daylight(dayOf(ctx, today))
  const pct = Math.abs((week / daylight(dayOf(ctx, today))) * 100).toFixed(1)
  const out = [`Daylight is ${word} by ${rate(now)} a day, and by ${pct}% (${duration(week)}) over the next week.`]

  // This season (the days changing the same way as today) and its fastest day.
  const sameWay = (d: string) => (change(d) > 0) === growing
  let start = today
  while (sameWay(addDays(start, -1))) start = addDays(start, -1)
  let end = today
  while (sameWay(addDays(end, 1))) end = addDays(end, 1)
  const fastest = fastestIn(start, end, change)
  if (fastest.date > today) {
    out.push(`The most it ${growing ? 'grows' : 'shrinks'} in a year is ${rate(fastest.change)} a day, around ${dayIn(ctx, fastest.date)}.`)
  } else {
    // Once the fastest has passed, it was; and the other way's fastest is the one to come
    // (John, 28 October).
    out.push(`The most it ${growing ? 'grew' : 'shrank'} was ${rate(fastest.change)} a day, around ${dayIn(ctx, fastest.date)}.`)
    const nextStart = addDays(end, 1)
    let nextEnd = nextStart
    while (!sameWay(addDays(nextEnd, 1))) nextEnd = addDays(nextEnd, 1)
    const next = fastestIn(nextStart, nextEnd, change)
    out.push(`It will ${growing ? 'shrink' : 'grow'} fastest around ${dayIn(ctx, next.date)}, by ${rate(next.change)} a day.`)
  }
  return out
}

/** The fastest day from `start` to `end`; with near-ties, the middle one of them. */
function fastestIn(start: string, end: string, change: (date: string) => number): { date: string; change: number } {
  const days: { date: string; change: number }[] = []
  for (let d = start; d <= end; d = addDays(d, 1)) days.push({ date: d, change: change(d) })
  const top = Math.max(...days.map((d) => Math.abs(d.change)))
  const tied = days.filter((d) => top - Math.abs(d.change) <= NEAR_TIE_SECONDS)
  return tied[Math.floor((tied.length - 1) / 2)]
}
