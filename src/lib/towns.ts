// "Roughly over …" (SPEC §6, PLAN stage 6): the place the sun rises or sets over, seen from
// the middle of a postcode district.
//
// John, 28 October: towns and cities, plus the places postcode districts are named after
// (src/data/towns.json); one lying within 8° of the sun's direction, between 3 and 25 miles
// away, the nearest first. When none does (often the sea), the sentence gives the compass
// point alone.

import data from '../data/towns.json' with { type: 'json' }
import type { Place } from './sun.ts'

export const TOWN_WITHIN_DEGREES = 8
export const TOWN_MILES = [3, 25] as const

const MILE_KM = 1.609344
const EARTH_KM = 6371.0088
const rad = Math.PI / 180

type Town = { name: string; latitude: number; longitude: number }
const TOWNS: Town[] = (data.places as [string, number, number][]).map(([name, latitude, longitude]) => ({ name, latitude, longitude }))

/** The direction from `a` to `b` (degrees clockwise from true north) and the distance in
 *  miles, along the earth's surface. */
export function bearingAndMiles(a: Place, b: Place): { bearing: number; miles: number } {
  const p1 = a.latitude * rad
  const p2 = b.latitude * rad
  const dl = (b.longitude - a.longitude) * rad
  const bearing = (Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) / rad + 360) % 360
  const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return { bearing, miles: (2 * EARTH_KM * Math.asin(Math.sqrt(h))) / MILE_KM }
}

export type Toward = { name: string; miles: number; off: number }

/** The place the sun is roughly over, looking from `from` towards `azimuth`, or null.
 *  `own` is the visitor's own place's name, never given. */
export function townToward(from: Place, azimuth: number, own: string): Toward | null {
  let best: Toward | null = null
  for (const t of TOWNS) {
    if (t.name === own) continue
    const { bearing, miles } = bearingAndMiles(from, t)
    if (miles < TOWN_MILES[0] || miles > TOWN_MILES[1]) continue
    const off = Math.abs(((bearing - azimuth + 540) % 360) - 180)
    if (off <= TOWN_WITHIN_DEGREES && (!best || miles < best.miles)) best = { name: t.name, miles, off }
  }
  return best
}
