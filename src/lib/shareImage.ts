// "Copy chart" / "Share chart" (John, November 9th 2026, as in Refueller and Riverwatcher): a picture of one of the page's
// charts ("Next 24 hours", "The year in light", "Pace of change"), with a heading, the place and dates, and the credit line,
// always in the light colours, made on the visitor's device. On a touch screen it goes to the phone's own share sheet; on a
// computer it's copied (or saved, where the browser won't copy). Nothing is sent anywhere until the visitor chooses where.
import { BANDS, BAND_LABEL, type Band } from './bands.ts'
import { clock } from './format.ts'
import { POSTCODE_CREDITS } from './postcode.ts'
import { rate, type Pace } from './pace.ts'
import { along, placeLabels, type Ribbon } from './ribbon.ts'
import type { YearView } from './yearView.ts'
import { addDays } from './ukTime.ts'

/** The light colours (organic.css and global.css), whatever the page's own mode. */
const C = {
  bg: '#f5ead8', text: '#201e1d', muted: '#645c50', accent: '#c67139', accent800: '#643312', edge: 'rgba(32,30,29,0.18)',
  band: { 'daylight': '#f2cf86', 'half-light': '#d98e57', 'dark': '#7b6577', 'very-dark': '#463c55', 'true-night': '#24212f' } as Record<Band, string>,
}
const CREDIT = `lightreader.baish.net · Times in UK local time for the middle of the postcode district, calculated with Astronomy Engine (MIT licence). ${POSTCODE_CREDITS.map((c) => c.replace(/([^.])$/, '$1.')).join(' ')}`

const W = 1200
const PAD = 50
const FIG = 'Figtree, system-ui, sans-serif'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const w of text.split(' ')) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > width && line) { lines.push(line); line = w } else line = t
  }
  if (line) lines.push(line)
  return lines
}

type Draw = (ctx: CanvasRenderingContext2D, top: number) => void

/** The frame every picture shares: the name, heading, sub-lines, the chart (`bodyH` tall, drawn by `draw`), the credit. */
function frame(heading: string, sub: string[], bodyH: number, draw: Draw, key = true): HTMLCanvasElement {
  const scale = 2
  const canvas = document.createElement('canvas')
  const probe = canvas.getContext('2d')!
  probe.font = `13px ${FIG}`
  const credit = wrap(probe, CREDIT, W - 2 * PAD)
  const top = 112 + sub.length * 26 + 18 + (key ? 34 : 0)
  const H = top + bodyH + 30 + credit.length * 17 + 24
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = C.accent
  ctx.font = `600 13px ${FIG}`
  ctx.fillText('LIGHTREADER', PAD, 52)
  ctx.fillStyle = C.text
  ctx.font = `34px Caprasimo, Georgia, serif`
  ctx.fillText(heading, PAD, 94)
  ctx.fillStyle = C.muted
  ctx.font = `17px ${FIG}`
  sub.forEach((s, i) => ctx.fillText(s, PAD, 124 + i * 26))
  if (key) {
    // The five lights, as the page's key.
    let x = PAD
    const y = top - 34
    ctx.font = `15px ${FIG}`
    for (const b of BANDS) {
      ctx.fillStyle = C.band[b]
      ctx.fillRect(x, y - 2, 16, 16)
      ctx.strokeStyle = C.edge; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y - 1.5, 15, 15)
      ctx.fillStyle = C.text
      ctx.fillText(BAND_LABEL[b], x + 24, y + 11)
      x += 24 + ctx.measureText(BAND_LABEL[b]).width + 24
    }
  }
  draw(ctx, top)
  const ruleY = top + bodyH + 6
  ctx.textAlign = 'left'
  ctx.setLineDash([])
  ctx.strokeStyle = C.edge; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, ruleY); ctx.lineTo(W - PAD, ruleY); ctx.stroke()
  ctx.fillStyle = C.muted
  ctx.font = `13px ${FIG}`
  credit.forEach((t, i) => ctx.fillText(t, PAD, ruleY + 22 + i * 17))
  return canvas
}

