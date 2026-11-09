import * as A from 'astronomy-engine'
import fs from 'node:fs'
const lat = 51.4517, lon = -0.9698
const obs = new A.Observer(lat, lon, 0)
const MIN = 60000, DAY = 86400000
const R = Math.PI / 180
const hor = (body, d) => { const eq = A.Equator(body, d, obs, true, true); const h = A.Horizon(d, obs, eq.ra, eq.dec, 'normal'); return { alt: h.altitude, az: h.azimuth, ra: eq.ra, dec: eq.dec } }
const sunAlt = d => { const eq = A.Equator(A.Body.Sun, d, obs, true, true); return A.Horizon(d, obs, eq.ra, eq.dec).altitude }
const moonAlt = d => hor(A.Body.Moon, d).alt
const frac = d => A.Illumination(A.Body.Moon, d).phase_fraction
const lonHour = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const clock = d => d ? lonHour.format(new Date(Math.round(d.getTime() / MIN) * MIN)) : null
const isBST = u => { const p = lonHour.formatToParts(u); return (+p.find(x => x.type === 'hour').value - u.getUTCHours() + 24) % 24 === 1 }
// UK clock minute c after 00:00 on the (UTC-labelled) date -> instant
const at = (y, m, d, c) => { const u0 = Date.UTC(y, m, d, 0, c); return new Date(isBST(new Date(u0 - 60 * MIN)) ? u0 - 60 * MIN : u0) }
const ord = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th')
const WD = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], MO = ['January','February','March','April','May','June','July','August','September','October','November','December']
const label = (dt, wd = true) => (wd ? WD[dt.getUTCDay()] + ' ' : '') + MO[dt.getUTCMonth()] + ' ' + ord(dt.getUTCDate())
const COMP = ['north','north-north-east','north-east','east-north-east','east','east-south-east','south-east','south-south-east','south','south-south-west','south-west','west-south-west','west','west-north-west','north-west','north-north-west']
const comp = az => COMP[Math.round(az / 22.5) % 16]
const enc = v => String.fromCharCode(63 + Math.max(0, Math.min(48, Math.round(v))))

// ---- A: the year. Columns = nights from Nov 9 2026; rows = UK clock 15:00 to 09:00, every 10 min
const START = [2026, 10, 9], N = 365, C0 = 15 * 60, STEP = 10, ROWS = 109
const year = { sun: [], moon: [], nights: [], c0: C0, step: STEP, rows: ROWS }
for (let i = 0; i < N; i++) {
  const day = new Date(Date.UTC(START[0], START[1], START[2] + i))
  const [y, m, d] = [day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()]
  let s = '', mo = ''
  for (let k = 0; k < ROWS; k++) {
    const t = at(y, m, d, C0 + k * STEP)
    const sa = sunAlt(t)
    s += String.fromCharCode(48 + Math.max(0, Math.min(64, Math.round((30 - sa) / 0.75))))   // 0 = sun 30 deg up or more ... 64 = 18 deg below or more
    const ma = moonAlt(t), f = frac(t)
    const up = Math.max(0, Math.min(1, (ma + 1) / 9)); const sm = up * up * (3 - 2 * up)  // soft edge from -1 to 8 deg
    mo += enc(f * sm * 36)
  }
  year.sun.push(s); year.moon.push(mo)
  // the night's figures
  const noon = at(y, m, d, 12 * 60), end = new Date(noon.getTime() + DAY)
  const alt = (dir, a) => { const r = A.SearchAltitude(A.Body.Sun, obs, dir, noon, 1, a); return r && r.date < end ? r.date : null }
  const span = (a) => { const s0 = alt(-1, a), e0 = alt(1, a); if (!s0 || !e0 || e0 <= s0) return null
    let free = 0; for (let x = s0.getTime(); x < e0.getTime(); x += MIN) if (moonAlt(new Date(x + 30000)) <= -0.3) free++
    return { from: clock(s0), to: clock(e0), mins: Math.round((e0 - s0) / MIN), free } }
  const tn = span(-18), vd = tn ? null : span(-12)
  const ss = A.SearchRiseSet(A.Body.Sun, obs, -1, noon, 1), sr = A.SearchRiseSet(A.Body.Sun, obs, 1, ss.date, 1)
  const mid = new Date(noon.getTime() + DAY / 2)
  year.nights.push({ l: label(day), ls: label(day, false), mon: m, dom: d, yr: y, tn, vd, lit: Math.round(frac(mid) * 100), ss: clock(ss.date), sr: clock(sr.date) })
}
// moon quarters in the span, for small marks along the top
year.phases = []
let q = A.SearchMoonQuarter(new Date(Date.UTC(...START, 0)))
const last = Date.UTC(START[0], START[1], START[2] + N)
while (q.time.date.getTime() < last) { if (q.quarter % 2 === 0) year.phases.push({ k: q.quarter === 0 ? 'new' : 'full', x: (q.time.date.getTime() - Date.UTC(...START, 12)) / DAY }); q = A.NextMoonQuarter(q) }

