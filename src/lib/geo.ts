// Direction and distance between two places, kept apart from src/lib/towns.ts so a page
// script that needs only the sum doesn't carry the town list.

import type { Place } from './sun.ts'

const MILE_KM = 1.609344
const EARTH_KM = 6371.0088
const rad = Math.PI / 180

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
