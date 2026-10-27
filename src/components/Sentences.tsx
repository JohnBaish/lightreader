// The sentence groups (SPEC §6), worked out in a worker (src/lib/sentences.worker.ts) so
// the page shows today and the ribbon straight away. A light label that could be read as
// an ordinary word is a small tag in its band colour (John, 27 October, option B).

import { Fragment, type ReactNode } from 'react'
import { BAND_LABEL } from '../lib/bands.ts'
import type { Group } from '../lib/sentences/index.ts'
import { sentenceParts } from '../lib/sentences/words.ts'

export function Sentence({ text }: { text: string }) {
  return (
    <>
      {sentenceParts(text).map((p, i) => 'text' in p ? p.text : <span key={i} className={`band-tag band-${p.band}`}>{BAND_LABEL[p.band]}</span>)}
    </>
  )
}

/** The groups as cards, in the spec's order; `after` puts a card of its own (such as "Is
 *  it light at…?") straight after the group named, across the full width. */
export function SentenceGroups({ groups, after = {} }: { groups: Group[] | null; after?: Record<string, ReactNode> }) {
  if (!groups) return <p className="muted working" role="status">Working out the rest of the year…</p>
  return (
    <div className="groups">
      {groups.filter((g) => g.sentences.length).map((g) => (
        <Fragment key={g.heading}>
          <section className="card group">
            <h3>{g.heading}</h3>
            <ul>{g.sentences.map((s, i) => <li key={i}><Sentence text={s} /></li>)}</ul>
          </section>
          {after[g.heading] && <div className="group-wide">{after[g.heading]}</div>}
        </Fragment>
      ))}
    </div>
  )
}
