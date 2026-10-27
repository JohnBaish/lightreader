# Lightreader: fresh look, and John's amendments — handover

Written on Tuesday October 27th 2026 by the fresh-look thread, for the thread that built
the site. Review of the branch `claude/nice-goodall-j1r6wu` at commit 4a01d20. The site was
built from the branch and served locally (the Vercel preview can't be opened from the
review container). Checked at 1200px (computer) and 390px with touch (phone), in light and
dark mode, in Chromium; also at 375px and 360px.

**Nothing was changed by the review.** No code, no branches, no commits. The review's
test scripts and screenshots live only in its own scratchpad, so this file is
self-contained: every finding has its steps and its exact wording below.

The file has three parts:

- **Part A**, the fresh-look report (sections 1–9), word for word as John has it as a PDF.
- **Part B**, ten amendments John made after his own look at the site (J1–J10), each with
  the review's check against the code and the decisions logged in `CLAUDE.md`.
- **Part C**, the decisions still to take, the overlaps, and a suggested combined order.

Sizes: small / medium / larger. Priorities: worth doing / optional / leave.

---

## Part A — the fresh-look report

### 1. Overall verdict

1.1 Lightreader is in good shape. The first visit, the top card, the next-24-hours ribbon,
every sentence card, "Is it light at…?", Compare, the year ribbon, the day-by-day tables,
printing a month, "About these figures", the footer, Change and dark mode all work at both
sizes and in both themes. Across every pass there were no script errors, no sideways
scrolling, and every typing box is 16px on a phone. The project's own checks pass (the
build, the lint and all 37 checks).

1.2 Six genuine faults, all small: three postcode districts show "null" instead of a place
name; two carry double names with a slash; "Is it light at…?" names three "darkest" days,
two of them a year apart, for a few days each December; Compare reads "last Friday" as a
date a year ago; Compare will compare your own place with itself; and on a phone, scrolling
the page with a finger that lands on the year ribbon changes the chosen day. The rest are
usability points and wording suggestions.

1.3 What was reviewed: Reading (RG1), Berwick-upon-Tweed (TD15) and Brighton (BN1) in the
browser, with Oxford (OX1), London (E1), Hay-on-Wye (HR3), St Just (TR19) and the three
unnamed districts for particular checks; the ribbon at 56 moments across the year (seven
dates from October 2026 to October 2027, eight times of day each, three places, computer
and phone, folded and unfolded); and, in a separate sweep, every sentence group for every
day of a year in 12 districts (RG1, TD15, BN1, TR18, TR21, NR32, NE1, TS1, DL12, SW1A, CA6,
HU1), "Is it light at…?" every half hour, and Compare against every third date over 800
days and all 74 named places.

### 2. The sentence cards

**2.1 "Direction of sunrise and sunset" sits alone — small · optional.**
What happens: on a computer the seven sentence cards sit two to a row, so the last one,
"Direction of sunrise and sunset", is on its own at the bottom left with an empty slot
beside it.
Recommendation: let a card that ends up alone stretch across both columns, as "Is it light
at…?" already does.

**2.2 "About the same daylight" four times at the equinoxes — small · optional.**
What happens: for about three days in March and two in September every place gets the same
daylight within a minute, and "Across the UK" says so four times over. Reading on March
18th 2027: "Reading gets about the same daylight as Inverness (about the same daylight as
Lerwick) today, and about the same daylight as Truro (about the same daylight as Penzance)."
Recommendation: when every place is within a minute, one plain sentence instead, along the
lines of "Today every place in the UK gets about the same daylight." (wording for John).
See J8, which drops the brackets from this sentence anyway.

**2.3 "The longest day since the clocks went back" — small · optional.**
What happens: when a daylight record reaches back to the day before a clock change, the
sentence blames the clocks: Reading on February 17th 2027 says "The longest day since the
clocks went back." That wording is right for sunrise and sunset records, which the clocks
do move, but the clocks don't change how long a day is, so here it reads oddly. About 11
days a year.
Recommendation: for the daylight records (shortest and longest day), give the date instead
("The longest day since Saturday October 24th.").

### 3. Is it light at…?

