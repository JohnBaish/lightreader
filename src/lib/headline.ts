// The top of the page (SPEC §5, "Today"), which changes with the time of day (John, 27
// October): until sunset, today's sunrise and sunset; from sunset (John, 28 October; it was
// once the sun is highest), today's sunset and then tomorrow's sunrise, each under its own
// small heading; and once it's dark
// (half-light over, at the minute shown, as everywhere else on the page; John, 28 October),
// tomorrow's sunrise and sunset. Where half-light lasts all night, that never happens.

import { clock, longDate } from './format.ts'
import type { DayFigures } from './sun.ts'

export type Headline = { kicker: string; items: { label: string; time: string }[] }[]

export function headline(now: Date, today: DayFigures, tomorrow: DayFigures): Headline {
  const day = (d: DayFigures, word: string) => `${word} · ${longDate(d.date)}`
  const item = (label: string, at: Date | null) => (at ? [{ label, time: clock(at) }] : [])
  // Each change at the minute shown, as everywhere else on the page (rule C).
  const minute = (at: Date) => Math.round(at.getTime() / 60_000) * 60_000
  if (now.getTime() < minute(today.sunset ?? today.noon)) {
    return [{ kicker: day(today, 'Today'), items: [...item('Sunrise', today.sunrise), ...item('Sunset', today.sunset)] }]
  }
  const dark = today.civilDusk && minute(today.civilDusk)
  if (dark && now.getTime() >= dark) {
    return [{ kicker: day(tomorrow, 'Tomorrow'), items: [...item('Sunrise', tomorrow.sunrise), ...item('Sunset', tomorrow.sunset)] }]
  }
  // John, 28 October (option B): the headings say which event.
  return [
    { kicker: day(today, "Today's sunset"), items: item('Sunset', today.sunset) },
    { kicker: day(tomorrow, "Tomorrow's sunrise"), items: item('Sunrise', tomorrow.sunrise) },
  ]
}
