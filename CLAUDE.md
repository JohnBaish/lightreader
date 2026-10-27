# Lightreader — working notes

**Sunrise, sunset, day length and twilight for a postcode.** A sister tool to
Clockmaker and Backtimer (`JohnBaish/clockwheel`), Flowcharter
(`JohnBaish/flowcharter`) and Hindcaster (`JohnBaish/hindcaster`), for
`lightreader.baish.net` (to be confirmed).

Read these first, in this order:

1. `SPEC.md`: John's spec, drafted with him in a Claude chat on 27 October
   2026. It is his document; record agreed changes in it, but don't reword it.
2. `PLAN.md`: the staged build and the open questions. Work one stage at a
   time, on its branch.
3. `HOUSE-STYLE.md`: the shared look and ways of working. Copied from
   Hindcaster's copy on 2026-10-27, which matches clockwheel `36378ed`.
   Clockwheel holds the master copy; if it has changed, re-copy it and note
   that here. The same goes for `SEO-HANDOVER.md` and
   `.claude/skills/fresh-look/`.
4. `design/mockups/`: the four mock-ups from the chat, as John uploaded them
   (renamed only). `top-of-page.html` option B (the sky ribbon),
   `compare.html` option C, `year-tables.html` C then B, and
   `your-times.html` option B were chosen. They load fonts from Google; the
   site itself self-hosts them, as the other tools do.

Key points:

- John is not a developer. Explain plainly and briefly, say what he needs to
  do, and use British spelling. He decides the wording.
- Agree before building anything significant. Show rendered previews before
  wiring anything in.
- Build on a branch and merge to `main` only when John says so.
- Check in a real browser at 1200px, and at 390px with touch emulation, and
  say what couldn't be checked.
- **No made-up figures**, including in examples and mock-ups (SPEC §2).
- **Nothing is sent:** every calculation runs in the browser, and the
  postcode lookup uses bundled data.
- The repo is **public** (John, 27 October: to avoid the limits that come
  with a private repo). It holds no one else's raw data, unlike Hindcaster.
- Add a dated entry below for every change.

## Log

### 2026-10-27 — spec read; mock-ups moved; plan drafted (branch `claude/nice-goodall-j1r6wu`)

**What:** moved John's four mock-ups from the top of the repo to
`design/mockups/` with plain names (`Lightreader Mockups (2).html` →
`top-of-page.html`, `Lightreader Compare.html` → `compare.html`,
`Lightreader Tables.html` → `year-tables.html`, `Lightreader Your Times.html`
→ `your-times.html`), with their contents unchanged. Copied `HOUSE-STYLE.md`,
`SEO-HANDOVER.md`, `.claude/skills/fresh-look/` and `.gitignore` from
Hindcaster. Wrote `PLAN.md` and this file. No app code yet.

**Checked (SPEC §11):**

- **Astronomy Engine** (npm `astronomy-engine` 2.1.19, MIT, published
  December 2023). `SearchRiseSet` finds when the *top* of the sun's disc
  reaches 34′ below the horizon (refraction), using the sun's true size on
  that date. At the sunset it finds, the centre is 0.835° below on 27 October
  and 0.837° below on 12 December, against the spec's 0.833°. That
  difference is less than a second of time, so the convention matches.
  `SearchAltitude` uses the centre without refraction, which is right for
  the 6°, 12° and 18° boundaries.
- **The spec's Reading examples:** for the RG1 district centre (from
  Hindcaster's `outcodes.json`, 51.4517° N, 0.9698° W, converted from the
  National Grid here), Astronomy Engine gives sunrise 06:48:22 and sunset
  16:46:21 today, half-light ending at 17:20:56, and sunset 15:54:58 on
  12 December. The spec gives 06:48:23 and 15:54:59, so it agrees to within
  a second. Today's headline is therefore "06:48", and daylight is 9h 58m
  (the spec's 06:49 and 9h 57m are Astral's figures).
- **chrono-node:** MIT licence. The latest version, 2.10.3, came out on
  12 October 2026. Pin an exact version that is at least two weeks old when
  stage 4 starts.
- **Postcode data:** Hindcaster's `data/outcodes.json` has 2,210 English
  postcode districts (at least half their postcodes in England). Each has its
  middle in National Grid metres and a place name, from OS Open Names, which
  covers what Lightreader needs. It needs converting to latitude and
  longitude. Its three credit lines (OS, Royal Mail, National Statistics)
  come with it.
- **Town data for directions:** OS Open Names (Open Government Licence) is
  the obvious source; it isn't built yet (PLAN stage 6).

