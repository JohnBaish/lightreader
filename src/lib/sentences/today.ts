// "Today" (SPEC §6): the day's sunrise, sunset and daylight; tonight's dark hours; and how
// fast the days are changing.

import { clock, duration } from '../format.ts'
import { daylight } from '../sun.ts'
import { addDays } from '../ukTime.ts'
import { dayOf, daysAhead, type SkyContext } from './context.ts'
import { bandTag, looseMinutes } from './words.ts'

export function todaySentences(ctx: SkyContext): string[] {
  const today = dayOf(ctx, ctx.today)
  const tomorrow = dayOf(ctx, addDays(ctx.today, 1))
  const out: string[] = []

  // "Sunrise 06:48, sunset 16:46: 9h 58m of daylight."
  if (today.sunrise && today.sunset) {
    out.push(`Sunrise ${clock(today.sunrise)}, sunset ${clock(today.sunset)}: ${duration(daylight(today))} of daylight.`)
  }

  // "Very dark or true night from 18:00 to 05:36." (the sun 12° or more below)
  if (today.nauticalDusk && tomorrow.nauticalDawn) {
    const what = today.astronomicalDusk ? 'Very dark or true night' : 'Very dark'
    out.push(`${what} from ${clock(today.nauticalDusk)} to ${clock(tomorrow.nauticalDawn)}.`)
  } else if (today.civilDusk && tomorrow.civilDawn) {
    // Too far north in midsummer for the sky to get very dark (rule E: never a blank).
    out.push(`The sky never reaches ${bandTag('very-dark')} tonight: it's ${bandTag('dark')} from ${clock(today.civilDusk)} to ${clock(tomorrow.civilDawn)}.`)
  }

  const rate = rateSentence(ctx)
  if (rate) out.push(rate)
  return out
}

/** How fast daylight is changing (a draft for John, PLAN question 4):
 *  - "Days are shortening by nearly 4m a day, close to the fastest they ever change."
 *    (the spec's wording, when the change is at least 90% of the year's fastest)
 *  - "Days are lengthening by about 2m a day."
 *  - near the solstices: "Days are lengthening by less than a minute a day, just after
 *    the shortest day." / "…, as the shortest day nears."
 *  - on the solstice: "Today is the shortest day of the year: days start lengthening
 *    tomorrow." */
export function rateSentence(ctx: SkyContext): string | null {
  const yesterday = dayOf(ctx, addDays(ctx.today, -1))
  const today = dayOf(ctx, ctx.today)
  const tomorrow = dayOf(ctx, addDays(ctx.today, 1))
  const change = (daylight(today) - daylight(yesterday)) / 1000
  const next = (daylight(tomorrow) - daylight(today)) / 1000

  if (change < 0 && next >= 0) return 'Today is the shortest day of the year: days start lengthening tomorrow.'
  if (change > 0 && next <= 0) return 'Today is the longest day of the year: days start shortening tomorrow.'

  const way = change < 0 ? 'shortening' : 'lengthening'
  if (Math.abs(change) < 60) {
    // Which solstice is near: the one ahead if the change is slowing, else the one just past.
    const slowing = Math.abs(next) < Math.abs(change)
    const solstice = (change < 0) === slowing ? 'shortest' : 'longest'
    const when = slowing ? `as the ${solstice} day nears` : `just after the ${solstice} day`
    return `Days are ${way} by less than a minute a day, ${when}.`
  }

  // The year's fastest change, from the year ahead.
  const year = [today, ...daysAhead(ctx, 366)]
  let fastest = 0
  for (let i = 1; i < year.length; i++) fastest = Math.max(fastest, Math.abs(daylight(year[i]) - daylight(year[i - 1])) / 1000)
  const close = Math.abs(change) >= 0.9 * fastest ? ', close to the fastest they ever change' : ''
  return `Days are ${way} by ${looseMinutes(change)} a day${close}.`
}
