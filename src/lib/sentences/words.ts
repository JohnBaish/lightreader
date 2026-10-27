// Small wording helpers shared by the sentence groups.

import { longDate } from '../format.ts'
import { numberWord } from '../words.ts'
import { daysBetween, type SkyContext } from './context.ts'

/** A date in a sentence: "Tuesday February 2nd", with the year only where it's needed
 *  (SPEC §4): when the date is more than 300 days from today. */
export const dateIn = (ctx: SkyContext, date: string) => longDate(date, Math.abs(daysBetween(ctx.today, date)) > 300)

/** Two dates for "from … to …": the year on both if either needs it. */
export function rangeIn(ctx: SkyContext, a: string, b: string): [string, string] {
  const year = Math.abs(daysBetween(ctx.today, a)) > 300 || Math.abs(daysBetween(ctx.today, b)) > 300
  return [longDate(a, year), longDate(b, year)]
}

/** "in nine days", "in 12 days", "tomorrow". */
export function inDays(n: number): string {
  if (n === 1) return 'tomorrow'
  return `in ${numberWord(n)} days`
}

/** A rate of change worded loosely, with no seconds (SPEC §6, Today): "nearly 4m",
 *  "about 3m", "more than 2m", "less than a minute". A draft for John (PLAN question 4). */
export function looseMinutes(seconds: number): string {
  const s = Math.abs(seconds)
  if (s < 60) return 'less than a minute'
  const whole = Math.floor(s / 60)
  const part = s / 60 - whole
  if (part >= 0.6) return `nearly ${whole + 1}m`
  if (part <= 0.2) return `about ${whole}m`
  return `more than ${whole}m`
}
