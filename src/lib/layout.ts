// Arranging the sentence cards on a computer (src/components/Sentences.tsx, CardRun; John,
// 28 October: "auto arrange"). A run of cards keeps its order, reading down the left column
// and then down the right, split where the two columns come out most even, so the least
// space is left empty beside the shorter one. With three or more, the last card may instead
// span the width under the two columns, when that leaves less empty space (Darkness and
// Across the UK side by side, Direction across the foot). Heights are each card's height in
// a column.

const column = (hs: number[], gap: number) => hs.reduce((a, b) => a + b, 0) + gap * Math.max(0, hs.length - 1)

/** Where to split cards of these heights into two columns (the first `k` on the left) so
 *  they come out most even, and the empty space left beside the shorter column. */
export function bestSplit(heights: number[], gap: number): { split: number; empty: number } {
  let split = 1
  let empty = Infinity
  for (let k = 1; k < heights.length; k++) {
    const e = Math.abs(column(heights.slice(0, k), gap) - column(heights.slice(k), gap))
    if (e < empty - 0.5) { empty = e; split = k }
  }
  return { split, empty }
}

export type Arrangement = { split: number; lastWide: boolean }

export function arrange(heights: number[], gap: number): Arrangement {
  const all = bestSplit(heights, gap)
  if (heights.length < 3) return { split: all.split, lastWide: false }
  const rest = bestSplit(heights.slice(0, -1), gap)
  return rest.empty < all.empty - 0.5 ? { split: rest.split, lastWide: true } : { split: all.split, lastWide: false }
}
