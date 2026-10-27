// The year's figures for one place (SPEC §9): six months back to six months ahead,
// centred on today, worked out in the browser.

import { timeline, type Change } from './bands.ts'
import { daysFigures, type DayFigures, type Place } from './sun.ts'
import { addDays } from './ukTime.ts'

/** The date `months` calendar months after `date` ("YYYY-MM-DD"), kept within the month
 *  (August 31st plus six months is February 28th or 29th). */
export function addMonths(date: string, months: number): string {
  const y = Number(date.slice(0, 4))
  const m = Number(date.slice(5, 7)) - 1 + months
  const year = y + Math.floor(m / 12)
  const month = ((m % 12) + 12) % 12
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const day = Math.min(Number(date.slice(8, 10)), last)
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export type YearFigures = {
  from: string
  to: string
  days: DayFigures[]
  /** Every change of light from the evening before `from` to the end of `to`. */
  changes: Change[]
}

/** Figures for every day from six months before `today` to six months after, both
 *  included ("April 27th 2026 to April 27th 2027" for October 27th 2026). */
export function yearFigures(place: Place, today: string): YearFigures {
  const from = addMonths(today, -6)
  const to = addMonths(today, 6)
  const days = daysFigures(place, addDays(from, -1), to)
  return { from, to, days: days.slice(1), changes: timeline(days) }
}
