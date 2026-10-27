// Fixed places outside the visitor's postcode, for "Across the UK" (SPEC §6), worked out
// from their own coordinates, so they need no postcode data outside England.
//
// Each is the town's point in OS Open Names (October 2026 download, populatedPlace),
// converted from the National Grid with scripts/lib/grid.ts. Provisional until John
// answers PLAN question 7 (which places, and which point for each).
//   Lerwick  447467, 1141434 (Town, Shetland Islands)
//   Penzance 147092,   30263 (Town, Cornwall)

import type { Place } from './sun.ts'

export type NamedPlace = Place & { name: string }

/** The far north and the far south-west: the two ends of the sentence. */
export const ACROSS_UK: NamedPlace[] = [
  { name: 'Lerwick', latitude: 60.1546, longitude: -1.1468 },
  { name: 'Penzance', latitude: 50.1184, longitude: -5.5393 },
]
