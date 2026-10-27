// The big places "Across the UK" picks its ends from (SPEC §6): every city in OS Open
// Names (Great Britain; Northern Ireland isn't included) and five well-known towns at the
// edges, worked out from their own coordinates, so they need no postcode data outside
// England. Built by scripts/build-uk-places.ts (John, 27 October: "the short list"; the
// places shown are whichever are at the two ends of what's being compared that day).

import data from '../data/ukPlaces.json' with { type: 'json' }
import type { Place } from './sun.ts'

/** `edge`: one of the five less familiar towns at the edges, named in brackets. */
export type NamedPlace = Place & { name: string; edge?: boolean }

export const UK_PLACES: NamedPlace[] = data.places
