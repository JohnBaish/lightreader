// "Roughly over …" (SPEC §6, PLAN stage 6): the place the sun rises or sets over, seen from
// the middle of a postcode district.
//
// John, 28 October: first, one place lying within 8° of the sun's direction, 3 to 25 miles
// away, from the towns and cities and the places postcode districts are named after
// (src/data/towns.json). Then, finding those too obscure: "between Bracknell and Wokingham
// (near Crowthorne)", the nearest town or city either side of the sun's direction, with a
// smaller place on the line in brackets (`describeToward`). When there's no town on one side,
// "roughly over" a town or city on the line; when there's none of that either (often the
// sea), the compass point alone.

import data from '../data/towns.json' with { type: 'json' }
import type { Place } from './sun.ts'

export const TOWN_WITHIN_DEGREES = 8
export const TOWN_MILES = [3, 25] as const

const MILE_KM = 1.609344
const EARTH_KM = 6371.0088
const rad = Math.PI / 180

type Town = { name: string; latitude: number; longitude: number; big: boolean }
const TOWNS: Town[] = (data.places as [string, number, number, number][]).map(([name, latitude, longitude, big]) => ({ name, latitude, longitude, big: big === 1 }))

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
 *  `own` is the visitor's own place's name, never given; with `bigOnly`, towns and cities
 *  only. */
export function townToward(from: Place, azimuth: number, own: string, bigOnly = false): Toward | null {
  let best: Toward | null = null
  for (const t of TOWNS) {
    if (t.name === own || (bigOnly && !t.big)) continue
    const { bearing, miles } = bearingAndMiles(from, t)
    if (miles < TOWN_MILES[0] || miles > TOWN_MILES[1]) continue
    const off = Math.abs(((bearing - azimuth + 540) % 360) - 180)
    if (off <= TOWN_WITHIN_DEGREES && (!best || miles < best.miles)) best = { name: t.name, miles, off }
  }
  return best
}

/** How far either side of the sun's direction the two towns of "between … and …" may lie. */
export const BETWEEN_DEGREES = 20

export type Between = { left: Toward; right: Toward; near: Toward | null }

/** "Between Wokingham and Bracknell (near Crowthorne)" (John, 28 October): the nearest town or
 *  city on each side of the sun's direction, within BETWEEN_DEGREES and TOWN_MILES, left then
 *  right as you look towards the sun; and the nearest smaller place (one a postcode district
 *  is named after) lying within TOWN_WITHIN_DEGREES of it, if any. Null unless there's a town
 *  on both sides. */
export function townsBetween(from: Place, azimuth: number, own: string, side = BETWEEN_DEGREES): Between | null {
  let left: Toward | null = null
  let right: Toward | null = null
  let near: Toward | null = null
  for (const t of TOWNS) {
    if (t.name === own) continue
    const { bearing, miles } = bearingAndMiles(from, t)
    if (miles < TOWN_MILES[0] || miles > TOWN_MILES[1]) continue
    const turn = ((bearing - azimuth + 540) % 360) - 180 // negative: to the left
    const off = Math.abs(turn)
    if (!t.big) {
      if (off <= TOWN_WITHIN_DEGREES && (!near || miles < near.miles)) near = { name: t.name, miles, off }
      continue
    }
    if (off > side) continue
    if (turn < 0 && (!left || miles < left.miles)) left = { name: t.name, miles, off }
    if (turn >= 0 && (!right || miles < right.miles)) right = { name: t.name, miles, off }
  }
  if (!left || !right) return null
  return { left, right, near }
}

/** ", between Bracknell and Wokingham (near Crowthorne)", ", roughly over Thatcham", or
 *  nothing: what follows the compass point in the sentence. */
export function describeToward(from: Place, azimuth: number, own: string): string {
  const b = townsBetween(from, azimuth, own)
  if (b) return `, between ${b.left.name} and ${b.right.name}${b.near ? ` (near ${b.near.name})` : ''}`
  const t = townToward(from, azimuth, own, true)
  return t ? `, roughly over ${t.name}` : ''
}
