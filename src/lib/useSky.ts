// The worker's results for the page (src/lib/sentences.worker.ts): the sentence groups, and
// "Is it light at…?" for the visitor's times. One worker for the page, kept running.

import { useEffect, useRef, useState } from 'react'
import type { LightAt } from './lightAtYear.ts'
import type { Group } from './sentences/index.ts'
import type { Answer, Ask } from './sentences.worker.ts'
import type { District } from './postcode.ts'

export function useSky(d: District, today: string, times: string[]): { groups: Group[] | null; lightAt: LightAt[] | null } {
  const worker = useRef<Worker | null>(null)
  const [groups, setGroups] = useState<{ key: string; value: Group[] } | null>(null)
  const [lightAt, setLightAt] = useState<{ key: string; value: LightAt[] } | null>(null)
  const nextId = useRef(0)
  const place = `${d.code} ${today}`
  const timesKey = `${place} ${times.join(',')}`

  useEffect(() => {
    const w = new Worker(new URL('./sentences.worker.ts', import.meta.url), { type: 'module' })
    worker.current = w
    return () => w.terminate()
  }, [])

  useEffect(() => {
    const w = worker.current!
    const id = ++nextId.current
    const onAnswer = (e: MessageEvent<Answer>) => {
      if (e.data.kind === 'groups' && e.data.id === id) setGroups({ key: place, value: e.data.groups })
    }
    w.addEventListener('message', onAnswer)
    w.postMessage({ kind: 'groups', id, place: d, name: d.name, now: new Date().toISOString() } satisfies Ask)
    return () => w.removeEventListener('message', onAnswer)
  }, [d, place])

  useEffect(() => {
    const w = worker.current!
    const id = ++nextId.current
    const onAnswer = (e: MessageEvent<Answer>) => {
      if (e.data.kind === 'times' && e.data.id === id) setLightAt({ key: timesKey, value: e.data.times })
    }
    w.addEventListener('message', onAnswer)
    w.postMessage({ kind: 'times', id, place: d, name: d.name, now: new Date().toISOString(), times } satisfies Ask)
    return () => w.removeEventListener('message', onAnswer)
  }, [d, timesKey, times])

  return {
    groups: groups?.key === place ? groups.value : null,
    // While new times are being worked out, the last ones stay, so the card doesn't flicker.
    lightAt: lightAt?.key.startsWith(place) ? lightAt.value : null,
  }
}
