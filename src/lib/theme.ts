import { useSyncExternalStore } from 'react'

// Light or dark mode (as Hindcaster's, HOUSE-STYLE §2; SPEC §4). Light unless the visitor
// switches; kept in this browser only, like the visitor's other choices. The small script in index.html reads the same key
// before the page draws, so a dark-mode visitor never sees a flash of the light page; a
// private window or blocked storage just gets light.
const KEY = 'lightreader.theme'
const listeners = new Set<() => void>()

let dark = document.documentElement.dataset.theme === 'dark'

export function setDark(value: boolean) {
  dark = value
  if (value) document.documentElement.dataset.theme = 'dark'
  else delete document.documentElement.dataset.theme
  try {
    if (value) localStorage.setItem(KEY, 'dark')
    else localStorage.removeItem(KEY)
  } catch {
    // Not kept; it still changes for this visit.
  }
  listeners.forEach((l) => l())
}

export function useDark(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => dark,
  )
}
