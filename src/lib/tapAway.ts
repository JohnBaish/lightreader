import { useEffect, type RefObject } from 'react'

// A chart's chosen line goes again when the visitor clicks or taps anywhere outside the chart (John, November 9th 2026, as
// in Refueller and Riverwatcher). Here it listens for a click rather than the first touch, so scrolling the page with a
// finger that starts outside the chart doesn't count as tapping away. Listens only while something is chosen.
export function useTapAway(shown: boolean, ref: RefObject<Element | null>, clear: () => void) {
  useEffect(() => {
    if (!shown) return
    const away = (e: MouseEvent) => {
      // Only a real click: saving a picture "clicks" a hidden link, which mustn't count.
      if (!e.isTrusted) return
      if (ref.current && !ref.current.contains(e.target as Node)) clear()
    }
    document.addEventListener('click', away)
    return () => document.removeEventListener('click', away)
  }, [shown, ref, clear])
}
