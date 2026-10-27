// Lightreader's page (PLAN stages 3 to 5, light mode): the header with the postcode pill,
// today's sunrise and sunset, the sky ribbon for the next 24 hours, the sentence groups,
// "Is it light at…?", Compare, the year ribbon and the day-by-day tables, "About
// these figures" and the footer (SPEC §5). A first-time visitor sees the postcode box; the
// last postcode chosen is kept on this device only.

import { Component, useEffect, useMemo, useState, type ReactNode } from 'react'
import { About } from './components/About.tsx'
import { PostcodeBox } from './components/PostcodeBox.tsx'
import { CompareCard } from './components/Compare.tsx'
import { LightAtCard } from './components/LightAt.tsx'
import { SentenceGroups } from './components/Sentences.tsx'
import { SkyRibbonNarrow, SkyRibbonWide } from './components/SkyRibbon.tsx'
import { YearCards } from './components/Year.tsx'
import { POSTCODE_CREDITS, saveDistrict, savedDistrict, type District } from './lib/postcode.ts'
import { useIsNarrow } from './lib/responsive.ts'
import { ribbon } from './lib/ribbon.ts'
import { savedTimes, saveTimes, tidyTimes } from './lib/times.ts'
import { useSky } from './lib/useSky.ts'
import { headline } from './lib/headline.ts'
import { daysFigures } from './lib/sun.ts'
import { addDays, ukParts } from './lib/ukTime.ts'

function Logo() {
  return (
    <svg className="logo" width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="var(--color-bg)" stroke="var(--color-accent)" strokeWidth="2.5" />
      <path d="M9 19.5a7 7 0 0 1 14 0" fill="none" stroke="var(--color-accent)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M7 23h18" fill="none" stroke="var(--color-accent-700)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

/** The moment now, moving on each minute, so the ribbon keeps up while the page is open. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

/** If the page can't be shown, a message and a way to choose again, not an empty page
 *  (as Hindcaster's safety net). */
class SafetyNet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return <div className="card welcome" role="alert"><p>Sorry, this page couldn't be shown. Try another postcode, or try again later.</p></div>
  }
}

function Place({ d, now }: { d: District; now: Date }) {
  const narrow = useIsNarrow(720)
  const today = ukParts(now).date
  // Today's and tomorrow's figures for the top of the page, which changes once the sun
  // is highest (src/lib/headline.ts).
  const head = useMemo(() => {
    const [fig, next] = daysFigures(d, today, addDays(today, 1))
    return headline(now, fig, next)
  }, [d, today, now])
  // The ribbon moves on with the clock; worked out again each minute.
  const r = useMemo(() => ribbon(d, now), [d, now])
  const [times, setTimes] = useState<string[]>(savedTimes)
  const changeTimes = (next: string[]) => {
    const tidy = tidyTimes(next)
    saveTimes(tidy)
    setTimes(tidy)
  }
  const { groups, lightAt, year } = useSky(d, today, times)
  return (
    <>
      <section className="card today">
        <div className="today-blocks">
          {head.map((b) => (
            <div key={b.kicker} className="today-block">
              <div className="kicker">{b.kicker}</div>
              <p className="today-big">
                {b.items.map((it, i) => (
                  <span key={it.label}>
                    {i > 0 && <span className="dot"> · </span>}
                    <span className="pair">{it.label} <span>{it.time}</span></span>
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="card next24">
        <h3>Next 24 hours</h3>
        {narrow ? <SkyRibbonNarrow r={r} /> : <SkyRibbonWide r={r} />}
      </section>
      <SentenceGroups groups={groups} after={{ 'Coming up': <LightAtCard key="light-at" times={times} lightAt={lightAt} narrow={narrow} onChange={changeTimes} /> }} />
      <CompareCard d={d} today={today} now={now} />
      <YearCards v={year} narrow={narrow} place={`${d.name} (${d.code})`} />
    </>
  )
}

export default function App() {
  const now = useNow()
  const [d, setD] = useState<District | null>(savedDistrict)
  const [changing, setChanging] = useState(false)
  const choose = (next: District) => {
    saveDistrict(next.code)
    setD(next)
    setChanging(false)
  }

  return (
    <>
      <nav className="nav" data-noprint>
        <span className="nav-brand"><Logo /> Lightreader</span>
        {d && !changing && (
          <span className="pill">
            {d.name} ({d.code})
            <button className="btn btn-primary btn-small" type="button" onClick={() => setChanging(true)}>Change</button>
          </span>
        )}
      </nav>
      <main className="col screen">
        {(!d || changing) && (
          <section className="card welcome">
            {!d && <h2>Sunrise, sunset and twilight for your postcode</h2>}
            {!d && <p className="muted">Check when the light comes and goes anywhere in England, today and through the year, in UK local time.</p>}
            <PostcodeBox onChoose={choose} onCancel={d ? () => setChanging(false) : undefined} />
          </section>
        )}
        {d && <SafetyNet key={d.code}><Place d={d} now={now} /></SafetyNet>}
        <About />
        <footer className="footer-notice" data-noprint>
          Lightreader is a free-to-use personal project by John Baish. More free tools at{' '}
          <a href="https://www.baish.net/" target="_blank" rel="noopener noreferrer" className="footer-link">www.baish.net</a>.
          {' '}Contact: workshop@baish.net. We don't record anything you do here, apart from anonymous visit statistics (no cookies, no personal data) showing us how the site is used.
          {' '}Your device, rather than the website, stores your recent selections, so the page opens the same way next time.
          <br />{POSTCODE_CREDITS.map((c) => c.replace(/([^.])$/, '$1.')).join(' ')}
          {' '}Calculated with <a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noopener noreferrer" className="footer-link">Astronomy Engine</a> (MIT licence).
        </footer>
      </main>
    </>
  )
}
