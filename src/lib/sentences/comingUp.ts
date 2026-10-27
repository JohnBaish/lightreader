// "Coming up" (SPEC §6): what happens in the next three months, in date order.
//
// - Whole hours crossed: "The sun rises after 07:00 from Tuesday November 3rd to Tuesday
//   February 23rd." when it's getting darker; "First sunset at 17:00 or later: Friday
//   February 5th." when it's getting lighter. Thresholds use the minute shown, and a time
//   on the hour counts as reached (rule C). A jump made by the clocks changing doesn't count:
//   the clock-change line says it.
// - Turning points: the earliest or latest sunrise or sunset, with the run of days showing
//   that minute and the very day (rules B and G), and the shortest or longest day.
// - The clock change, only in the ten weeks before it.

import { clock, duration } from '../format.ts'
import { daylight, type DayFigures } from '../sun.ts'
import { addMonths } from '../year.ts'
import { addDays } from '../ukTime.ts'
import { bestWithTies, clockChanges, clockSeconds, dayOf, daysAhead, daysBetween, offsetOn, runAround, shown, type SkyContext } from './context.ts'
import { dateIn, inDays, rangeIn } from './words.ts'

export const CLOCK_CHANGE_NOTICE_DAYS = 70
/** A threshold lasting longer than this (about eight months) is hardly news: "after 05:00
 *  from July to May". */
export const LONGEST_RUN_DAYS = 240

type Item = { date: string; text: string }

export function comingUpSentences(ctx: SkyContext): string[] {
  const end = addMonths(ctx.today, 3)
  const ahead = daysAhead(ctx, 400)
  const windowLength = ahead.findIndex((d) => d.date > end)
  const items: Item[] = [...hourCrossings(ctx, ahead, windowLength), ...turningPoints(ctx, ahead, windowLength), ...clockChangeLine(ctx)]
  return items.sort((a, b) => a.date.localeCompare(b.date)).map((i) => i.text)
}