**Couldn't be checked:** MET Norway's Sunrise 3.0 (`api.met.no` isn't an
allowed host here); the subdomain (John, in Vercel).

**For John:** the questions at the end of `PLAN.md`. Two come from the house
style: 24-hour times, and the dark-mode page colours.

### 2026-10-27 — John's answers; stage 1 built (branch `claude/nice-goodall-j1r6wu`)

**John decided:** Lightreader's 24-hour times ("06:49") are a deliberate
exception to the house style's "9.30am", like Clockmaker's ("we tried various
looks and this was the best"); dark mode uses Hindcaster's colours (house style
§2), not the spec's darker set; he allowed `api.met.no`; start stage 1. SPEC §4
updated to match. **To do in clockwheel when there's access:** add Lightreader
to the house style's list of 24-hour exceptions (§15).

**Branch:** stages 0 and 1 are both on this session's branch,
`claude/nice-goodall-j1r6wu` (the session can only push there), not on
`stage-1-figures` as PLAN first said.

**What:** Vite + React + TypeScript set up as Hindcaster's, with the same tool
versions (from its lock file) and `astronomy-engine` pinned at 2.1.19; the page
is a placeholder line until stage 3.
- `src/lib/sun.ts`: every event for a place and a UK day. A day's morning
  events are those between the solar midnight before its noon and the noon;
  its evening events run from the noon to the next solar midnight. So
  "tonight" stays with the evening it starts, even when true night begins
  after midnight in May. Missing events are `null` (rule E).
- `src/lib/bands.ts`: the five labels and `bandAt()`, from one timeline of
  changes, for everything that colours or answers "is it light".
- `src/lib/format.ts`: times (rounded on the instant, then read in UK time),
  dates, durations, the 16-point compass. `src/lib/year.ts`: six months either
  side, both ends included (366 days for today). Copied from Hindcaster:
  `ukTime.ts`, `words.ts`, `scripts/lib/grid.ts` (with a new `fromBritishGrid`).
- `scripts/build-outcodes.ts` (`npm run outcodes <Hindcaster's
  data/outcodes.json>`): `src/data/outcodes.json`, the 2,210 English districts
  as latitude, longitude and place (81 KB, 30 KB compressed), with the three
  credit lines.
- `scripts/check-figures.ts` (`npm run check`, 14 checks).
- `scripts/compare-metno.ts` (`npm run compare-metno [<cache folder>]`):
  `design/metno-comparison.md`. Node's `fetch` needs `NODE_USE_ENV_PROXY=1` in
  this container to use the proxy.
- `scripts/figures-sheet.ts` (`npm run figures-sheet`):
  `design/figures-sheet-2026-10-27.md`, every example in the spec recomputed.

**Found:**
- **MET Norway, all of 2027, six places from Penzance to Berwick (4,380
  times):** MET Norway drops the seconds rather than rounding (its times run
  from 62 seconds before ours to 3 after). Measured against that, our time
  falls outside its minute 114 times, by at most 3.3 seconds (Reading's
  sunrise on January 21st 2027). Directions agree to 0.02°; the compass word
  differs twice, both within 0.02° of the line between two points. Because we
  round and MET Norway doesn't, the page will often show a minute later than
  MET Norway's own figures. That's the agreed rounding, not an error.
- **The spec's examples:** 19 of 31 lines come out the same. The 12 that
  differ are mostly a minute either side, because the spec's examples came
  partly from Astral, for example: sunrise 06:48, not 06:49; 9h 58m of
  daylight; the shortest day 7h 50m; the latest sunrise 08:09 from December
  26th to January 4th; earliest sunset 15:55 from December 9th to 16th;
  "dark at 17:30 until Monday February 1st"; Christmas sunrise 08:08 and
  7h 51m.
- **No true night in Reading next summer: May 23rd to July 19th 2027**, not
  the spec's May 17th to July 22nd (Astral). Checked independently: the sun's
  lowest point on each night, found by stepping through the night every 30
  seconds, first fails to reach 18° below on May 23rd, and reaches it again on
  July 20th. That matches the textbook rule: no true night at 51.45° N while
  the sun's declination is above 20.55°.
- **Rule G in practice:** the darkest morning is a near-tie, December 31st
  (07:29:22) and January 1st (07:29:23), so both would be named; the latest
  sunrises, December 30th and 31st, are 0.012 seconds apart.
- The spec's "Sunday February 14th" was a Saturday in 2026.
- A whole year for one place takes about 0.3 seconds in Node here. To measure
  on a phone in stage 3; it may want working out a little at a time.

