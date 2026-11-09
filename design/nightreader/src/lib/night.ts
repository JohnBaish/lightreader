// The night's figures for a place (SPEC §3 to §6), worked out with Astronomy Engine on the
// device. Built on Lightreader's sun.ts: a night belongs to the UK day it starts on, and runs
// from that day's sunset to the next day's sunrise.

import {
  AngleFromSun, Body, Equator, Horizon, Illumination, MoonPhase, Observer, SearchRiseSet, SiderealTime,
} from 'astronomy-engine'
import { dayFigures, sunPosition, type DayFigures, type Place } from './sun.ts'
import { addDays } from './ukTime.ts'

const MINUTE = 60_000
const DAY_MS = 86_400_000
const RAD = Math.PI / 180
const observer = (place: Place) => new Observer(place.latitude, place.longitude, 0)

/** Where a body is: degrees above the horizon (as seen, with refraction) and clockwise from north. */
export function position(place: Place, body: Body, at: Date): { altitude: number; azimuth: number; ra: number; dec: number } {
  const obs = observer(place)
  const eq = Equator(body, at, obs, true, true)
  const hor = Horizon(at, obs, eq.ra, eq.dec, 'normal')
  return { altitude: hor.altitude, azimuth: hor.azimuth, ra: eq.ra, dec: eq.dec }
}

// ---------- how dark the night gets (SPEC §3) ----------

/** The darkest kind of sky a night reaches, in Lightreader's words, and when it lasts. */
export type DarkKind = 'true night' | 'very dark' | 'dark'
export type Darkest = { kind: DarkKind; from: Date; to: Date }

/** The darkest stretch of the night that starts on `evening`'s date: true night if the Sun gets
 *  18° below the horizon, otherwise "very dark" (12°), otherwise "dark" (6°), otherwise null
 *  (half-light all night, in the far north around midsummer). */
export function darkest(evening: DayFigures, morning: DayFigures): Darkest | null {
  const tries: [DarkKind, Date | null, Date | null][] = [
    ['true night', evening.astronomicalDusk, morning.astronomicalDawn],
    ['very dark', evening.nauticalDusk, morning.nauticalDawn],
    ['dark', evening.civilDusk, morning.civilDawn],
  ]
  for (const [kind, from, to] of tries) if (from && to && to > from) return { kind, from, to }
  return null
}

// ---------- the Moon ----------

export type Span = { from: Date; to: Date }

/** The stretches between `from` and `to` when the Moon is up (its top edge above the horizon,
 *  as moonrise and moonset are defined). */
export function moonUp(place: Place, from: Date, to: Date): Span[] {
  const obs = observer(place)
  const days = (to.getTime() - from.getTime()) / DAY_MS
  const events: { at: Date; rise: boolean }[] = []
  for (const direction of [1, -1] as const) {
    let start = from
    for (;;) {
      const found = SearchRiseSet(Body.Moon, obs, direction, start, days)
      if (!found || found.date >= to) break
      events.push({ at: found.date, rise: direction === 1 })
      start = new Date(found.date.getTime() + MINUTE)
    }
  }
  events.sort((a, b) => a.at.getTime() - b.at.getTime())
  // Up at the start? The next event says so; with none, its height does.
  let up = events.length ? !events[0].rise : position(place, Body.Moon, from).altitude > 0
  const spans: Span[] = []
  let since = from
  for (const e of events) {
    if (up) spans.push({ from: since, to: e.at })
    up = e.rise
    since = e.at
  }
  if (up) spans.push({ from: since, to })
  return spans
}

const PHASES = ['New Moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full Moon', 'Waning gibbous', 'Last quarter', 'Waning crescent']

/** The Moon as it looks from `place` at `at`: how much is lit, the phase's name, and which way
 *  its bright edge points (degrees from straight up, positive towards the left, as on the sky). */
export function moonLook(place: Place, at: Date): { lit: number; phase: string; tilt: number; altitude: number; azimuth: number } {
  const moon = position(place, Body.Moon, at)
  const sun = position(place, Body.Sun, at)
  const am = moon.ra * 15 * RAD, dm = moon.dec * RAD, as = sun.ra * 15 * RAD, ds = sun.dec * RAD
  const brightLimb = Math.atan2(Math.cos(ds) * Math.sin(as - am), Math.sin(ds) * Math.cos(dm) - Math.cos(ds) * Math.sin(dm) * Math.cos(as - am))
  const hourAngle = (SiderealTime(at) * 15 + place.longitude) * RAD - am
  const parallactic = Math.atan2(Math.sin(hourAngle), Math.tan(place.latitude * RAD) * Math.cos(dm) - Math.sin(dm) * Math.cos(hourAngle))
  return {
    lit: Illumination(Body.Moon, at).phase_fraction,
    phase: PHASES[Math.floor(((MoonPhase(at) + 22.5) % 360) / 45)],
    tilt: (((brightLimb - parallactic) / RAD + 540) % 360) - 180,
    altitude: moon.altitude,
    azimuth: moon.azimuth,
  }
}

// ---------- one night ----------

export type Night = {
  /** The UK date the night starts on. */
  date: string
  sunset: Date | null
  sunrise: Date | null
  /** The darkest stretch, or null when it's half-light all night. */
  darkest: Darkest | null
  /** How long that stretch is, and how much of it has no Moon, in milliseconds. */
  darkMs: number
  moonFreeMs: number
  /** When the Moon is up between sunset and sunrise. */
  moonUp: Span[]
  /** The Moon's lit share (0 to 1) in the middle of the night. */
  moonLit: number
}

