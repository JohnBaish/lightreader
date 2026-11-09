# Nightreader: the staged build

One stage at a time, each shown to John before the next. Until `JohnBaish/nightreader`
exists, the work is parked in Lightreader's repo (`design/nightreader/`) on a session branch,
and nothing is public.

## Stage 0: design, spec and plan — done (November 9th 2026)

Mock-ups agreed (`design/mockups/`, https://claude.ai/artifact/UDWU52EtUoMi9d7JYEMB57),
`SPEC.md`, this file.

## Stage 1: the figures — started November 9th 2026

1. **Done:** `src/lib/night.ts` (how dark the night gets and its fallbacks, the Moon and
   Moon-free time, the planets and the two-level in-view rule, fists) and `src/lib/ahead.ts`
   (phases, eclipses, planets at their best, meteor showers), on Lightreader's `sun.ts`.
2. **Done:** Great Britain's postcode districts (`src/data/outcodes.json`, from Refueller).
3. **Done:** `npm run check` (13 checks) and `npm run figures-sheet`
   (`design/figures-sheet-2026-11-09.md`: five places from Penzance to Lerwick).
4. **To do:** John reads the figures sheet and answers SPEC §12.
5. **To do:** the meteor shower list checked against the International Meteor Organization;
   eclipse and planet dates compared with a published source; the stars' terms read.
6. **To do:** the town list for Great Britain; the stars and lines prepared as a small file.
7. **To do:** how long a year of nights takes on a phone (about 365 Moon searches).

## Stage 2: the sentences

Every sentence the page says, as plain functions with checks, and a sentence sheet for John:
the opening, the Moon, each planet's line with its place and fists, "Looking ahead".

## Stage 3: the page, with "The sky tonight"

The app (Vite, React and TypeScript, as Lightreader), the postcode box, the Ember look, the
opening and the first picture. Checked at 1200px, 390px and 844 by 390 with touch.

## Stage 4: "Where to look"

The view south with its slider, towns, stars and fists.

## Stage 5: "The year in darkness"

The year picture with its keys and the chosen night's figures.

## Stage 6: "Looking ahead"

The list, with meteor showers.

## Stage 7: finishing and launch

"About these figures", credits, favicon, link preview, search, the domain, Web Analytics,
`/fresh-look`, the hub card and the overview. A testing stage only if John asks for one.

## Dates to remember

None yet.
