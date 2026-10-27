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

type Day = { name: string; edge: boolean; day: DayFigures }

/** The two ends of `key` among `days`, lowest first. */
function ends(days: Day[], key: (d: DayFigures) => number): [Day, Day] {
  const sorted = [...days].sort((a, b) => key(a.day) - key(b.day))
  return [sorted[0], sorted[sorted.length - 1]]
}

export function acrossUkSentences(ctx: SkyContext, places: NamedPlace[] = UK_PLACES): string[] {
  const here = dayOf(ctx, ctx.today)
  if (!here.sunset || !here.sunrise) return []
  const near = places.filter((p) => kmBetween(p, ctx.place) >= NEAR_KM)
    .map((p) => ({ name: p.name, edge: !!p.edge, day: dayFigures(p, ctx.today) }))
    .filter((p) => p.day.sunset && p.day.sunrise)
  const cities = near.filter((p) => !p.edge)
  if (cities.length < 2) return []

  // The ends among the cities; an edge town in brackets when it goes further (John, 27
  // October), in John's wording of 28 October (J7): "There's an early sunset today in Norwich
  // at 16:35 (16:21 in Lerwick), and a late one in Truro at 17:05 (17:08 in Penzance).
  // Reading's is at 16:46."
  const sunset = (d: DayFigures) => d.sunset!.getTime()
  const [early, late] = ends(cities, sunset)
  const [earliest, latest] = ends(near, sunset)
  const also = (city: Day, edge: Day, words: (d: Day) => string) => (edge !== city && edge.edge ? ` (${words(edge)})` : '')
  const at = (d: Day) => `${clock(d.day.sunset!)} in ${d.name}`
  const mine = here.sunset.getTime()
  const yours = mine < sunset(earliest.day) ? `; ${ctx.name}'s is earlier still, at ${clock(here.sunset)}.`
    : mine > sunset(latest.day) ? `; ${ctx.name}'s is later still, at ${clock(here.sunset)}.`
    : `. ${ctx.name}'s is at ${clock(here.sunset)}.`
  const out = [`There's an early sunset today in ${early.name} at ${clock(early.day.sunset!)}${also(early, earliest, at)}, and a late one in ${late.name} at ${clock(late.day.sunset!)}${also(late, latest, at)}${yours}`]

  // "Reading gets 33m more daylight than Inverness today, and 5m less than Truro." The cities
  // only, without the edge towns in brackets (John, 28 October, J8). When every place is within
  // a minute of the visitor's, as around the equinoxes, one plain sentence (the fresh look,
  // 2.2; John's wording).
  const [least, most] = ends(cities, daylight)
  const [leastAll, mostAll] = ends(near, daylight)
  const within = (p: Day) => Math.abs(daylight(here) - daylight(p.day)) < 60_000
  if (within(leastAll) && within(mostAll)) {
    out.push('Today every place in the UK gets about the same amount of daylight.')
    return out
  }
  const than = (p: Day, first: boolean) => {
    const diff = daylight(here) - daylight(p.day)
    return Math.abs(diff) < 60_000 ? `about the same amount of daylight as ${p.name}` : `${duration(diff)} ${diff > 0 ? 'more' : 'less'}${first ? ' daylight' : ''} than ${p.name}`
  }
  out.push(`${ctx.name} gets ${than(least, true)} today, and ${than(most, false)}.`)
  return out
}

/** Straight-line distance in kilometres (a sphere is close enough here). */
function kmBetween(a: Place, b: Place): number {
  const r = Math.PI / 180
  const x = (b.longitude - a.longitude) * r * Math.cos(((a.latitude + b.latitude) / 2) * r)
  const y = (b.latitude - a.latitude) * r
  return Math.hypot(x, y) * 6371
}
