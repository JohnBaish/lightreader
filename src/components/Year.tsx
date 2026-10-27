// The year (SPEC §9): the year ribbon (mock-up option C), and below it the day-by-day
// tables (option B), folded to a row of month buttons until one is chosen.

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { BANDS } from '../lib/bands.ts'
import { longDate, weekday, ordinal } from '../lib/format.ts'
import { dayDetail, type DayRow, type YearView } from '../lib/yearView.ts'
import { addDays } from '../lib/ukTime.ts'
import { Legend } from './SkyRibbon.tsx'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const monthName = (m: string) => MONTH_NAMES[Number(m.slice(5, 7)) - 1]
const dayIndex = (v: YearView, date: string) => Math.round((Date.parse(date) - Date.parse(v.from)) / 86_400_000)
const pct = (x: number) => `${(x * 100).toFixed(3)}%`

function rowFor(v: YearView, date: string): DayRow | undefined {
  return v.months.find((m) => date.startsWith(m.month))?.rows.find((r) => r.date === date)
}

/** "Sunrise 06:48 · Sunset 16:46", or what happens instead (rule E). */
function riseSet(r: DayRow): string {
  if (r.sunrise && r.sunset) return `Sunrise ${r.sunrise} · Sunset ${r.sunset}`
  return r.sunrise ? `Sunrise ${r.sunrise}` : r.sunset ? `Sunset ${r.sunset}` : 'The sun stays down'
}

/** The same, each pair kept on one line, for the detail card. */
const riseSetLines = (r: DayRow) => riseSet(r).split(' · ').map((part, i) => (
  <span key={i}>{i > 0 && <span className="dot"> · </span>}<span className="pair">{part}</span></span>
))

function YearRibbon({ v, chosen, onChoose, narrow }: { v: YearView; chosen: string; onChoose: (date: string) => void; narrow: boolean }) {
  const n = v.ribbon.length
  const plot = useRef<HTMLDivElement>(null)
  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const box = plot.current!.getBoundingClientRect()
    const i = Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - box.left) / box.width) * n)))
    onChoose(addDays(v.from, i))
  }
  const keys = (e: KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, PageUp: -7, PageDown: 7 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = addDays(chosen, step)
    if (next >= v.from && next <= v.to) onChoose(next)
  }
  // The first of each month along the bottom; on a phone, just its letter.
  const months: { i: number; label: string }[] = []
  for (let i = 0; i < n; i++) {
    const d = addDays(v.from, i)
    if (d.endsWith('-01')) months.push({ i, label: narrow ? monthName(d)[0] : monthName(d).slice(0, 3) })
  }
  const hours = [0, 6, 12, 18, 24]
  return (
    <div className="yr">
      <div className="yr-hours" aria-hidden="true">
        {hours.map((h) => <span key={h} style={{ bottom: pct(h / 24) }}>{String(h).padStart(2, '0')}:00</span>)}
      </div>
      <div
        className="yr-plot"
        ref={plot}
        role="slider"
        tabIndex={0}
        aria-label="The year in light: choose a day"
        aria-valuemin={0}
        aria-valuemax={n - 1}
        aria-valuenow={dayIndex(v, chosen)}
        aria-valuetext={longDate(chosen, true)}
        onPointerDown={pick}
        onKeyDown={keys}
      >
        <svg viewBox={`0 0 ${n} 1440`} preserveAspectRatio="none" aria-hidden="true">
          <rect x="0" y="0" width={n} height="1440" fill="var(--band-true-night)" />
          {BANDS.filter((b) => b !== 'true-night').map((b) => (
            // One shape per band, each day a touch wider and each stretch a touch taller, so
            // no seams show; five shapes draw far quicker on a phone than thousands of boxes.
            <path key={b} fill={`var(--band-${b})`} d={v.ribbon.flatMap((day, i) => day.filter((s) => s.band === b)
              .map((s) => `M${i} ${1440 - s.to}h1.6v${s.to - s.from + 3}h-1.6z`)).join('')} />
          ))}
          {[6, 12, 18].map((h) => <line key={h} x1="0" x2={n} y1={1440 - h * 60} y2={1440 - h * 60} className="yr-line" vectorEffect="non-scaling-stroke" />)}
        </svg>
        <div className="yr-today" style={{ left: pct((dayIndex(v, v.today) + 0.5) / n) }} aria-hidden="true" />
        {chosen !== v.today && <div className="yr-chosen" style={{ left: pct((dayIndex(v, chosen) + 0.5) / n) }} aria-hidden="true" />}
      </div>
      <div className="yr-months" aria-hidden="true">
        {months.map((m) => <span key={m.i} style={{ left: pct((m.i + 15) / n) }}>{m.label}</span>)}
      </div>
    </div>
  )
}

