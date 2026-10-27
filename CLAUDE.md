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

## Layout

- **The page** (Vite + React + TypeScript): `src/App.tsx` (header with the postcode pill,
  Today, the sky ribbon, the sentence groups, "About these figures", the footer; the last
  postcode in `localStorage`, key `lightreader.postcode`), `src/components/` (`SkyRibbon`,
  `Sentences`, `PostcodeBox`, `About`, `LightAt`, `Compare`). The sentences and "Is it
  light at…?" are worked out in a worker that stays running (`src/lib/sentences.worker.ts`,
  `src/lib/useSky.ts`) so today and the ribbon show at once; the times are kept in
  `localStorage`, key `lightreader.times` (`src/lib/times.ts`).
- **The figures:** `src/lib/sun.ts` (Astronomy Engine; twilight times worked out only when
  read), `bands.ts`, `format.ts`, `year.ts`, `ribbon.ts` (the next 24 hours and where its
  labels go, and Compare's midnight-to-midnight days), `headline.ts` (the top card),
  `lightAtYear.ts` (each time's year strip), `compare.ts` (reading the Compare box with
  chrono-node, and its sentences), `postcode.ts` (the bundled list, `src/data/outcodes.json`), `ukPlaces.ts`
  (`src/data/ukPlaces.json`), `src/lib/sentences/` (every group in SPEC §6).
- **Checks:** `npm run check` (figures, sentences, page), `npm run build`, `npm run lint`.
- **Sheets for John:** `npm run figures-sheet`, `npm run sentence-sheet [<html>]`,
  `npm run compare-metno [<cache>]` (needs `NODE_USE_ENV_PROXY=1` here).
- **Data builds:** `npm run outcodes <Hindcaster's data/outcodes.json>`,
  `npm run uk-places <OS Open Names Data folder>`.

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

### 2026-10-27 — stage 3 built: the page, light mode (branch `claude/nice-goodall-j1r6wu`)

**John** said yes to stage 3.

**What:** the page from the approved mock-up (option B), on the shared base copied from
Hindcaster (`organic.css`; the shared part of `global.css`; `responsive.ts`; the postcode
reader and error wording of its chooser; the safety net; the footer), with
`@vercel/analytics` at Hindcaster's version.
- Header: logo (the mock-up's sun on the horizon), "Lightreader", the pill "Reading (RG1)"
  with Change (44px on a phone). First visit: a heading, one line and the postcode box.
- Today: the kicker and "Sunrise 06:48 · Sunset 16:46", nothing else (SPEC §5).
- The sky ribbon (`src/lib/ribbon.ts`, `SkyRibbon.tsx`): to scale, now to the same time
  tomorrow, moving on each minute. Computer: "Now" just left of the strip; labels alternate
  above and below, moving to the other side or a far row when they'd touch, and a far-row
  line never crosses a near-row label (`placeLabels`). Phone: upright, true night longer
  than three hours folded to 40px with a zigzag and its length, labels spaced so none
  overlap (`spreadLabels`), "Wed" before times after midnight.
- The sentence groups as cards, two to a row on a computer, the tags in band colours.
  "Is it light at…?" waits for stage 4; directions are compass-only until stage 6.
- "About these figures" and the footer: **draft wording for John**, including the three
  postcode credit lines and "Calculated with Astronomy Engine (MIT licence)".

**Speed:** the sentences took about 1.5 seconds in the browser here; with twilight times
worked out only when a sentence reads them, and each solar midnight reused for the next
day, about 1 second (408 ms in Node, was about 900). The figures sheet and sentence sheet
come out byte for byte the same. Slowing the browser's processor didn't slow the worker
(CDP throttling seems not to reach it), so the time on a real phone isn't known.

**Mistakes on the way, caught in the browser:** "Sunrise 06:48 · Sunset 16:46" broke into
four lines on a phone; "Now" collided with the midnight divider and with changes only
minutes later (now beside the strip on a computer, and always first on a phone); a far-row
label's line ran through "Now 15:40". A quoting slip broke the new check file once.

**Verified:** `npx tsc -b`, `oxlint` (clean), `npm run check` (14 + 12 + 4; new: the
ribbon covers 24 hours band by band as `bandAt` says, Reading's ticks at 09:02, labels
never overlap, the postcode reader). In Chromium at 1200px and at 390px with touch:
Reading at 09:02 today, Reading on a winter evening, Berwick at 22:30 on midsummer night,
four more ribbons (summer evening, spring dawn), the first visit, a Welsh postcode refused
with Hindcaster's wording, "rg4 7hn" typed, Change, Cancel, a new postcode, a reload: no
script errors, no sideways scroll, all four fonts loaded where used. The one failed load is
Vercel's statistics script, which exists only on Vercel. Screenshots in
`design/previews/stage3-*.png`.
**Couldn't be checked:** a real phone; the Vercel preview itself (blocked here).

### 2026-10-27 — John's first look at the page (branch `claude/nice-goodall-j1r6wu`)

**John** ("I love this"), on an iPhone, asked to stay at stage 3 for some changes:
- **The top card** changes once the sun is highest (`src/lib/headline.ts`): before, "Today ·
  Tuesday October 27th" with "Sunrise 06:48 · Sunset 16:46"; from then on, "Today · …" with
  "Sunset 16:46" and "Tomorrow · Wednesday October 28th" with "Sunrise 06:50" (side by side on
  a computer, stacked on a phone). He asked for wording suggestions for the headings; these
  are drafts, with alternatives put to him.
- **Folded true night** on a phone 80px tall (was 40).
- **The key** in two groups that stay together, so "Very dark" sits beside "True night" when
  it wraps on a phone.
- **Today:** the daylight on its own line ("9h 58m of daylight.").
- **Darkness** now starts with "Very dark or true night from 18:00 to 05:36." (moved from
  Today, with its far-north version).
- **Across the UK:** the ends among the cities, with one of the five edge towns in brackets
  when it goes further ("from 16:35 in Norwich (16:21 in Lerwick) to 17:05 in Truro (17:08 in
  Penzance)"); the five are marked `edge` in `src/data/ukPlaces.json` (rebuilt from the same
  Open Names download).
- **"Direction of sunrise and sunset"** as the heading (the towns still come in stage 6).
- **To come back to:** John will review the landing page (before a postcode is entered);
  noted in PLAN.

SPEC §5 and §6 annotated with the changes. **Verified:** `npx tsc -b`, `oxlint`, `npm run
check` (14 + 12 + 5; new: the top card before and after the sun is highest). In Chromium at
1200px, 390px and 375px with touch, at 09:02 and at 15:00 today, a winter evening and
Berwick's midsummer night: no script errors, no sideways scroll. Screenshots in
`design/previews/stage3-*.png` refreshed.

### 2026-10-27 — PARKED (John stepped away)

Everything is committed and pushed to `claude/nice-goodall-j1r6wu`, **not merged**
(`main` still has only the spec and the mock-ups). Nothing is half-done; `npm run check`,
lint and the build pass, and the Vercel preview built.

**Waiting on John:**
1. The top card's headings: "Today" / "Tomorrow" (as built), A by time of day ("This
   evening", "Tomorrow morning"), or B by event ("Today's sunset", "Tomorrow's sunrise").
2. Anything else from his look at the page; then stage 4 ("Is it light at…?" and Compare).
3. Later: the landing page review and the draft wording ("About these figures", footer).

### 2026-10-28 — John's answers; stage 4 built: "Is it light at…?" and Compare (branch `claude/nice-goodall-j1r6wu`)

**John:** option B for the top card's headings ("Today's sunset · …", "Tomorrow's sunrise ·
…"); the folded true night to open when tapped; "This fortnight" to give each time's
difference from today in brackets; go ahead with stage 4.

**What:**
- `headline.ts`: option B. `SkyRibbon.tsx`: tapping the fold or its note ("(folded: tap to
  open)") opens true night out to scale, the strip growing longer (470px to 684px today)
  with the rest unchanged; tapping again folds it. `fortnight.ts`: "the sun rose at 07:36
  (48m later) and set at 18:00 (1h 14m later)", "rises at 07:01 (12m later)": by the clock
  from exact times (rule H; 07:01 against 06:48 is 12m 3x s, so "12m").
- **"Is it light at…?"** (`LightAt.tsx`, `lightAtYear.ts`, `times.ts`): chips with ✕, "+ Add
  a time" (the phone's own time picker), up to six, "Saved on this device only"; a first
  visit starts with 07:30 and 17:30 (draft); for each time a pill ("Dark today"), the year
  strip (six months either side, today marked, months beneath, one letter on a phone) and
  its two sentences. The strip uses each change at the minute shown, so it agrees with the
  sentences (checked day by day). Sits straight after "Coming up", across the full width.
- **Compare** (`Compare.tsx`, `compare.ts`): one box ("Try Christmas, 14/7 or TR18"), the
  three quick choices, the echo ("Comparing with Friday December 25th 2026"), paired
  midnight-to-midnight ribbons with the hours and key, the BST note, and the spec's
  sentences for a date ahead, a date behind, and a place (tense by whether each moment has
  passed there yet). Reads dates with `chrono-node` 2.10.3 (MIT, published 12 October 2026,
  pinned), plus "Christmas", "Christmas Day", "longest day", "shortest day" (worked out for
  the place), "last …" (the one before), and "march 28" (chrono read it as March of the year
  28). Places: an English postcode, or any of the 74 big places by name (John: places outside
  England "if easily done").
- The worker now stays running and keeps the place's figures, so changing the times is quick.

**Results:** all three of the spec's Compare examples come out as written, apart from the
known minute-or-so differences (Christmas sunrise 08:08 and 7h 51m; July 14th 05:03 and
22:00; Aberdeen's sunset 16:35:31, shown 16:36).

**Verified:** `npx tsc -b`, `oxlint`, `npm run check` (14 + 12 + 8; new: reading the box,
the three Compare examples, the strip against the sentences). In Chromium at 1200px and
390px with touch: Compare with Christmas, last July 14th, Aberdeen, CF10 (refused), the
"Shortest day" button; adding 21:00 and removing 07:30, kept after a reload; tapping the fold
open and shut; the full page at 09:02 and 15:00: no script errors, no sideways scroll.
Screenshots `design/previews/stage4-*.png`. The page's script grew from 130 to 150 KB
compressed (chrono-node); it could be loaded only when Compare is first used, if wanted.
**Couldn't be checked:** a real phone; the Vercel preview (blocked here).

### 2026-10-28 — a chosen time goes in at once; more Compare chips noted (branch `claude/nice-goodall-j1r6wu`)

**John** asked for a time chosen in "Is it light at…?" to go in when the picker's tick is
pressed, without "Add"; and noted he'd like more quick choices in Compare (in PLAN, "For
John to come back to"). He also said a first visit keeps 07:30 and 17:30, and to go on.

**What (`LightAt.tsx`):** the time goes in when the box loses focus (a phone picker's tick
or Done, or clicking away) and, on a touch screen, when the picker confirms. On a computer
the box's typed changes don't count, because "07:3" already reads as 07:03; Enter and Add
still work. Cancel doesn't add what was in the box; an empty box clicked away from stays
open.

**Verified:** `npx tsc -b`, lint, build. In Chromium at 1200px (choosing then clicking away
adds; Cancel doesn't; Enter adds; an empty box stays open) and at 390px with touch (the
picker's confirm adds at once): saved after each, no errors, no sideways scroll.
**Couldn't be checked:** the real iPhone and Android pickers.

### 2026-10-28 — stage 5 built: the year (branch `claude/nice-goodall-j1r6wu`)

**John:** keep 07:30 and 17:30 for a first visit; go on with stage 5.

**What:**
- `src/lib/yearView.ts`: worked out in the worker (a `year` message; `useSky` returns
  `year`), from the same figures as the sentences. `yearChanges()` now takes the context,
  so the year's changes are worked out once for "Is it light at…?" and the ribbon (the same
  result either way, checked). Each change is taken at the minute shown (rule C).
  - The ribbon: each day from UK midnight to midnight by the clock, so the clock changes
    show as steps; in the hour the clocks go back, the second pass simply carries on.
  - The tables: whole months for the 13 months the span touches, with the clock-change
    rows ("Clocks went back on Sunday October 25th. Times from here are GMT."; "go forward
    … BST" for the coming one).
- `src/components/Year.tsx`, after Compare.
  - "The year in light": an SVG drawn in days and minutes and stretched to fit. It has hour
    lines, month labels (one letter on a phone), a today line and the chosen day's line.
    Tap or click a day (arrow keys on a computer) to fill the detail card ("See all of May"
    opens that month at that day).
  - "Day by day": the 13 month buttons, grouped under 2026 and 2027, with today's month
    ringed. When a month is open: arrows, Close and "Print this month". Each month is a
    table on a computer and compact cards on a phone, with today highlighted.
- Printing a month gives one A4 page: the place, the month and its table.
- Rule E: a time that doesn't happen shows "never" in the table, and "the sky never gets
  very dark" (or "Half-light all night") in the detail card. Both are drafts.

**SPEC §9's "to check":** the strips in May and August draw correctly. Each strip is cut at
midnight from one timeline, so true night that starts after midnight (Reading, May 20th:
very dark to 00:17, then true night) is in the right place; this is now a check.

**Figures:** the October table matches the mock-up apart from one cell: October 7th's
half-light ends at 19:01 (19:01:29), where the mock-up had 19:02. Berwick never gets very
dark from June 2nd to July 9th; on June 1st very dark comes at 00:48, after midnight, and
is shown under that date.

**Verified:**
- `npx tsc -b`, lint, `npm run check` (14 + 12 + 9; new: every strip from midnight to
  midnight; daylight on the strip matches the table's sunrise and sunset every day; today's
  row and detail; both clock-change rows; May 20th; Berwick at midsummer).
- In Chromium at 1200px and 390px with touch: today's detail; tapping May 20th, then the
  arrow key to the 21st; "See all of May" opening May with the day marked; October's clock
  row and today; next month; Close; Berwick's June; printing a month (one page). The year
  shows about one second after the page opens. No errors, no sideways scroll.
- Screenshots `design/previews/stage5-*.png`.

**Couldn't be checked:** a real phone; the Vercel preview (blocked here).

### 2026-10-28 — the iPhone time picker fixed; Compare works like "Is it light at…?" (branch `claude/nice-goodall-j1r6wu`)

**John (on his iPhone):** "+ Add a time" opened the picker, then closed it a second later,
adding the current time. **Cause:** an iPhone fills in the current time the moment its
picker opens, and the page added a time on the first change (the touch-screen rule from
earlier today). **Fix (`LightAt.tsx`):** a time goes in only when the box loses focus (the
picker closed with its tick, or clicking away), never on a change; a loss of focus within
half a second of gaining it is ignored. Enter and Add still work.

**John (a change of plan for Compare):** model it on "Is it light at…?": the quick
choices go, and what's added is saved as chips with "Saved on this device only".
**What:** `src/lib/comparisons.ts` (`lightreader.compare`, up to six, in the order added,
kept as typed so "Christmas" always means the next one; repeats ignored). In `Compare.tsx`,
the chips have ✕ and "+ Add a date or place"; the box shows when adding, and always while
nothing's saved. Each comparison has its echo, ribbons, clock note and sentences, and the
key comes once at the end. A postcode is saved under its name ("Penzance (TR18)"), which
`readTarget()` now reads back. `QUICK` is removed; the earlier note about more chips is
superseded.

**Verified:** `npx tsc -b`, lint, `npm run check` (14 + 12 + 10; new: saved comparisons
read back, repeats ignored). In Chromium at 1200px and 390px with touch: the box filled
with a time while focused adds nothing; closing it adds that time. In Compare: Christmas,
Aberdeen and TR18 added; CF10 refused with its message and Cancel; a repeat ignored; one
removed; kept after a reload. No errors, no sideways scroll. Screenshots
`design/previews/stage4-compare-chips-*.png`.
**Couldn't be checked:** a real iPhone's picker.

### 2026-10-28 — Compare's wording; the year drawn more quickly (branch `claude/nice-goodall-j1r6wu`)

**John:** "Your selections will only be saved on this device." before anything's saved in
Compare (was "What you add is saved on this device only."); "never" and the other year
wording are fine; "Is it light at…?" works on his iPhone now; stage 5 looks great. He found
the page slow to load.

**Speed:** measured here, today and the ribbon show at about 0.25 seconds; the sentences,
the times and the year together at about 1.1 seconds. In Node the worker's part is about
0.6 seconds: the sun's figures for 800 days (about 0.2), the sentences (0.15), the year's
twilight times (0.13), "Is it light at…?" (0.05) and the year view. Two changes:
- The year view no longer searches every change of light for each day, and reads the
  clock without `Intl` except on the two clock-change days (about 120 to 40 milliseconds).
- The year ribbon is drawn as five shapes, one per band, instead of about 2,900 boxes
  (looks the same; quicker for a phone to draw).
The rest is the figures themselves. How long it takes on John's iPhone isn't known.

**Verified:** `npx tsc -b`, lint, `npm run check` (14 + 12 + 10; the ribbon still agrees
with the tables every day); the stage 4 and 5 browser runs at 1200px and 390px with touch:
no errors, no sideways scroll.

### 2026-10-28 — the opening page's wording, for John (branch `claude/nice-goodall-j1r6wu`)

John asked for the wording a first-time visitor sees, to redraft it. Written out word for
word in `design/landing-wording-2026-10-28.md` (top bar, the opening card, its messages,
"About these figures", the footer and credits). Docs only. Noticed while checking: the
build keeps Astronomy Engine's MIT notice in the worker's script but not in the main
script, which also includes the library; noted for stage 7 in PLAN.

### 2026-10-28 — stage 6: the "roughly over …" places, with a sheet for John (branch `claude/nice-goodall-j1r6wu`)

**John's rule:** towns and cities, plus the places postcode districts are named after;
within 8° of the sun's direction; 3 to 25 miles away; the nearest first; when none (often
the sea), the compass point alone; Welsh names in English.

**What:**
- `scripts/build-towns.ts` (`npm run towns <Open Names Data folder>`) writes
  `src/data/towns.json` from the same October 2026 Open Names download: 1,603 places within
  45 km of an English district's middle (48 KB, 20 KB compressed).
  - The towns and cities, plus each district's place at its own Open Names point. Either
    half of a double name counts, and hyphens are ignored.
  - "City of Westminster" reads as "Westminster", and "City of London" as "the City of
    London".
  - Only the districts named "London" have no place of that name.
- `src/lib/towns.ts`: `townToward()`, with the bearing and distance along the earth's
  surface.
- `directions.ts`: "The sun rises in the east-south-east, roughly over Windlesham, and sets in
  the west-south-west, roughly over Thatcham." Behind `withTowns`, off on the page until John
  has checked the sheet.
- `scripts/directions-sheet.ts` (`npm run directions-sheet`) writes
  `design/directions-sheet-2026-10-27.md`:
  - how often a place is found across all 2,210 districts (84 to 87%);
  - today's sentence for one district in each of the 100 postcode areas;
  - the shortest and longest days' places, with distances and how far off line.

**Verified:** `npx tsc -b`, lint, `npm run check` (unchanged; the page doesn't show the
places yet).

### 2026-10-28 — John's wording for the opening page; the month buttons lined up (branch `claude/nice-goodall-j1r6wu`)

**John:**
- The opening line is now "Check when the light comes and goes anywhere in England, today
  and through the year, in UK local time." (was "When the light comes and goes where you
  are, … in UK clock time.").
- The footer says "stores your recent selections" (was "your last postcode").
- In "Day by day" on his iPhone, a month that wraps should sit under April, not under the
  year.

**What:**
- `App.tsx`: the two wording changes, also in `design/landing-wording-2026-10-28.md`.
- `Year.tsx` and `global.css`: each year's months sit in their own box beside the year.
  On a phone they're equal columns, five to a row at 390px and 375px (2026: April to
  August, then September to December under them; 2027: January to April). A computer
  still has one row.

**Verified:** `npx tsc -b`, lint, `npm run check` (14 + 12 + 10); in Chromium at 1200px, and
at 390px and 375px with touch: the months' positions line up; the year card and tables as
before; no errors, no sideways scroll.

### 2026-10-28 — stage 6, second version: "between … and … (near …)" (branch `claude/nice-goodall-j1r6wu`)

**John** found the first sheet's places too obscure, and asked for "rises between Town/City
and Town/City (near smaller place name)".

**What (`src/lib/towns.ts`, `describeToward()`):**
- **Between:** the nearest town or city on each side of the sun's direction, within 20°
  and 3 to 25 miles, named left then right as you face the sun.
- **In brackets:** the nearest smaller place (one a postcode district is named after) within
  8° of the line, if there is one.
- **With no town on one side:** "roughly over" a town or city within 8°.
- **With neither:** the compass point alone.
- `src/data/towns.json` now marks the towns and cities (`npm run towns` rebuilt from the
  same download).
- The 20° was chosen after trying 30°, which reached for small towns further round (Reading:
  "Tadley and Thatcham").
- The sheet is regenerated with the new wording and how often each kind is used: "between"
  72 to 77%, "roughly over" 11 to 13%, the compass alone 12 to 16%.

**Verified:** `npx tsc -b`, lint, `npm run check` (unchanged; not on the page yet).

### 2026-10-28 — the year ribbon: a handle hints that the line moves (branch `claude/nice-goodall-j1r6wu`)

**John:** "The Year In Light is beautiful", but it isn't obvious the line can be moved;
asked for a very subtle pointer. **What (`Year.tsx`, `global.css`):** a small rounded handle
with "‹›" at the top of the chosen day's line (today's at first), kept inside the chart at
the ends; the line can now be dragged as well as tapped; the note under the card reads "Tap
or slide along the year to see a day's times." on a phone and "Click or drag along the year
to see a day's times, or use the arrow keys." on a computer (drafts).
**Verified:** `npx tsc -b`, lint, build; in Chromium at 1200px and 390px with touch: dragging
from today to mid-June shows Saturday June 20th, tapping and the arrow keys as before, no
errors, no sideways scroll. Picture `design/previews/stage5-year-handle-narrow.png`.

