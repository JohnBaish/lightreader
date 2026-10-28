# Lightreader — spec

Drafted with John on Tuesday October 27th 2026, for Claude Code to turn into a staged plan. Every decision below was agreed in conversation unless it is marked **To check** or **To decide**.

---

## 1. What Lightreader is

- A new free tool in the baish.net suite: sunrise, sunset, day length and twilight for a postcode.
- **Audience:** enthusiasts.
- **Purpose:** usable information about when the light comes and goes, measured against everyday activities. Local clock time is what matters most.
- **Coverage:** England first, like Hindcaster. Scotland, Wales and Northern Ireland can come later.
- **Location:** by postcode only, at postcode-district precision.
- **Name:** Lightreader. The name plays on reading the light, light reading, and a photographer's light reading.
- **Address:** lightreader.baish.net (John, October 27th 2026).
- **House rules:** follows HOUSE-STYLE.md, the wording rules and the ways of working, the same as the other tools. It is described as "a free-to-use personal project by John Baish". Update the hub's title and description when it launches.
- **Stack:** Vite + React + TypeScript on Vercel. No backend, no accounts, anonymous Vercel analytics.

## 2. Principles

- **Nothing is sent.** Every calculation runs in the browser. The postcode lookup uses data bundled with the site and makes no request carrying the visitor's postcode. Saved times are kept in the browser only, and the page says so: "Saved on this device only".
- **No made-up figures**, anywhere, including examples.
- **The tool explains itself on a first visit.** An "About these figures" panel explains the four light labels with their technical names, says where the figures come from, and says how accurate they are: within a minute or so; real hills, buildings and weather aren't modelled.

## 3. Calculation

- **Library: Astronomy Engine** (npm `astronomy-engine`, MIT licence).
  - It replaces SunCalc. Checked for Reading, Saturday December 12th 2026, SunCalc gives sunset at 15:56:31. Astral (Python) gives 15:54:38, Astronomy Engine gives 15:54:59, and MET Norway's Sunrise 3.0 API gives 15:54. SunCalc is about two minutes out.
- **Definitions:**
  - Sunrise and sunset happen when the sun's centre is 0.833° below the horizon, which allows for refraction and the sun's apparent radius.
  - The twilight boundaries are the sun's centre at 6°, 12° and 18° below the horizon.
  - **To check:** that Astronomy Engine's rise and set convention matches this.
- **Times:** calculate in UTC; display in Europe/London local time.
- **Location:** use the postcode-district centre. Moving about 17 km east or west shifts the times by roughly a minute, so district precision is enough.
- **Before launch:** compare a full year for several English places against MET Norway Sunrise 3.0, and log the largest difference.
- **Example figures:** all examples in this spec are real figures for Reading (RG1) on Tuesday October 27th 2026. Some came from Astral and some from Astronomy Engine, so the final build may move a borderline day by a minute. For example, today's sunrise is 06:48:38 in Astral (shown as 06:49) and 06:48:23 in Astronomy Engine (shown as 06:48). Recompute every example from the chosen library before using it in tests.

## 4. Labels, formats and colours

### Light labels

| Label | Technical name | Sun's centre below the horizon |
|---|---|---|
| Daylight | — | sun up |
| Half-light | civil twilight | 0 to 6° |
| Dark | nautical twilight | 6 to 12° |
| Very dark | astronomical twilight | 12 to 18° |
| True night | — | more than 18° |

- "Dark" in a sentence means the dark band or darker, which is everything after half-light.
- "Light" means daylight or half-light.

### Formats

- **Times:** 24-hour, with a leading zero and a colon: "06:49". Round to the nearest minute. This is a deliberate exception to HOUSE-STYLE §15's "9.30am", like Clockmaker's (John, October 27th 2026: "we tried various looks and this was the best").
- **Dates:** month first, with an ordinal: "Tuesday October 27th". Add the year only where it's needed.
- **Durations:** "1h 20m", "47m", "2h" (never "2h 0m"), and "less than a minute" for anything shorter.
- **Numbers:** one to nine in words and 10+ as digits, as house style ("in nine days", "in 12 days"). Durations and times always use digits.
- **Tense** follows the date and the time of day: past dates use "rose" and "set"; today mixes tenses as the day goes on.
- **BST/GMT:** say so only when two dates being compared are on different clock times.
- **Clock changes:** "since" and "until" sentences stop at a clock change and say so.