**3.1 Three "darkest" days named, two of them a year apart — small · worth doing.**
What happens: for a few days each December the sentence lists three dates joined with "and
… and". Reading, 12:00, on December 11th 2026: "12:00 is always at least half-light here.
Even on the darkest evenings, Friday December 11th and Saturday December 12th and Saturday
December 11th 2027, half-light ends at 16:35." On December 12th: "Saturday December 12th and
Saturday December 11th 2027 and Sunday December 12th 2027". On December 31st at 07:30:
"…the darkest mornings, Thursday December 31st and Friday January 1st and Friday December
31st 2027…". On January 1st it names today and a year today: "Friday January 1st and
Saturday January 1st 2028". Cause: `lightSentence()` in `src/lib/sentences/lightAt.ts`
looks a year ahead from today (`year(ctx)` = today plus 365 days) and `bestWithTies()`
keeps every day within a second of the best, so when today is one of the near-tied darkest
days, the same days next year tie as well.
Recommendation: name only the days in the first run of near-ties (as `turnText()` in
`comingUp.ts` does by looking only at the neighbours), and if three ever remain, join them
with commas.

**3.2 Midday times name the darkest evening — small · optional.**
What happens: for a time that is always daylight, such as 12:00, the first sentence still
names the darkest evening: "12:00 is always at least half-light here. Even on the darkest
evenings, Friday December 11th and Saturday December 12th, half-light ends at 16:35." True,
but beside the point at midday, and the second sentence already says "The sun is always up
at 12:00 here."
Recommendation: when the time is daylight all year, a shorter first line: "12:00 is always
daylight here."

### 4. Compare

**4.1 "Last Friday" gives a date a year ago — small · worth doing.**
What happens: on Tuesday October 27th, type "last Friday": the echo says "Comparing with
Thursday October 30th 2025". ("Last Sunday" happened to give the right day, October 25th.)
Cause: `readTarget()` in `src/lib/compare.ts` strips "last ", chrono reads "friday" as this
coming Friday (October 30th), and the "last and year not certain" loop then looks back year
by year for an October 30th before today.
Recommendation: let chrono handle "last Friday", "last Monday" and so on whole (it
understands them), keeping the page's own handling for "last July 14th" and "last
Christmas".

**4.2 Your own place compared with itself — small · worth doing.**
What happens: in Reading (RG1), type "RG1": "Comparing with Reading (RG1), today", two
strips both labelled "Reading" (the same React key twice), and "In Reading today the sun
rose at 06:48, at the same time as in Reading. It set at 16:46, at the same time…". The
same from Oxford (OX1) typing "Oxford", or from Brighton (BN1) typing "Brighton and Hove".
Recommendation: when the place typed is the visitor's own district, or a named place
within a couple of miles of it, say "That's where you are: see above.", as it already says
"That's today: see above." for today's date.

**4.3 A town typed by name is refused — small · optional.**
What happens: type "Reading" (from anywhere): "That isn't a date or place Lightreader
knows. Try one like Christmas, 14/7 or TR18." Only the 74 big places are known by name (the
cities, plus Lerwick, Stornoway, Penzance, Dover and Lowestoft); any other English town
needs its postcode, and the message doesn't say so.
Recommendation: (a) say so in the message: "For a town in England, type its postcode (like
TR18). Cities can be typed by name." (b) Also accept the names from the postcode list when
a name belongs to one district only ("Reading" finds RG1), with the message for names that
belong to several (Brighton is BN1 and BN2). The review would do (a) now and keep (b) in
mind.

**4.4 "25.12" and "25-12" are refused — small · optional.**
What happens: "25/12", "25 Dec" and "25th December" all work; a date typed with dots or
dashes gets the "isn't a date or place" message.
Recommendation: turn dots and dashes between numbers into slashes before reading the date.

**4.5 The hint in the box is cut short on a phone — small · optional.**
What happens: at 390px the box is 213px wide beside the Compare button, so the grey hint
reads "Try Christmas, 14/7 or TR1"; narrower phones cut more.
Recommendation: (a) a shorter hint, "Christmas, 14/7 or TR18"; or (b) the Compare button
under the box on a phone. The review would pick (a).

