// "Is it light at…?" (SPEC §6): two sentences for each of the visitor's times, from today
// through the year ahead.
//
// "Light" is daylight or half-light; "dark" is anything after half-light (SPEC §4). Both
// use the minute shown (rule C): it's light at 07:30 when half-light starts at 07:30 or
// earlier, and dark at 17:30 when half-light ends at 17:30 or earlier (on the minute
// counts as reached). Likewise the sun is up at a time from the minute of sunrise until
// the minute before sunset. An "until" or "again from" caused by the clocks changing says
// so (SPEC §4, clock changes). When today is the last day, it says "from tomorrow".

import { clock } from '../format.ts'
import type { DayFigures } from '../sun.ts'
import { addDays } from '../ukTime.ts'
import { bestWithTies, clockSeconds, dayOf, daysAhead, offsetOn, shown, type SkyContext } from './context.ts'
import { dateIn } from './words.ts'

/** A time of day as "HH:MM", e.g. "07:30". */
export type TimeOfDay = string

const minutesOf = (t: TimeOfDay) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))

/** Light (daylight or half-light) at `t` on day `d`, by the minutes shown. */
export function lightAt(d: DayFigures, t: number): boolean {
  const from = d.civilDawn ? shown(d.civilDawn) : 0 // no civil dawn: half-light all night
  const to = d.civilDusk ? shown(d.civilDusk, 12 * 60) : 24 * 60
  return t >= from && t < to
}

/** The sun up at `t` on day `d`, by the minutes shown. */
export function sunUpAt(d: DayFigures, t: number): boolean {
  if (!d.sunrise || !d.sunset) return false
  return t >= shown(d.sunrise) && t < shown(d.sunset, 12 * 60)
}

/** The year from today: today and the next 365 days. */
const year = (ctx: SkyContext) => [dayOf(ctx, ctx.today), ...daysAhead(ctx, 365)]

/** Where today's state at `t` first changes, if it does within the year: the last day
 *  of the run, and whether the clocks changing ended it. */
function change(days: DayFigures[], test: (d: DayFigures) => boolean): { last: DayFigures; byClocks: boolean } | null {
  const now = test(days[0])
  const i = days.findIndex((d) => test(d) !== now)
  if (i < 0) return null
  return { last: days[i - 1], byClocks: offsetOn(days[i].date) !== offsetOn(days[i - 1].date) }
}

const clockWords = (ctx: SkyContext, firstOfNew: string) =>
  `the clocks go ${offsetOn(firstOfNew) > offsetOn(addDays(firstOfNew, -1)) ? 'forward' : 'back'} on ${dateIn(ctx, firstOfNew)}`

export function lightAtSentences(ctx: SkyContext, time: TimeOfDay): string[] {
  const t = minutesOf(time)
  const days = year(ctx)
  const morning = t < shown(days[0].noon)
  return [lightSentence(ctx, days, time, t, morning), sunSentence(ctx, days, time, t, morning)]
}

/** "It's dark at 17:30 until Monday February 1st." / "It's light at 07:30 until …" /
 *  "07:30 is always at least half-light here. Even on the darkest morning, Friday January
 *  1st, half-light starts at 07:29." */
function lightSentence(ctx: SkyContext, days: DayFigures[], time: TimeOfDay, t: number, morning: boolean): string {
  const light = lightAt(days[0], t)
  const c = change(days, (d) => lightAt(d, t))
  if (c && c.last.date === ctx.today) return `From tomorrow it's ${light ? 'dark' : 'light'} at ${time}.`
  if (c) {
    const state = light ? 'light' : 'dark'
    const end = c.byClocks ? `until ${clockWords(ctx, addDays(c.last.date, 1))}` : `until ${dateIn(ctx, c.last.date)}`
    return `It's ${state} at ${time} ${end}.`
  }
  if (!light) return `It's always dark at ${time} here.`
  // Always light: name the darkest morning (latest half-light start) or evening (earliest end).
  const event = morning ? 'civilDawn' : 'civilDusk'
  const withEvent = days.filter((d) => d[event])
  if (withEvent.length === 0) return `${time} is always at least half-light here.`
  const worst = bestWithTies(withEvent, (d) => (morning ? -1 : 1) * clockSeconds(d[event]!))
  const names = worst.map((d) => dateIn(ctx, d.date)).join(' and ')
  const verb = morning ? 'starts' : 'ends'
  const which = morning ? 'morning' : 'evening'
  const nameWords = worst.length > 1 ? `the darkest ${which}s, ${names}` : `the darkest ${which}, ${names}`
  return `${time} is always at least half-light here. Even on ${nameWords}, half-light ${verb} at ${clock(worst[0][event]!)}.`
}

/** "The sun is up by 07:30 until Friday November 20th." / "The sun is up at 17:30 again
 *  from Monday February 22nd." / "The sun is still up at 17:30 until …" / "The sun is up
 *  by 07:30 again from …" */
function sunSentence(ctx: SkyContext, days: DayFigures[], time: TimeOfDay, t: number, morning: boolean): string {
  const up = sunUpAt(days[0], t)
  const c = change(days, (d) => sunUpAt(d, t))
  const by = morning ? 'up by' : 'up at'
  if (!c) return up ? `The sun is always ${by} ${time} here.` : `The sun is never up at ${time} here.`
  const next = addDays(c.last.date, 1)
  if (c.last.date === ctx.today) {
    if (up) return morning ? `Today is the last day the sun is up by ${time}.` : `Today is the last day the sun is still up at ${time}.`
    return `The sun is ${by} ${time} again from tomorrow.`
  }
  if (up) {
    const end = c.byClocks ? `until ${clockWords(ctx, next)}` : `until ${dateIn(ctx, c.last.date)}`
    return morning ? `The sun is up by ${time} ${end}.` : `The sun is still up at ${time} ${end}.`
  }
  const from = c.byClocks ? `from ${dateIn(ctx, next)}, when the clocks go ${offsetOn(next) > offsetOn(c.last.date) ? 'forward' : 'back'}` : `from ${dateIn(ctx, next)}`
  return `The sun is ${by} ${time} again ${from}.`
}