### Colours

- **Theme:** light mode by default, with a switch for dark mode, as Hindcaster has.
- **Light mode:** house palette, plus the band colours below.
- **Dark mode page colours:** Hindcaster's, as in HOUSE-STYLE §2 (page #2a2723, surface #37332e, text #e8dfcf, muted text #b0a593, terracotta #dd8a56; John, October 27th 2026). This replaces the darker set first drafted here (page #1b1816). The dark band colours below are to be re-checked against the new page colours.

| Band | Light mode | Dark mode |
|---|---|---|
| Daylight | #f2cf86 | #d8b46e |
| Half-light | #d98e57 | #c27a48 |
| Dark | #7b6577 | #6c5868 |
| Very dark | #463c55 | #3d344f |
| True night | #24212f | #0f0e16 |

All of these colours are approved by John.

## 5. The page, top to bottom

1. **Header:** logo, "Lightreader", and a postcode pill showing, for example, "Reading (RG1)" with a Change button.
2. **Today:** "Sunrise 06:49 · Sunset 16:46" in large type. Show nothing else here; day length lives in the sentences.
   - **Changed (John, October 27th 2026):** before the sun is highest, as above, under "Today · Tuesday October 27th"; from then on, today's sunset under "Today · …" and then tomorrow's sunrise under "Tomorrow · Wednesday October 28th". The headings' wording is a draft.
   - **Changed (John, October 28th 2026, option B):** the headings say which event: "Today's sunset · …" and "Tomorrow's sunrise · …".
   - **Changed (John, October 29th 2026):** once it's dark (half-light over, at the minute shown), tomorrow's sunrise and sunset under "Tomorrow · Thursday October 29th". Where half-light lasts all night, it stays as before.
3. **Next 24 hours: the sky ribbon** (mockup option B).
   - **Computer:** a horizontal strip, drawn to scale, from now to the same time tomorrow, coloured by band. Each change of light is a tick with its time and label, alternating above and below. The strip starts with a "Now" marker and has a midnight divider marked "Wed" (or whichever day). Show the legend below it.
   - **Phone:** the strip stands upright. True night is folded to a fixed height with a zigzag and its length ("True night, 10h 19m (folded)"). Events are listed beside it. (John, October 27th 2026: the folded part at least twice as tall as first built; the key wraps with "Very dark" beside "True night".)
   - **To consider later:** showing the length of the night on the computer version too.
4. **Sentence groups,** in the order of section 6.
5. **Compare** (section 7). It sits at a fixed place on the page and does not follow you as you scroll.
6. **The year:** the year ribbon, with the day-by-day table below it (section 8).

## 6. Sentence groups

These are shown under sub-headings, in this order. The examples are for Reading on Tuesday October 27th 2026.

### Today
- "Sunrise 06:49, sunset 16:46: 9h 57m of daylight."
  - **Changed (John, October 27th 2026):** the daylight on a line of its own: "Sunrise 06:48, sunset 16:46." then "9h 58m of daylight."
- "Very dark or true night from 18:00 to 05:36."
  - **Moved (John, October 27th 2026)** to the start of Darkness.
- "Days are shortening by nearly 4m a day, close to the fastest they ever change."
  - The rate is worded loosely, with no seconds.
  - **To decide with John:** variants for lengthening days, and for around the solstices when the change is tiny.

