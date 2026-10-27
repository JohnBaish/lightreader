// The top of the page (SPEC §5, "Today"), which changes with the time of day (John, 27
// October): before the sun is highest, today's sunrise and sunset; from then on, today's
// sunset and then tomorrow's sunrise, each under its own small heading.

import { clock, longDate } from './format.ts'
import type { DayFigures } from './sun.ts'

export type Headline = { kicker: string; items: { label: string; time: string }[] }[]

export function headline(now: Date, today: DayFigures, tomorrow: DayFigures): Headline {
  const day = (d: DayFigures, word: string) => `${word} · ${longDate(d.date)}`
  const item = (label: string, at: Date | null) => (at ? [{ label, time: clock(at) }] : [])
  if (now < today.noon) {
    return [{ kicker: day(today, 'Today'), items: [...item('Sunrise', today.sunrise), ...item('Sunset', today.sunset)] }]
  }
  // John, 28 October (option B): the headings say which event.
  return [
    { kicker: day(today, "Today's sunset"), items: item('Sunset', today.sunset) },
    { kicker: day(tomorrow, "Tomorrow's sunrise"), items: item('Sunrise', tomorrow.sunrise) },
  ]
}
