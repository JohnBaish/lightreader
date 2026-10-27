// "Darkness" (SPEC §6 and rule E): tonight's true night, and the coming nights without one.

import { duration } from '../format.ts'
import { addDays } from '../ukTime.ts'
import { dayOf, daysAhead, type SkyContext } from './context.ts'
import { bandTag, dateIn, rangeIn } from './words.ts'

export function darknessSentences(ctx: SkyContext): string[] {
  const today = dayOf(ctx, ctx.today)
  const tomorrow = dayOf(ctx, addDays(ctx.today, 1))
  const out: string[] = []

  // Tonight (rule E: never a blank). The labels are tags (John, 27 October, option B).
  if (today.astronomicalDusk && tomorrow.astronomicalDawn) {
    out.push(`Tonight's true night lasts ${duration(tomorrow.astronomicalDawn.getTime() - today.astronomicalDusk.getTime())}.`)
  } else if (today.nauticalDusk) {
    out.push(`No true night tonight: at its darkest the sky only reaches ${bandTag('very-dark')}.`)
  } else if (today.civilDusk) {
    out.push(`No true night tonight: at its darkest the sky only reaches ${bandTag('dark')}.`)
  } else {
    out.push('Half-light lasts all night.')
  }

  // "No true night from Sunday May 23rd to Monday July 19th." The next run of nights
  // without one within the year; inside one, "True night returns on Tuesday July 20th."
  const nights = [today, ...daysAhead(ctx, 366)]
  const none = (i: number) => !nights[i].astronomicalDusk
  if (none(0)) {
    const end = nights.findIndex((_, i) => !none(i))
    if (end > 0) out.push(`True night returns on ${dateIn(ctx, nights[end].date)}.`) // John, 27 October
  } else {
    const start = nights.findIndex((_, i) => none(i))
    if (start > 0) {
      let end = start
      while (end + 1 < nights.length && none(end + 1)) end++
      const [a, b] = rangeIn(ctx, nights[start].date, nights[end].date)
      out.push(`No true night from ${a} to ${b}.`)
    }
  }
  return out
}
