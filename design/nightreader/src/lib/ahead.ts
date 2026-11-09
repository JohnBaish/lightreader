// Looking ahead (SPEC §7): the Moon's phases, eclipses, the planets at their best, and meteor
// showers, each worked out for the place.

import {
  Body, Illumination, NextLocalSolarEclipse, NextLunarEclipse, NextMoonQuarter, Observer, SearchLocalSolarEclipse,
  SearchLunarEclipse, SearchMaxElongation, SearchMoonQuarter, SearchRelativeLongitude, SearchSunLongitude,
} from 'astronomy-engine'
import { night, position, type Night } from './night.ts'
import type { Place } from './sun.ts'
import { ukParts } from './ukTime.ts'

const QUARTERS = ['New Moon', 'First quarter', 'Full Moon', 'Last quarter']

export function moonPhases(from: Date, count: number): { phase: string; at: Date }[] {
  const out = []
  let q = SearchMoonQuarter(from)
  for (let i = 0; i < count; i++) { out.push({ phase: QUARTERS[q.quarter], at: q.time.date }); q = NextMoonQuarter(q) }
  return out
}

/** Eclipses of the Moon with the Moon above the horizon at the peak. Faint ("penumbral") ones,
 *  which only dim the Moon slightly and are hard to notice, are left out (John, November 9th 2026). */
export function lunarEclipses(place: Place, from: Date, count: number): { kind: string; peak: Date; covered: number; altitude: number }[] {
  const out = []
  let e = SearchLunarEclipse(from)
  for (let tries = 0; out.length < count && tries < 40; tries++) {
    const altitude = position(place, Body.Moon, e.peak.date).altitude
    if (altitude > 0 && e.kind !== 'penumbral') out.push({ kind: e.kind, peak: e.peak.date, covered: e.obscuration, altitude })
    e = NextLunarEclipse(e.peak)
  }
  return out
}

/** Eclipses of the Sun seen from the place, with the Sun up at the peak. */
export function solarEclipses(place: Place, from: Date, count: number): { kind: string; begin: Date; peak: Date; end: Date; covered: number; altitude: number }[] {
  const obs = new Observer(place.latitude, place.longitude, 0)
  const out = []
  let e = SearchLocalSolarEclipse(from, obs)
  for (let tries = 0; out.length < count && tries < 40; tries++) {
    if (e.peak.altitude > 0) out.push({ kind: e.kind, begin: e.partial_begin.time.date, peak: e.peak.time.date, end: e.partial_end.time.date, covered: e.obscuration, altitude: e.peak.altitude })
    e = NextLocalSolarEclipse(e.peak.time, obs)
  }
  return out
}

/** Mars, Jupiter and Saturn opposite the Sun: at their brightest and up all night. */
export function oppositions(from: Date): { name: string; at: Date; magnitude: number }[] {
  return (['Mars', 'Jupiter', 'Saturn'] as const)
    .map((name) => { const t = SearchRelativeLongitude(Body[name], 0, from); return { name, at: t.date, magnitude: Illumination(Body[name], t).mag } })
    .sort((a, b) => a.at.getTime() - b.at.getTime())
}

/** Mercury and Venus at their furthest from the Sun: the best mornings or evenings for them. */
export function elongations(from: Date, until: Date): { name: string; at: Date; degrees: number; sky: 'morning' | 'evening' }[] {
  const out = []
  for (const name of ['Mercury', 'Venus'] as const) {
    let e = SearchMaxElongation(Body[name], from)
    while (e.time.date < until) { out.push({ name, at: e.time.date, degrees: e.elongation, sky: e.visibility as 'morning' | 'evening' }); e = SearchMaxElongation(Body[name], e.time.AddDays(1)) }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime())
}

/** The main meteor showers: the point on the Sun's yearly path (its longitude, degrees) where
 *  each peaks, and the most an observer might count in an hour under perfect skies.
 *  TO CHECK against the International Meteor Organization's current calendar before launch:
 *  only the Quadrantids' figure was confirmed (November 9th 2026); the rest are from memory. */
export const SHOWERS: { name: string; sunLongitude: number; perHour: number }[] = [
  { name: 'Quadrantids', sunLongitude: 283.15, perHour: 110 },
  { name: 'Lyrids', sunLongitude: 32.32, perHour: 18 },
  { name: 'Eta Aquariids', sunLongitude: 45.5, perHour: 50 },
  { name: 'Perseids', sunLongitude: 140.0, perHour: 100 },
  { name: 'Orionids', sunLongitude: 208, perHour: 20 },
  { name: 'Leonids', sunLongitude: 235.27, perHour: 15 },
  { name: 'Geminids', sunLongitude: 262.2, perHour: 150 },
  { name: 'Ursids', sunLongitude: 270.7, perHour: 10 },
]

/** Each shower's next peak, and the night nearest it at the place (the night before a peak that
 *  falls before UK midday, otherwise the night that follows). */
export function meteorShowers(place: Place, from: Date): { name: string; perHour: number; peak: Date; night: Night }[] {
  return SHOWERS.map((s) => {
    const peak = SearchSunLongitude(s.sunLongitude, from, 370)!.date
    const uk = ukParts(peak)
    const date = uk.hour < 12 ? new Date(Date.parse(uk.date + 'T00:00:00Z') - 86_400_000).toISOString().slice(0, 10) : uk.date
    return { name: s.name, perHour: s.perHour, peak, night: night(place, date) }
  }).sort((a, b) => a.peak.getTime() - b.peak.getTime())
}
