// The sentence groups (SPEC §6), worked out in a worker (src/lib/sentences.worker.ts) so
// the page shows today and the ribbon straight away. A light label that could be read as
// an ordinary word is a small tag in its band colour (John, 27 October, option B).

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { BAND_LABEL } from '../lib/bands.ts'
import { arrange, type Arrangement } from '../lib/layout.ts'
import type { Group } from '../lib/sentences/index.ts'
import { sentenceParts } from '../lib/sentences/words.ts'

export function Sentence({ text }: { text: string }) {
  return (
    <>
      {sentenceParts(text).map((p, i) => 'text' in p ? p.text : <span key={i} className={`band-tag band-${p.band}`}>{BAND_LABEL[p.band]}</span>)}
    </>
  )
}

function GroupCard({ g, cardRef }: { g: Group; cardRef?: (e: HTMLElement | null) => void }) {
  return (
    <section className="card group" ref={cardRef}>
      <h3>{g.heading}</h3>
      <ul>{g.sentences.map((s, i) => <li key={i}><Sentence text={s} /></li>)}</ul>
    </section>
  )
}

/** A card's height as its contents need it, whether or not it's been stretched. */
function naturalHeight(card: HTMLElement): number {
  const last = card.lastElementChild ?? card
  return last.getBoundingClientRect().bottom - card.getBoundingClientRect().top + parseFloat(getComputedStyle(card).paddingBottom)
}

/** A run of cards between full-width ones, in two columns on a computer, arranged by
 *  `arrange()` (src/lib/layout.ts) from each card's height in a column, measured as drawn and
 *  again whenever a card changes size. One card alone spans the width. On a phone the
 *  columns stack, so the order is kept. */
function CardRun({ run }: { run: Group[] }) {
  const cards = useRef(new Map<string, HTMLElement>())
  const heights = useRef(new Map<string, number>())
  const box = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<Arrangement>(() => ({ split: Math.ceil(run.length / 2), lastWide: false }))
  const order = run.map((g) => g.heading).join('|')
  useLayoutEffect(() => {
    if (run.length < 2) return
    const measure = () => {
      // Only a card in a column is measured, so a card spanning the width keeps its column
      // height and the arrangement can't flip back and forth.
      // A card's own height, from its top to the end of its sentences plus its padding, as the
      // last card in a column is stretched to fill it (John, 28 October).
      for (const [heading, e] of cards.current) if (e.closest('.group-col')) heights.current.set(heading, naturalHeight(e))
      const hs = run.map((g) => heights.current.get(g.heading) ?? 0)
      const gap = parseFloat(getComputedStyle(box.current!).rowGap) || 0
      const next = arrange(hs, gap)
      setLayout((was) => (was.split === next.split && was.lastWide === next.lastWide ? was : next))
    }
    measure()
    const watch = new ResizeObserver(measure)
    cards.current.forEach((e) => watch.observe(e))
    return () => watch.disconnect()
  }, [order, run])
  if (run.length === 1) return <div className="group-wide"><GroupCard g={run[0]} /></div>
  const card = (g: Group) => (
    <GroupCard key={g.heading} g={g} cardRef={(e) => { if (e) cards.current.set(g.heading, e); else cards.current.delete(g.heading) }} />
  )
  const inColumns = layout.lastWide ? run.slice(0, -1) : run
  return (
    <div className="group-run" ref={box}>
      {/* Side by side, cards line up at the top, and the last in each column stretches so the
          two columns end level (John, 28 October). */}
      <div className="group-cols">
        <div className="group-col">{inColumns.slice(0, layout.split).map(card)}</div>
        <div className="group-col">{inColumns.slice(layout.split).map(card)}</div>
      </div>
      {layout.lastWide && <div className="group-wide">{card(run[run.length - 1])}</div>}
    </div>
  )
}

/** The groups as cards, in the spec's order; `after` puts a card of its own (such as "Is
 *  it light at…?") straight after the group named, across the full width. */
export function SentenceGroups({ groups, after = {} }: { groups: Group[] | null; after?: Record<string, ReactNode> }) {
  if (!groups) return <p className="muted working" role="status">Working out the rest of the year…</p>
  const shown = groups.filter((g) => g.sentences.length)
  // Runs of cards between the full-width ones.
  const parts: ReactNode[] = []
  let run: Group[] = []
  for (const g of shown) {
    run.push(g)
    if (after[g.heading] || g === shown[shown.length - 1]) {
      parts.push(<CardRun key={run[0].heading} run={run} />)
      if (after[g.heading]) parts.push(<div key={`after-${g.heading}`} className="group-wide">{after[g.heading]}</div>)
      run = []
    }
  }
  return <div className="groups">{parts}</div>
}