**Mistakes on the way:** a first draft of the clock-change check had guessed
times (07:44, 06:46) instead of computed ones (07:43, 06:45); caught by the
check itself and replaced with the real figures. `pkill -f` with the pattern in
its own command line stopped the calling shell, as Hindcaster's notes warn.
Nothing was lost.

**Verified:** `npm run build`, `npm run lint` (clean), `npm run check`
(14 passed). No screen to check in a browser yet.
**Couldn't be checked:** Lerwick and Aberdeen's figures (their fixed points
wait for PLAN question 7); twilight times against an outside source (MET
Norway gives none).

### 2026-10-27 — stage 2 built: the sentences (branch `claude/nice-goodall-j1r6wu`)

**John** asked to go ahead with stage 2. Questions 4, 5, 7 and 8 are still open,
so question 4's wording is drafted for him and "Across the UK" uses provisional
points.

**What:** `src/lib/sentences/`, one file per group, plain functions of a
`SkyContext` (place, name, today, now, and the sun's figures from 400 days back
to 400 ahead; `context.ts` has the shared rules: clock seconds for rule A, the
minute shown for rule C, runs for rule B, near-ties for rule G, clock changes).
`index.ts` gives every group in the spec's order. `src/lib/ukPlaces.ts`: Lerwick
and Penzance at their OS Open Names town points (October 2026 download,
checksum matched OS's; in the scratchpad only), provisional until question 7.
Fonts `@fontsource/caprasimo` and `figtree` added at Hindcaster's versions (for
the PDF now, the page later). `scripts/check-sentences.ts` (second part of
`npm run check`, 10 checks, including every group for Reading today) and
`scripts/sentence-sheet.ts` (`npm run sentence-sheet [<html>]`):
`design/sentence-sheet-2026-10-27.md`, ten days and places, with 12 numbered
points for John; the PDF is made from the HTML with the fresh-look
`make-pdf.mjs`.

**Rules worked out on the way (all in the sheet for John):**
- "Close to the fastest they ever change" when the change is at least 90% of
  the year's fastest (today 3m 41s; fastest 3m 58s, March 18th 2027).
- A record against the way the times are going is the clocks' doing and isn't
  said (October 25th: "the earliest sunrise since September"). "Since the
  clocks went back" when the day it goes back to is the day before a change.
- "Coming up" names every whole hour crossed, both ways, leaving out the
  clock-change day itself and thresholds lasting more than 240 days.
- Both dates in a "from … to …" get the year when either needs it.
- "Across the UK" leaves out a fixed place within 25 km of the visitor.
- Rule G names both near-tied days often with exact times: the earliest sunset
  (December 12th and 13th, 0.44 seconds apart), the darkest mornings for 07:30
  (December 31st and January 1st).

**Mistakes on the way:** two expectations in the new checks were my guesses,
not computed (the "since the clocks went back" date; the darkest evening for
12:00). The checks failed, I looked at the real figures, and the code was
right both times; the checks now use the real results. Breaking rule A on
purpose (30 days to 2) makes the checks fail, as it should.

**Verified:** `npm run build`, `npm run lint` (clean), `npm run check` (14 + 10).
**Not yet:** working out all the sentences takes about 0.7 seconds in Node
(800 days of figures); to be cut down in stage 3 before it runs on phones.

### 2026-10-27 — John's answers to the open questions (branch `claude/nice-goodall-j1r6wu`)

**John:** no surprises in the figures sheet or the MET Norway comparison; Lerwick and
Aberdeen at their town centres; question 4's wording drafted (as in the sentence
sheet); question 5, Compare accepts places outside England "if easily done" (stage 4);
question 7, Penzance at its postcode district centre (TR18), and the places shown
should be "the closest big places to the extremes"; question 8, the address is
`lightreader.baish.net`. SPEC §1 and §8 and PLAN updated. Penzance in
`src/lib/ukPlaces.ts` moved from its OS town point to the TR18 centre (about 250 m
apart; today's sentences don't change). Checks 14 + 10. He is now reading the
sentence sheet.

### 2026-10-27 — "Across the UK" from John's short list; one record line dropped (branch `claude/nice-goodall-j1r6wu`)

**John** meant "the closest big places to the extremes" as the places at the two ends
of whatever is compared that day, not the UK's geographical extremes. Shown options A
(cities), B (cities and towns) and a short list; **he chose the short list, without
Northern Ireland.** He also spotted that "The shortest day since Monday February
16th." and "Today's daylight matches Monday February 16th's." say the same thing, and
preferred the second.

