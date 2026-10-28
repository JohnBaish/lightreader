// "Pace of change" (John, 28 October, option A): a line of how much daylight each day gains
// or loses against the day before, over the year card's span. Above zero is shaded in the
// daylight colour and labelled as days getting longer, below zero in the very-dark colour
// as days getting shorter; today is a fixed line with its figure. The sentences come from
// src/lib/pace.ts.

import { useLayoutEffect, useRef, useState } from 'react'
import { rate, type Pace } from '../lib/pace.ts'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** The y-axis reaches 4m 50s either way, so Berwick's fastest (4m 38s) still fits with a
 *  little room; no English district is further north. */
const MAX_SECONDS = 290

export function PaceCard({ p, narrow, span }: { p: Pace; narrow: boolean; span: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(narrow ? 330 : 1000)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const rows = p.rows
  const n = rows.length
  const ti = rows.findIndex((r) => r.date === p.today)
  const H = narrow ? 220 : 260
  const padL = narrow ? 34 : 42
  const padR = 8
  const padT = 10
  const padB = 36 // room for today's figure under a deep dip (Berwick) above the months
  const iw = width - padL - padR
  const ih = H - padT - padB
  const x = (i: number) => padL + (i / (n - 1)) * iw
  const y = (v: number) => padT + ih / 2 - (v / MAX_SECONDS) * (ih / 2)
  const z = y(0)
  const line = 'M' + rows.map((r, i) => `${x(i).toFixed(1)},${y(r.change).toFixed(1)}`).join('L')
  const area = `${line}L${x(n - 1)},${z}L${x(0)},${z}Z`

  // Each label in the middle of the longest stretch of its own side.
  const middleOf = (up: boolean) => {
    let best = [0, -1]
    let start = -1
    rows.forEach((r, i) => {
      const on = (r.change > 0) === up
      if (on && start < 0) start = i
      if ((!on || i === n - 1) && start >= 0) {
        const end = on ? i : i - 1
        if (end - start > best[1] - best[0]) best = [start, end]
        start = -1
      }
    })
    return Math.round((best[0] + best[1]) / 2)
  }
  const now = rows[ti]
  const tagRight = x(ti) < width - 110
  const tagY = now.change < 0 ? y(now.change) + 18 : y(now.change) - 10
  const ticks = [-240, -120, 120, 240]

  return (
    <section className="card year pace">
      <div className="year-head">
        <h3>Pace of change</h3>
        <span className="muted">{span}</span>
      </div>
      <div ref={ref} className="pace-chart">
        <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img"
          aria-label={`How much daylight each day gains or loses, ${span}. Today ${now.change < 0 ? 'minus' : 'plus'} ${rate(now.change)}.`}>
          <defs>
            <clipPath id="pace-up"><rect x="0" y="0" width={width} height={z} /></clipPath>
            <clipPath id="pace-down"><rect x="0" y={z} width={width} height={H} /></clipPath>
          </defs>
          {ticks.map((v) => <line key={v} className="pace-grid" x1={padL} x2={width - padR} y1={y(v)} y2={y(v)} />)}
          {[...ticks, 0].map((v) => (
            <text key={v} className="pace-axis" x={padL - 6} y={y(v) + 4} textAnchor="end">
              {v === 0 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v / 60)}m`}
            </text>
          ))}
          <path className="pace-gain" d={area} clipPath="url(#pace-up)" />
          <path className="pace-loss" d={area} clipPath="url(#pace-down)" />
          <line className="pace-zero" x1={padL} x2={width - padR} y1={z} y2={z} />
          <path className="pace-line" d={line} />
          <text className="pace-in pace-in-gain" x={x(middleOf(true))} y={y(narrow ? 45 : 60)} textAnchor="middle">{narrow ? 'Longer' : 'Days getting longer'}</text>
          <text className="pace-in pace-in-loss" x={x(middleOf(false))} y={y(narrow ? -55 : -70)} textAnchor="middle">{narrow ? 'Shorter' : 'Days getting shorter'}</text>
          {rows.map((r, i) => r.date.endsWith('-01') && (
            <text key={r.date} className="pace-axis" x={x(i)} y={H - 6} textAnchor="middle">
              {narrow ? MONTHS[Number(r.date.slice(5, 7)) - 1][0] : MONTHS[Number(r.date.slice(5, 7)) - 1]}
            </text>
          ))}
          <line className="pace-today" x1={x(ti)} x2={x(ti)} y1={padT} y2={padT + ih} />
          <circle className="pace-dot" cx={x(ti)} cy={y(now.change)} r={5} />
          <text className="pace-tag" x={tagRight ? x(ti) + 8 : x(ti) - 8} y={tagY} textAnchor={tagRight ? 'start' : 'end'}>
            Today {now.change < 0 ? '−' : '+'}{rate(now.change)}
          </text>
        </svg>
      </div>
      <ul className="pace-words">{p.sentences.map((s, i) => <li key={i}>{s}</li>)}</ul>
      <p className="note">The line shows how much daylight each day gains or loses against the day before.</p>
    </section>
  )
}