// ---- B: three nights, every 5 min, clock 15:30 to 08:30
const PL = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']
const RULE = { sun: -6, alt: 15 }
function tonight(y, m, d, title) {
  const c0 = 15 * 60 + 30, step = 5, rows = 205
  const T = [], sun = [], moon = [], mf = [], pl = Object.fromEntries(PL.map(p => [p, []])), az = Object.fromEntries(['Sun', 'Moon', ...PL].map(p => [p, []])), tilt = [], lst = []
  for (let k = 0; k < rows; k++) { const t = at(y, m, d, c0 + k * step); T.push(t); sun.push(+sunAlt(t).toFixed(2)); moon.push(+moonAlt(t).toFixed(2)); mf.push(+frac(t).toFixed(3))
    for (const p of PL) { const h = hor(A.Body[p], t); pl[p].push(+h.alt.toFixed(2)); az[p].push(+h.az.toFixed(1)) }
    const hs = hor(A.Body.Sun, t), hm_ = hor(A.Body.Moon, t); az.Sun.push(+hs.az.toFixed(1)); az.Moon.push(+hm_.az.toFixed(1)); tilt.push(Math.round(limbTilt(t, hm_, hs))); lst.push(+((A.SiderealTime(t) * 15 + lon + 360) % 360).toFixed(3)) }
  const day = new Date(Date.UTC(y, m, d)), noon = at(y, m, d, 720), end = new Date(noon.getTime() + DAY)
  const ev = (dir, a) => { const r = a === undefined ? A.SearchRiseSet(A.Body.Sun, obs, dir, noon, 1) : A.SearchAltitude(A.Body.Sun, obs, dir, noon, 1, a); return r && r.date < end ? r.date : null }
  const sunset = ev(-1), dusk = ev(-1, -18), dawn = ev(1, -18), sunrise = ev(1), cdusk = ev(-1, -6), cdawn = ev(1, -6)
  let free = 0; for (let x = dusk.getTime(); x < dawn.getTime(); x += MIN) if (moonAlt(new Date(x + 30000)) <= -0.3) free++
  // bodies: when they meet the rule, and their highest point then
  const body = (name, b) => { let first = null, lastT = null, best = null
    for (let x = sunset.getTime(); x <= sunrise.getTime(); x += MIN) { const t = new Date(x); if (sunAlt(t) > RULE.sun) continue; const h = hor(b, t); if (h.alt < RULE.alt) continue
      if (!first) first = t; lastT = t; if (!best || h.alt > best.alt) best = { alt: h.alt, az: h.az, t } }
    const rise = A.SearchRiseSet(b, obs, 1, noon, 1), set = A.SearchRiseSet(b, obs, -1, noon, 1)
    const out = { name, rise: rise && rise.date < end ? clock(rise.date) : null, set: set && set.date < end ? clock(set.date) : null }
    if (name !== 'Moon') out.mag = +A.Illumination(b, dusk).mag.toFixed(1)
    if (first) Object.assign(out, { from: clock(first), to: clock(lastT), high: Math.round(best.alt), dir: comp(best.az), at: clock(best.t), atMs: best.t.getTime() })
    return out }
  const bodies = PL.map(p => body(p, A.Body[p]))
  const moonB = body('Moon', A.Body.Moon)
  // the Moon's look: lit fraction and the tilt of its bright limb from "up", at its highest in the night, else at start of true night
  let when = dusk, bestAlt = -99
  for (let x = dusk.getTime(); x <= dawn.getTime(); x += 5 * MIN) { const a = moonAlt(new Date(x)); if (a > bestAlt) { bestAlt = a; when = new Date(x) } }
  if (bestAlt < 0) when = dusk
  const mm = hor(A.Body.Moon, when), su = hor(A.Body.Sun, when)
  const am = mm.ra * 15 * R, dm = mm.dec * R, as = su.ra * 15 * R, dsn = su.dec * R
  const chi = Math.atan2(Math.cos(dsn) * Math.sin(as - am), Math.sin(dsn) * Math.cos(dm) - Math.cos(dsn) * Math.sin(dm) * Math.cos(as - am))
  const H = (A.SiderealTime(when) * 15 + lon) * R - am
  const qq = Math.atan2(Math.sin(H), Math.tan(lat * R) * Math.cos(dm) - Math.sin(dm) * Math.cos(H))
  const ph = A.MoonPhase(when)
  const names = ['New Moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full Moon', 'Waning gibbous', 'Last quarter', 'Waning crescent']
  return { az, tilt, lst, title, date: label(day), next: label(new Date(day.getTime() + DAY)), c0, step, rows, t0: T[0].getTime(), sun, moon, mf, pl, bodies, moonB,
    sunset: clock(sunset), sunrise: clock(sunrise), dusk: clock(dusk), dawn: clock(dawn), cdusk: clock(cdusk), cdawn: clock(cdawn),
    ms: { sunset: sunset.getTime(), sunrise: sunrise.getTime(), dusk: dusk.getTime(), dawn: dawn.getTime() },
    dark: Math.round((dawn - dusk) / MIN), free,
    look: { frac: +frac(when).toFixed(3), tilt: +(((chi - qq) / R + 540) % 360 - 180).toFixed(1), up: bestAlt > 0, at: clock(when), name: names[Math.floor(((ph + 22.5) % 360) / 45)], lit: Math.round(frac(when) * 100) } }
}
function limbTilt(when, mm, su) { const am = mm.ra * 15 * R, dm = mm.dec * R, as = su.ra * 15 * R, dsn = su.dec * R
  const chi = Math.atan2(Math.cos(dsn) * Math.sin(as - am), Math.sin(dsn) * Math.cos(dm) - Math.cos(dsn) * Math.sin(dm) * Math.cos(as - am))
  const H = (A.SiderealTime(when) * 15 + lon) * R - am, qq = Math.atan2(Math.sin(H), Math.tan(lat * R) * Math.cos(dm) - Math.sin(dm) * Math.cos(H))
  return ((chi - qq) / R + 540) % 360 - 180 }
