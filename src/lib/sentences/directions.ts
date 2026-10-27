// "Where the sun rises and sets" (SPEC §6), on the 16-point compass, with the places lying in
// each direction where there are some ("between Bracknell and Wokingham"; src/lib/towns.ts,
// PLAN stage 6).
// The places are shown only once John has checked the sheet (`withTowns`).

import { compassPoint } from '../format.ts'
import { dayFigures } from '../sun.ts'
import { describeToward } from '../towns.ts'
import { dayOf, type SkyContext } from './context.ts'

export function directionSentences(ctx: SkyContext, withTowns = false): string[] {
  const today = dayOf(ctx, ctx.today)
  if (today.sunriseAzimuth === null || today.sunsetAzimuth === null) return []
  const over = (azimuth: number) => (withTowns ? describeToward(ctx.place, azimuth, ctx.name) : '')
  const rises = `rises in the ${compassPoint(today.sunriseAzimuth)}${over(today.sunriseAzimuth)}`
  const sets = `sets in the ${compassPoint(today.sunsetAzimuth)}${over(today.sunsetAzimuth)}`
  // "rises in the east-south-east, between Bracknell and Wokingham, and sets …": a comma
  // before "and" only when the first half has its places.
  const out = [`The sun ${rises}${rises.includes(',') ? ',' : ''} and ${sets}.`]

  // "On the longest day it rises in the north-east and sets in the north-west." The longest
  // day of the year containing today (June 21st in recent years; checked by daylight).
  const year = Number(ctx.today.slice(0, 4))
  const longest = [19, 20, 21, 22, 23]
    .map((d) => dayFigures(ctx.place, `${year}-06-${d}`))
    .sort((a, b) => (b.sunset!.getTime() - b.sunrise!.getTime()) - (a.sunset!.getTime() - a.sunrise!.getTime()))[0]
  const rise = compassPoint(longest.sunriseAzimuth!)
  const set = compassPoint(longest.sunsetAzimuth!)
  if (rise !== compassPoint(today.sunriseAzimuth) || set !== compassPoint(today.sunsetAzimuth)) {
    out.push(`On the longest day it rises in the ${rise} and sets in the ${set}.`)
  }
  return out
}
