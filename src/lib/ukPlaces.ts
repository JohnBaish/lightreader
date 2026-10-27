// Fixed places outside the visitor's postcode, for "Across the UK" (SPEC §6), worked out
// from their own coordinates, so they need no postcode data outside England.
//
// John, 27 October (PLAN question 7): Lerwick at its town centre, Penzance at its postcode
// district centre (TR18, as in src/data/outcodes.json). Lerwick is its point in OS Open
// Names (October 2026 download, populatedPlace, Town, Shetland Islands, 447467, 1141434),
// converted from the National Grid with scripts/lib/grid.ts. Which places to show (the
// closest big places to the extremes) is still being settled.

import type { Place } from './sun.ts'

export type NamedPlace = Place & { name: string }

/** The far north and the far south-west: the two ends of the sentence. */
export const ACROSS_UK: NamedPlace[] = [
  { name: 'Lerwick', latitude: 60.1546, longitude: -1.1468 },
  { name: 'Penzance', latitude: 50.1174, longitude: -5.5424 },
]
