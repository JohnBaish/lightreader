// `npm run sentence-sheet [<html out>]`: the stage 2 sentence sheet for John (PLAN stage 2):
// every sentence group for 14 days and places, with the drafts he needs to decide on.
// Writes design/sentence-sheet-2026-10-27.md; with an HTML path, also an A5 page in the
// fresh-look report's style for .claude/skills/fresh-look/make-pdf.mjs to turn into a PDF.

import { readFileSync, writeFileSync } from 'node:fs'
import { allGroups, makeContext } from '../src/lib/sentences/index.ts'
import { clock, longDate } from '../src/lib/format.ts'
import { ukParts } from '../src/lib/ukTime.ts'

const outcodes = JSON.parse(readFileSync('src/data/outcodes.json', 'utf8')) as { outcodes: Record<string, [number, number, string]> }

type Scenario = { code: string; iso: string; why: string; times: string[] }
const SCENARIOS: Scenario[] = [
  { code: 'RG1', iso: '2026-10-27T09:02:00Z', why: 'today, as in the spec and the mock-ups', times: ['07:30', '17:30'] },
  { code: 'RG1', iso: '2026-10-25T07:00:00Z', why: 'the morning the clocks went back', times: ['07:30', '17:30'] },
  { code: 'RG1', iso: '2026-12-21T10:00:00Z', why: 'the shortest day', times: ['07:30', '17:30'] },
  { code: 'RG1', iso: '2027-03-20T10:00:00Z', why: 'the days changing fastest, eight days before the clocks go forward', times: ['06:00', '18:30'] },
  { code: 'RG1', iso: '2027-03-28T10:00:00Z', why: 'the day the clocks go forward', times: ['06:00', '19:00'] },
  { code: 'RG1', iso: '2027-05-15T10:00:00Z', why: 'May, a week before the nights without true night', times: ['05:00', '21:30'] },
  { code: 'RG1', iso: '2027-06-21T10:00:00Z', why: 'the longest day', times: ['05:00', '21:30'] },
  { code: 'RG1', iso: '2027-08-15T20:00:00Z', why: 'August, in the evening', times: ['06:00', '20:30'] },
  { code: 'TR18', iso: '2026-10-27T09:02:00Z', why: 'the far south-west, today', times: ['07:30', '17:30'] },
  { code: 'TD15', iso: '2027-06-21T10:00:00Z', why: 'the far north of England, on the longest day', times: ['04:30', '22:00'] },
  { code: 'NE1', iso: '2027-06-21T10:00:00Z', why: 'point 8: Newcastle on the longest day', times: ['04:00', '22:00'] },
  { code: 'TS1', iso: '2027-06-21T10:00:00Z', why: 'point 8: Middlesbrough, about as far south as it happens', times: ['04:00', '22:00'] },
  { code: 'TD15', iso: '2027-05-25T10:00:00Z', why: 'point 8: Berwick in late May, before the nights stop getting very dark', times: ['04:30', '22:00'] },
  { code: 'NE1', iso: '2027-07-10T10:00:00Z', why: 'point 8: Newcastle in July, after they start again', times: ['04:00', '22:00'] },
]

const DECISIONS: string[] = [
  '<strong>How fast days change</strong> (your question 4). Drafts: “nearly 4m”, “about 3m”, “more than 3m”, rounded loosely with no seconds; “close to the fastest they ever change” when the change is at least 90% of the year’s fastest (today’s 3m 41s is 93%; the fastest is 3m 58s, in mid-March); near the solstices “Days are shortening by less than a minute a day, as the shortest day nears.” or “…, just after the shortest day.”; and on the day itself “Today is the shortest day of the year: days start lengthening tomorrow.”',
  '<strong>Near-ties (rule G) come up often.</strong> Your rule names both days when they’re less than a second apart, and with exact times that happens a lot: the earliest sunset (December 12th and 13th, 0.4 seconds apart), the latest sunrise (December 30th and 31st), the darkest mornings for 07:30 (December 31st and January 1st). Keep naming both every time?',
  '<strong>“Coming up”, narrowed</strong> (decided 27 October, my suggestion for your OK): the turning points (earliest and latest sunrise and sunset, shortest and longest day) and the clock change always; of the whole hours crossed, only the soonest for sunrise and the soonest for sunset, so at most two such lines. Today that leaves five lines (A), and between two and six on the other days here; when the soonest hour lasts most of the year (and so is left out), the next one is used.',
  '<strong>The spring repeat in one line</strong> (decided 27 October, from your suggestion): “First sunrise at 06:00 or earlier: Tuesday March 23rd, and again after the clocks go forward, on Tuesday April 20th.” (D).',
  '<strong>Records a year back</strong> (decided 27 October): “The shortest day for a year.” (C), or “for more than a year”.',
  '<strong>Records the clocks make.</strong> Just after the clocks go back, sunrises are an hour earlier by the clock while they’re getting later each day, so “The earliest sunrise since September” would be the clocks’ doing. Records against the way the times are going are left out; “The latest sunrise since the clocks went back” stays, as the spec has it.',
  '<strong>Inside the summer weeks with no true night</strong> (decided 27 October): “True night returns on Sunday August 8th.” (G and J).',
  '<strong>Where it doesn’t even get very dark</strong> (you asked for more examples; K–N are new): this happens in 125 English postcode districts, north of about 54.6° N, from Middlesbrough and Appleby (three or four nights around the longest day) to Berwick (38 nights, June 2nd to July 9th 2027). Today says “It doesn’t get very dark tonight: dark from 22:58 to 03:22.” and Darkness “No true night tonight: at its darkest the sky is dark.” (your rule E wording with “dark” in place of “very dark”). Either side of those weeks, the very dark spell can start just after midnight: “Very dark from 00:01 to 02:09.” (M).',
  '<strong>Is it light at…? for times that never change:</strong> “It’s always dark at 01:00 here.”, “The sun is never up at 01:00 here.”, “The sun is always up at 12:00 here.” When the clocks end a run: “It’s light at 06:00 until the clocks go forward on Sunday March 28th.” and “… again from Sunday March 28th, when the clocks go forward.” And when today is the last day: “From tomorrow it’s light at 21:30.”, “Today is the last day the sun is up by 07:30.”',
  '<strong>Across the UK</strong> (decided 27 October): the two ends are whichever places on your short list (the 69 cities, plus Lerwick, Stornoway, Penzance, Dover and Lowestoft) have the earliest and latest sunset that day, and separately the least and most daylight, so they change with the season (see G: Dover to Stornoway). Penzance is at its postcode district centre, so its sunset today is 17:07:38 and shows as 17:08 (the spec had 17:07). For someone within about 15 miles of a place on the list, that place is left out, and if they are beyond both ends it says so: “…to 17:05 in Truro, and Penzance’s is later still, at 17:08.” (see I).',
  '<strong>A week either side with much the same daylight</strong> (less than a minute’s difference) would say “Daylight was much the same.” or “That’s much the same daylight.” It doesn’t happen in England, as the smallest weekly change is about 2m, so it’s there only as a safety net.',
  '<strong>Where the sun rises and sets</strong> has the compass directions only; the towns (“roughly over Bracknell”) come in stage 6. “On the longest day …” is left out when it would say the same as today.',
  '<strong>Records (decided 27 October):</strong> when “Today’s daylight matches …’s” shows, “The shortest day since …” (or “longest”) no longer shows with it, as they said the same thing.',
]

