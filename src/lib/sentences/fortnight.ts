// "This fortnight" (SPEC §6): the same weekday a week back and a week ahead. A clock change
// in between is named, as the times are then on different clocks (SPEC §4, BST/GMT).

import { clock, duration } from '../format.ts'
import { daylight } from '../sun.ts'
import { addDays } from '../ukTime.ts'
import { dayOf, offsetOn, type SkyContext } from './context.ts'
import { dateIn } from './words.ts'

export function fortnightSentences(ctx: SkyContext): string[] {
  const today = dayOf(ctx, ctx.today)
  const back = dayOf(ctx, addDays(ctx.today, -7))
  const ahead = dayOf(ctx, addDays(ctx.today, 7))
  const out: string[] = []
  const nowOffset = offsetOn(ctx.today)

  // "A week ago, before the clocks went back, the sun rose at 07:36 and set at 18:00. Days were 26m longer."
  if (back.sunrise && back.sunset) {
    const change = offsetOn(back.date) === nowOffset ? '' : `, before the clocks went ${offsetOn(back.date) > nowOffset ? 'back' : 'forward'},`
    const diff = daylight(back) - daylight(today)
    const then = Math.abs(diff) < 60_000 ? 'Daylight was much the same.' : `Days were ${duration(diff)} ${diff > 0 ? 'longer' : 'shorter'}.`
    out.push(`A week ago${change} the sun rose at ${clock(back.sunrise)} and set at ${clock(back.sunset)}. ${then}`)
  }

  // "Next Tuesday the sun rises at 07:01 and sets at 16:33. That's 25m less daylight."
  if (ahead.sunrise && ahead.sunset) {
    const change = offsetOn(ahead.date) === nowOffset ? '' : `, after the clocks go ${offsetOn(ahead.date) > nowOffset ? 'forward' : 'back'},`
    const diff = daylight(ahead) - daylight(today)
    const then = Math.abs(diff) < 60_000 ? "That's much the same daylight." : `That's ${duration(diff)} ${diff > 0 ? 'more' : 'less'} daylight.`
    const weekday = dateIn(ctx, ahead.date).split(' ')[0]
    out.push(`Next ${weekday}${change} the sun rises at ${clock(ahead.sunrise)} and sets at ${clock(ahead.sunset)}. ${then}`)
  }
  return out
}
