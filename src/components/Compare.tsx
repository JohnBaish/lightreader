// Compare (SPEC §8, mock-up option C): one box for a date or a place; quick choices; what
// was understood, said back; two small ribbons on the same midnight-to-midnight scale; the
// BST note when the clocks differ; and sentences only. It sits at a fixed place on the page.

import { useMemo, useState, type FormEvent } from 'react'
import { clockNote, compareDate, comparePlace, QUICK, readTarget, type Target } from '../lib/compare.ts'
import { longDate } from '../lib/format.ts'
import type { District } from '../lib/postcode.ts'
import { dayRibbon } from '../lib/ribbon.ts'
import { dayFigures, type Place } from '../lib/sun.ts'
import { Legend } from './SkyRibbon.tsx'

function DayStrip({ place, date, label }: { place: Place; date: string; label: string }) {
  const segs = useMemo(() => dayRibbon(place, date), [place, date])
  const from = segs[0].from.getTime()
  const span = segs[segs.length - 1].to.getTime() - from
  const share = (ms: number) => `${((ms / span) * 100).toFixed(3)}%`
  return (
    <div className="pair-row">
      <span className="pair-label">{label}</span>
      <div className="pair-strip">
        {segs.map((s, i) => <div key={i} className={`band-${s.band}`} style={{ left: share(s.from.getTime() - from), width: share(s.to.getTime() - s.from.getTime()) }} />)}
      </div>
    </div>
  )
}

const SHORT = (date: string) => {
  const [weekday, month, day] = longDate(date).split(' ')
  return `${weekday.slice(0, 3)} ${month} ${day}`
}

export function CompareCard({ d, today, now }: { d: District; today: string; now: Date }) {
  const [typed, setTyped] = useState('')
  const [target, setTarget] = useState<Target | null>(null)
  const choose = (text: string) => setTarget(readTarget(text, d, today))
  const submit = (e: FormEvent) => { e.preventDefault(); choose(typed) }

  const here = useMemo(() => dayFigures(d, today), [d, today])
  const result = useMemo(() => {
    if (!target || target.kind === 'error') return null
    if (target.kind === 'date') {
      if (target.date === today) return { echo: 'Comparing with today', note: null, sentences: ["That's today: see above."], strips: null }
      return {
        echo: `Comparing with ${longDate(target.date, true)}`,
        note: clockNote(today, target.date),
        sentences: compareDate(here, dayFigures(d, target.date), today),
        strips: [{ place: d as Place, date: today, label: 'Today' }, { place: d as Place, date: target.date, label: SHORT(target.date) }],
      }
    }
    return {
      echo: `Comparing with ${target.name}, today`,
      note: null,
      sentences: comparePlace(here, dayFigures(target.place, today), d.name, target.name.replace(/ \(.*\)$/, ''), now),
      strips: [{ place: d as Place, date: today, label: d.name }, { place: target.place, date: today, label: target.name.replace(/ \(.*\)$/, '') }],
    }
  }, [target, d, today, here, now])

  return (
    <section className="card compare">
      <h3>Compare</h3>
      <form className="field" onSubmit={submit} noValidate>
        <label htmlFor="cmp">Type a date, like "Christmas" or "14/7", or a place or postcode.</label>
        <div className="choose-row">
          <input className="input" id="cmp" value={typed} placeholder="Try Christmas, 14/7 or TR18" autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="go"
            onChange={(e) => setTyped(e.target.value)} />
          <button className="btn btn-primary" type="submit">Compare</button>
        </div>
        {target?.kind === 'error' && <div className="choose-error" role="alert">{target.message}</div>}
      </form>
      <div className="quick">
        {QUICK.map((q) => <button key={q} type="button" className="chip chip-button" onClick={() => { setTyped(q); choose(q) }}>{q}</button>)}
      </div>
      {result && (
        <div className="compare-result">
          <div className="echo"><span className="kicker">{result.echo.split(' ').slice(0, 2).join(' ')}</span> <b>{result.echo.split(' ').slice(2).join(' ')}</b></div>
          {result.strips && (
            <div className="pairs">
              {result.strips.map((s) => <DayStrip key={s.label} {...s} />)}
              <div className="pair-row pair-axis"><span className="pair-label" /><div className="pair-hours"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div></div>
              <Legend />
            </div>
          )}
          {result.note && <p className="clock-note">{result.note}</p>}
          <ul>{result.sentences.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </section>
  )
}
