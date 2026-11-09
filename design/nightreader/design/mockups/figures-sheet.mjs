import * as A from 'astronomy-engine'
const place = { lat: 51.4517, lon: -0.9698 } // RG1 district centre, as Lightreader
const obs = new A.Observer(place.lat, place.lon, 0)
const DAY = 86400000
const fmtT = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const fmtD = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
const fmtDs = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', month: 'short', day: 'numeric', year: 'numeric' })
const t = d => d ? fmtT.format(new Date(d.getTime() + 30000 - ((d.getTime()+30000) % 60000))) : 'none'
const dd = d => fmtD.format(d), ds = d => fmtDs.format(d)
const dur = ms => { const m = Math.round(ms / 60000); return `${Math.floor(m / 60)}h ${m % 60}m` }
const COMP = ['north','north-north-east','north-east','east-north-east','east','east-south-east','south-east','south-south-east','south','south-south-west','south-west','west-south-west','west','west-north-west','north-west','north-north-west']
const comp = az => COMP[Math.round(az / 22.5) % 16]
const pos = (body, d) => { const eq = A.Equator(body, d, obs, true, true); const h = A.Horizon(d, obs, eq.ra, eq.dec, 'normal'); return { alt: h.altitude, az: h.azimuth, eq } }
const sunAlt = d => { const eq = A.Equator(A.Body.Sun, d, obs, true, true); return A.Horizon(d, obs, eq.ra, eq.dec).altitude }
const moonUp = d => pos(A.Body.Moon, d).alt > -0.3  // roughly: top of disc on the horizon, refraction included

// A night: from local noon (12:00 UTC is near enough for Reading) to the next.
function night(noonUTC) {
  const end = new Date(noonUTC.getTime() + DAY)
  const sr = (dir, alt) => { const r = alt === undefined ? A.SearchRiseSet(A.Body.Sun, obs, dir, noonUTC, 1) : A.SearchAltitude(A.Body.Sun, obs, dir, noonUTC, 1, alt); return r && r.date < end ? r.date : null }
  const sunset = sr(-1), dusk = sr(-1, -18), dawn = sr(1, -18), sunrise = sr(1)
  let dark = 0, moonFree = 0
  if (dusk && dawn && dawn > dusk) {
    dark = dawn - dusk
    for (let x = dusk.getTime(); x < dawn.getTime(); x += 60000) if (!moonUp(new Date(x + 30000))) moonFree += 60000
  }
  return { sunset, dusk, dawn, sunrise, dark, moonFree }
}

const noon = new Date(Date.UTC(2026, 10, 9, 12))
const n = night(noon), end = new Date(noon.getTime() + DAY)
console.log('# TONIGHT:', dd(noon), 'into', dd(end))
console.log(`Sunset ${t(n.sunset)}; true night ${t(n.dusk)} to ${t(n.dawn)} (${dur(n.dark)}); sunrise ${t(n.sunrise)}`)
// Moon
const ph = A.MoonPhase(n.dusk), ill = A.Illumination(A.Body.Moon, n.dusk)
const names = ['New Moon','Waxing crescent','First quarter','Waxing gibbous','Full Moon','Waning gibbous','Last quarter','Waning crescent']
console.log(`Moon: phase angle ${ph.toFixed(1)} deg (${names[Math.floor(((ph + 22.5) % 360) / 45)]}), ${(ill.phase_fraction * 100).toFixed(0)}% lit at start of true night`)
const mr = A.SearchRiseSet(A.Body.Moon, obs, 1, noon, 1), ms = A.SearchRiseSet(A.Body.Moon, obs, -1, noon, 1)
console.log(`Moonrise ${mr ? t(mr.date) + ' (' + comp(pos(A.Body.Moon, mr.date).az) + ')' : 'none'}; moonset ${ms ? t(ms.date) + ' (' + comp(pos(A.Body.Moon, ms.date).az) + ')' : 'none'}  [noon to noon]`)
console.log(`Moon-free true night: ${dur(n.moonFree)} of ${dur(n.dark)}`)
// Planets: draft rule = sun at least 6 deg below, planet at least 10 deg up
console.log('\n## Planets tonight (draft rule: sun 6+ deg below horizon, planet 10+ deg up)')
for (const b of ['Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune']) {
  const body = A.Body[b]; let first = null, last = null, best = null
  for (let x = n.sunset.getTime(); x <= n.sunrise.getTime(); x += 60000) {
    const d = new Date(x); if (sunAlt(d) > -6) continue
    const p = pos(body, d); if (p.alt < 10) continue
    if (!first) first = d; last = d; if (!best || p.alt > best.alt) best = { ...p, d }
  }
  const rise = A.SearchRiseSet(body, obs, 1, noon, 1), set = A.SearchRiseSet(body, obs, -1, noon, 1)
  const il = A.Illumination(body, n.dusk), eq = A.Equator(body, n.dusk, obs, false, true), con = A.Constellation(eq.ra, eq.dec).name
  const elong = A.AngleFromSun(body, n.dusk)
  console.log(`${b}: mag ${il.mag.toFixed(1)}, in ${con}, ${elong.toFixed(0)} deg from the Sun; rises ${rise ? t(rise.date) : 'none'}, sets ${set ? t(set.date) : 'none'}; ` +
    (first ? `meets rule ${t(first)} to ${t(last)}; highest ${best.alt.toFixed(0)} deg in the ${comp(best.az)} at ${t(best.d)}` : 'does not meet the rule tonight'))
}

