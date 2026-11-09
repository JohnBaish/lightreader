// Meteor showers: each peaks when the Sun reaches a fixed point on its yearly path (its "solar longitude"),
// so the date and time for any year can be worked out. The longitudes, rates and radiants below are from
// memory of the International Meteor Organization's working list: TO CHECK against its current calendar.
import * as A from 'astronomy-engine'
const lat = 51.4517, lon = -0.9698, obs = new A.Observer(lat, lon, 0), MIN = 60000, DAY = 86400000
const SHOWERS = [['Quadrantids', 283.15, 110], ['Lyrids', 32.32, 18], ['Eta Aquariids', 45.5, 50], ['Perseids', 140.0, 100], ['Orionids', 208, 20], ['Leonids', 235.27, 15], ['Geminids', 262.2, 150], ['Ursids', 270.7, 10]]
const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const moonAlt = d => { const e = A.Equator(A.Body.Moon, d, obs, true, true); return A.Horizon(d, obs, e.ra, e.dec, 'normal').altitude }
const hm = m => `${Math.floor(m / 60)}h ${m % 60}m`
const start = new Date(Date.UTC(2026, 10, 9, 12)), out = []
for (const [name, sl, zhr] of SHOWERS) { const pk = A.SearchSunLongitude(sl, start, 370).date
  // the night nearest the peak: from the noon before it if the peak is after midnight-ish, else that day's noon
  const noon = new Date(Date.UTC(pk.getUTCFullYear(), pk.getUTCMonth(), pk.getUTCDate() - (pk.getUTCHours() < 12 ? 1 : 0), 12))
  const dusk = A.SearchAltitude(A.Body.Sun, obs, -1, noon, 1, -18), dawn = dusk && A.SearchAltitude(A.Body.Sun, obs, 1, dusk.date, 1, -18)
  let dark = 0, free = 0; if (dusk && dawn && dawn.date - noon < DAY) for (let x = dusk.date.getTime(); x < dawn.date.getTime(); x += MIN) { dark++; if (moonAlt(new Date(x + 30000)) <= -0.3) free++ }
  out.push([pk, `${name} (about ${zhr} an hour at best, under perfect skies): peak ${f.format(pk)}; that night ${dark ? `true night ${hm(dark)}, Moon-free ${hm(free)}` : 'no true night'}; Moon ${Math.round(A.Illumination(A.Body.Moon, pk).phase_fraction * 100)}% lit`]) }
out.sort((a, b) => a[0] - b[0]).forEach(o => console.log(o[1]))
