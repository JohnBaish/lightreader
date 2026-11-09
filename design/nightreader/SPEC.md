# Nightreader: what it is and does

**What you can see in the night sky from your postcode, tonight and through the year.**
A sister tool to Lightreader, for `nightreader.baish.net` (to be set up).

Each part is marked **Agreed** (John, November 9th 2026) or **Proposed** (Claude's, for John
to confirm). Open questions are numbered in §12.

## 1. The idea (Agreed)

Lightreader tells you when the light comes and goes. Nightreader tells you what the dark is
good for: how much of the night is properly dark and free of moonlight, where the Moon and
planets are and when, where to look for them, and which nights of the year are the best.

The value is in how it looks. Every picture is drawn from the real sky for that place and
night: no made-up figures, no decoration standing in for data.

## 2. Principles (Agreed)

1. **Nothing is sent.** Every calculation runs on the device with Astronomy Engine, as in
   Lightreader. The postcode is looked up in bundled data and kept after "#".
2. **No made-up figures**, in mock-ups too. Every star, tint and curve is the true one.
3. **Great Britain from the start.** Northern Ireland isn't in the open postcode data.
4. **Free to run:** a static site, no collector, no keys.
5. **Dark for everyone.** It doesn't follow the device. A light "almanac" version for
   printing and shared pictures is an idea for later (§11).
6. **Its own character.** It carries the family's look lightly (Caprasimo, Figtree, the
   cream) but isn't bound by the house style where that would cost beauty. Colours: "Ember"
   (deep indigo, a terracotta-to-gold glow at the horizon).
7. Wording follows the house style, with Lightreader's exceptions: 24-hour times ("21:24"),
   and Lightreader's words for the sky (Daylight, Half-light, Dark, Very dark, True night).

## 3. How dark the night gets

1. **Agreed.** The headline figure is **Moon-free true night**: the time the Sun is 18° or
   more below the horizon and the Moon is down (its top edge below the horizon).
2. **Agreed.** When there's no true night, it falls back to "very dark" (the Sun 12° or more
   below) and says so.
3. **Proposed.** Further north the fallback needs one more step. From Edinburgh and Lerwick
   on June 21st the sky only reaches "dark" (6° or more below); from the far north of
   Shetland it's half-light all night. So: true night, else very dark, else dark, else
   "Half-light all night: the sky never gets dark."
4. **Agreed.** A night belongs to the day it starts on, and runs from sunset to the next
   sunrise.
5. **Agreed (draft wording).** On a night with no Moon-free darkness the headline reads "No
   Moon-free night", with "The Moon is up for the whole of true night" beneath.

## 4. The Moon (Agreed)

Drawn at its true phase and tilted as it appears from the place. Phase name, share lit,
moonrise and moonset. The moonlight shading in the pictures shows when the Moon is up and how
full it is; it isn't a measurement of brightness, and the page says so.

## 5. The planets, and "in view"

1. **Agreed.** Mercury, Venus, Mars, Jupiter and Saturn. Uranus and Neptune are left out:
   they need binoculars.
2. **Agreed.** Two levels, not one bar: **well placed** from 20° above the horizon, and
   **low** from 10° to 20° ("needs a clear horizon"). Below 10° isn't in view. A single
   higher bar would hide planets that can plainly be seen: from Britain a planet in the
   southern part of its path never climbs above about 15°, and less from Scotland.
3. **Agreed in principle; the numbers Proposed.** How dark the sky must be depends on how
   bright the planet is. The Sun must be at least this far below the horizon:
   3° for the very brightest (Venus), 4.5° for bright ones (Jupiter, Mars at its best),
   6° for ordinary ones (Saturn, Mars), 9° for faint ones (Mercury at its dimmest).
4. **Proposed.** When a planet isn't in view the page says why: "too close to the Sun",
   "too low while the sky is dark" or "below the horizon all night".
5. **Agreed.** Height is given in fists as well as degrees: a fist at arm's length covers
   about 10°. Fists are shown as tiny icons, to the nearest half.

## 6. The three pictures (Agreed; mock-ups in `design/mockups/`)

1. **The sky tonight.** From sunset to sunrise, the sky coloured by the Sun's depth, with an
   arc for the Moon and each planet showing how high it stands; solid where it's in view.
2. **Where to look.** The view south, east on the left. A slider moves through the night.
   The towns along the horizon are at their true directions (Lightreader's rule: "between
   Bordon and Alton (near Hook)", else "roughly over …", else the compass point alone), in
   two rows. Real stars and constellation lines; the brightest stars named. A ruler of fists
   up the left edge. On a phone the picture is larger than the screen with true shapes,
   opens on south and is swiped sideways.
3. **The year in darkness.** Every night for a year, dusk at the top and dawn at the bottom,
   coloured by the Sun's depth, with moonlight as pale slanting bands. Two keys: the sky, and
   moonlight by phase. Tapping a night gives its figures.

The opening is the Moon beside one figure (Moon-free true night), smaller than first drawn.

## 7. Looking ahead (Proposed)

A short list in date order, each line worked out for the place:

1. The Moon's next new and full.
2. Eclipses of the Sun seen from the place, and of the Moon when the Moon is up. Faint
   ("penumbral") eclipses of the Moon are left out: they are hard to notice.
3. Mars, Jupiter and Saturn at their best (opposite the Sun); the best mornings or evenings
   for Mercury and Venus.
4. Meteor showers, each with a plain verdict from that night's Moon: "Geminids, December
   14th: a good year, the Moon sets early."

## 8. Places and data

1. **Agreed.** Postcode districts: Refueller's list for Great Britain (2,863 districts, from
   OS Open Names), with its three credit lines.
2. **To build.** A town list covering Scotland and Wales for "Where to look" (Lightreader's
   covers places near England only), by Lightreader's `build-towns.ts`.
3. **Agreed for the mock-up; to confirm for launch.** Stars: d3-celestial's files (BSD
   licence), from a compilation of ESA's Hipparcos catalogue. The underlying catalogue's
   terms are still to read. HYG (CC BY-SA 4.0) is the alternative.
4. **To check.** The meteor shower list against the International Meteor Organization's
   current calendar.

## 9. Not in the first version (Agreed)

Space station passes (needs a collector), tonight's cloud (would mean sending a location to a
forecast service), how dark the sky is locally (no licence checked), Uranus and Neptune.

## 10. Accuracy (Agreed)

Astronomy Engine 2.1.19, the version Lightreader uses. Moon times were compared with MET
Norway on two days (within a minute). Stars near the horizon ignore the bending of light
there. Eclipse and planet dates are still to compare with a published source.

## 11. Ideas for later

A light "almanac" look for printing and "Share chart" pictures; comparing with another date or
place, as Lightreader does; a full-circle view; star names on tapping.

## 12. Open questions for John

1. §3.3: the extra fallback step for the far north ("dark", then "half-light all night").
2. §5.3: the four Sun-depth numbers. The figures sheet shows what they give.
3. §7: is "Looking ahead" the right list, and is leaving out faint eclipses right?
4. The Moon's phase names: eight names cover the month, so "First quarter" runs from about
   35% to 65% lit. Fine, or only "First quarter" on the day itself?
5. The repo: `JohnBaish/nightreader`, public, when you're ready to create it.
