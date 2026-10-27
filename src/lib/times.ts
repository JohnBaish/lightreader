// The visitor's times for "Is it light at…?", kept on this device only (SPEC §6): "Saved
// on this device only". A first visit starts with the spec's two examples, 07:30 and 17:30
// (a draft, for John). Blocked storage just means the times last for this visit.

const KEY = 'lightreader.times'
export const FIRST_TIMES = ['07:30', '17:30']
export const MAX_TIMES = 6

const valid = (t: unknown): t is string => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t)

export function savedTimes(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return FIRST_TIMES
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list.filter(valid).slice(0, MAX_TIMES) : FIRST_TIMES
  } catch {
    return FIRST_TIMES
  }
}

export function saveTimes(times: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(times))
  } catch {
    // Not saved; they still work for this visit.
  }
}

/** Sorted and without repeats. */
export const tidyTimes = (times: string[]) => [...new Set(times)].sort()