function MonthTable({ m, today, highlight, narrow }: { m: YearView['months'][number]; today: string; highlight: string | null; narrow: boolean }) {
  const marks = new Map(m.clockMarks.map((c) => [c.date, c.text]))
  const never = <span className="muted">never</span>
  const cls = (r: DayRow) => [r.date === today ? 'is-today' : '', r.date === highlight ? 'is-chosen' : ''].join(' ').trim() || undefined
  const todayTag = (r: DayRow) => r.date === today && <span className="today-tag">Today</span>
  if (narrow) {
    return (
      <ol className="day-cards">
        {m.rows.flatMap((r) => [
          marks.has(r.date) && <li key={`m${r.date}`} className="clock-mark">{marks.get(r.date)}</li>,
          <li key={r.date} className={cls(r)} data-date={r.date}>
            <span className="day-card-date"><small>{weekday(r.date).slice(0, 3)}</small>{Number(r.date.slice(8))}</span>
            <span className="day-card-times">
              <b className="mono">{r.sunrise && r.sunset ? `${r.sunrise} – ${r.sunset}` : riseSet(r)}</b>
              <small>{r.civilDawn && r.civilDusk ? `Half-light ${r.civilDawn} – ${r.civilDusk}` : 'Half-light all night'}</small>
            </span>
            <span className="day-card-length">{r.daylight}</span>
          </li>,
        ])}
      </ol>
    )
  }
  return (
    <table className="day-table">
      <thead>
        <tr><th>Date</th><th>Half-light</th><th>Sunrise</th><th>Sunset</th><th>Half-light ends</th><th>Very dark</th><th>Daylight</th></tr>
      </thead>
      <tbody>
        {m.rows.flatMap((r) => [
          marks.has(r.date) && <tr key={`m${r.date}`} className="clock-mark"><td colSpan={7}>{marks.get(r.date)}</td></tr>,
          <tr key={r.date} className={cls(r)} data-date={r.date}>
            <td>{weekday(r.date).slice(0, 3)} {ordinal(Number(r.date.slice(8)))} {todayTag(r)}</td>
            <td className="mono">{r.civilDawn ?? never}</td>
            <td className="mono">{r.sunrise ?? never}</td>
            <td className="mono">{r.sunset ?? never}</td>
            <td className="mono">{r.civilDusk ?? never}</td>
            <td className="mono">{r.nauticalDusk ?? never}</td>
            <td>{r.daylight}</td>
          </tr>,
        ])}
      </tbody>
    </table>
  )
}

export function YearCards({ v, narrow, place }: { v: YearView | null; narrow: boolean; place: string }) {
  const [chosen, setChosen] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<string | null>(null)
  const daysCard = useRef<HTMLElement>(null)
  const scrollTo = useRef<string | null>(null)

  // After "See all of …", bring the month, at the chosen day, into view.
  useEffect(() => {
    const date = scrollTo.current
    if (!date || !daysCard.current) return
    scrollTo.current = null
    const row = daysCard.current.querySelector(`[data-date="${date}"]`)
    ;(row ?? daysCard.current).scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [open])

  if (!v) {
    return (
      <section className="card year">
        <h3>The year in light</h3>
        <p className="muted working" role="status">Working out the year…</p>
      </section>
    )
  }
  const day = chosen ?? v.today
  const row = rowFor(v, day)
  const monthIndex = open ? v.months.findIndex((m) => m.month === open) : -1
  const month = monthIndex >= 0 ? v.months[monthIndex] : null
  const seeAll = (date: string) => {
    scrollTo.current = date
    setHighlight(date)
    setOpen(date.slice(0, 7))
  }
  const choose = (m: string | null) => {
    setHighlight(null)
    setOpen(m)
  }
  const print = () => {
    document.body.dataset.printMonth = ''
    const done = () => { delete document.body.dataset.printMonth; window.removeEventListener('afterprint', done) }
    window.addEventListener('afterprint', done)
    window.print()
  }
  const years = [...new Set(v.months.map((m) => m.month.slice(0, 4)))]
  const fromLabel = `${monthName(v.from)} ${v.from.slice(0, 4)} to ${monthName(v.to)} ${v.to.slice(0, 4)}`

  return (
    <>
      <section className="card year">
        <div className="year-head">
          <h3>The year in light</h3>
          <span className="muted">{fromLabel}</span>
        </div>
        <YearRibbon v={v} chosen={day} onChoose={setChosen} narrow={narrow} />
        <Legend />
        {row && (
          <div className="year-detail" aria-live="polite">
            <div className="kicker">{longDate(day, true)}{day === v.today ? ' · Today' : ''}</div>
            <p className="year-detail-big">{riseSetLines(row)}</p>
            <p>{dayDetail(row)}</p>
            <button type="button" className="link-button" onClick={() => seeAll(day)}>See all of {monthName(day)}</button>
          </div>
        )}
        <p className="note">Tap a day to see its times{narrow ? '' : ', or use the arrow keys'}.</p>
      </section>

      <section className="card days" ref={daysCard}>
        <div className="year-head">
          <h3>Day by day<span className="print-only"> · {place}</span></h3>
          {month && (
            <div className="days-nav">
              <button type="button" data-noprint className="btn btn-secondary btn-small" aria-label="Previous month" disabled={monthIndex === 0} onClick={() => choose(v.months[monthIndex - 1].month)}>‹</button>
              <span className="days-month">{monthName(month.month)} {month.month.slice(0, 4)}</span>
              <button type="button" data-noprint className="btn btn-secondary btn-small" aria-label="Next month" disabled={monthIndex === v.months.length - 1} onClick={() => choose(v.months[monthIndex + 1].month)}>›</button>
            </div>
          )}
        </div>
        <div className="month-buttons" data-noprint>
          {years.map((y) => (
            <div key={y} className="month-year">
              <span className="muted">{y}</span>
              <div className="month-list">
                {v.months.filter((m) => m.month.startsWith(y)).map((m) => (
                  <button
                    key={m.month}
                    type="button"
                    className={`chip chip-button${m.month === open ? ' is-open' : ''}${m.month === v.today.slice(0, 7) ? ' is-now' : ''}`}
                    aria-pressed={m.month === open}
                    onClick={() => choose(m.month === open ? null : m.month)}
                  >
                    {monthName(m.month).slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {month && (
          <>
            <MonthTable m={month} today={v.today} highlight={highlight} narrow={narrow} />
            <div className="days-actions" data-noprint>
              <button type="button" className="btn btn-secondary btn-small" onClick={print}>Print this month</button>
              <button type="button" className="btn btn-secondary btn-small" onClick={() => choose(null)}>Close</button>
            </div>
          </>
        )}
      </section>
    </>
  )
}