### 5. The year in light and Day by day

**5.1 Scrolling the page by the year ribbon changes the day (phone) — small · worth doing.**
What happens: on a phone, a swipe up the page that starts on the year ribbon picks the day
under the finger as well as scrolling, because `YearRibbon` picks on `pointerdown`. The
ribbon is 170px tall, halfway down the page, so this will happen often. Starting a swipe a
fifth of the way along changed the detail card from today to Thursday July 9th 2026 while
the page scrolled on (simulated touch through CDP). A tap, a sideways drag and the handle
all work as intended.
Recommendation: pick the day when the finger lifts, or only once it has moved sideways, so
a vertical scroll leaves the day alone. A tap would still pick at once.

**5.2 "See all of …" when that month is already open — small · optional.**
What happens: on a computer, with November open in Day by day, choose a day in November on
the ribbon and click "See all of November": the day's row is highlighted but the page
doesn't move to it. It only scrolls when the link opens a different month (the scroll
effect in `YearCards` runs on a change of `open`).
Recommendation: always scroll to the day's row.

### 6. Across the whole site

**6.1 Three districts show "null" instead of a place — small · worth doing.**
What happens: TR22 (St Agnes in the Isles of Scilly, as far as the review can tell), MK20
and SO97 have `null` as the place name in `src/data/outcodes.json`. The pill reads
" (TR22)"; "Across the UK" says "…to 17:05 in Truro (17:08 in Penzance), and null's is
later still, at 17:11." and "null gets 40m more daylight than Inverness…"; Compare says
"…2m later than in null"; and a printed month is headed "Day by day · null (TR22)". MK20
and SO97 look like special-purpose districts rather than places, which is worth confirming.
Recommendation: (a) give the three a name in the list (St Agnes for TR22; perhaps Milton
Keynes and Southampton for the other two); and (b) wherever a name is missing, show the
postcode itself ("TR22 gets 40m more daylight…") so this can never read "null" again. The
review would do both.

**6.2 Two districts carry double names with a slash — small · worth doing.**
What happens: HR3 shows "Y Gelli Gandryll / Hay-on-Wye (HR3)" and TR19 "St Just / St Just
in Penwith (TR19)" in the pill, in every sentence that names the place ("Y Gelli Gandryll /
Hay-on-Wye gets 30m more daylight than Inverness…", "…10m later than in Y Gelli Gandryll /
Hay-on-Wye.") and in the printed heading. On a 360px phone the HR3 pill fills the whole
row but still fits.
Recommendation: when the postcode list is built (`scripts/build-outcodes.ts`), keep one
name: the English half for HR3 ("Hay-on-Wye", following John's rule that Welsh names are
given in English) and the short form for TR19 ("St Just").

**6.3 Controls under 44px on a phone — small · optional.**
What happens: the postcode and Compare boxes are 39px tall and their Show and Compare
buttons 36px; the ✕ on the time and Compare chips is 36px; "See all of October" is 22px
tall; the folded true-night strip is 22px wide and its "(folded: tap to open)" note 21px
tall. Everything else (Change, the month buttons, the arrows, Close, Print this month, the
dark-mode switch) is 44px.
Recommendation: 44px on a phone for the boxes, their buttons and the ✕ (the house rule),
and a taller tap area for the fold note and the link.

### 7. Looked at and would leave alone

7.1 **First visit and the postcode box.** The heading, the line and the box are as agreed.
"Type a postcode first.", "That doesn't look like a postcode…" and the England-only message
all appear for the right input (CF10, EH1, BT1, JE2, IM1 and W1 refused); "rg1 8fr" is
taken as RG1; the choice is kept after a reload; no box is focused on load, which is right
for phones.

7.2 **The top card and the next 24 hours.** The card changes from "Today" to "Today's
sunset / Tomorrow's sunrise" at the minute the sun is highest (11:47 to 11:48 for Reading
on October 27th). The ribbon's labels never overlap or spill out of the card at any of 56
moments across the year in Reading, Berwick and Brighton, on a computer and on a phone,
folded and unfolded. The fold opens and shuts from the strip or its note, "Wed" sits before
tomorrow's times, and at midnight everything moves on without errors.