const hh = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:00`
const changesClock = (d: DayFigures) => offsetOn(d.date) !== offsetOn(addDays(d.date, -1))

function hourCrossings(ctx: SkyContext, ahead: DayFigures[], windowLength: number): Item[] {
  const items: Item[] = []
  const list = [dayOf(ctx, ctx.today), ...ahead]
  for (let i = 1; i <= windowLength; i++) {
    const prev = list[i - 1]
    const cur = list[i]
    if (changesClock(cur) || !prev.sunrise || !cur.sunrise || !prev.sunset || !cur.sunset) continue
    const r1 = shown(prev.sunrise)
    const r2 = shown(cur.sunrise)
    const s1 = shown(prev.sunset)
    const s2 = shown(cur.sunset)
    for (let h = 60; h < 24 * 60; h += 60) {
      if (r1 <= h && r2 > h) {
        const last = runEnd(list, i, (d) => !!d.sunrise && shown(d.sunrise) > h)
        if (last) items.push({ date: cur.date, text: `The sun rises after ${hh(h)} ${fromUntil(ctx, cur, last)}.` })
      }
      if (r1 > h && r2 <= h) items.push({ date: cur.date, text: `First sunrise at ${hh(h)} or earlier: ${dateIn(ctx, cur.date)}.` })
      if (s1 >= h && s2 < h) {
        const last = runEnd(list, i, (d) => !!d.sunset && shown(d.sunset) < h)
        if (last) items.push({ date: cur.date, text: `The sun sets before ${hh(h)} ${fromUntil(ctx, cur, last)}.` })
      }
      if (s1 < h && s2 >= h) items.push({ date: cur.date, text: `First sunset at ${hh(h)} or later: ${dateIn(ctx, cur.date)}.` })
    }
  }
  return items
}

/** The last day of the run starting at `list[i]`, and whether a clock change ended it;
 *  null if it runs past the end of the list or lasts longer than LONGEST_RUN_DAYS. */
function runEnd(list: DayFigures[], i: number, test: (d: DayFigures) => boolean): { day: DayFigures; byClocks: boolean } | null {
  let j = i
  while (j + 1 < list.length && test(list[j + 1])) j++
  const next = list[j + 1]
  if (!next || daysBetween(list[i].date, list[j].date) > LONGEST_RUN_DAYS) return null
  return { day: list[j], byClocks: changesClock(next) }
}

/** "from Tuesday November 3rd to Tuesday February 23rd", or "from … until the clocks go
 *  forward on Sunday March 28th" when the clocks end the run (the spec's "until"
 *  sentences stop at a clock change and say so). */
function fromUntil(ctx: SkyContext, start: DayFigures, end: { day: DayFigures; byClocks: boolean }): string {
  if (!end.byClocks) {
    const [a, b] = rangeIn(ctx, start.date, end.day.date)
    return `from ${a} to ${b}`
  }
  const change = addDays(end.day.date, 1)
  const [a, b] = rangeIn(ctx, start.date, change)
  return `from ${a} until the clocks go ${offsetOn(change) > offsetOn(end.day.date) ? 'forward' : 'back'} on ${b}`
}

type Turn = { key: (d: DayFigures) => number; low: string; high: string; event: 'sunrise' | 'sunset' | null }
const TURNS: Turn[] = [
  { key: (d) => clockSeconds(d.sunrise!), low: 'Earliest sunrise', high: 'Latest sunrise', event: 'sunrise' },
  { key: (d) => clockSeconds(d.sunset!), low: 'Earliest sunset', high: 'Latest sunset', event: 'sunset' },
  { key: (d) => daylight(d) / 1000, low: 'Shortest day', high: 'Longest day', event: null },
]

function turningPoints(ctx: SkyContext, ahead: DayFigures[], windowLength: number): Item[] {
  const items: Item[] = []
  const list = [dayOf(ctx, ctx.today), ...ahead]
  if (list.some((d, i) => i <= windowLength + 1 && (!d.sunrise || !d.sunset))) return items
  for (const t of TURNS) {
    for (const low of [true, false]) {
      const sign = low ? 1 : -1
      for (let i = 1; i <= windowLength; i++) {
        const [a, b, c] = [list[i - 1], list[i], list[i + 1]]
        if (changesClock(b) || changesClock(c)) continue
        const v = sign * t.key(b)
        if (!(v < sign * t.key(a) && v <= sign * t.key(c))) continue
        items.push({ date: b.date, text: turnText(ctx, t, low, list, i) })
      }
    }
  }
  return items
}

function turnText(ctx: SkyContext, t: Turn, low: boolean, list: DayFigures[], i: number): string {
  const label = low ? t.low : t.high
  const day = list[i]
  if (t.event === null) return `${label}: ${dateIn(ctx, day.date)}, with ${duration(daylight(day))} of daylight.`
  const at = (d: DayFigures) => d[t.event!]!
  const minute = shown(at(day))
  const [first, last] = runAround(list, i, (d) => !!d[t.event!] && !changesClock(d) && shown(at(d)) === minute)
  // The very day, and any within a second of it (rule G), among the neighbours.
  const near = list.slice(Math.max(0, i - 3), i + 4).filter((d) => !changesClock(d))
  const ties = bestWithTies(near, (d) => (low ? 1 : -1) * t.key(d))
  const very = low ? 'very earliest' : 'very latest'
  const head = `${label}: ${clock(at(day))}`
  if (first.date === last.date) return `${head}, on ${dateIn(ctx, day.date)}.`
  const [a, b] = rangeIn(ctx, first.date, last.date)
  const run = `${head}, every day from ${a} to ${b}.`
  if (ties.length > 1) {
    const names = ties.map((d) => dateIn(ctx, d.date))
    return `${run} Within that period, the ${very} are on ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}, a fraction of a second apart.`
  }
  return `${run} Within that period, the ${very} is on ${dateIn(ctx, ties[0].date)}.`
}

/** "Clocks go forward in nine days, on Sunday March 28th: sunset jumps from 18:28 to 19:30."
 *  In autumn the sunrise, which is what the change moves into darkness or light. */
function clockChangeLine(ctx: SkyContext): Item[] {
  const change = clockChanges(ctx.today, addDays(ctx.today, CLOCK_CHANGE_NOTICE_DAYS))[0]
  if (!change) return []
  const before = dayOf(ctx, addDays(change.date, -1))
  const on = dayOf(ctx, change.date)
  const event = change.forward ? 'sunset' : 'sunrise'
  const was = before[event]
  const now = on[event]
  if (!was || !now) return []
  const way = change.forward ? 'forward' : 'back'
  const n = daysBetween(ctx.today, change.date)
  if (n === 0) {
    const tense = ctx.now.getTime() >= now.getTime() ? 'was' : 'is'
    return [{ date: change.date, text: `Clocks went ${way} today: ${event} ${tense} at ${clock(now)}, not ${clock(was)}.` }]
  }
  const when = n === 1 ? 'tomorrow' : `${inDays(n)}, on ${dateIn(ctx, change.date)}`
  return [{ date: change.date, text: `Clocks go ${way} ${when}: ${event} jumps from ${clock(was)} to ${clock(now)}.` }]
}
