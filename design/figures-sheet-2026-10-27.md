# Lightreader figures sheet, Tuesday October 27th 2026

Every example figure in `SPEC.md` for Reading (RG1), recomputed with Lightreader's own
calculation (Astronomy Engine 2.1.19, for the RG1 district centre, 51.4517° N, 0.9698° W).
Made by `npm run figures-sheet`. Times are UK clock time; "exact" times are to the second.

A line marked **differs** has at least one figure that comes out differently. Most are
a minute either side, because some of the spec's figures came from another library
(Astral) and a time near the half-minute can round either way.

| | Group | The spec says | Lightreader gives | How it was worked out |
|---|---|---|---|---|
| **differs** | Today | Sunrise 06:49, sunset 16:46 | Sunrise 06:48, sunset 16:46 | exact 06:48:22 and 16:46:21 |
| **differs** | Today | 9h 57m of daylight | 9h 58m of daylight | sunset minus sunrise, exact, then rounded |
| same | Today | Very dark or true night from 18:00 to 05:36 | from 18:00 to 05:36 | the sun 12° below, this evening and tomorrow morning |
| same | Today | Shortening by nearly 4m a day | 3m 41s shorter than yesterday ("nearly 4m" fits) | today's daylight minus yesterday's |
| same | This fortnight | A week ago: rose 07:36, set 18:00; days were 26m longer | Tuesday October 20th: 07:36 and 18:00; 26m longer | exact difference in daylight |
| same | This fortnight | Next Tuesday: rises 07:01, sets 16:33; 25m less daylight | Tuesday November 3rd: 07:01 and 16:33; 25m less | exact difference in daylight |
| same | Records | The earliest sunset since Wednesday January 28th | since Wednesday January 28th | the most recent day with an earlier sunset by the clock (16:46:18 against 16:46:21) |
| same | Records | The shortest day since Saturday February 14th | since Saturday February 14th | the most recent day with less daylight (9h 58m) |
| same | Records | The latest sunrise since the clocks went back (hidden: less than 30 days) | since Saturday October 24th, sunrise 07:43 | the most recent day with a later sunrise by the clock: the day before the clocks went back |
| same | Records | Today's daylight matches Sunday February 14th's | Saturday February 14th | past days in 2026 with the same daylight, to the minute shown (February 14th 2026 was a Saturday) |
| same | Coming up | The sun rises after 07:00 from Tuesday November 3rd to Tuesday February 23rd | after 07:00 from Tuesday November 3rd to Tuesday February 23rd | sunrise shown as 07:01 or later |
| **differs** | Coming up | Earliest sunset: 15:55, every day from Monday December 7th to Friday December 18th; the very earliest on Saturday December 12th | 15:55, every day from Wednesday December 9th to Wednesday December 16th; the very earliest Saturday December 12th (15:54:58) | the earliest minute shown, then the earliest exact time |
| **differs** | Coming up | Shortest day: Monday December 21st, with 7h 49m of daylight | Monday December 21st, 7h 50m | least daylight, exact |
| **differs** | Coming up | Latest sunrise: 08:10, every day from Monday December 28th to Saturday January 2nd; the very latest on Wednesday December 30th and Thursday December 31st, a fraction of a second apart | 08:09, every day from Saturday December 26th to Monday January 4th; the very latest Wednesday December 30th (08:09:18.041) and Thursday December 31st (08:09:18.029) | the latest minute shown; then every day within a second of the latest exact time (rule G) |
| same | Coming up | First sunset at 17:00 or later: Friday February 5th | Friday February 5th (17:00) | sunset shown as 17:00 or later; on the hour counts (rule C) |
| same | Coming up | Clocks go forward on Sunday March 28th: sunset jumps from 18:28 to 19:30 | March 28th: 18:28 to 19:30 | Saturday March 27th and Sunday March 28th 2027 |
| **differs** | Is it light at…? | It's dark at 17:30 until Tuesday February 2nd | dark at 17:30 until Monday February 1st (half-light ends 17:29; next day 17:31) | half-light ends at or before 17:30, as shown |
| same | Is it light at…? | 07:30 is always at least half-light; the darkest morning is Friday January 1st, half-light starts at 07:29 | 07:30 is always at least half-light; the darkest morning Friday January 1st (07:29:23) and Thursday December 31st (07:29:22), half-light starts 07:29 | over the year shown (April 27th 2026 to April 27th 2027) |
| same | Is it light at…? | The sun is up by 07:30 until Friday November 20th | until Friday November 20th (sunrise 07:30) | sunrise shown as 07:30 or earlier |
| same | Is it light at…? | The sun is up at 17:30 again from Monday February 22nd | up at 17:30 from Monday February 22nd (sunset 17:31) | sunset shown as 17:31 or later |
| same | Darkness | Tonight's true night lasts 10h 19m | 10h 19m | from 18:38:29 to 04:57:38 |
| **differs** | Darkness | No true night from Monday May 17th to Thursday July 22nd (next summer) | from Sunday May 23rd to Monday July 19th 2027 | evenings on which the sun doesn't reach 18° below |
| **differs** | Across the UK | Sunset in Penzance 17:07 | Penzance (TR18) 17:08 | TR18 district centre, exact 17:07:38. Lerwick (16:21 in the spec) waits for its point to be agreed (PLAN question 7) |
| same | Across the UK | Reading gets 6m less daylight than Penzance | 6m less | exact difference |
| same | Directions | Rises in the east-south-east, sets in the west-south-west | east-south-east, west-south-west | 109.7° and 250.0° from north |
| same | Directions | On the longest day, north-east and north-west | north-east, north-west | June 21st 2027: 49.0° and 311.0° |
| **differs** | Compare | Christmas: rises 08:09, 1h 20m later; sets 15:59, 47m earlier; half-light ends 16:40, 41m earlier; 2h 7m less daylight, 7h 50m in all | rises 08:08, 1h 20m later; sets 15:59, 47m earlier; half-light ends 16:40, 41m earlier; 2h 7m less, 7h 51m in all | differences by the clock, from exact times (rule H) |
| **differs** | Compare | Last July 14th: rose 05:04, 1h 45m earlier; set 21:15, 4h 29m later; half-light ended 22:01, 4h 39m later; 6h 14m more, 16h 12m in all; no true night | rose 05:03, 1h 45m earlier; set 21:15, 4h 29m later; half-light ended 22:00, 4h 39m later; 6h 14m more, 16h 12m in all; no true night | differences by the clock (July in BST, today in GMT) |
| same | Year ribbon card | Sunrise 06:48 · Sunset 16:46 · 9h 58m of daylight. Half-light 06:14 to 17:21; very dark from 18:00 | Sunrise 06:48 · Sunset 16:46 · 9h 58m. Half-light 06:14 to 17:21; very dark from 18:00 |  |
| **differs** | Sky ribbon mock-up | Sun highest 11:48; sunset 16:46; dark 17:21; very dark 18:00; true night 18:39 | 11:48; 16:46; 17:21; 18:00; 18:38 | true night starts 18:38:29 |
| **differs** | Sky ribbon mock-up | Wednesday: very dark 04:57; dark 05:36; half-light 06:15; sunrise 06:50 | 04:58; 05:36; 06:15; 06:50 | very dark from 04:57:38 |

19 of 31 lines are the same; 12 differ.