7.3 **The sentences across a year.** All seven groups for every day of a year in Reading,
Berwick, Brighton, Penzance, Hugh Town, Lowestoft, Newcastle, Middlesbrough, Barnard
Castle, Westminster, Longtown and Hull; "Is it light at…?" every half hour; Compare against
hundreds of dates and all 74 named places: no bad values, no missing full stops, every rule
as agreed. "Records and runs" has nothing to say for about a week after the longest day
(late June 2027) and the card is hidden then, which is right.

7.4 **Places over the border.** Near Longtown (CA6) the sun sets "between Annan and
Lockerbie": real towns in that direction, as the rule intends.

7.5 **Compare's refusals.** Dates that don't exist (29/2, 31/4, 30 Feb), "Easter",
"Christmas Eve", "next Christmas", "2027", "12" and "Belfast" (Northern Ireland left out by
John's choice) get the standard message, and the echo always says what was understood
("July" is Thursday July 1st 2027; "Friday" is this Friday).

7.6 **Compare chips kept as typed.** "Today" and "Tomorrow" always mean today and tomorrow,
by design. A chip whose text can't be read shows nothing, and damaged saved times show only
the valid ones; both are only reachable by editing the browser's storage by hand.

7.7 **The year and the tables.** Every month button, the arrows (greyed at April 2026 and
April 2027), Close, the open month's button closing it, the two clock-change rows,
Berwick's "never" and "the sky never gets very dark" (John's agreed drafts), the arrow keys
and Page Up and Page Down. Home and End do nothing, which is fine.

7.8 **Printing a month.** One A4 page on a computer with "Day by day · Reading (RG1)",
"October 2026" and the table and nothing else; the phone layout prints as three pages.
Printing the whole page through the browser's own Print runs to seven pages with gaps,
because each card is kept whole; "Print this month" is the intended route.

7.9 **Change, dark mode and the keyboard.** Change shows the box with Cancel and keeps the
page below; Cancel, a refused postcode and a new one all behave, and the saved times stay
across a change of place. The dark choice is set before the page draws, kept, and cleared
by switching back. Tab reaches everything in order with a visible ring. Escape doesn't
close the Change box, but Cancel does and Tab reaches it.

7.10 **"About these figures" and the footer.** As agreed; the links open in a new tab; the
credits are the three lines that come with the postcode data.

7.11 **The missing statistics script.** The one failed load on every page is Vercel's
statistics script (`/_vercel/insights/script.js`), which exists only on Vercel.

7.12 **No browser toolbar colour for dark mode.** Safari's toolbar stays its default
colour; Hindcaster is the same.

### 8. What I couldn't check

8.1 A real iPhone or Android phone: the time picker and its tick or Done (John's own iPhone
check stands), Safari's toolbar, how scrolling feels, and the swipe in 5.1 on a real screen
(shown here with simulated touches).

8.2 A real printer and the browser's print dialogue; the PDFs were made from the print
layout instead.

8.3 The Vercel preview and the live address, which are blocked from the review container;
the site was built and served locally from the branch.

8.4 Speed on a real phone; in the review the sentences and the year arrive about a second
after the page opens.

8.5 The safety-net message, as nothing made the page fail.

8.6 Screen readers, beyond the labels and roles present in the page.

### 9. Suggested order (the report's own; the combined order is in Part C)

1. Quick fixes, in one branch: 6.1, 6.2, 3.1, 4.1, 4.2 and 5.1, with before-and-after
   screenshots.
2. Decide on: 4.3 (a) or (b); 4.5 (a) or (b).
3. Optional extras that could go into the quick-fix branch: 2.1, 2.2, 2.3, 3.2, 4.4, 5.2
   and 6.3.
4. Left alone for now: 7.1–7.12.

Every item in sections 2–7 appears in this list: 2.1–2.3, 3.1–3.2, 4.1–4.5, 5.1–5.2,
6.1–6.3, 7.1–7.12.

---

## Part B — John's amendments after his own look, with the review's checks

