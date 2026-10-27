// "Coming up", headed "Looking ahead" on the page (SPEC §6; John, 28 October): what happens in the next three months, in date order.
//
// - Whole hours crossed, the soonest for sunrise and the soonest for sunset only (John,
//   27 October): "The sun rises after 07:00 from Tuesday November 3rd to Tuesday February
//   23rd." when it's getting darker; "First sunset at 17:00 or later: Friday February
//   5th." when it's getting lighter. Thresholds use the minute shown, and a time on the
//   hour counts as reached (rule C). A jump made by the clocks changing doesn't count: the
//   clock-change line says it.
// - Turning points: the earliest or latest sunrise or sunset, with the run of days showing
//   that minute and the very day (rules B and G), and the shortest or longest day.
// - The clock change, only in the ten weeks before it.

import { clock, duration } from '../format.ts'
import { daylight, type DayFigures } from '../sun.ts'
import { addMonths } from '../year.ts'
import { addDays } from '../ukTime.ts'
import { bestWithTies, clockChanges, clockSeconds, dayOf, daysAhead, daysBetween, offsetOn, runAround, shown, type SkyContext } from './context.ts'
import { numberWord } from '../words.ts'
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

type Crossing = { event: 'sunrise' | 'sunset'; h: number; later: boolean; i: number }

/** Every whole hour that sunrise or sunset crosses between `list[from]` and `list[to]`,
 *  by the minute shown. `later` is the way it crosses: past the hour into later times. */
function crossings(list: DayFigures[], from: number, to: number): Crossing[] {
  const out: Crossing[] = []
  for (let i = Math.max(1, from); i <= to && i < list.length; i++) {
    const prev = list[i - 1]
    const cur = list[i]
    if (changesClock(cur)) continue
    for (const event of ['sunrise', 'sunset'] as const) {
      const a = prev[event]
      const b = cur[event]
      if (!a || !b) continue
      // Sunrise: past h means after h (h itself counts as by h). Sunset: h itself counts as reached.
      const before = event === 'sunrise' ? (m: number, h: number) => m <= h : (m: number, h: number) => m < h
      for (let h = 60; h < 24 * 60; h += 60) {
        const wasBefore = before(shown(a), h)
        const isBefore = before(shown(b), h)
        if (wasBefore !== isBefore) out.push({ event, h, later: wasBefore, i })
      }
    }
  }
  return out
}

/** The whole hours crossed (John, 27 October: "only some"): the soonest for sunrise and
 *  the soonest for sunset in the window, so at most two lines. Getting darker reads as a
 *  run ("The sun rises after 07:00 from … to …"); getting lighter as a first ("First
 *  sunset at 17:00 or later: …"). In spring the clocks can make a first happen twice;
 *  then both go in one line. */
function hourCrossings(ctx: SkyContext, ahead: DayFigures[], windowLength: number): Item[] {
  const items: Item[] = []
  const list = [dayOf(ctx, ctx.today), ...ahead]
  const found = crossings(list, 1, windowLength)
  for (const event of ['sunrise', 'sunset'] as const) {
    // The soonest crossing that makes a line (a run lasting most of the year doesn't).
    for (const c of found.filter((x) => x.event === event)) {
      const item = crossingLine(ctx, list, c)
      if (item) {
        items.push(item)
        break
      }
    }
  }
  return items
}

function crossingLine(ctx: SkyContext, list: DayFigures[], c: Crossing): Item | null {
  const event = c.event
  const cur = list[c.i]
  const darker = event === 'sunrise' ? c.later : !c.later
  if (darker) {
    const test = event === 'sunrise'
      ? (d: DayFigures) => !!d.sunrise && shown(d.sunrise) > c.h
      : (d: DayFigures) => !!d.sunset && shown(d.sunset) < c.h
    const last = runEnd(list, c.i, test)
    const verb = event === 'sunrise' ? `The sun rises after ${hh(c.h)}` : `The sun sets before ${hh(c.h)}`
    return last ? { date: cur.date, text: `${verb} ${fromUntil(ctx, cur, last)}.` } : null
  }
  const what = event === 'sunrise' ? `First sunrise at ${hh(c.h)} or earlier` : `First sunset at ${hh(c.h)} or later`
  // The same first again, after a clock change has undone it (John's point 4).
  // Only a repeat within two months counts: a year on, it's simply next year's.
  const again = crossings(list, c.i + 1, c.i + 60)
    .find((x) => x.event === event && x.h === c.h && x.later === c.later)
  const changeBetween = again && list.slice(c.i + 1, again.i + 1).some(changesClock)
  if (again && changeBetween) {
    const change = list.slice(c.i + 1, again.i + 1).find(changesClock)!
    const way = offsetOn(change.date) > offsetOn(addDays(change.date, -1)) ? 'forward' : 'back'
    const [a, b] = rangeIn(ctx, cur.date, list[again.i].date)
    return { date: cur.date, text: `${what}: ${a}, and again after the clocks go ${way}, on ${b}.` }
  }
  return { date: cur.date, text: `${what}: ${dateIn(ctx, cur.date)}.` }
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
  if (t.event === null) {
    // "Shortest day: Monday December 21st, 55 days from now, with 7h 50m of daylight, 2h 8m
    // less than today." (John, 28 October, J4; the difference from exact times, rule H)
    const n = daysBetween(ctx.today, day.date)
    const when = n === 0 ? 'today' : n === 1 ? 'tomorrow' : `${numberWord(n)} days from now`
    const diff = daylight(day) - daylight(dayOf(ctx, ctx.today))
    const than = Math.abs(diff) < 60_000 ? 'much the same as today' : `${duration(diff)} ${diff > 0 ? 'more' : 'less'} than today`
    return n === 0
      ? `${label}: today, with ${duration(daylight(day))} of daylight.`
      : `${label}: ${dateIn(ctx, day.date)}, ${when}, with ${duration(daylight(day))} of daylight, ${than}.`
  }
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
