# Lightreader — build plan

Drafted on Tuesday October 27th 2026 from John's `SPEC.md` and the four chosen
mock-ups in `design/mockups/`. The plan is staged so that John can see and
approve each stage before the next begins. Each stage is built on its own
branch and merged to `main` only when John says so (HOUSE-STYLE §10).

At the end of every stage:

- `npm run build`, `npm run lint` and `npm run check` pass (once they exist).
- Anything with a screen has been checked in Chromium at 1200px, and at 390px
  with touch emulation, with no sideways scrolling. John sees the
  screenshots.
- `CLAUDE.md` has a dated entry: what was built, how it was checked, and what
  couldn't be checked.
- John gets a short summary in plain English, plus a preview link where there
  is something to see.

The order puts the figures first, then the wording, then the page. Every
sentence and table depends on the calculation being right, and on
the sentences agreeing with the tables (rule C). Getting those settled before
anything is drawn means the page stages are mostly layout.

---

## Stage 0 — spec, plan and setup (this branch, `claude/nice-goodall-j1r6wu`)

Done on this branch:

- The mock-ups moved to `design/mockups/` (`top-of-page.html`,
  `compare.html`, `year-tables.html`, `your-times.html`), unchanged.
- `HOUSE-STYLE.md`, `SEO-HANDOVER.md`, `.claude/skills/fresh-look/` and
  `.gitignore` copied from Hindcaster's copies (clockwheel `36378ed`).
- `CLAUDE.md` (working notes, reading list, log) and this plan.
- Some of the SPEC §11 checks (results in `CLAUDE.md`).

**John's answers (27 October):** question 1, yes, Lightreader's 24-hour times
are a deliberate exception; question 2, Hindcaster's dark colours; question 6,
`api.met.no` allowed; question 9, start stage 1. Questions 4, 5, 7 and 8 are
still open; question 3 needed no answer.

**More answers (27 October, after stage 1):** the figures sheet and the MET Norway
comparison hold no surprises. Question 4: yes, draft the wording (done in the stage 2
sentence sheet). Question 5: yes, Compare accepts places outside England if it's easily
done, each at its town centre (stage 4). Question 7: Lerwick at its town centre,
Penzance at its postcode district centre (TR18); and the places shown should be "the
closest big places to the extremes", which is being settled. Question 8: yes,
`lightreader.baish.net`.

## Stage 1 — the calculation, and the postcode list (no screen)

Branch: `claude/nice-goodall-j1r6wu` (this session's branch, together with stage 0)

1. Scaffold Vite + React + TypeScript, set up like Hindcaster's (`oxlint`,
   `npm run check` run directly by Node with no test framework), with
   `astronomy-engine` pinned to an exact version.
2. `src/lib/sun.ts`: for a place and a UK date, the day's events in UTC.
   These are sunrise and sunset, the 6°, 12° and 18° boundaries both
   morning and evening, and solar noon. Also the sun's direction at sunrise
   and sunset, and the day's darkest point. Missing events (no true night in
   summer) are returned as "none", never as an error (rule E).
3. `src/lib/bands.ts`: which band applies at any moment, built from those
   events, so the ribbons, strips and "Is it light at…?" all use one rule.
4. `src/lib/format.ts`: times ("06:49", rounded to the nearest minute, UK
   clock time), dates ("Tuesday October 27th"), durations ("1h 20m", "47m",
   "2h", "less than a minute") and numbers in words (house style §13).
5. `src/lib/year.ts`: the year's figures for one place, six months back to
   six ahead, worked out in the browser. (A quick test of the library
   suggests this takes a fraction of a second; to be measured.)
6. **Postcode districts.** Reuse Hindcaster's `data/outcodes.json` (2,210
   English districts, from OS Open Names). Convert each district centre from
   British National Grid to latitude and longitude at build time, and keep
   only what Lightreader needs (district, place name, latitude, longitude).
   The file is bundled with the site, so no request carries the postcode.
   The three credit lines come with it (OS, Royal Mail, National
   Statistics).
7. **Checks** in `npm run check`: every example figure in the spec,
   recomputed from Astronomy Engine; BST and GMT days; both clock-change
   days; no true night in summer; rounding at the half-minute.
8. **The year against MET Norway's Sunrise 3.0** (SPEC §3): a script that
   compares every day of a year for about six English places (for example
   Penzance, Reading, Norwich, Manchester, Newcastle and Berwick) and logs
   the largest difference. It needs `api.met.no` allowed in the environment
   (question 6).
9. **For John:** a "figures sheet" with Reading's spec examples next to the
   recomputed ones, so the wording stage starts from the right numbers.

**Stage 1 status (27 October):** built; waiting for John's look at the figures
sheet (`design/figures-sheet-2026-10-27.md`) and the MET Norway comparison
(`design/metno-comparison.md`). Not merged.

## Stage 2 — the sentences (no screen yet)