John sent these after reading the site himself, before seeing the report. Each has the
review's check against the code, the sweep and the decisions in `CLAUDE.md`.

**J1. This fortnight: drop the daylight line except around a clock change.**
John asked whether the two bracketed differences always add up to the daylight difference.
They do, exactly, because daylight is sunset minus sunrise, and that holds across a clock
change too (the hour shifts both times equally; "48m later" and "1h 14m later" give the 26m
in the example). The caveat is rule H: each figure is rounded on its own, so now and then
the two brackets look a minute out from the daylight line. John's rule: say "Days were 26m
longer." or "That's 25m less daylight." only in the week before or after a clock change,
when the brackets need explaining. Sound; it also removes the visible sums. It drops a
sentence from SPEC §6, which is John's call. Doable in `src/lib/sentences/fortnight.ts`.
No clash with the report.

**J2. Records and runs: "latest sunrise since".**
Already exists (`records.ts`, the `latest sunrise` measure), shown hundreds of times in
the sweep. Hidden today only by rule A: Reading's latest sunrise today goes back just three
days, to Saturday October 24th (07:36 BST), under the 30-day minimum. It returns on
November 23rd 2026 as "The latest sunrise since the clocks went back." and from November
29th as "The latest sunrise since Friday January 30th 2026." Nothing to build. (Report 2.3
is about the daylight records borrowing that clocks wording.)

