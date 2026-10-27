// Works out the sentence groups and "Is it light at…?" away from the page (PLAN stages 3
// and 4), as they take about a second (the sun's figures for some 800 days), so the page
// can show today and the ribbon straight away. The worker stays running and keeps the
// figures for the last place and day, so changing the times is quick.

import { lightAtYear, yearChanges, type LightAt } from './lightAtYear.ts'
import { allGroups, makeContext, type Group, type SkyContext } from './sentences/index.ts'
import type { Place } from './sun.ts'
import { ukParts } from './ukTime.ts'

export type Ask =
  | { kind: 'groups'; id: number; place: Place; name: string; now: string }
  | { kind: 'times'; id: number; place: Place; name: string; now: string; times: string[] }
export type Answer =
  | { kind: 'groups'; id: number; groups: Group[] }
  | { kind: 'times'; id: number; times: LightAt[] }

let kept: { key: string; ctx: SkyContext; year?: ReturnType<typeof yearChanges> } | null = null

function context(place: Place, name: string, now: string) {
  const key = `${place.latitude},${place.longitude} ${ukParts(new Date(now)).date}`
  if (kept?.key !== key) kept = { key, ctx: makeContext(place, name, new Date(now)) }
  return kept
}

self.onmessage = (e: MessageEvent<Ask>) => {
  const a = e.data
  const k = context(a.place, a.name, a.now)
  if (a.kind === 'groups') {
    self.postMessage({ kind: 'groups', id: a.id, groups: allGroups(k.ctx, []) } satisfies Answer)
  } else {
    k.year ??= yearChanges(a.place, k.ctx.today)
    self.postMessage({ kind: 'times', id: a.id, times: a.times.map((t) => lightAtYear(k.ctx, k.year!, t)) } satisfies Answer)
  }
}
