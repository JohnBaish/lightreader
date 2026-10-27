// "Is it light at…?" (SPEC §6, mock-up option B of "your times"): the visitor's times as
// chips, each with today's light as a pill, a thin strip of the light at that time on every
// day of the year with a today marker, and two sentences.

import { useState, type FormEvent } from 'react'
import { BAND_LABEL } from '../lib/bands.ts'
import type { LightAt } from '../lib/lightAtYear.ts'
import { MAX_TIMES } from '../lib/times.ts'
import { Sentence } from './Sentences.tsx'
import { Legend } from './SkyRibbon.tsx'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** The light at one time of day across the year, as runs of colour. */
export function YearStrip({ l, narrow }: { l: LightAt; narrow: boolean }) {
  const runs: { band: string; from: number; to: number }[] = []
  l.strip.forEach((b, i) => {
    const last = runs[runs.length - 1]
    if (last && last.band === b) last.to = i + 1
    else runs.push({ band: b, from: i, to: i + 1 })
  })
  const n = l.strip.length
  const pct = (i: number) => `${((i / n) * 100).toFixed(3)}%`
  return (
    <div className="year-strip" aria-hidden="true">
      <div className="year-strip-bar">
        {runs.map((r, i) => <div key={i} className={`band-${r.band}`} style={{ left: pct(r.from), width: pct(r.to - r.from) }} />)}
        <div className="year-strip-today" style={{ left: pct(l.todayIndex + 0.5) }} />
      </div>
      <div className="year-strip-months">
        {l.months.filter((m) => m.index + 15 < n).map((m) => <span key={m.index} style={{ left: pct(m.index + 15) }}>{narrow ? MONTHS[m.month][0] : MONTHS[m.month]}</span>)}
      </div>
    </div>
  )
}

export function LightAtCard({ times, lightAt, narrow, onChange }: { times: string[]; lightAt: LightAt[] | null; narrow: boolean; onChange: (t: string[]) => void }) {
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')
  const add = (e: FormEvent) => {
    e.preventDefault()
    if (/^\d{2}:\d{2}$/.test(value)) onChange([...times, value])
    setValue('')
    setAdding(false)
  }
  const shown = lightAt?.filter((l) => times.includes(l.time)) ?? null
  return (
    <section className="card group light-at">
      <h3>Is it light at…?</h3>
      <div className="chips">
        {times.map((t) => (
          <span key={t} className="chip mono">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(times.filter((x) => x !== t))}>✕</button>
          </span>
        ))}
        {adding ? (
          <form className="chip-add" onSubmit={add}>
            <input className="input" type="time" required autoFocus value={value} onChange={(e) => setValue(e.target.value)} aria-label="A time to add" />
            <button className="btn btn-primary btn-small" type="submit">Add</button>
            <button className="btn btn-secondary btn-small" type="button" onClick={() => setAdding(false)}>Cancel</button>
          </form>
        ) : (
          times.length < MAX_TIMES && <button className="btn btn-primary btn-small" type="button" onClick={() => setAdding(true)}>+ Add a time</button>
        )}
        <span className="note">Saved on this device only</span>
      </div>
      {!shown ? (
        times.length > 0 && <p className="muted working" role="status">Working out the year…</p>
      ) : (
        shown.map((l) => (
          <div key={l.time} className="light-at-time">
            <div className="light-at-head">
              <h4 className="mono">{l.time}</h4>
              <span className={`band-tag band-${l.today}`}>{BAND_LABEL[l.today]} today</span>
            </div>
            <YearStrip l={l} narrow={narrow} />
            <ul>{l.sentences.map((s, i) => <li key={i}><Sentence text={s} /></li>)}</ul>
          </div>
        ))
      )}
      {shown && shown.length > 0 && <Legend />}
    </section>
  )
}