**J3. Coming up: "the sun won't set before 16:00 until …", and the equivalent for
shortening days.**
Doable. Today the lighter direction gives only the first day ("First sunset at 16:00 or
later: Saturday December 26th.") while the darker direction gives the run ("The sun sets
before 16:00 from Monday November 30th to Friday December 25th."). Two existing rules need
a decision before building (`comingUp.ts`): runs longer than about eight months
(`LONGEST_RUN_DAYS`, 240) are dropped as hardly news, and this form would often be that
long ("won't set before 17:00" lasts February to October); and in spring the clocks make a
first happen twice, which is currently said in one line ("First sunrise at 06:00 or
earlier: Tuesday March 23rd, and again after the clocks go forward, on Tuesday April
20th."). John wrote "4pm"; the site's agreed style is "16:00" (SPEC §4).

**J4. Shortest and longest day: days from now, the daylight, and the difference from
today.**
Doable; the figures exist. For Reading today: "Shortest day: Monday December 21st, 55 days
from now, with 7h 50m of daylight, 2h 8m less than today." The longest day the same with
"more". John wrote "of light"; the site says "daylight" everywhere, so the review would keep
that unless John wants the change. (`turnText()` in `comingUp.ts`; "55 days" in digits by
the number rule, "in nine days" in words.)

**J5. Is it light at: "Dusk first starts at 05:15 on Friday April 23rd".**
Needs John's say on which sentence this replaces, because 05:15 is a morning time and
"dusk" is the evening. Two things to weigh: the words dawn and dusk aren't used anywhere on
the site (the labels are daylight, half-light, dark, very dark, true night), so they would
need defining in "About these figures" (dawn and dusk usually mean the start and end of
half-light); and the card's present forms are "It's light/dark at … until …", "The sun is
up by … until …" and "The sun is up at … again from …" (`lightAt.ts`). Report 3.1 and 3.2
are in this card and don't clash with a rewording.

**J6. Darkness: the length in brackets; "No true night" only within ten weeks.**
Both doable (`darkness.ts`). The length after the first bullet ("Very dark or true night
from 18:00 to 05:36 (11h 36m)") would come from the exact times, so it could occasionally
read a minute off the two shown times (rule H); the review would accept that. "No true
night from …" only when the first date is within ten weeks matches the clock-change notice
(`CLOCK_CHANGE_NOTICE_DAYS`, 70). "True night returns on …" inside the run is unaffected.

**J7. Across the UK, first sentence: "There's an early sunset today in Norwich at 16:35
(16:21 in Lerwick), and a late one in Truro at 17:05 (17:08 in Penzance)."**
Works, and fixes the jar between the bracketed and unbracketed places. Two variants need
the same treatment (`acrossUk.ts`): the visitor's own line ("Reading's is at 16:46.") and
the "earlier still / later still" form used when the visitor is beyond both ends (Penzance,
Lowestoft, Berwick: "…and Penzance's is later still, at 17:08."). A closer-to-exact
alternative if wanted: "The earliest sunset today is Norwich's, at 16:35 (16:21 in
Lerwick), and the latest Truro's, at 17:05 (17:08 in Penzance). Reading's is at 16:46."

**J8. Drop the brackets from the daylight sentence.**
Simple (`acrossUk.ts`, the second sentence). It makes report 2.2 simpler or moot, so decide
J8 before 2.2. It undoes the 27 October bracket decision for this sentence only.

**J9. Direction card: two bullets; drop the longest-day bullet.**
Doable (`directions.ts`): "The sun rises in the east-south-east, between Bracknell and
Wokingham (near Bagshot)." / "It sets in the west-south-west, roughly over Thatcham." John
said "the shortest day bullet"; the bullet is "On the longest day it rises in the north-east
and sets in the north-west", read as that one (to confirm). It's a SPEC §6 sentence, John's
call. Report 2.1 (the lone card) is unaffected.

**J10. Year in light: the box below the ribbon as a comparison with today.**
The biggest item; a mock-up first. Compare already has the pieces (`compareDate()` and the
paired `dayRibbon()` strips), so the choice is how much goes under the ribbon when a day
other than today is chosen: (a) the day's own times with the difference from today in
brackets after each, as This fortnight does; or (b) the Compare block itself (two strips
and the sentences), with today's card as now when today is chosen. Either makes report 5.1
more important, since a mis-picked day would then show a whole comparison.

---

## Part C — decisions still to take, overlaps, and a combined order

### C1. Decisions for John (reply by number)

- **4.3** Town names in Compare: (a) a clearer message, or (b) also accept names from the
  postcode list when unambiguous.
- **4.5** The Compare hint on a phone: (a) shorter hint, or (b) the button under the box.
- **J3** Whether to lift the eight-month limit for the "won't set before … until …" form,
  and how it should read in spring when the clocks make it happen twice. Written as
  "16:00", not "4pm"?
- **J4** "of daylight" (as elsewhere) or "of light"?
- **J5** Which sentence "Dusk first starts at …" replaces, and whether to introduce dawn and
  dusk as words (then defined in "About these figures").
- **J7** John's wording, or the "earliest … latest …" alternative; and the wording for the
  own-place line and the "earlier still / later still" case.
- **J8 then 2.2** Drop the brackets (J8); then whether an equinox sentence is still wanted
  (2.2).
- **J9** Confirm it is the "On the longest day …" bullet that goes.
- **J10** (a) brackets after the times, or (b) the Compare block; mock-up first either way.
- **6.1** Names for MK20 and SO97 (TR22 as St Agnes), and the postcode as the fallback.

### C2. Overlaps to handle together

- J8 with 2.2 (the same sentence).
- J5 with 3.1 and 3.2 (the same card; 3.1 is a fault whatever the wording becomes).
- J10 with 5.1 and 5.2 (the same card; 5.1 first).
- J1, J4, J6, J7, J8, J9 and 2.3 all change sentence files that have checks in
  `scripts/check-sentences.ts`; the expectations there will need updating with real figures.

### C3. Suggested combined order

1. **One branch, built in this order, with before-and-after screenshots at 1200px and
   390px:** the report's quick fixes 6.1, 6.2, 3.1, 4.1, 4.2 and 5.1; then John's J1, J4,
   J6, J7, J8 and J9 (J2 needs nothing); then any of 2.1, 2.3, 3.2, 4.4, 5.2 and 6.3 John
   ticks.
2. **Needing John's answers first:** 4.3, 4.5, J3, J5, and 2.2 after J8.
3. **Mock-up before building:** J10, in both sizes, options (a) and (b).
4. **Left alone:** 7.1–7.12.

### C4. Afterwards

Per the fresh-look skill (§7), once John has decided, a short dated entry goes in
`CLAUDE.md`: the review's commit (4a01d20), the numbered findings in one line each, John's
amendments J1–J10, and his decision on each.
