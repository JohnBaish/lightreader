// UK clock time (Europe/London) without any libraries. Stored times are UTC;
// the day windows (SPEC §4) are UK clock time.

const ZONE = 'Europe/London'

const partsFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hourCycle: 'h23',
})

export type UkParts = { date: string; hour: number; minute: number }

/** The UK calendar date ("YYYY-MM-DD") and clock time of an instant. */
export function ukParts(at: Date): UkParts {
  const p: Record<string, string> = {}
  for (const { type, value } of partsFormat.formatToParts(at)) p[type] = value
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), minute: Number(p.minute) }
}

/** Minutes UK clock time is ahead of UTC at an instant (0 for GMT, 60 for BST). */
function offsetMinutes(at: Date): number {
  const p = ukParts(at)
  const asUtc = Date.UTC(+p.date.slice(0, 4), +p.date.slice(5, 7) - 1, +p.date.slice(8, 10), p.hour, p.minute)
  return Math.round((asUtc - Math.floor(at.getTime() / 60000) * 60000) / 60000)
}

/** The instant at which UK clocks show `hour`:00 on `date`. (The windows only
 *  use midnight, 9am and 9pm, which always exist exactly once: UK clocks
 *  change at 1am and 2am.) */
export function ukInstant(date: string, hour: number): Date {
  const guess = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10), hour)
  let at = new Date(guess - offsetMinutes(new Date(guess)) * 60000)
  at = new Date(guess - offsetMinutes(at) * 60000)
  return at
}

/** The calendar date `days` after `date` ("YYYY-MM-DD"). */
export function addDays(date: string, days: number): string {
  const d = new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10) + days))
  return d.toISOString().slice(0, 10)
}
