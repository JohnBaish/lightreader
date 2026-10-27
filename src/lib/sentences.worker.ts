// Works out the sentence groups away from the page (PLAN stage 3), as they take about a
// second (the sun's figures for some 800 days), so the page can show today and the ribbon
// straight away.

import { allGroups, makeContext, type Group } from './sentences/index.ts'
import type { Place } from './sun.ts'

export type Ask = { place: Place; name: string; now: string }
export type Answer = { groups: Group[]; ms: number }

self.onmessage = (e: MessageEvent<Ask>) => {
  const t0 = performance.now()
  const groups = allGroups(makeContext(e.data.place, e.data.name, new Date(e.data.now)), [])
  self.postMessage({ groups, ms: Math.round(performance.now() - t0) } satisfies Answer)
}