### 2026-10-28 — the places on the page (branch `claude/nice-goodall-j1r6wu`)

**John:** the year ribbon's handle "is great", and so is the second sheet of places. The
places are now in the "Direction of sunrise and sunset" card (`directionSentences(ctx,
true)`). Reading today: "The sun rises in the east-south-east, between Bracknell and
Wokingham (near Bagshot), and sets in the west-south-west, roughly over Thatcham."
**Verified:** `npx tsc -b`, lint, `npm run check` (14 + 12 + 11; new: Reading's places, Brighton's
sunset over the sea, the visitor's own place never named; Reading's full set of sentences
updated); in Chromium at 1200px and 390px with touch, Reading, Brighton and Darlington (no
places either way): the card as above, the sentences in about a second as before, no errors,
no sideways scroll. Pictures `design/previews/stage6-directions-*.png`.

### 2026-10-28 — stage 7 begun: dark mode (branch `claude/nice-goodall-j1r6wu`)

**John:** he had redrafted the opening wording in chat (the line under the heading and the
footer's "recent selections", both already in); go on to stage 7.

**What:** dark mode copied from Hindcaster (HOUSE-STYLE §2):
- `src/lib/theme.ts` (key `lightreader.theme`) and `src/components/ThemeSwitch.tsx`, at the
  top right.
- A few lines in `index.html` set dark mode before the page draws.
- `global.css` has Hindcaster's dark tokens plus SPEC §4's dark band colours. Ink is kept on
  the daylight and half-light tags, and the page background colour is used for the text of
  the open month's button.
- Screen only, so printing is always light.
- On a phone the switch sits beside "Lightreader", with the postcode pill on the row below.
- The footer's "stores your recent selections" already covers the choice.

**Verified:** `npx tsc -b`, lint, `npm run check` (14 + 12 + 11). In Chromium at 1200px and
390px with touch:
- the switch on the first visit; still dark after choosing RG1 and a reload;
- the whole page looked over in dark (ribbon, sentences, "Is it light at…?", Compare, the
  year, October's day cards);
- printing gives white;
- switching back clears the stored choice;
- the stage 4 and 5 runs in light as before;
- no errors, no sideways scroll.

Pictures `design/previews/stage7-dark-*.png`. **Couldn't be checked:** a real phone; Safari's
toolbar colour.

### 2026-10-28 — stage 7: favicon options for John (branch `claude/nice-goodall-j1r6wu`)

Three options in `design/favicon-options/`, drawn to the house recipe (HOUSE-STYLE §7):
A, a terracotta half sun on an ink horizon, cream with a terracotta ring; B, the page's
logo (an arc of sun on the horizon); C, A on solid terracotta. `design/favicon-options.html`
(from Hindcaster's) shows them at 16, 32, 48 and 96px beside the other five icons in a row
of tabs; renders `design/previews/favicon-options.png` and `-1x.png`. At a real 16px, A and
C read as a sun on the horizon; B's arc thins to a curl. Nothing wired in yet.

### 2026-10-28 — the opening page's wording agreed

John: apart from his two changes (the line under the heading and "your recent selections"),
the rest of the opening page's wording is fine as it stands. `design/landing-wording-2026-10-28.md`
marked agreed. Docs only.

### 2026-10-28 — icon A chosen; the search description agreed (branch `claude/nice-goodall-j1r6wu`)

**John:** dark mode "looks really really good"; icon A ("really good"); the search
description to end "and compared with dates or places you choose." (139 characters, so it
fits: "Free sunrise, sunset and twilight times for any postcode in England: today, through
the year, and compared with dates or places you choose."). **What:** `public/favicon.svg`
(option A), linked from `index.html`; the build copies it. The description goes in with the
title and the rest of the search tags once the title is confirmed (PLAN).

### 2026-10-28 — search title and description in; link-preview picture drafted (branch `claude/nice-goodall-j1r6wu`)

**John:** the title is fine; go ahead with the link-preview picture.
**What:** `index.html` now has the title "Lightreader – sunrise, sunset and twilight times in
England", the agreed description and the canonical link to `https://lightreader.baish.net/`;
`public/robots.txt` and `public/sitemap.xml` as Hindcaster's. The picture:
`design/og-lightreader.html` (from Hindcaster's, same layout and fonts loaded by path), with
icon A's half sun drawn large, "Lightreader" and the tagline "Sunrise, sunset and twilight /
for your postcode." (the opening heading; for John). Rendered at 1200×630 to
`design/previews/og-lightreader.png`; Caprasimo and Figtree 600 confirmed loaded. Waiting for
John's approval before it goes in `public/` with the `og:` and `twitter:` tags.
**Verified:** build (robots.txt and sitemap.xml copied; the tags in the built page).
