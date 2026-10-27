// Compare (SPEC §8, mock-up option C; changed by John, 28 October, to work as "Is it light
// at…?" does): each date or place the visitor adds is a chip, saved on this device only, and
// each gets what was understood, said back; two small ribbons on the same midnight-to-
// midnight scale; the BST note when the clocks differ; and sentences only. It sits at a
// fixed place on the page.

import { useMemo, useState, type FormEvent } from 'react'
import { addComparison, MAX_COMPARISONS, saveComparisons, savedComparisons } from '../lib/comparisons.ts'
import { clockNote, compareDate, comparePlace, readTarget, type Target } from '../lib/compare.ts'
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

type Result = { echo: string; note: string | null; sentences: string[]; strips: { place: Place; date: string; label: string }[] | null }

function compareWith(target: Target, d: District, today: string, now: Date): Result | null {
  if (target.kind === 'error') return null
  const here = dayFigures(d, today)
  if (target.kind === 'date') {
    if (target.date === today) return { echo: 'Comparing with today', note: null, sentences: ["That's today: see above."], strips: null }
    return {
      echo: `Comparing with ${longDate(target.date, true)}`,
      note: clockNote(today, target.date),
      sentences: compareDate(here, dayFigures(d, target.date), today),
      strips: [{ place: d, date: today, label: 'Today' }, { place: d, date: target.date, label: SHORT(target.date) }],
    }
  }
  const name = target.name.replace(/ \(.*\)$/, '')
  return {
    echo: `Comparing with ${target.name}, today`,
    note: null,
    sentences: comparePlace(here, dayFigures(target.place, today), d.name, name, now),
    strips: [{ place: d, date: today, label: d.name }, { place: target.place, date: today, label: name }],
  }
}

function CompareResult({ r }: { r: Result }) {
  return (
    <div className="compare-result">
      <div className="echo"><span className="kicker">{r.echo.split(' ').slice(0, 2).join(' ')}</span> <b>{r.echo.split(' ').slice(2).join(' ')}</b></div>
      {r.strips && (
        <div className="pairs">
          {r.strips.map((s) => <DayStrip key={s.label} {...s} />)}
          <div className="pair-row pair-axis"><span className="pair-label" /><div className="pair-hours"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div></div>
        </div>
      )}
      {r.note && <p className="clock-note">{r.note}</p>}
      <ul>{r.sentences.map((s, i) => <li key={i}>{s}</li>)}</ul>
    </div>
  )
}

export function CompareCard({ d, today, now }: { d: District; today: string; now: Date }) {
  const [list, setList] = useState<string[]>(savedComparisons)
  const [adding, setAdding] = useState(false)
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)
  const change = (next: string[]) => {
    saveComparisons(next)
    setList(next)
  }
  // The box shows when adding, and always while there's nothing saved yet.
  const open = adding || list.length === 0
  const close = () => { setAdding(false); setTyped(''); setError(null) }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const target = readTarget(typed, d, today)
    if (target.kind === 'error') { setError(target.message); return }
    // A place is kept under its proper name ("Penzance (TR18)"), a date as typed.
    change(addComparison(list, target.kind === 'place' ? target.name : typed))
    close()
  }
  const results = useMemo(
    () => list.map((text) => ({ text, r: compareWith(readTarget(text, d, today), d, today, now) })),
    [list, d, today, now],
  )

  return (
    <section className="card compare">
      <h3>Compare</h3>
      <div className="chips">
        {list.map((t) => (
          <span key={t} className="chip">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => change(list.filter((x) => x !== t))}>✕</button>
          </span>
        ))}
        {!open && list.length < MAX_COMPARISONS && <button className="btn btn-primary btn-small" type="button" onClick={() => setAdding(true)}>+ Add a date or place</button>}
        {list.length > 0 && <span className="note">Saved on this device only</span>}
      </div>
      {open && list.length < MAX_COMPARISONS && (
        <form className="field" onSubmit={submit} noValidate>
          <label htmlFor="cmp">Type a date, like "Christmas" or "14/7", or a place or postcode.</label>
          <div className="choose-row">
            <input className="input" id="cmp" value={typed} placeholder="Try Christmas, 14/7 or TR18" autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="go"
              autoFocus={adding} onChange={(e) => { setTyped(e.target.value); setError(null) }} />
            <button className="btn btn-primary" type="submit">Compare</button>
            {list.length > 0 && <button className="btn btn-secondary" type="button" onClick={close}>Cancel</button>}
          </div>
          {error && <div className="choose-error" role="alert">{error}</div>}
          {list.length === 0 && <div className="note">What you add is saved on this device only.</div>}
        </form>
      )}
      {results.map(({ text, r }) => r && <CompareResult key={text} r={r} />)}
      {results.some(({ r }) => r?.strips) && <Legend />}
    </section>
  )
}
