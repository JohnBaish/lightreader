// The next 24 hours, for the sky ribbon (SPEC §5, mock-up option B): the stretches of
// light from now to the same time tomorrow, and the changes between them.

import { BAND_AFTER, bandAt, timeline, type Band, type EventKind } from './bands.ts'
import { daysFigures, type Place } from './sun.ts'
import { addDays, ukInstant, ukParts } from './ukTime.ts'

const HOUR = 3_600_000

export type Segment = { band: Band; from: Date; to: Date }
export type Tick = { at: Date; kind: EventKind | 'noon'; label: string }
export type Ribbon = {
  from: Date
  to: Date
  segments: Segment[]
  ticks: Tick[]
  /** UK midnight inside the window, and the weekday it starts ("Wed"). */
  midnight: { at: Date; day: string } | null
}

/** What each change is called on the ribbon: sunrise and sunset by name, the others by
 *  the light they lead into ("Dark" at 17:21, "Very dark" at 04:57), as in the mock-up. */
export const TICK_LABEL: Record<EventKind | 'noon', string> = {
  astronomicalDawn: 'Very dark',
  nauticalDawn: 'Dark',
  civilDawn: 'Half-light',
  sunrise: 'Sunrise',
  sunset: 'Sunset',
  civilDusk: 'Dark',
  nauticalDusk: 'Very dark',
  astronomicalDusk: 'True night',
  noon: 'Sun highest',
}

const SHORT_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function ribbon(place: Place, now: Date): Ribbon {
  const to = new Date(now.getTime() + 24 * HOUR)
  const today = ukParts(now).date
  const days = daysFigures(place, addDays(today, -1), addDays(today, 1))
  const changes = timeline(days)
  const inside = changes.filter((c) => c.at > now && c.at < to)

  const segments: Segment[] = []
  let band = bandAt(changes, now)
  let start = now
  for (const c of inside) {
    segments.push({ band, from: start, to: c.at })
    band = BAND_AFTER[c.kind]
    start = c.at
  }
  segments.push({ band, from: start, to })

  const ticks: Tick[] = inside.map((c) => ({ at: c.at, kind: c.kind, label: TICK_LABEL[c.kind] }))
  for (const d of days) if (d.noon > now && d.noon < to) ticks.push({ at: d.noon, kind: 'noon', label: TICK_LABEL.noon })
  ticks.sort((a, b) => a.at.getTime() - b.at.getTime())

  const tomorrow = addDays(today, 1)
  const midnightAt = ukInstant(tomorrow, 0)
  const midnight = midnightAt > now && midnightAt < to
    ? { at: midnightAt, day: SHORT_DAY[new Date(tomorrow + 'T12:00:00Z').getUTCDay()] }
    : null
  return { from: now, to, segments, ticks, midnight }
}

/** Where `at` falls along the ribbon, from 0 to 1. */
export const along = (r: Ribbon, at: Date) => (at.getTime() - r.from.getTime()) / (r.to.getTime() - r.from.getTime())

/** True night longer than this is folded on a phone (SPEC §5). */
export const FOLD_LONGER_THAN = 3 * HOUR

/** Label tops for points at `anchors` (in order), each centred on its point where it can
 *  be, but at least `gap` below the one before, so none overlap. */
export function spreadLabels(anchors: number[], gap: number): number[] {
  const tops: number[] = []
  for (const a of anchors) tops.push(Math.max(a - gap / 2, tops.length ? tops[tops.length - 1] + gap : -Infinity))
  return tops
}

/** Where each label goes beside the strip: above or below it, in the near or far row.
 *  `spans` are each label's left and right edges in pixels, and `marks` where each points
 *  to, in order. As in the mock-up the labels alternate above and below; one that would
 *  touch another goes to the other side, then to the far row. A far-row label's line
 *  passes the near row, so it mustn't cross a near-row label, nor a near-row label sit on
 *  it. The first label is above. */
export type LabelPlace = { side: 'above' | 'below'; row: 0 | 1 }
export function placeLabels(spans: [number, number][], marks: number[], pad = 6): LabelPlace[] {
  const taken: Record<string, [number, number][]> = { above0: [], below0: [], above1: [], below1: [] }
  const lines: Record<string, number[]> = { above: [], below: [] }
  const clear = (a: [number, number], b: [number, number]) => a[1] + pad <= b[0] || b[1] + pad <= a[0]
  const out: LabelPlace[] = []
  spans.forEach((span, i) => {
    const mark = marks[i]
    const first: 'above' | 'below' = i === 0 ? 'above' : out[i - 1].side === 'above' ? 'below' : 'above'
    const second = first === 'above' ? 'below' : 'above'
    const tries: LabelPlace[] = [{ side: first, row: 0 }, { side: second, row: 0 }, { side: first, row: 1 }, { side: second, row: 1 }]
    const fits = (p: LabelPlace) => taken[`${p.side}${p.row}`].every((s) => clear(span, s)) && (p.row === 0
      ? lines[p.side].every((x) => x < span[0] - pad || x > span[1] + pad)
      : taken[`${p.side}0`].every((s) => mark < s[0] - pad || mark > s[1] + pad))
    const chosen = tries.find(fits) ?? tries[0]
    taken[`${chosen.side}${chosen.row}`].push(span)
    if (chosen.row === 1) lines[chosen.side].push(mark)
    out.push(chosen)
  })
  return out
}
