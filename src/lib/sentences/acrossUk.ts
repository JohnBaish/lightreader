// "Across the UK" (SPEC §6): today's sunset and daylight at the fixed places in
// src/lib/ukPlaces.ts, against the visitor's.

import { clock, duration } from '../format.ts'
import { dayFigures, daylight, type Place } from '../sun.ts'
import { ACROSS_UK, type NamedPlace } from '../ukPlaces.ts'
import { dayOf, type SkyContext } from './context.ts'

/** Fixed places closer than this to the visitor are left out, so Penzance isn't compared
 *  with itself. About 15 miles. */
export const NEAR_KM = 25

export function acrossUkSentences(ctx: SkyContext, places: NamedPlace[] = ACROSS_UK): string[] {
  const here = dayOf(ctx, ctx.today)
  if (!here.sunset || !here.sunrise) return []
  const there = places.filter((p) => kmBetween(p, ctx.place) >= NEAR_KM)
    .map((p) => ({ name: p.name, day: dayFigures(p, ctx.today) }))
    .filter((p) => p.day.sunset && p.day.sunrise)
  if (there.length === 0) return []

  const out: string[] = []
  if (there.length === 1) {
    // "Sunset today is at 21:49 in Lerwick. Penzance's is at 21:09."
    out.push(`Sunset today is at ${clock(there[0].day.sunset!)} in ${there[0].name}. ${ctx.name}'s is at ${clock(here.sunset)}.`)
  } else {
    // "Sunset today runs from 16:21 in Lerwick to 17:07 in Penzance. Reading's is at 16:46."
    const bySunset = [...there].sort((a, b) => a.day.sunset!.getTime() - b.day.sunset!.getTime())
    const first = bySunset[0]
    const last = bySunset[bySunset.length - 1]
    out.push(`Sunset today runs from ${clock(first.day.sunset!)} in ${first.name} to ${clock(last.day.sunset!)} in ${last.name}. ${ctx.name}'s is at ${clock(here.sunset)}.`)
  }

  // "Reading gets 51m more daylight than Lerwick today, and 6m less than Penzance."
  const parts = there.map((p, i) => {
    const diff = daylight(here) - daylight(p.day)
    const amount = Math.abs(diff) < 60_000 ? 'about the same daylight as' : `${duration(diff)} ${diff > 0 ? 'more' : 'less'}${i === 0 ? ' daylight' : ''} than`
    return `${amount} ${p.name}`
  })
  out.push(`${ctx.name} gets ${parts[0]} today${parts.slice(1).map((p) => `, and ${p}`).join('')}.`)
  return out
}

/** Straight-line distance in kilometres (a sphere is close enough here). */
function kmBetween(a: Place, b: Place): number {
  const r = Math.PI / 180
  const x = (b.longitude - a.longitude) * r * Math.cos(((a.latitude + b.latitude) / 2) * r)
  const y = (b.latitude - a.latitude) * r
  return Math.hypot(x, y) * 6371
}
