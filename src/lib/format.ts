// How times, dates and durations are written (SPEC §4).
//
// Times are 24-hour, "06:49", rounded to the nearest minute, in UK clock time: a
// deliberate exception to the house style's "9.30am" (John, 27 October). Rounding is
// done on the instant (half a minute or more rounds up), before the clock time is read,
// so it is right on clock-change days too.

import { ukParts } from './ukTime.ts'

const MINUTE = 60_000

/** The instant rounded to the nearest whole minute. */
export const roundToMinute = (at: Date): Date => new Date(Math.floor((at.getTime() + MINUTE / 2) / MINUTE) * MINUTE)

/** "06:49": UK clock time, to the nearest minute. */
export function clock(at: Date): string {
  const p = ukParts(roundToMinute(at))
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
}

/** Minutes past UK midnight of the time as shown ("06:49" → 409), for thresholds that
 *  must agree with what is shown (SPEC §7 rule C). */
export function shownMinutes(at: Date): number {
  const p = ukParts(roundToMinute(at))
  return p.hour * 60 + p.minute
}

/** 1st, 2nd, 3rd, 4th; 11th, 12th, 13th; 21st, 22nd, 23rd; 31st. (As Hindcaster's.) */
export function ordinal(n: number): string {
  const tens = n % 100
  if (tens >= 11 && tens <= 13) return `${n}th`
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "Tuesday" for a UK date "YYYY-MM-DD". */
export const weekday = (date: string) => WEEKDAYS[new Date(date + 'T12:00:00Z').getUTCDay()]

/** "Tuesday October 27th", or "Friday December 25th 2026" with `withYear`. */
export function longDate(date: string, withYear = false): string {
  const month = MONTHS[Number(date.slice(5, 7)) - 1]
  const day = ordinal(Number(date.slice(8, 10)))
  return `${weekday(date)} ${month} ${day}${withYear ? ` ${date.slice(0, 4)}` : ''}`
}

/** "1h 20m", "47m", "2h" (never "2h 0m"), and "less than a minute" for anything shorter
 *  than a minute. Rounded to the nearest minute, from the exact length (rule H). */
export function duration(ms: number): string {
  const abs = Math.abs(ms)
  if (abs < MINUTE) return 'less than a minute'
  const minutes = Math.round(abs / MINUTE)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/** The 16 points of the compass, as words, for an azimuth in degrees from true north
 *  (SPEC §6, "Where the sun rises and sets"). */
const POINTS = [
  'north', 'north-north-east', 'north-east', 'east-north-east',
  'east', 'east-south-east', 'south-east', 'south-south-east',
  'south', 'south-south-west', 'south-west', 'west-south-west',
  'west', 'west-north-west', 'north-west', 'north-north-west',
]
export const compassPoint = (azimuth: number): string => POINTS[Math.round((((azimuth % 360) + 360) % 360) / 22.5) % 16]
