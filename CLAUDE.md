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