const overlap = (a: Span, b: Span) => Math.max(0, Math.min(a.to.getTime(), b.to.getTime()) - Math.max(a.from.getTime(), b.from.getTime()))

/** The night that starts on `date`. `evening` and `morning` are that day's and the next day's
 *  sun figures, when already worked out. */
export function night(place: Place, date: string, evening = dayFigures(place, date), morning = dayFigures(place, addDays(date, 1), evening.midnight)): Night {
  const dark = darkest(evening, morning)
  const from = evening.sunset ?? evening.noon, to = morning.sunrise ?? morning.noon
  const up = moonUp(place, from, to)
  const darkMs = dark ? dark.to.getTime() - dark.from.getTime() : 0
  const moonlit = dark ? up.reduce((sum, span) => sum + overlap(span, dark), 0) : 0
  return {
    date, sunset: evening.sunset, sunrise: morning.sunrise, darkest: dark, darkMs, moonFreeMs: darkMs - moonlit, moonUp: up,
    moonLit: Illumination(Body.Moon, evening.midnight).phase_fraction,
  }
}

/** Every night from `from` for `count` nights. */
export function nights(place: Place, from: string, count: number): Night[] {
  const out: Night[] = []
  let evening = dayFigures(place, from)
  for (let i = 0, date = from; i < count; i++, date = addDays(date, 1)) {
    const morning = dayFigures(place, addDays(date, 1), evening.midnight)
    out.push(night(place, date, evening, morning))
    evening = morning
  }
  return out
}

// ---------- the planets, and whether they're in view (SPEC §5) ----------

export const PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'] as const
export type PlanetName = (typeof PLANETS)[number]

/** "Well placed" from this many degrees up; "low" from LOW up to it; below LOW, not in view. */
export const WELL = 20
export const LOW = 10

/** How far below the horizon the Sun must be for a body of this brightness to show (lower
 *  magnitudes are brighter): Venus in bright half-light, faint ones only once it's dark. */
export function sunDepthNeeded(magnitude: number): number {
  if (magnitude <= -3) return 3
  if (magnitude <= -1) return 4.5
  if (magnitude <= 1.5) return 6
  return 9
}

export type Level = 'well' | 'low'
export type InView = {
  name: PlanetName | 'Moon'
  magnitude: number | null
  /** Degrees from the Sun (for "too close to the Sun"). */
  fromSun: number
  /** The best level reached tonight, or null if it's never in view. */
  level: Level | null
  /** When it's in view at all (low or well), and when it's well placed. */
  inView: Span[]
  wellPlaced: Span[]
  /** Its highest point while in view. */
  best: { at: Date; altitude: number; azimuth: number } | null
  /** Why not, when it's never in view. */
  why: 'too close to the Sun' | 'too low while the sky is dark' | 'below the horizon all night' | null
}

/** One body through the night from `from` (sunset) to `to` (sunrise), minute by minute. */
export function inView(place: Place, name: PlanetName | 'Moon', from: Date, to: Date): InView {
  const body = Body[name]
  const middle = new Date((from.getTime() + to.getTime()) / 2)
  const magnitude = name === 'Moon' ? null : Illumination(body, middle).mag
  const depth = name === 'Moon' ? 0.833 : sunDepthNeeded(magnitude!)
  const seen: Span[] = [], well: Span[] = []
  let best: InView['best'] = null
  let everUp = false
  let openSeen: Date | null = null, openWell: Date | null = null
  const start = Math.ceil(from.getTime() / MINUTE) * MINUTE
  for (let t = start; t <= to.getTime() + MINUTE; t += MINUTE) {
    const at = new Date(t)
    const inside = t <= to.getTime()
    const p = inside ? position(place, body, at) : null
    if (p && p.altitude > 0) everUp = true
    const darkEnough = inside && sunPosition(place, at).altitude <= -depth
    const low = !!p && darkEnough && p.altitude >= LOW
    const high = low && p!.altitude >= WELL
    if (low && !openSeen) openSeen = at
    if (!low && openSeen) { seen.push({ from: openSeen, to: new Date(t - MINUTE) }); openSeen = null }
    if (high && !openWell) openWell = at
    if (!high && openWell) { well.push({ from: openWell, to: new Date(t - MINUTE) }); openWell = null }
    if (low && (!best || p!.altitude > best.altitude)) best = { at, altitude: p!.altitude, azimuth: p!.azimuth }
  }
  const fromSun = AngleFromSun(body, middle)
  const level: Level | null = well.length ? 'well' : seen.length ? 'low' : null
  const why = level ? null : !everUp ? 'below the horizon all night' : fromSun < 15 ? 'too close to the Sun' : 'too low while the sky is dark'
  return { name, magnitude, fromSun, level, inView: seen, wellPlaced: well, best, why }
}

/** The Moon and the five planets through the night that starts on `date`. */
export function sky(place: Place, date: string): InView[] {
  const evening = dayFigures(place, date), morning = dayFigures(place, addDays(date, 1), evening.midnight)
  const from = evening.sunset ?? evening.noon, to = morning.sunrise ?? morning.noon
  return (['Moon', ...PLANETS] as const).map((name) => inView(place, name, from, to))
}

/** Height in fists held at arm's length (about 10° each), to the nearest half. */
export const fists = (altitude: number): number => Math.round(altitude / 5) / 2
