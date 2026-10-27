// "This fortnight" (SPEC §6): the same weekday a week back and a week ahead. A clock change
// in between is named, as the times are then on different clocks (SPEC §4, BST/GMT).

import { clock, duration } from '../format.ts'
import { daylight } from '../sun.ts'
import { addDays } from '../ukTime.ts'
import { clockSeconds, dayOf, offsetOn, type SkyContext } from './context.ts'
import { dateIn } from './words.ts'

export function fortnightSentences(ctx: SkyContext): string[] {
  const today = dayOf(ctx, ctx.today)
  const back = dayOf(ctx, addDays(ctx.today, -7))
  const ahead = dayOf(ctx, addDays(ctx.today, 7))
  const out: string[] = []
  const nowOffset = offsetOn(ctx.today)

  // How each time differs from today's, by the clock, from the exact times (rule H), in
  // brackets after it (John, 28 October): "(48m later)".
  const than = (then: Date, now: Date | null) => {
    if (!now) return ''
    const s = clockSeconds(then) - clockSeconds(now)
    return Math.abs(s) < 60 ? '(about the same as today)' : `(${duration(s * 1000)} ${s > 0 ? 'later' : 'earlier'})`
  }

  // "A week ago, before the clocks went back, the sun rose at 07:36 (48m later) and set at
  // 18:00 (1h 14m later). Days were 26m longer."
  if (back.sunrise && back.sunset && today.sunrise && today.sunset) {
    const change = offsetOn(back.date) === nowOffset ? '' : `, before the clocks went ${offsetOn(back.date) > nowOffset ? 'back' : 'forward'},`
    const diff = daylight(back) - daylight(today)
    const then = Math.abs(diff) < 60_000 ? 'Daylight was much the same.' : `Days were ${duration(diff)} ${diff > 0 ? 'longer' : 'shorter'}.`
    out.push(`A week ago${change} the sun rose at ${clock(back.sunrise)} ${than(back.sunrise, today.sunrise)} and set at ${clock(back.sunset)} ${than(back.sunset, today.sunset)}. ${then}`)
  }

  // "Next Tuesday the sun rises at 07:01 (13m later) and sets at 16:33 (13m earlier).
  // That's 25m less daylight."
  if (ahead.sunrise && ahead.sunset && today.sunrise && today.sunset) {
    const change = offsetOn(ahead.date) === nowOffset ? '' : `, after the clocks go ${offsetOn(ahead.date) > nowOffset ? 'forward' : 'back'},`
    const diff = daylight(ahead) - daylight(today)
    const then = Math.abs(diff) < 60_000 ? "That's much the same daylight." : `That's ${duration(diff)} ${diff > 0 ? 'more' : 'less'} daylight.`
    const weekday = dateIn(ctx, ahead.date).split(' ')[0]
    out.push(`Next ${weekday}${change} the sun rises at ${clock(ahead.sunrise)} ${than(ahead.sunrise, today.sunrise!)} and sets at ${clock(ahead.sunset)} ${than(ahead.sunset, today.sunset!)}. ${then}`)
  }
  return out
}
