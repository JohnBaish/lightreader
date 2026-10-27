// The five light labels (SPEC §4) and which one applies at any moment.
//
// Everything that colours a ribbon, a strip or a pill, or answers "Is it light at…?",
// goes through `timeline()` and `bandAt()`, so they all agree with the times shown.

import type { DayFigures } from './sun.ts'

export type Band = 'daylight' | 'half-light' | 'dark' | 'very-dark' | 'true-night'

/** From lightest to darkest. */
export const BANDS: readonly Band[] = ['daylight', 'half-light', 'dark', 'very-dark', 'true-night']

/** The words shown, and the technical names for "About these figures". */
export const BAND_LABEL: Record<Band, string> = {
  'daylight': 'Daylight',
  'half-light': 'Half-light',
  'dark': 'Dark',
  'very-dark': 'Very dark',
  'true-night': 'True night',
}
export const BAND_TECHNICAL: Record<Band, string | null> = {
  'daylight': null,
  'half-light': 'civil twilight',
  'dark': 'nautical twilight',
  'very-dark': 'astronomical twilight',
  'true-night': null,
}

/** "Light" in a sentence: daylight or half-light (SPEC §4). */
export const isLight = (band: Band) => band === 'daylight' || band === 'half-light'

export type EventKind =
  | 'astronomicalDawn' | 'nauticalDawn' | 'civilDawn' | 'sunrise'
  | 'sunset' | 'civilDusk' | 'nauticalDusk' | 'astronomicalDusk'

/** A change of light: at `at`, the light becomes `band`. */
export type Change = { at: Date; kind: EventKind; band: Band }

/** The band each event leads into. */
export const BAND_AFTER: Record<EventKind, Band> = {
  astronomicalDawn: 'very-dark',
  nauticalDawn: 'dark',
  civilDawn: 'half-light',
  sunrise: 'daylight',
  sunset: 'half-light',
  civilDusk: 'dark',
  nauticalDusk: 'very-dark',
  astronomicalDusk: 'true-night',
}

const ORDER: EventKind[] = [
  'astronomicalDawn', 'nauticalDawn', 'civilDawn', 'sunrise',
  'sunset', 'civilDusk', 'nauticalDusk', 'astronomicalDusk',
]

/** Every change of light over consecutive days, in time order. Missing events (no true
 *  night in summer) are simply absent, so the band runs on unchanged. */
export function timeline(days: DayFigures[]): Change[] {
  const changes: Change[] = []
  for (const day of days) {
    for (const kind of ORDER) {
      const at = day[kind]
      if (at) changes.push({ at, kind, band: BAND_AFTER[kind] })
    }
  }
  return changes.sort((a, b) => a.at.getTime() - b.at.getTime())
}

/** The band at `at`. `changes` must cover the moment, with at least one change before it
 *  (a timeline starting the day before is enough). */
export function bandAt(changes: Change[], at: Date): Band {
  const t = at.getTime()
  let band: Band | null = null
  for (const c of changes) {
    if (c.at.getTime() > t) break
    band = c.band
  }
  if (band === null) throw new Error('bandAt: the timeline starts after this moment')
  return band
}

/** The band for the sun's centre at `altitude` degrees (geometric), with sunrise and
 *  sunset at 0.833° below. Used by the checks to test `bandAt`; a moment within a second
 *  of a change may differ, because sunrise uses the sun's true size on the day. */
export function bandForAltitude(altitude: number): Band {
  if (altitude > -0.833) return 'daylight'
  if (altitude > -6) return 'half-light'
  if (altitude > -12) return 'dark'
  if (altitude > -18) return 'very-dark'
  return 'true-night'
}