/** "Next 24 hours": the strip across the picture, each change of light labelled above or below it, as on a computer. */
export function ribbonImage(r: Ribbon, place: string, nowWords: string): HTMLCanvasElement {
  const x0 = PAD, w = W - 2 * PAD
  const probe = document.createElement('canvas').getContext('2d')!
  const labels = r.ticks.map((t) => ({ at: t.at, time: clock(t.at), label: t.label }))
  const widthOf = (l: { time: string; label: string }) => {
    probe.font = `700 16px ${FIG}`; const a = probe.measureText(l.time).width
    probe.font = `14px ${FIG}`; const b = probe.measureText(l.label).width
    return Math.max(a, b) + 6
  }
  const marks = labels.map((l) => along(r, l.at) * w)
  const spans = labels.map((l, i): [number, number] => [marks[i] - widthOf(l) / 2, marks[i] + widthOf(l) / 2])
  const spots = placeLabels(spans, marks)
  const above = spots.some((p) => p.side === 'above' && p.row === 1) ? 104 : 56
  const below = spots.some((p) => p.side === 'below' && p.row === 1) ? 104 : 56
  const stripH = 56
  const bodyH = above + stripH + below + 10
  return frame('Next 24 hours', [place, nowWords], bodyH, (ctx, top) => {
    const sy = top + above
    // The strip, rounded.
    ctx.save()
    ctx.beginPath(); ctx.roundRect(x0, sy, w, stripH, 12); ctx.clip()
    for (const s of r.segments) {
      ctx.fillStyle = C.band[s.band]
      const a = x0 + along(r, s.from) * w, b = x0 + along(r, s.to) * w
      ctx.fillRect(a, sy, b - a + 0.6, stripH)
    }
    if (r.midnight) {
      const mx = x0 + along(r, r.midnight.at) * w
      ctx.strokeStyle = C.bg; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(mx, sy); ctx.lineTo(mx, sy + stripH); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = C.bg; ctx.font = `600 13px ${FIG}`; ctx.textAlign = 'left'
      ctx.fillText(r.midnight.day.toUpperCase(), mx + 6, sy + stripH / 2 + 5)
    }
    ctx.restore()
    ctx.strokeStyle = C.edge; ctx.lineWidth = 1
    ctx.beginPath(); ctx.roundRect(x0 + 0.5, sy + 0.5, w - 1, stripH - 1, 12); ctx.stroke()
    // The labels, each with a short line to its own moment.
    ctx.textAlign = 'center'
    labels.forEach((l, i) => {
      const p = spots[i]
      const mx = x0 + marks[i]
      const reach = p.row === 0 ? 10 : 58
      ctx.strokeStyle = C.text; ctx.lineWidth = 1
      ctx.beginPath()
      if (p.side === 'above') { ctx.moveTo(mx, sy - 2); ctx.lineTo(mx, sy - 2 - reach) } else { ctx.moveTo(mx, sy + stripH + 2); ctx.lineTo(mx, sy + stripH + 2 + reach) }
      ctx.stroke()
      const base = p.side === 'above' ? sy - 2 - reach - 22 : sy + stripH + 2 + reach + 16
      ctx.fillStyle = C.text; ctx.font = `700 16px ${FIG}`
      ctx.fillText(l.time, mx, base)
      ctx.fillStyle = C.muted; ctx.font = `14px ${FIG}`
      ctx.fillText(l.label, mx, base + 18)
    })
  })
}