const groupsFor = (s: Scenario) => {
  const [latitude, longitude, name] = outcodes.outcodes[s.code]
  const ctx = makeContext({ latitude, longitude }, name, new Date(s.iso))
  return { name, ctx, groups: allGroups(ctx, s.times) }
}
const when = (s: Scenario) => {
  const now = new Date(s.iso)
  return `${longDate(ukParts(now).date, true)} at ${clock(now)}`
}

// Markdown, for the repo
const md: string[] = [
  '# Lightreader sentence sheet, Tuesday October 27th 2026',
  '',
  'Every sentence group in SPEC §6, as Lightreader works them out (PLAN stage 2), for 14',
  'days and places. Nothing here is made up: each is the real figure for that place and day.',
  'Places are postcode-district centres. "Is it light at…?" uses two times for each day,',
  'chosen to show the interesting cases. Made by `npm run sentence-sheet`.',
  '',
  '## For you to decide',
  '',
  ...DECISIONS.map((d, i) => `${i + 1}. ${d.replace(/<\/?strong>/g, '**')}`),
  '',
]
for (const [n, s] of SCENARIOS.entries()) {
  const { name, groups } = groupsFor(s)
  md.push(`## ${String.fromCharCode(65 + n)}. ${name} (${s.code}), ${when(s)}`, '', `*${s.why}*`, '')
  for (const g of groups) {
    if (!g.sentences.length) continue
    md.push(`**${g.heading}**`, '', ...g.sentences.map((x) => `- ${x}`), '')
  }
}
writeFileSync('design/sentence-sheet-2026-10-27.md', md.join('\n'))

// HTML, for the PDF
const out = process.argv[2]
if (out) {
  const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const template = readFileSync('.claude/skills/fresh-look/report-template.html', 'utf8')
  const head = template.slice(0, template.indexOf('</style>')) + `
.day{color:#5b5550;font-size:9.5pt;margin:0 0 6pt}
.group{break-inside:avoid;margin:0 0 6pt}
.group h3{margin:6pt 0 2pt}
</style></head><body>`
  const html: string[] = [
    head.replace('<title>PROJECT: fresh look</title>', '<title>Lightreader: sentence sheet</title>'),
    '<h1>Lightreader: the sentences</h1>',
    '<p class="sub">Stage 2, Tuesday October 27th 2026. Every sentence group in the spec, worked out by the code for 14 days and places.</p>',
    '<div class="note"><strong>Nothing here is made up.</strong> Each sentence is the real figure for that place and day, from Lightreader’s own calculation. Places are postcode-district centres. Each point is numbered so you can reply by number: 1–13 are the points (all decided on 27 October except 8, which has more examples, K–N); A–N are the examples.</div>',
    '<h2>For you to decide</h2>',
    ...DECISIONS.map((d, i) => `<div class="item"><p>${i + 1}. ${d}</p></div>`),
  ]
  for (const [n, s] of SCENARIOS.entries()) {
    const { name, groups } = groupsFor(s)
    html.push(`<h2>${String.fromCharCode(65 + n)}. ${esc(name)} (${s.code})</h2>`, `<p class="day">${esc(when(s))}: ${esc(s.why)}.</p>`)
    for (const g of groups) {
      if (!g.sentences.length) continue
      html.push(`<div class="group"><h3>${esc(g.heading)}</h3><ul>${g.sentences.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`)
    }
  }
  html.push('</body></html>')
  writeFileSync(out, html.join('\n'))
}
console.log('Wrote design/sentence-sheet-2026-10-27.md' + (out ? ` and ${out}` : ''))
