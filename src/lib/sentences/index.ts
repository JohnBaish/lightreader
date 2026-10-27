// Every sentence group, in the order the page shows them (SPEC §6).

import { acrossUkSentences } from './acrossUk.ts'
import { comingUpSentences } from './comingUp.ts'
import type { SkyContext } from './context.ts'
import { darknessSentences } from './darkness.ts'
import { directionSentences } from './directions.ts'
import { fortnightSentences } from './fortnight.ts'
import { lightAtSentences, type TimeOfDay } from './lightAt.ts'
import { recordSentences } from './records.ts'
import { todaySentences } from './today.ts'

export { makeContext, type SkyContext } from './context.ts'

export type Group = { heading: string; sentences: string[] }

export function allGroups(ctx: SkyContext, times: TimeOfDay[]): Group[] {
  return [
    { heading: 'Today', sentences: todaySentences(ctx) },
    { heading: 'This fortnight', sentences: fortnightSentences(ctx) },
    { heading: 'Records and runs', sentences: recordSentences(ctx) },
    { heading: 'Coming up', sentences: comingUpSentences(ctx) },
    ...times.map((t) => ({ heading: `Is it light at ${t}?`, sentences: lightAtSentences(ctx, t) })),
    { heading: 'Darkness', sentences: darknessSentences(ctx) },
    { heading: 'Across the UK', sentences: acrossUkSentences(ctx) },
    { heading: 'Direction of sunrise and sunset', sentences: directionSentences(ctx) }, // John, 27 October
  ]
}