Branch: `claude/nice-goodall-j1r6wu` (this session's branch)

**Status (27 October):** built; the sentence sheet
(`design/sentence-sheet-2026-10-27.md`, and as a PDF) is with John, with 12
numbered points for him to decide. Not merged.

Every sentence group in SPEC §6 and every rule in SPEC §7, written as plain
functions of (place, date, time of day) in `src/lib/sentences/`. Each group
gets its own file and its own checks.

- Today, This fortnight, Records and runs (rule A: 30 days, stopping at a
  clock change), Coming up (three months; the clock-change line only in the
  ten weeks before), Darkness (rule E), Across the UK, Is it light at…?
  (worked for any time given).
- Rules B (runs of days at the same minute, with the exact day), C
  (thresholds use the shown minute; on the hour counts), F (tense follows
  the date and the time of day), G (name both near-tied days) and H
  (differences from exact times).
- **For John:** a "sentence sheet" (a PDF, like the fresh-look reports)
  showing every group for a handful of dates and places: today, the
  shortest and longest days, both clock-change days, a day in May and a day
  in August, and a northern and a southern place. This is where the open
  wording gets settled (questions 4 and 5) before it's built into a page.

"Where the sun rises and sets" waits for stage 6, because it needs town
data.

## Stage 3 — the page, top half (light mode)

Branch: `claude/nice-goodall-j1r6wu` (this session's branch)

**Status (27 October):** built; with John for a look on the Vercel preview. The wording of
the first-visit screen, "About these figures" and the footer is draft. Not merged.

- Header: logo, "Lightreader", and the postcode pill with Change. Opening the
  pill shows the postcode box (16px text on touch screens; capitals; no
  autocorrect). The last choice is kept in `localStorage`
  (`lightreader.postcode`) and the page says "Saved on this device only".
  First visit: the box and a short explanation.
- Today: "Sunrise 06:48 · Sunset 16:46" in large type, and nothing else.
- Next 24 hours: the sky ribbon (mock-up option B). On a computer it's
  horizontal, drawn to scale, with alternating ticks, Now, the midnight
  divider and a legend. On a phone it's upright, with true night folded to a
  zigzag and its length, and the events listed beside it. (Proposed: it moves
  on with the clock while the page is open.)
- The sentence groups from stage 2, under their sub-headings, in the spec's
  order.
- "About these figures": the four light labels with their technical names,
  where the figures come from (Astronomy Engine), and how accurate they are.
- Footer and credits, the "changed in another tab" warning (house style
  §14) if it applies, and Vercel Analytics.
- **John:** creates the Vercel project, so there's a preview link.
- Render the chosen mock-up's layout from real code; check the ribbon's
  colours with the dataviz validator.

## Stage 4 — "Is it light at…?" and Compare

Branch: `claude/nice-goodall-j1r6wu` (this session's branch)

**Status (28 October):** built and looked at by John ("I love them both"). A first visit
starts with 07:30 and 17:30 (John: as is). A time chosen in the picker goes in at once,
with no "Add" needed. Not merged.

- **Is it light at…?** (option B): chips with ✕ and "+ Add a time", saved
  in `localStorage` (`lightreader.times`). Each time gets a band pill, a
  year strip with a today marker, and its two sentences.
- **Compare** (option C): one box for a date or a postcode. Dates are parsed
  with `chrono-node` (en-GB, day before month) plus the custom words
  ("Christmas", "Christmas Day", "longest day", "shortest day"). A bare date
  means the next one and "last" works. There are quick choices, the echo
  ("Comparing with Friday December 25th 2026"), paired ribbons on a
  midnight-to-midnight scale, the BST note, and sentences only. It stays at
  a fixed place on the page.
  **Changed (John, 28 October):** like "Is it light at…?": each date or place added is a
  chip with ✕, saved on this device only (`lightreader.compare`, up to six, as typed;
  a postcode under its name, "Penzance (TR18)"), each with its comparison beneath. No quick
  choices; a first visit starts with the box and nothing saved.

## Stage 5 — the year

Branch: `claude/nice-goodall-j1r6wu` (this session's branch)

**Status (28 October):** built; with John for a look on the Vercel preview. Not merged.
Below the year ribbon, the day-by-day tables cover whole months (April 1st 2026 to April
30th 2027 today), and the month buttons are grouped under their years. A time that
doesn't happen shows as "never" in the table, and the detail card says "the sky never gets
very dark" (both drafts). There's a "Print this month" button.

- The year ribbon (option C): a strip for each day, hour lines, month
  labels, a today marker and clock-change steps. Tapping a day shows its
  detail card, with "See all of [month]". This includes the SPEC §9 check of
  how May and August draw when true night starts or ends around midnight.
- Day by day (option B): folded to the 13 month buttons, then one month at a
  time with arrows and Close, today highlighted, the clock-change marker
  row, and compact cards on a phone.
- Printing: a month table prints cleanly (house style print rules).

## Stage 6 — where the sun rises and sets

Branch: `claude/nice-goodall-j1r6wu` (this session's branch)

**Status (28 October):** built and on the page. John chose a first rule (one place within
8°), found its places too obscure, and asked for "between Town and Town (near smaller
place)"; he approved that version's sheet (`design/directions-sheet-2026-10-27.md`) and
it's now in the "Direction of sunrise and sunset" card (`describeToward()` in
`src/lib/towns.ts`). Not merged.

- Directions on the 16-point compass from the sun's direction at sunrise and
  sunset.
- The town: from OS Open Names (Open Government Licence; the OS credit line
  is already on the page from the postcode list). Rule to agree with John:
  a town or city within about 5° of the direction, at a "sensible distance"
  (for example 5 to 25 miles), preferring bigger places. A sheet of results
  for many districts goes to John before it's switched on, as the gauge
  names did in Hindcaster.
- "On the longest day it rises in the north-east…".

## Stage 7 — dark mode, icons, search, launch

Branch: `stage-7-launch`

- Dark mode with Hindcaster's switch, light by default (question 2 decides
  the colours). Mock-ups in both themes first.
  **Built (28 October), for John to look at on the preview.**
- Favicon options, then a link-preview image (house style §7). **John chose A (28
  October), now `public/favicon.svg`.** Link-preview picture approved with "Sunrise, sunset
  and light-based facts for English places you choose.": `public/og-lightreader.png`, with
  the `og:` and `twitter:` tags.
- Search description agreed (John, 28 October, 139 characters): "Free sunrise, sunset and
  twilight times for any postcode in England: today, through the year, and compared with
  dates or places you choose." Title draft: "Lightreader – sunrise, sunset and twilight
  times in England".
- Search: title, description, canonical address, `robots.txt`, `sitemap.xml`
  (`SEO-HANDOVER.md` checklist).
- A `/fresh-look` review before launch. **Done (27 October, a separate thread;
  `design/fresh-look-handover-2026-10-27.md`).** Fixes and John's J1–J10 built (28
  October; J3 dropped as duplication); the optional extras 2.3, 3.2, 4.4, 5.2 and 6.3 built;
  2.1 explained again to John.
- Astronomy Engine's MIT notice: the worker's script carries it, but the main script
  (which also includes the library) loses it in the build. Keep it there too (28 October).
  **Done (28 October):** the build keeps legal comments (`vite.config.ts`).
- **Merged to `main` (28 October, John: "make it live … on the Vercel address"):** Vercel's
  production build of `main` completed (commit `403e6a6`).
- **John:** the `lightreader.baish.net` domain and Web Analytics in Vercel,
  then Search Console, then the hub card with the hub's title and
  description updated, then the baish.net overview.

## For John to come back to

- **The landing page** (what a first-time visitor sees before entering a postcode): John
  wants to review it at some point (27 October). Today it has a heading, one line, the
  postcode box, "About these figures" and the footer, all draft wording.
- The wording of "About these figures" and the footer (drafts from stage 3).
- **Compare:** John first asked for more quick choices (28 October), then changed plan the
  same day: Compare now works like "Is it light at…?", with the visitor's own dates and places
  as saved chips and no preset choices.

## Later (SPEC §10, not in the first version)

Saved dates and places in Compare; the 24-hour clock face; Scotland, Wales
and Northern Ireland; Hindcaster's summer wording using Lightreader's
calculation; showing the night's length on the computer ribbon.

---

## Questions for John

1. **Times: 24-hour "06:49"?** The spec says so. The house style (§15,
   23 October) says new tools write "9.30am". It allows Clockmaker's 24-hour
   style as an exception because it suits broadcasting. Is Lightreader's
   24-hour style a deliberate exception too? If so, I'll add it to the house
   style's list.
2. **Dark-mode page colours.** The spec's page colours (page `#1b1816`) are
   close to Hindcaster's first dark version, which you found too dark and
   harsh. The house style now says new tools use Hindcaster's option B (page
   `#2a2723`). Option B for the page, with the spec's band colours re-checked
   against it? Or the spec's colours as they stand?
3. **The spec's examples moved by a minute.** Astronomy Engine puts today's
   sunrise in RG1 at 06:48:22, so the page will say "Sunrise 06:48", not
   06:49. Daylight comes out at 9h 58m, not 9h 57m. The Tables mock-up
   already notes this. No action is needed unless you'd rather check
   anything.
4. **Rate of change wording** (SPEC §6, "To decide"): the wording for
   lengthening days and for the weeks around the solstices. I'd draft a few
   versions in the stage 2 sentence sheet. Is that all right?
5. **Compare beyond England** (SPEC §8, "To decide"): accept a short list of
   UK places (like "Across the UK") at launch, or English postcodes only?
6. **MET Norway check:** please add `api.met.no` to this environment's
   Allowed domains for the stage 1 year comparison (it's free and needs no
   key).
7. **"Across the UK" points:** Lerwick and Penzance at their town centres?
   And is the comparison always those two ends, or should it also include,
   for example, Belfast or Cardiff?
8. **Subdomain:** `lightreader.baish.net`? You'd add it in Vercel at
   stage 7.
9. **Start stage 1?** It has no screen: the figures, the postcode list and
   their checks, ending with the figures sheet.
