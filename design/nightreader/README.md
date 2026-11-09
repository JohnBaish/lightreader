# Nightreader: parked design work

**Parked here on November 9th 2026** (John: "park it all in Lightreader's repo for the time being"),
on the session branch only. It moves to its own repo, `JohnBaish/nightreader`, once John creates one.
Nothing here is part of Lightreader's site: the build doesn't read this folder.

Nightreader is a proposed sister tool to Lightreader: what can be seen in the night sky from a
postcode, tonight and through the year. Almost all of it is calculated on the device with Astronomy
Engine, as Lightreader is.

The mock-ups (a private page): https://claude.ai/artifact/UDWU52EtUoMi9d7JYEMB57

## Agreed with John (November 9th 2026)

1. Name: Nightreader, for now. ("Darkreader" was dropped: Dark Reader is a well-known browser
   extension that turns websites dark.)
2. Dark for everyone, not following the device. Its own character: it carries the family's look
   lightly (Caprasimo and Figtree, the cream) but isn't bound by the house style.
3. Colours: "Ember" (deep indigo, a terracotta-to-gold glow at the horizon). Blue hour and Plum
   were the other two shown; their colours are still in `template.html`.
4. Headline figure: Moon-free true night. In the weeks with no true night it falls back to
   "very dark" and says so.
5. Three pictures:
   - **The sky tonight:** arcs of how high the Moon and planets stand, sunset to sunrise.
   - **Where to look:** the view south with a slider through the night; the towns along the
     horizon at their true directions (Lightreader's town list and "between … and …" rule); real
     stars and constellation lines; height in fists (a fist at arm's length is about 10°). On a
     phone, option B: larger with true shapes, swiped sideways, opening on south.
   - **The year in darkness:** every night for a year, dusk at the top, with moonlight as pale
     slanting bands; two keys (the sky, and moonlight by phase).
6. The opening figure a bit smaller than first drawn. Two rows of town names. Fists as tiny icons.
7. Great Britain from the start.

## Open

1. The "in view" rule. Draft: sky at least in half-light (Sun 6° or more below) and the body at
   least 15° up. John thought 15° might be low. Claude's advice: don't raise one bar; use two
   levels, "well placed" (20° or more) and "low" (10° to 20°, "needs a clear horizon"), because
   from Britain a planet in the southern part of its path never gets higher than about 15°, and
   less further north. Not yet decided.
2. Wording on a night with no Moon-free darkness. In the mock-up now (draft): "No Moon-free
   night" / "The Moon is up for the whole of true night". John's own draft: "The moon is at least
   partially visible all night".
3. Star data. The mock-up uses d3-celestial's files (BSD licence, in `stars/` with its licence),
   whose stars come from a compilation of ESA's Hipparcos catalogue. The underlying catalogue's
   terms haven't been read (the host was blocked). HYG (CC BY-SA 4.0) is the alternative.
4. Meteor showers. Each peaks at a fixed point on the Sun's yearly path, so `meteors.mjs` works
   out the date for any year and the Moon on that night. Its list of showers is from memory of the
   International Meteor Organization's working list and **must be checked** against the current
   calendar before use.
5. Great Britain needs Refueller's postcode districts and a town list that covers Scotland and
   Wales (Lightreader's covers places near England only).
6. Stars low down ignore the bending of light near the horizon.
7. Not looked at: space station passes (needs a collector), tonight's cloud (left out on purpose),
   how dark the sky is locally (no licence checked).

## Files

- `template.html`: the mock-up page. `build.mjs` puts `data.json` into it and writes
  `nightreader-mockups.html` (the published page) and `test.html` (for the browser check).
- `data.mjs`: works out every figure for the middle of RG1 (the year grid, three sample nights,
  stars turned to the equator of date, towns from `src/data/towns.json`). Writes `data.json`.
- `figures-sheet.mjs`: the first figures sheet (tonight, looking ahead, the year by month).
- `meteors.mjs`: the meteor shower peaks for the next year.
- `screenshots.cjs`: renders `test.html` at 1200px, 390px with touch and 844 by 390 with touch.
- `stars/`: d3-celestial's star, star-name and constellation-line files, and its licence.

To rebuild: `npm ci` in the repo, then `node design/nightreader/data.mjs` and
`node design/nightreader/build.mjs`.

## Checked

Astronomy Engine 2.1.19, as Lightreader. The weeks with no true night (May 23rd to July 19th 2027)
match Lightreader's own checks. The mock-ups were checked in Chromium at 1200px, 390px with touch
and 844 by 390 with touch: no errors, no sideways scrolling. Not checked: a real phone, a Mac,
Safari, and the eclipse and planet dates against an outside source.
