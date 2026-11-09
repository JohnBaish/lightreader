# Nightreader — working notes

**What you can see in the night sky from your postcode, tonight and through the year.** A
sister tool to Lightreader (`JohnBaish/lightreader`), for `nightreader.baish.net` (to be set
up). **Parked for now inside Lightreader's repo** (`design/nightreader/`), on a session
branch; it moves to `JohnBaish/nightreader` when John creates that repo.

Read these first, in this order:

1. `SPEC.md`: what Nightreader is and does (what's agreed, what's proposed, open questions).
2. `PLAN.md`: the staged build. Work one stage at a time.
3. The mock-ups John agreed: https://claude.ai/artifact/UDWU52EtUoMi9d7JYEMB57 (source in
   `design/mockups/`; rebuild with `node design/mockups/data.mjs` then `build.mjs`).
4. Lightreader's `HOUSE-STYLE.md` (clockwheel holds the master). Nightreader may depart from
   it for beauty's sake (SPEC §2): dark for everyone, its own colours.

Key points:

- John is not a developer. Explain plainly and briefly, say what he needs to do, and use
  British spelling. He decides the wording.
- Agree before building anything significant. Show rendered options at computer and phone
  widths. Questions in numbered batches.
- **The value is in how it looks.** Take time over it; show John pictures.
- **No made-up figures**, in mock-ups too: real stars, real towns, real times.
- **Nothing is sent:** every calculation runs on the device.
- Check in a real browser at 1200px, 390px with touch and 844 by 390 with touch, and say what
  couldn't be checked.
- Times are 24-hour ("21:24"), as Lightreader. Dates month first ("November 9th").
- A dated log entry below for every change.
- **Project tracker:** `projects/nightreader.md` in `JohnBaish/baish.net-directory`.

## Layout

- `src/lib/night.ts`: one night's figures (darkest stretch and its fallbacks, the Moon,
  Moon-free time, the planets "in view", fists). `src/lib/ahead.ts`: looking ahead (phases,
  eclipses, planets at their best, meteor showers).
- `src/lib/sun.ts`, `ukTime.ts`, `format.ts`, `geo.ts`, `words.ts`: copied from Lightreader
  (commit `8ea2e16`), unchanged.
- `src/data/outcodes.json`: Great Britain's postcode districts, copied from Refueller
  (`data/outcodes.json`, made October 30th 2026).
- `src/lib/towns.ts` (Lightreader's, unchanged) and `src/data/towns.json` (`npm run towns`).
- `scripts/check-figures.ts` (`npm run check`), `scripts/figures-sheet.ts`
  (`npm run figures-sheet [YYYY-MM-DD]`). `npm run typecheck`.
- While parked, the scripts use Lightreader's installed packages (`npm ci` in its top folder).
- `design/mockups/`: the agreed mock-up page and what builds it. `design/figures-sheet-*.md`.

## Log

### 2026-11-09 — John's answers; faint eclipses out; the town list for Great Britain

**John:** yes to the far-north fallback and to the four Sun-depth numbers; faint eclipses of the
Moon left out ("I think so"); phase names fine as they are; the repo tomorrow.

**What:** `lunarEclipses()` leaves out penumbral eclipses, so Reading's next is the partial one
on January 12th 2028. `scripts/build-towns.ts` (`npm run towns <Refueller's data/places.json>`)
writes `src/data/towns.json`: 2,092 places (1,426 towns and cities, 666 smaller places districts
are named after; 2,800 of 2,863 districts matched). `src/lib/towns.ts` copied from Lightreader
unchanged. SPEC §3, §5, §7, §8 and §12 and PLAN updated; the figures sheet remade.

**Found:** in the Highlands and islands the rule's 25 miles rarely reaches a town: from Lerwick
every direction tried, and from Inverness four of five, give the compass point alone. Edinburgh
and Cardiff read well ("between Loanhead and Penicuik (near Roslin)", "roughly over Barry").
Put to John (SPEC §12.2).

**Mistakes, logged openly:** an apostrophe in a check's name broke the file. Then I committed
and pushed while one check was failing, and wrote "14 checks" here: the run's result was hidden
by the command I used. The failing check was my own wrong expectation (1.7° west of south the
towns rule gives "roughly over Alton", not "between Bordon and Alton"); the code was right. The
check now holds both real results, and the next commit corrects it. All 14 pass.

**Verified:** `npm run check` (14), `npm run typecheck`. **Couldn't be checked:** the meteor
shower list (`www.imo.net` isn't allowed in this session).

### 2026-11-09 — spec and plan; stage 1 started: the figures

**John:** agreed all of Claude's suggestions (two heights for "in view" with a darker sky for
fainter planets; "No Moon-free night"; meteor showers in "Looking ahead"; Great Britain from
the start), and asked for the spec, the plan and a start on stage 1.

**What:** `SPEC.md`, `PLAN.md`, this file. `src/lib/night.ts` and `ahead.ts`; the sun, time
and format code from Lightreader; Refueller's postcode districts; 13 checks; the figures
sheet (`design/figures-sheet-2026-11-09.md`). The mock-up files moved to `design/mockups/`.

**Found:**
- With the two-height rule Venus counts tonight, but only as "low" (15° up at 06:57).
- From Edinburgh and Lerwick the midsummer sky only reaches "dark", so the fallback needs a
  step beyond "very dark" (SPEC §3.3, proposed).
- Moon-free time is now exact (from moonrise and moonset), where the mock-ups sampled each
  minute; the two agree to the minute (10h 59m, 5h 56m, none).
- MET Norway's moonrise and moonset for Reading on November 17th (13:16, 23:32, seconds
  dropped) against ours (13:17:00, 23:32:47); November 24th's agree to the minute too.
- A faint ("penumbral") eclipse of the Moon is the next one listed (February 20th 2027);
  proposed to leave those out.

**Mistakes on the way:** one expectation in the new checks was my guess (4° as one fist; the
rule gives half a fist, rightly); corrected to the real result. A type slip in `ahead.ts`
caught by the type check.

**Verified:** `npm run check` (13), `npm run typecheck`; raising "well placed" to 25° on
purpose made the checks fail, then restored. Lightreader's own lint is still clean. No page
yet, so nothing in a browser.
**Couldn't be checked:** the meteor shower list (only the Quadrantids' figure confirmed);
eclipse and planet dates against a published source; speed on a phone.

### 2026-11-09 — the mock-ups

Four rounds with John the same day (colours: Ember; the opening figure smaller; "Where to
look" with a slider, towns, real stars and fists; option B on a phone; a key for moonlight).
Details in `README.md`.