console.log('\n# LOOKING AHEAD')
let q = A.SearchMoonQuarter(noon); const qn = ['New Moon','First quarter','Full Moon','Last quarter']
for (let i = 0; i < 8; i++) { console.log(`${qn[q.quarter]}: ${dd(q.time.date)} ${t(q.time.date)}`); q = A.NextMoonQuarter(q) }
console.log('\n## Lunar eclipses (next 4), with the Moon\'s height at Reading at the peak')
let le = A.SearchLunarEclipse(noon)
for (let i = 0; i < 4; i++) { const p = pos(A.Body.Moon, le.peak.date); console.log(`${le.kind}: peak ${dd(le.peak.date)} ${t(le.peak.date)}; Moon ${p.alt.toFixed(0)} deg ${p.alt > 0 ? 'above' : 'below'} horizon; obscuration ${(le.obscuration*100).toFixed(0)}%; sun alt ${sunAlt(le.peak.date).toFixed(0)}`); le = A.NextLunarEclipse(le.peak) }
console.log('\n## Solar eclipses seen from Reading (next 3)')
let se = A.SearchLocalSolarEclipse(noon, obs)
for (let i = 0; i < 3; i++) { console.log(`${se.kind}: peak ${dd(se.peak.time.date)} ${t(se.peak.time.date)}, sun ${se.peak.altitude.toFixed(0)} deg up at peak, ${(se.obscuration*100).toFixed(0)}% of the disc covered; starts ${t(se.partial_begin.time.date)} (alt ${se.partial_begin.altitude.toFixed(0)}), ends ${t(se.partial_end.time.date)} (alt ${se.partial_end.altitude.toFixed(0)})`); se = A.NextLocalSolarEclipse(se.peak.time, obs) }
console.log('\n## Oppositions (planet opposite the Sun, at its brightest, up all night)')
for (const b of ['Mars','Jupiter','Saturn']) { const o = A.SearchRelativeLongitude(A.Body[b], 0, noon); console.log(`${b}: ${dd(o.date)}, mag ${A.Illumination(A.Body[b], o).mag.toFixed(1)}`) }
console.log('\n## Greatest elongations')
for (const b of ['Mercury','Venus']) { let e = A.SearchMaxElongation(A.Body[b], noon); for (let i = 0; i < (b === 'Mercury' ? 4 : 2); i++) { console.log(`${b}: ${dd(e.time.date)}, ${e.elongation.toFixed(1)} deg, ${e.visibility} sky`); e = A.SearchMaxElongation(A.Body[b], e.time.AddDays(1)) } }

console.log('\n# THE YEAR: true night and Moon-free true night, Reading, nights starting Nov 9 2026 to Nov 8 2027')
const rows = []
for (let i = 0; i < 365; i++) { const d = new Date(noon.getTime() + i * DAY); rows.push({ d, ...night(d) }) }
const byMonth = new Map()
for (const r of rows) { const k = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(r.d); if (!byMonth.has(k)) byMonth.set(k, []); byMonth.get(k).push(r) }
console.log('Month | nights | avg true night | avg Moon-free | nights wholly Moon-free | nights with none Moon-free (but some true night) | nights with no true night')
for (const [k, v] of byMonth) { const avg = f => v.reduce((s, r) => s + f(r), 0) / v.length
  console.log(`${k} | ${v.length} | ${dur(avg(r => r.dark))} | ${dur(avg(r => r.moonFree))} | ${v.filter(r => r.dark > 0 && r.moonFree >= r.dark - 60000).length} | ${v.filter(r => r.dark > 0 && r.moonFree === 0).length} | ${v.filter(r => r.dark === 0).length}`) }
const none = rows.filter(r => r.dark === 0)
console.log(`No true night: ${none.length} nights, ${ds(none[0].d)} to ${ds(none[none.length - 1].d)}`)
const top = [...rows].sort((a, b) => b.moonFree - a.moonFree).slice(0, 5)
console.log('Most Moon-free true night:', top.map(r => `${ds(r.d)} ${dur(r.moonFree)}`).join('; '))
const tot = rows.reduce((s, r) => s + r.dark, 0), mf = rows.reduce((s, r) => s + r.moonFree, 0)
console.log(`Year total true night ${Math.round(tot / 3600000)} h; Moon-free ${Math.round(mf / 3600000)} h (${(mf / tot * 100).toFixed(0)}%)`)
console.log('\nNext 14 nights: date | true night | Moon % lit | Moon-free true night')
for (const r of rows.slice(0, 14)) console.log(`${ds(r.d)} | ${t(r.dusk)}-${t(r.dawn)} | ${(A.Illumination(A.Body.Moon, r.dusk).phase_fraction * 100).toFixed(0)}% | ${dur(r.moonFree)}`)
