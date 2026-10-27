// The visitor's comparisons for Compare, kept on this device only, as "Is it light at…?"
// keeps its times (John, 28 October: "Saved on this device only"). Each is kept as typed
// ("Christmas", "14/7", "Aberdeen"), so a date such as Christmas always means the next one.
// A first visit starts with none. Blocked storage just means they last for this visit.

const KEY = 'lightreader.compare'
export const MAX_COMPARISONS = 6

export function savedComparisons(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(list) ? list.filter((t): t is string => typeof t === 'string' && t.trim() !== '').slice(0, MAX_COMPARISONS) : []
  } catch {
    return []
  }
}

export function saveComparisons(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // Not saved; they still work for this visit.
  }
}

/** A new comparison added at the end, unless it's already there (in any case). */
export function addComparison(list: string[], text: string): string[] {
  const tidy = text.trim().replace(/\s+/g, ' ')
  const label = tidy.charAt(0).toUpperCase() + tidy.slice(1)
  if (list.some((t) => t.toLowerCase() === label.toLowerCase())) return list
  return [...list, label].slice(0, MAX_COMPARISONS)
}
