// "Where the sun rises and sets" (SPEC §6), on the 16-point compass, with the places lying in
// each direction where there are some ("between Bracknell and Wokingham"; src/lib/towns.ts,
// PLAN stage 6). `withTowns` leaves the places out (the checks of the compass wording).

import { compassPoint } from '../format.ts'
import { describeToward } from '../towns.ts'
import { dayOf, type SkyContext } from './context.ts'

export function directionSentences(ctx: SkyContext, withTowns = false): string[] {
  const today = dayOf(ctx, ctx.today)
  if (today.sunriseAzimuth === null || today.sunsetAzimuth === null) return []
  const over = (azimuth: number) => (withTowns ? describeToward(ctx.place, azimuth, ctx.name) : '')
  // Two bullets, and no longer the longest day's directions (John, 28 October, J9).
  return [
    `The sun rises in the ${compassPoint(today.sunriseAzimuth)}${over(today.sunriseAzimuth)}.`,
    `It sets in the ${compassPoint(today.sunsetAzimuth)}${over(today.sunsetAzimuth)}.`,
  ]
}