const nights = [tonight(2026, 10, 9, 'Tonight'), tonight(2026, 10, 17, 'First quarter'), tonight(2026, 10, 24, 'Full Moon')]
// stars: d3-celestial's files (XHIP / Hipparcos, J2000), turned to the equator of date
const ST = new URL('./stars/', import.meta.url).pathname, epoch = new Date(Date.UTC(2026, 10, 9, 21))
const ofDate = (raDeg, dec) => { A.DefineStar(A.Body.Star1, ((raDeg + 360) % 360) / 15, dec, 1000); const e = A.Equator(A.Body.Star1, epoch, obs, true, false); return [+(e.ra * 15).toFixed(2), +e.dec.toFixed(2)] }
const names = JSON.parse(fs.readFileSync(ST + 'd3c-starnames.json', 'utf8'))
const stars = JSON.parse(fs.readFileSync(ST + 'd3c-stars.6.json', 'utf8')).features.filter(f => f.properties.mag <= 4.7 && f.geometry.coordinates[1] > -38)
  .map(f => { const [ra, dec] = ofDate(...f.geometry.coordinates); const o = [ra, dec, f.properties.mag, +(+f.properties.bv || 0.6).toFixed(2)]; if (f.properties.mag < 1.6 && names[f.id] && names[f.id].name) o.push(names[f.id].name); return o })
const lines = []
for (const f of JSON.parse(fs.readFileSync(ST + 'd3c-constellations.lines.json', 'utf8')).features) for (const seg of f.geometry.coordinates) { if (seg.every(c => c[1] < -38)) continue; lines.push(seg.map(c => ofDate(c[0], c[1]))) }
// towns round Reading, from Lightreader's list (OS Open Names)
const TW = JSON.parse(fs.readFileSync(new URL('../../src/data/towns.json', import.meta.url), 'utf8'))
const towns = TW.places.map(([name, la, lo, big]) => { const p1 = lat * R, p2 = la * R, dl = (lo - lon) * R
  const d = 2 * Math.asin(Math.sqrt(Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2)) * 3958.8
  const b = (Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) / R + 360) % 360
  return [name, +b.toFixed(1), +d.toFixed(1), big] }).filter(t => t[2] >= 3 && t[2] <= 25 && t[0] !== 'Reading')
console.log('stars', stars.length, 'named', stars.filter(s => s[4]).map(s => s[4]).join(', '), '| lines', lines.length, '| towns', towns.length, towns.filter(t => t[3]).length)
fs.writeFileSync(new URL('./data.json', import.meta.url), JSON.stringify({ place: 'Reading (RG1)', lat, rule: RULE, year, nights, stars, lines, towns }))
for (const n of nights) { console.log(n.title, n.date, '| dark', n.dusk, n.dawn, n.dark, 'free', n.free, '| look', JSON.stringify(n.look)); console.log(' moon', JSON.stringify(n.moonB)); for (const b of n.bodies) console.log(' ', JSON.stringify(b)) }
const y = year.nights; console.log(JSON.stringify(y[0]), JSON.stringify(y[200]), JSON.stringify(y[226]))
console.log('phases', year.phases.length, 'size', fs.statSync('data.json').size)
