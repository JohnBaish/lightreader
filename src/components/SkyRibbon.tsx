// "Next 24 hours": the sky ribbon (SPEC §5, mock-up option B). On a computer, a strip
// across the page drawn to scale, with each change of light as a tick, alternating above
// and below; on a phone, the strip stands upright, true night folded to a fixed height
// with its length, and the changes listed beside it.

import { BANDS, BAND_LABEL } from '../lib/bands.ts'
import { clock, duration } from '../lib/format.ts'
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { along, FOLD_LONGER_THAN, placeLabels, spreadLabels, type Ribbon } from '../lib/ribbon.ts'
import { ukParts } from '../lib/ukTime.ts'

export function Legend() {
  return (
    <div className="legend">
      {BANDS.map((b) => <span key={b}><i className={`band-${b}`} />{BAND_LABEL[b]}</span>)}
    </div>
  )
}

const pct = (x: number) => `${(x * 100).toFixed(3)}%`

/** A label's width in pixels, roughly, from its longest line (12.5px bold digits, 11px
 *  words), to keep labels apart. */
const labelWidth = (time: string, label: string) => Math.max(time.length * 7.4, label.length * 6) + 4

export function SkyRibbonWide({ r }: { r: Ribbon }) {
  // The strip's width, to place the labels so none overlap.
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(950)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // "Now" sits just left of the strip, so no change of light, however soon, can reach it.
  const labels = r.ticks.map((t) => ({ at: t.at, time: clock(t.at), label: t.label }))
  const spans = labels.map((l): [number, number] => {
    const x = along(r, l.at) * width
    const w = labelWidth(l.time, l.label)
    return [x - w / 2, x + w / 2]
  })
  const place = placeLabels(spans, labels.map((l) => along(r, l.at) * width))
  // Room for the far rows only when they're used.
  const above = place.some((p) => p.side === 'above' && p.row === 1) ? 88 : 44
  const below = place.some((p) => p.side === 'below' && p.row === 1) ? 88 : 44
  const vars = { '--above': `${above}px`, '--below': `${below}px` } as CSSProperties
  return (
    <div className="ribbon-wide">
      <div className="ribbon-track" ref={ref} style={vars}>
        <div className="ribbon-strip">
          {r.segments.map((s, i) => (
            <div key={i} className={`band-${s.band}`} style={{ left: pct(along(r, s.from)), width: pct(along(r, s.to) - along(r, s.from)) }} />
          ))}
          {r.midnight && (
            <div className="ribbon-midnight" style={{ left: pct(along(r, r.midnight.at)) }}><span>{r.midnight.day}</span></div>
          )}
        </div>
        <div className="ribbon-now"><span>Now</span><b className="mono">{clock(r.from)}</b></div>
        {labels.map((l, i) => (
          <div key={i} className={`ribbon-tick ${place[i].side} row${place[i].row}`} style={{ left: pct(along(r, l.at)) }}>
            <b className="mono">{l.time}</b>
            <span>{l.label}</span>
          </div>
        ))}
      </div>
      <Legend />
    </div>
  )
}

const FOLD_PX = 40
const LINE_PX = 21

/** Upright, for a phone. The strip's height is shared out by time, except a long true
 *  night, which is folded to FOLD_PX with a zigzag and its length. */
export function SkyRibbonNarrow({ r }: { r: Ribbon }) {
  const total = 470
  const ms = (s: { from: Date; to: Date }) => s.to.getTime() - s.from.getTime()
  const folded = (s: Ribbon['segments'][number]) => s.band === 'true-night' && ms(s) > FOLD_LONGER_THAN
  const unfoldedMs = r.segments.filter((s) => !folded(s)).reduce((a, s) => a + ms(s), 0)
  const foldCount = r.segments.filter(folded).length
  const perMs = (total - foldCount * FOLD_PX) / unfoldedMs

  // Each segment's top and height in pixels, and where any moment falls.
  const placed: { s: Ribbon['segments'][number]; top: number; h: number; folded: boolean }[] = []
  for (const s of r.segments) {
    const prev = placed[placed.length - 1]
    placed.push({ s, top: prev ? prev.top + prev.h : 0, h: folded(s) ? FOLD_PX : ms(s) * perMs, folded: folded(s) })
  }
  const yOf = (at: Date) => {
    const p = placed.find((p) => at >= p.s.from && at <= p.s.to)!
    return p.folded ? p.top + (at.getTime() === p.s.from.getTime() ? 0 : p.h) : p.top + (at.getTime() - p.s.from.getTime()) * perMs
  }
  const today = ukParts(r.from).date
  const day = r.midnight?.day

  // Labels, and the note for each fold, pushed down so none overlap; each tick keeps a
  // short line to its own point.
  type Entry = { at: number; tick?: Ribbon['ticks'][number]; fold?: string; now?: boolean }
  // "Now" always first, then the changes and folds in order down the strip.
  const entries: Entry[] = [
    { at: LINE_PX / 2, now: true },
    ...[
      ...r.ticks.map((tick) => ({ at: yOf(tick.at), tick })),
      ...placed.filter((p) => p.folded).map((p) => ({ at: p.top + p.h / 2, fold: `${BAND_LABEL['true-night']}, ${duration(ms(p.s))} (folded)` })),
    ].sort((a, b) => a.at - b.at),
  ]
  const tops = spreadLabels(entries.map((e) => e.at), LINE_PX)
  const labels = entries.map((e, i) => ({ ...e, top: tops[i] }))

  return (
    <div className="ribbon-narrow">
      <div className="ribbon-column" style={{ height: total }}>
        <div className="ribbon-vstrip">
          {placed.map((p, i) => (
            <div key={i} className={`band-${p.s.band}${p.folded ? ' folded' : ''}`} style={{ top: p.top, height: p.h }} />
          ))}
        </div>
        {labels.map((l, i) => l.now ? (
          <div key={i} className="ribbon-vlabel ribbon-vnow" style={{ top: l.top }}>Now {clock(r.from)}</div>
        ) : l.tick ? (
          <div key={i}>
            <div className="ribbon-vmark" style={{ top: l.at }} />
            <div className="ribbon-vlabel" style={{ top: l.top }}>
              <b className="mono">{day && ukParts(l.tick.at).date !== today ? `${day} ` : ''}{clock(l.tick.at)}</b> {l.tick.label}
            </div>
          </div>
        ) : (
          <div key={i} className="ribbon-vlabel ribbon-fold-note" style={{ top: l.top }}>{l.fold}</div>
        ))}
      </div>
      <Legend />
    </div>
  )
}