### This fortnight
Compares with the same weekday a week back and a week ahead.
- "A week ago, before the clocks went back, the sun rose at 07:36 and set at 18:00. Days were 26m longer."
- "Next Tuesday the sun rises at 07:01 and sets at 16:33. That's 25m less daylight."
- **Changed (John, October 28th 2026):** each time is followed by its difference from today's in brackets: "the sun rose at 07:36 (48m later) and set at 18:00 (1h 14m later)".
- **Changed (John, October 28th 2026, J1):** the daylight line ("Days were 26m longer.", "That's 25m less daylight.") only when a clock change lies between, where the brackets need explaining.

### Records and runs
- "The earliest sunset since Wednesday January 28th."
- "The shortest day since Saturday February 14th."
- "The latest sunrise since the clocks went back."
  - Rule A hides this today, because the gap is less than 30 days.
- "Today's daylight matches Sunday February 14th's."
- **Changed (John, October 28th 2026; fresh look, 2.3):** the shortest and longest day records give the date even when it is just before a clock change ("The longest day since Saturday October 24th."), as the clocks don't change how long a day is.

### Coming up
This shows events in the next three months. The clock-change line appears only in the ten weeks before the change.
- "The sun rises after 07:00 from Tuesday November 3rd to Tuesday February 23rd."
- "Earliest sunset: 15:55, every day from Monday December 7th to Friday December 18th. Within that period, the very earliest is on Saturday December 12th."
- "Shortest day: Monday December 21st, with 7h 49m of daylight."
  - **Changed (John, October 28th 2026, J4):** "Shortest day: Monday December 21st, 55 days from now, with 7h 50m of daylight, 2h 8m less than today." The longest day the same, with "more".
  - **Added (John, October 29th 2026):** the next equinox, wherever it falls, in date order with the rest: "Spring equinox: Saturday March 20th, 143 days from now, with sunset at 18:16." ("today" or "tomorrow, …" when it's that close; the date is the UK date of the equinox moment).
- "Latest sunrise: 08:10, every day from Monday December 28th to Saturday January 2nd. Within that period, the very latest are on Wednesday December 30th and Thursday December 31st, a fraction of a second apart."
- "First sunset at 17:00 or later: Friday February 5th."
  - This illustrates the wording; on October 27th it would fall outside the three-month window.
- "Clocks go forward in x days, on Sunday March 28th: sunset jumps from 18:28 to 19:30."
  - The day before: "Clocks go forward tomorrow…"
  - The day itself: "Clocks went forward today: sunset is at 19:30, not 18:28."
  - In autumn, use sunrise instead: "Clocks go back in x days, on Sunday [date]: sunrise jumps from [time] to [time]."

### Is it light at…?
This is option B of the "your times" mockup.
- Visitors add their own times as chips, with ✕ to remove one and "+ Add a time". The times are saved in the browser.
- **Per time:** a label with a pill showing today's band at that time, a thin strip showing the band at that time on every day of the year (with a today marker), and two sentences.
- The sentences, for Reading:
  - "It's dark at 17:30 until Tuesday February 2nd."
  - "07:30 is always at least half-light here. Even on the darkest morning, Friday January 1st, half-light starts at 07:29."
    - Apply rule G: if the darkest mornings are less than a second apart, name both.
  - "The sun is up by 07:30 until Friday November 20th."
  - "The sun is up at 17:30 again from Monday February 22nd."
- **Other forms:**
  - "It's light at [time] until [date]."
  - "The sun is up by [time] again from [date]."
  - "The sun is still up at [time] until [date]."
- **Changed (John, October 28th 2026, J5):** when the time is dark today, the first sentence says when half-light first reaches it, in the site's own words: "Half-light starts by 05:15 from Saturday April 24th." and, in the evening, "Half-light lasts past 17:30 from Tuesday February 2nd." ("past", as a half-light ending on the minute counts as dark, rule C). **And (fresh look, 3.2):** a time that is daylight all year says only "12:00 is always daylight here."

### Darkness
- "Tonight's true night lasts 10h 19m."
- "No true night from Monday May 17th to Thursday July 22nd."
  - These dates are next summer's, from Astral; recompute them.
- **Changed (John, October 28th 2026, J6):** the dark hours carry their length: "Very dark or true night from 18:00 to 05:36 (11h 36m)."; and "No true night from …" only shows when it starts within ten weeks.

### Across the UK
These are calculated for fixed coordinates, so they need no postcode data outside England.
- **Decided (John, October 27th 2026):** the places are whichever big places are at the two ends of each comparison that day, from a short list (the cities in OS Open Names, plus Lerwick, Stornoway, Penzance, Dover and Lowestoft; not Northern Ireland). The cities are named, with one of the five edge towns in brackets when it goes further: "Sunset today runs from 16:35 in Norwich (16:21 in Lerwick) to 17:05 in Truro (17:08 in Penzance). Reading's is at 16:46."
- "Sunset today runs from 16:21 in Lerwick to 17:07 in Penzance. Reading's is at 16:46."
- "Reading gets 51m more daylight than Lerwick today, and 6m less than Penzance."
- **Changed (John, October 28th 2026, J7 and J8):** "There's an early sunset today in Norwich at 16:35 (16:21 in Lerwick), and a late one in Truro at 17:05 (17:08 in Penzance). Reading's is at 16:46." (beyond both ends: "…and a late one in Truro at 17:05; Penzance's is later still, at 17:08."). The daylight sentence names the cities only, without brackets: "Reading gets 33m more daylight than Inverness today, and 5m less than Truro." When every place is within a minute, as around the equinoxes: "Today every place in the UK gets about the same amount of daylight."

### Where the sun rises and sets
(Heading on the page: "Direction of sunrise and sunset", John, October 27th 2026.)
- "The sun rises in the east-south-east, roughly over Bracknell, and sets in the west-south-west, roughly over Theale."
  - Directions use the 16-point compass, from the sun's direction (azimuth) at sunrise and sunset.
  - The town is a recognisable place lying in that direction, within about 5°, at a sensible distance. In the example, Bracknell and Theale were picked by hand.
  - **To check:** a data source, such as OS Open Names.
- "On the longest day it rises in the north-east and sets in the north-west."
- **Changed (John, October 28th 2026):** the places are "between" two towns or cities, with a smaller place in brackets ("between Bracknell and Wokingham (near Bagshot)"), or "roughly over" one (src/lib/towns.ts); and (J9) two bullets, "The sun rises in the east-south-east, between Bracknell and Wokingham (near Bagshot)." and "It sets in the west-south-west, roughly over Thatcham.", with the longest-day bullet dropped.

## 7. Rules

- **A. Records.** "Since" sentences compare to the second. They appear only when the gap is at least 30 days, and they stop at a clock change and say so.
- **B. Ties at the minute.** When the rounded time holds for several days, give the run of days and, where it's interesting, the exact day. Never show seconds.
- **C. Thresholds** use the displayed minute, so a sentence never contradicts the tables. A time exactly on the hour counts as reached.
- **D. Durations:** see section 4.
- **E. Short nights.**
  - When the sun doesn't reach 18° below: "No true night tonight: at its darkest the sky is very dark."
  - Where it doesn't pass 6° below, should coverage ever reach far enough north: "Half-light lasts all night."
  - Never show a blank or an error for a missing time.
- **F. Tense** follows the date and the time of day.
- **G. Near-ties.** If the "very earliest" or "very latest" days are less than a second apart, name both.
- **H. Differences** are worked out from exact times. A sum may now and then look a minute out, and that's accepted.

## 8. Compare (mockup option C)

- **One box** takes either a date or a postcode, and compares with one thing at a time.
  - Placeholder: "Try Christmas, 14/7 or TR18". TR18 is Penzance.
  - **Dates:** parsed with chrono (en-GB day-month order). Add custom words: "Christmas", "Christmas Day", "longest day" and "shortest day" (calculated for the place, not fixed).
  - Don't use "midsummer" or "midwinter".
  - A bare date such as "July 14th" means the next one. "Last July 14th" works.
  - **To check:** chrono's licence.
- **Quick choices:** Christmas Day, Shortest day, Longest day.
- **Echo:** always say back what was understood: "Comparing with Friday December 25th 2026".
- **Paired ribbons:** two small ribbons, today and the other day, on the same midnight-to-midnight scale, with the legend.
- **BST note** when the clock times differ: "July times are in BST, an hour ahead of today's GMT."
- **Sentences only, no table.**
  - Date ahead: "On Friday December 25th the sun rises at 08:09, 1h 20m later than today." / "It sets at 15:59, 47m earlier." / "Half-light ends at 16:40, 41m earlier." / "That's 2h 7m less daylight: 7h 50m in all."
  - Date behind: "On Tuesday July 14th the sun rose at 05:04, 1h 45m earlier than today, and set at 21:15, 4h 29m later." / "Half-light ended at 22:01, 4h 39m later than today." / "There was 6h 14m more daylight: 16h 12m in all." / "There was no true night."
  - Place: "In Aberdeen today the sun rose at 07:08, 20m later than in Reading." / "It sets at 16:35, 11m earlier." / "Half-light ends at 17:16, 5m earlier." / "That's 31m less daylight: 9h 27m in all."
  - The "usable light" sentence uses the end of half-light.
- **Place comparisons beyond England:** only English postcodes can be looked up at launch, so Aberdeen above is only an illustration. **Decided** (John, October 27th 2026): yes, if easily done, using the same fixed-coordinate approach as "Across the UK", with each place at its town centre (Aberdeen as the example).

## 9. The year (mockup option C, then option B)

- **The span:** six months back to six months ahead, centred on today.
- **Year ribbon.**
  - Each day is a thin upright strip of band colours, from midnight at the bottom to midnight at the top, with hour lines at 00, 06, 12, 18 and 24 and month labels.
  - A today marker sits on top. Clock changes show as steps.
  - Tapping a day shows a detail card: "Tuesday October 27th 2026: Sunrise 06:48 · Sunset 16:46 · 9h 58m of daylight. Half-light 06:14 to 17:21; very dark from 18:00", plus a link "See all of [month]".
  - **Changed (John, October 28th 2026, J10, option B):** for a day other than today the card compares it with today, as Compare does: the chosen day's strip above today's, the BST note when the clocks differ, and Compare's sentences.
  - **To check:** how the strips draw in May and August, when true night starts or ends around midnight.
- **Day by day.**
  - **Folded at rest:** only a row of 13 month buttons shows, with the current month marked.
  - **Opening a month:** choosing one unfolds that month's table, with arrows to the previous and next months and a Close button. The year ribbon's "See all of [month]" link opens it at that month, with the day highlighted.
  - **Columns:** Date, Half-light (starts), Sunrise, Sunset, Half-light ends, Very dark, Daylight.
  - **Within the table:** today is highlighted. A marker row shows where the clocks change: "Clocks went back on Sunday October 25th. Times from here are GMT."
  - **On a phone,** each day becomes a compact card: day and date, "sunrise – sunset", half-light underneath, daylight on the right.

## 10. Later ideas, not for the first version

- Saved dates and places as quick choices in Compare.
- The 24-hour clock-face view (mockup option C of the first round), as an extra feature. John wants to explore what else it could do.
- Scotland, Wales and Northern Ireland.
- Hindcaster could use Lightreader's calculation for its summer wording when it's already light at 05:50.

## 11. For Claude Code to check

1. Postcode data: reuse Hindcaster's postcode-district lookup if it covers this need.
2. Town data and licence for the sunrise and sunset directions.
3. Astronomy Engine's rise and set convention, as in section 3.
4. chrono's licence.
5. The subdomain.
6. Recompute every example figure in this spec from Astronomy Engine before writing tests.

## Mockups made in this conversation

All are in the light theme unless noted; they are published as private pages for John.

- **Lightreader Mockups:** top of page. Option B was chosen. Dark versions of A and B are included.
- **Lightreader Compare:** option C was chosen.
- **Lightreader Tables:** C, then B, was chosen.
- **Lightreader Your Times:** option B was chosen.
