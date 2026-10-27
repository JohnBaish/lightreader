// The sun's events for a place and a UK day, worked out in the browser with Astronomy
// Engine (SPEC §3). All times are instants (UTC inside a Date); src/lib/format.ts shows
// them in UK clock time.
//
// Definitions (SPEC §3):
// - Sunrise and sunset: Astronomy Engine's SearchRiseSet, when the top of the sun's disc
//   is 34′ below the horizon (refraction), using the sun's true size on the day. That
//   puts its centre 0.833° below, give or take 0.004° (less than a second of time;
//   checked in CLAUDE.md, 27 October).
// - Twilight: the sun's centre 6°, 12° and 18° below the horizon, with no allowance for
//   refraction (SearchAltitude), as the definitions intend.
//
// Each UK day's morning events are those between the solar midnight before its solar
// noon and that noon; its evening events are those between the noon and the next solar
// midnight. So "tonight" belongs to the day it starts on, even when, in May or August,
// the sun only reaches 18° below after the clocks pass midnight. When the sun doesn't get
// that low, the event is null (SPEC §7 rule E): never an error.

import { Body, Equator, Horizon, Observer, SearchAltitude, SearchHourAngle, SearchRiseSet, type FlexibleDateTime } from 'astronomy-engine'
import { addDays, ukInstant } from './ukTime.ts'

export type Place = { latitude: number; longitude: number }

/** The twilight boundaries: the sun's centre this many degrees below the horizon. */
export const CIVIL = 6
export const NAUTICAL = 12
export const ASTRONOMICAL = 18

export type DayFigures = {
  /** The UK date, "YYYY-MM-DD". */
  date: string
  /** Morning: the sun's centre rising through 18°, 12° and 6° below, then sunrise. */
  astronomicalDawn: Date | null
  nauticalDawn: Date | null
  civilDawn: Date | null
  sunrise: Date | null
  /** Solar noon (the sun highest) and its altitude in degrees. */
  noon: Date
  noonAltitude: number
  /** Evening: sunset, then the sun's centre sinking through 6°, 12° and 18° below. */
  sunset: Date | null
  civilDusk: Date | null
  nauticalDusk: Date | null
  astronomicalDusk: Date | null
  /** Solar midnight after this day's noon (the sun lowest tonight) and its altitude. */
  midnight: Date
  midnightAltitude: number
  /** The sun's direction at sunrise and sunset, degrees clockwise from true north. */
  sunriseAzimuth: number | null
  sunsetAzimuth: number | null
}

const DAY_MS = 86_400_000

const observer = (place: Place) => new Observer(place.latitude, place.longitude, 0)

/** The sun's geometric altitude and azimuth (no refraction), degrees. */
export function sunPosition(place: Place, at: FlexibleDateTime): { altitude: number; azimuth: number } {
  const obs = observer(place)
  const eq = Equator(Body.Sun, at, obs, true, true)
  const hor = Horizon(at, obs, eq.ra, eq.dec)
  return { altitude: hor.altitude, azimuth: hor.azimuth }
}

/** The first time in [from, to) the sun's centre crosses `depth` degrees below the
 *  horizon going up (+1) or down (−1); null if it doesn't. */
function crossing(obs: Observer, direction: 1 | -1, depth: number, from: Date, to: Date): Date | null {
  const found = SearchAltitude(Body.Sun, obs, direction, from, (to.getTime() - from.getTime()) / DAY_MS, -depth)
  return found && found.date < to ? found.date : null
}

function riseSet(obs: Observer, direction: 1 | -1, from: Date, to: Date): Date | null {
  const found = SearchRiseSet(Body.Sun, obs, direction, from, (to.getTime() - from.getTime()) / DAY_MS)
  return found && found.date < to ? found.date : null
}

/** Every sun event for `place` on the UK day `date` ("YYYY-MM-DD"). */
export function dayFigures(place: Place, date: string): DayFigures {
  const obs = observer(place)
  const dayStart = ukInstant(date, 0)
  const noon = SearchHourAngle(Body.Sun, obs, 0, dayStart).time.date
  // Solar midnight before noon: search forward from 24 hours before it, so the first hit
  // is the one in between.
  const midnightBefore = SearchHourAngle(Body.Sun, obs, 12, new Date(noon.getTime() - DAY_MS)).time.date
  const midnight = SearchHourAngle(Body.Sun, obs, 12, noon).time.date
  const sunrise = riseSet(obs, 1, midnightBefore, noon)
  const sunset = riseSet(obs, -1, noon, midnight)
  return {
    date,
    astronomicalDawn: crossing(obs, 1, ASTRONOMICAL, midnightBefore, noon),
    nauticalDawn: crossing(obs, 1, NAUTICAL, midnightBefore, noon),
    civilDawn: crossing(obs, 1, CIVIL, midnightBefore, noon),
    sunrise,
    noon,
    noonAltitude: sunPosition(place, noon).altitude,
    sunset,
    civilDusk: crossing(obs, -1, CIVIL, noon, midnight),
    nauticalDusk: crossing(obs, -1, NAUTICAL, noon, midnight),
    astronomicalDusk: crossing(obs, -1, ASTRONOMICAL, noon, midnight),
    midnight,
    midnightAltitude: sunPosition(place, midnight).altitude,
    sunriseAzimuth: sunrise ? sunPosition(place, sunrise).azimuth : null,
    sunsetAzimuth: sunset ? sunPosition(place, sunset).azimuth : null,
  }
}

/** Day figures for every UK day from `from` to `to`, both included. */
export function daysFigures(place: Place, from: string, to: string): DayFigures[] {
  const days: DayFigures[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(dayFigures(place, d))
  return days
}

/** Daylight in milliseconds: sunset minus sunrise (0 if either is missing). */
export const daylight = (day: DayFigures): number =>
  day.sunrise && day.sunset ? day.sunset.getTime() - day.sunrise.getTime() : 0
