// "Across the UK" (SPEC §6): today's sunset and daylight against the big places at the two
// ends of each, from the short list in src/lib/ukPlaces.ts (John, 27 October). The ends
// are picked separately for sunset and for daylight, so they change with the season: on
// October 27th 2026 sunset runs from Lerwick to Penzance; on June 21st 2027 from Dover to
// Stornoway, while daylight runs from Penzance (least) to Lerwick (most).

import { clock, duration } from '../format.ts'
import { dayFigures, daylight, type DayFigures, type Place } from '../sun.ts'
import { UK_PLACES, type NamedPlace } from '../ukPlaces.ts'
import { dayOf, type SkyContext } from './context.ts'

/** Places closer than this to the visitor are left out, so Penzance isn't compared with
 *  itself. About 15 miles. */
export const NEAR_KM = 25

type Day = { name: string; day: DayFigures }

/** The two ends of `key` among `days`, lowest first. */
function ends(days: Day[], key: (d: DayFigures) => number): [Day, Day] {
  const sorted = [...days].sort((a, b) => key(a.day) - key(b.day))
  return [sorted[0], sorted[sorted.length - 1]]
}

export function acrossUkSentences(ctx: SkyContext, places: NamedPlace[] = UK_PLACES): string[] {
  const here = dayOf(ctx, ctx.today)
  if (!here.sunset || !here.sunrise) return []
  const there = places.filter((p) => kmBetween(p, ctx.place) >= NEAR_KM)
    .map((p) => ({ name: p.name, day: dayFigures(p, ctx.today) }))
    .filter((p) => p.day.sunset && p.day.sunrise)
  if (there.length < 2) return []

  // "Sunset today runs from 16:21 in Lerwick to 17:08 in Penzance. Reading's is at 16:46."
  // When the visitor is beyond both ends: "…, and Penzance's is later still, at 17:08."
  const [early, late] = ends(there, (d) => d.sunset!.getTime())
  const mine = here.sunset.getTime()
  const yours = mine < early.day.sunset!.getTime() ? `, and ${ctx.name}'s is earlier still, at ${clock(here.sunset)}.`
    : mine > late.day.sunset!.getTime() ? `, and ${ctx.name}'s is later still, at ${clock(here.sunset)}.`
    : `. ${ctx.name}'s is at ${clock(here.sunset)}.`
  const out = [`Sunset today runs from ${clock(early.day.sunset!)} in ${early.name} to ${clock(late.day.sunset!)} in ${late.name}${yours}`]

  // "Reading gets 51m more daylight than Lerwick today, and 6m less than Penzance."
  const [least, most] = ends(there, daylight)
  const parts = [least, most].map((p, i) => {
    const diff = daylight(here) - daylight(p.day)
    const amount = Math.abs(diff) < 60_000 ? 'about the same daylight as' : `${duration(diff)} ${diff > 0 ? 'more' : 'less'}${i === 0 ? ' daylight' : ''} than`
    return `${amount} ${p.name}`
  })
  out.push(`${ctx.name} gets ${parts[0]} today, and ${parts[1]}.`)
  return out
}

/** Straight-line distance in kilometres (a sphere is close enough here). */
function kmBetween(a: Place, b: Place): number {
  const r = Math.PI / 180
  const x = (b.longitude - a.longitude) * r * Math.cos(((a.latitude + b.latitude) / 2) * r)
  const y = (b.latitude - a.latitude) * r
  return Math.hypot(x, y) * 6371
}
