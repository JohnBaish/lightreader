# Lightreader against MET Norway, 2027

Made by `npm run compare-metno` on 2026-10-27: every sunrise and sunset of 2027
for six postcode districts, from Lightreader's calculation (Astronomy Engine) and from MET Norway's
Sunrise 3.0 API. MET Norway gives times to the minute; ours are to the second.

MET Norway's times run from about a minute before ours to a few seconds after, so it drops the
seconds rather than rounding: its "06:48" means some time from 06:48:00 to 06:48:59. So the fair
test is whether our exact time falls inside MET Norway's minute, and if not, by how many seconds
it misses. Lightreader itself rounds to the nearest minute (SPEC §4), so the page will often show
a minute later than MET Norway's own pages; that is the rounding, not a disagreement.

| District | Place | Times | MET Norway minus ours | Outside MET Norway's minute | By at most | Direction, largest difference |
|---|---|---|---|---|---|---|
| TR18 | Penzance | 730 | -62 to 2 seconds | 20 | 2.5 seconds | 0.02° |
| RG1 | Reading | 730 | -61 to 3 seconds | 14 | 3.3 seconds | 0.02° |
| NR1 | Norwich | 730 | -61 to 3 seconds | 17 | 3.1 seconds | 0.02° |
| M1 | Manchester | 730 | -61 to 3 seconds | 23 | 2.8 seconds | 0.02° |
| NE1 | Newcastle upon Tyne | 730 | -62 to 3 seconds | 23 | 3.2 seconds | 0.02° |
| TD15 | Berwick-upon-Tweed | 730 | -62 to 3 seconds | 17 | 2.8 seconds | 0.02° |

**Largest difference:** our sunrise in RG1 on 2027-01-21 is 3.3 seconds
before MET Norway's minute (ours 07:56:56 UTC, MET Norway 07:57 UTC).

**Outside MET Norway's minute:** 114 of 4380 times; 88 earlier, 26 later.

**Directions:** the 16-point compass word differs on 2 of 4380 times
(an azimuth within a few hundredths of a degree of a boundary between two points):

- TR18 2027-07-22 sunset: ours 303.748° (west-north-west), MET Norway 303.76° (north-west)
- RG1 2027-07-25 sunset: ours 303.744° (west-north-west), MET Norway 303.75° (north-west)