**What:** `scripts/build-uk-places.ts` (`npm run uk-places <Open Names Data folder>`)
writes `src/data/ukPlaces.json`: the 69 cities in OS Open Names (not the City of
London or the City of Westminster; Newport, Swansea and St Davids in English), plus
Lerwick, Stornoway, Dover and Lowestoft at their Open Names points and Penzance at
TR18: 74 places. `src/lib/ukPlaces.ts` loads it; `acrossUk.ts` picks the earliest and
latest sunset, and separately the least and most daylight, each day, leaving out any
place within 25 km of the visitor, and says "earlier still" or "later still" when the
visitor is beyond both ends. `records.ts`: "Today's daylight matches …" replaces "The
shortest (longest) day since …" when both would show. Sentence sheet regenerated; its
points 1–12 keep their numbers, and the records change is point 13.

**Results:** today, sunset from 16:21 in Lerwick to 17:08 in Penzance (the spec's
example, exactly); on June 21st 2027, from 21:14 in Dover to 22:35 in Stornoway, and
daylight from Penzance (least) to Lerwick (most). **Correction:** in chat I'd said the
spec's "Lerwick to Penzance" was right by luck and that today's latest sunset was in
the Isles of Scilly or Truro; that was for the lists without Penzance. With the short
list, Penzance is the latest.

**Verified:** `npm run build`, lint, `npm run check` (14 + 10). Working out all the
sentences now takes about 0.9 seconds in Node (74 more places for one day); still to be
cut down in stage 3.

### 2026-10-27 — John's answers on the sentence sheet (branch `claude/nice-goodall-j1r6wu`)

**John:** 1 agreed (the rate wording); 2 yes (name both near-tied days); 3 only some
"Coming up" lines, with firm suggestions from me; 4 put the spring repeat in one line;
5 "the shortest day for a year"; 6 fine; 7 "True night returns on …"; 8 fine, but he
may need more examples; 9–13 fine.

**What:**
- `comingUp.ts`: of the whole hours crossed, only the soonest for sunrise and the
  soonest for sunset that makes a line (my suggestion, put to John in the sheet);
  turning points and the clock change as before. Between two and six lines on the
  14 examples (five today). The spring repeat: "First sunrise at 06:00 or earlier:
  Tuesday March 23rd, and again after the clocks go forward, on Tuesday April 20th."
  (only a repeat within 60 days, with a clock change in between, counts; a first
  try matched the same date a year on).
- `records.ts`: a record a year or more back says "for a year" (or "for more than a
  year" beyond 366 days) instead of the date.
- `darkness.ts`: "True night returns on …" inside the summer weeks without one.
- Sentence sheet: points 3, 4, 5 and 7 marked decided; point 8 explained with four
  more examples (K–N: Newcastle and Middlesbrough on the longest day, Berwick on May
  25th, Newcastle on July 10th). 125 English districts have nights that don't get very
  dark, from three around the longest day (Middlesbrough, Barnard Castle) to 38 at
  Berwick (June 2nd to July 9th 2027).
- Checks 14 + 12; breaking the 60-day limit on purpose makes them fail.

### 2026-10-27 — Vercel project created

John created the Vercel project. Its first build, of `main`, failed with "vite: command
not found", as expected: `main` holds only the spec and the mock-ups, with no
`package.json` (Hindcaster's first build failed the same way). This entry is the push
that starts the branch's own preview build. Preview link pattern (HOUSE-STYLE §10):
`https://lightreader-git-claude-nice-goodall-j1r6wu-john-baish.vercel.app` (to confirm
from Vercel's status on the commit).

### 2026-10-27 — the far-north wording: option B (branch `claude/nice-goodall-j1r6wu`)

The branch's first Vercel preview built successfully (status "Deployment has completed",
14:09 UTC); its address can't be opened from this container (`*.vercel.app` is refused).

**John chose option B** for "at its darkest the sky is dark": where a light label could
be read as an ordinary word, it's a tag in its band colour, with "only" so it reads as
a limit. The sentences carry the tag as `{{dark}}` (`bandTag()` in
`src/lib/sentences/words.ts`); `plainText()` turns it into "dark" in quotation marks,
and `sentenceParts()` splits a sentence for the page (stage 3). Used in three
sentences: "No true night tonight: at its darkest the sky only reaches [Very dark]."
and "… only reaches [Dark]." (`darkness.ts`), and "The sky never reaches [Very dark]
tonight: it's [Dark] from 22:58 to 03:22." (`today.ts`). "Very dark or true night from
… to …" and "It's dark at 17:30 until …" stay as words (SPEC §4 defines "dark" in a
sentence). The sentence sheet's PDF shows the tags in the spec's light-mode band colours;
its Markdown uses quotation marks. All 13 points are now decided. Checks 14 + 12.