/** "The year in light": each day an upright strip from midnight to midnight, today's line, and the chosen day's if any. */
export function yearImage(v: YearView, place: string, span: string, chosen: string | null, chosenLabel: string): HTMLCanvasElement {
  const n = v.ribbon.length
  const L = PAD + 54, R = W - PAD, plotH = 330
  const bodyH = 26 + plotH + 30
  const sub = [place, span]
  return frame('The year in light', sub, bodyH, (ctx, top) => {
    const T = top + 26, B = T + plotH
    const x = (i: number) => L + (i / n) * (R - L)
    const y = (min: number) => B - (min / 1440) * plotH
    ctx.save()
    ctx.beginPath(); ctx.roundRect(L, T, R - L, plotH, 6); ctx.clip()
    ctx.fillStyle = C.band['true-night']; ctx.fillRect(L, T, R - L, plotH)
    v.ribbon.forEach((day, i) => {
      for (const s of day) {
        if (s.band === 'true-night') continue
        ctx.fillStyle = C.band[s.band]
        ctx.fillRect(x(i), y(s.to), x(i + 1) - x(i) + 0.7, y(s.from) - y(s.to) + 0.7)
      }
    })
    ctx.strokeStyle = 'rgba(245,234,216,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4])
    for (const h of [6, 12, 18]) { ctx.beginPath(); ctx.moveTo(L, y(h * 60)); ctx.lineTo(R, y(h * 60)); ctx.stroke() }
    ctx.setLineDash([])
    ctx.restore()
    ctx.strokeStyle = C.edge; ctx.lineWidth = 1
    ctx.beginPath(); ctx.roundRect(L + 0.5, T + 0.5, R - L - 1, plotH - 1, 6); ctx.stroke()
    // Hours down the side, months along the bottom.
    ctx.fillStyle = C.muted; ctx.font = `14px ${FIG}`; ctx.textAlign = 'right'
    for (const h of [0, 6, 12, 18, 24]) ctx.fillText(`${String(h).padStart(2, '0')}:00`, L - 8, y(h * 60) + 5)
    ctx.textAlign = 'center'
    for (let i = 0; i < n; i++) {
      const d = addDays(v.from, i)
      if (d.endsWith('-01') && i + 15 < n) ctx.fillText(MONTHS[Number(d.slice(5, 7)) - 1].slice(0, 3), x(i + 15), B + 22)
    }
    // Today's line, and the chosen day's, each named above the chart.
    const dayLine = (date: string, colour: string, label: string, white: boolean) => {
      const i = Math.round((Date.parse(date) - Date.parse(v.from)) / 86_400_000)
      const lx = x(i + 0.5)
      if (white) { ctx.fillStyle = C.text; ctx.fillRect(lx - 2, T, 4, plotH) }
      ctx.fillStyle = colour; ctx.fillRect(lx - 1, T, 2, plotH)
      ctx.font = `600 14px ${FIG}`
      const tw = ctx.measureText(label).width
      ctx.textAlign = lx - tw / 2 < L ? 'left' : lx + tw / 2 > R ? 'right' : 'center'
      ctx.fillStyle = C.text
      ctx.fillText(label, ctx.textAlign === 'left' ? L : ctx.textAlign === 'right' ? R : lx, T - 9)
    }
    if (chosen && chosen !== v.today) {
      const ci = Math.round((Date.parse(chosen) - Date.parse(v.from)) / 86_400_000)
      const ti = Math.round((Date.parse(v.today) - Date.parse(v.from)) / 86_400_000)
      // Both named only when far enough apart to read; otherwise the chosen day alone.
      if (Math.abs(x(ci) - x(ti)) > 190) dayLine(v.today, C.accent800, 'Today', false)
      else { ctx.fillStyle = C.accent800; ctx.fillRect(x(ti + 0.5) - 1, T, 2, plotH) }
      dayLine(chosen, '#ffffff', chosenLabel, true)
    } else dayLine(v.today, C.accent800, 'Today', false)
  })
}

