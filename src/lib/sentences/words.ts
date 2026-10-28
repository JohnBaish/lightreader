// Small wording helpers shared by the sentence groups.

import { BAND_LABEL, type Band } from '../bands.ts'
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

/** A date in "Looking back", "Looking ahead" and "Is it light at…?" (John, 28 October): no
 *  weekday ("February 2nd"), except a date one to six days ahead, which gives it in brackets
 *  ("November 3rd (Tuesday)"); the year as for `dateIn`. */
function shortDate(ctx: SkyContext, date: string, withYear: boolean): string {
  const full = longDate(date, withYear)
  const space = full.indexOf(' ')
  const ahead = daysBetween(ctx.today, date)
  return ahead >= 1 && ahead <= 6 ? `${full.slice(space + 1)} (${full.slice(0, space)})` : full.slice(space + 1)
}
export const dayIn = (ctx: SkyContext, date: string) => shortDate(ctx, date, Math.abs(daysBetween(ctx.today, date)) > 300)

/** Two dates for "from … to …" in those groups: the year on both if either needs it. */
export function daysIn(ctx: SkyContext, a: string, b: string): [string, string] {
  const year = Math.abs(daysBetween(ctx.today, a)) > 300 || Math.abs(daysBetween(ctx.today, b)) > 300
  return [shortDate(ctx, a, year), shortDate(ctx, b, year)]
}

/** A light label inside a sentence, where it could be read as an ordinary word ("at its
 *  darkest the sky only reaches dark"). John, 27 October (option B): the page shows it as
 *  a small coloured tag matching the ribbon's key; anywhere else (`plainText`) it's in
 *  quotation marks. Written into the sentence as "{{dark}}". */
export const bandTag = (band: Band) => `{{${band}}}`

const TAG = /\{\{(daylight|half-light|dark|very-dark|true-night)\}\}/g

/** A sentence with its tags as plain text: "{{very-dark}}" becomes "very dark" in
 *  quotation marks. */
export const plainText = (s: string) => s.replace(TAG, (_, b: Band) => `"${BAND_LABEL[b].toLowerCase()}"`)

/** A sentence split into text and tags, for the page. */
export function sentenceParts(s: string): ({ text: string } | { band: Band })[] {
  const parts: ({ text: string } | { band: Band })[] = []
  let last = 0
  for (const m of s.matchAll(TAG)) {
    if (m.index > last) parts.push({ text: s.slice(last, m.index) })
    parts.push({ band: m[1] as Band })
    last = m.index + m[0].length
  }
  if (last < s.length) parts.push({ text: s.slice(last) })
  return parts
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