/** "Pace of change": the line of each day's gain or loss of daylight, shaded above and below zero, and its sentences. */
export function paceImage(p: Pace, place: string, span: string): HTMLCanvasElement {
  const probe = document.createElement('canvas').getContext('2d')!
  probe.font = `16px ${FIG}`
  const words = p.sentences.map((s) => wrap(probe, s, W - 2 * PAD - 24))
  const chartH = 330
  const wordsH = words.reduce((a, l) => a + l.length * 23 + 6, 0)
  const bodyH = chartH + 16 + wordsH
  return frame('Pace of change', [place, span], bodyH, (ctx, top) => {
    const rows = p.rows, n = rows.length
    const ti = rows.findIndex((r) => r.date === p.today)
    const MAX = 290
    const L = PAD + 54, R = W - PAD - 8, T = top + 8, B = top + chartH - 34
    const x = (i: number) => L + (i / (n - 1)) * (R - L)
    const y = (v: number) => T + (B - T) / 2 - (v / MAX) * ((B - T) / 2)
    const z = y(0)
    // Grid and axis.
    ctx.font = `14px ${FIG}`; ctx.textAlign = 'right'
    for (const v of [-240, -120, 0, 120, 240]) {
      ctx.strokeStyle = v === 0 ? 'rgba(32,30,29,0.45)' : 'rgba(32,30,29,0.12)'; ctx.lineWidth = 1
      ctx.setLineDash(v === 0 ? [] : [3, 3])
      ctx.beginPath(); ctx.moveTo(L, y(v)); ctx.lineTo(R, y(v)); ctx.stroke()
      ctx.fillStyle = C.muted
      ctx.fillText(v === 0 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v / 60)}m`, L - 8, y(v) + 5)
    }
    ctx.setLineDash([])
    const trace = () => { ctx.beginPath(); rows.forEach((r, i) => (i ? ctx.lineTo(x(i), y(r.change)) : ctx.moveTo(x(i), y(r.change)))) }
    for (const up of [true, false]) {
      ctx.save()
      ctx.beginPath(); ctx.rect(L, up ? T - 10 : z, R - L, up ? z - T + 10 : B - z + 10); ctx.clip()
      trace(); ctx.lineTo(x(n - 1), z); ctx.lineTo(x(0), z); ctx.closePath()
      ctx.globalAlpha = 0.85; ctx.fillStyle = up ? C.band.daylight : C.band['very-dark']; ctx.fill(); ctx.globalAlpha = 1
      ctx.restore()
    }
    trace(); ctx.strokeStyle = C.text; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.stroke()
    // Each label in the middle of the longest stretch of its own side, as on the page.
    const middleOf = (up: boolean) => {
      let best = [0, -1], start = -1
      rows.forEach((r, i) => {
        const on = (r.change > 0) === up
        if (on && start < 0) start = i
        if ((!on || i === n - 1) && start >= 0) { const end = on ? i : i - 1; if (end - start > best[1] - best[0]) best = [start, end]; start = -1 }
      })
      return Math.round((best[0] + best[1]) / 2)
    }
    ctx.textAlign = 'center'; ctx.font = `600 14px ${FIG}`
    ctx.fillStyle = C.text; ctx.fillText('DAYS GETTING LONGER', x(middleOf(true)), y(60))
    ctx.fillStyle = C.bg; ctx.fillText('DAYS GETTING SHORTER', x(middleOf(false)), y(-70))
    ctx.fillStyle = C.muted; ctx.font = `14px ${FIG}`
    rows.forEach((r, i) => { if (r.date.endsWith('-01')) ctx.fillText(MONTHS[Number(r.date.slice(5, 7)) - 1].slice(0, 3), x(i), top + chartH - 8) })
    // Today.
    const now = rows[ti]
    ctx.strokeStyle = C.accent; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(x(ti), T); ctx.lineTo(x(ti), B); ctx.stroke()
    ctx.fillStyle = C.accent; ctx.strokeStyle = C.bg; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.arc(x(ti), y(now.change), 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    const right = x(ti) < R - 170
    ctx.fillStyle = C.text; ctx.font = `600 15px ${FIG}`; ctx.textAlign = right ? 'left' : 'right'
    ctx.fillText(`Today ${now.change < 0 ? '−' : '+'}${rate(now.change)}`, x(ti) + (right ? 10 : -10), now.change < 0 ? y(now.change) + 24 : y(now.change) - 13)
    // The sentences, as bullets.
    ctx.textAlign = 'left'; ctx.font = `16px ${FIG}`
    let wy = top + chartH + 16 + 16
    for (const lines of words) {
      ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(PAD + 6, wy - 5, 3, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = C.text
      lines.forEach((t, i) => ctx.fillText(t, PAD + 24, wy + i * 23))
      wy += lines.length * 23 + 6
    }
  }, false)
}

export type Delivered = 'shared' | 'copied' | 'saved' | 'cancelled'
const touch = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
/** The share button's own word: "Share" on a touch screen (the phone's share sheet), "Copy" on a computer. */
export const shareVerb = () => (touch() ? 'Share' : 'Copy')

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Hands the picture over: the share sheet on a touch screen, else the clipboard, else a saved file. Call straight from the tap. */
export async function deliver(canvas: HTMLCanvasElement, filename: string, title: string): Promise<Delivered> {
  const blob = new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('No picture'))), 'image/png'))
  if (touch()) {
    const b = await blob
    const file = new File([b], filename, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title })
        return 'shared'
      } catch (e) {
        if ((e as Error).name === 'AbortError') return 'cancelled'
      }
    }
    save(b, filename)
    return 'saved'
  }
  try {
    // The picture is handed over as a promise, made inside the click, which Safari needs.
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return 'copied'
  } catch {
    save(await blob, filename)
    return 'saved'
  }
}

/** "lightreader-year-2026-11-09.png" */
export const imageName = (what: string, ms: number) => `lightreader-${what}-${new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date(ms))}.png`
