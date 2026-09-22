export type Rect = { x: number; y: number; w: number; h: number }

export const MAX_THUMB = 220
export const EDGE_PAD = 12

export function thumbSize(naturalW: number, naturalH: number, max = MAX_THUMB) {
  const nw = Math.max(1, naturalW)
  const nh = Math.max(1, naturalH)
  const scale = Math.min(max / nw, max / nh, 1)
  return {
    w: Math.max(32, Math.round(nw * scale)),
    h: Math.max(32, Math.round(nh * scale)),
  }
}

export function rectsOverlap(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function randomInBounds(w: number, h: number, avoid: Rect, vw: number, vh: number): Rect {
  const maxX = Math.max(EDGE_PAD, vw - w - EDGE_PAD)
  const maxY = Math.max(EDGE_PAD, vh - h - EDGE_PAD)
  const minX = Math.min(EDGE_PAD, maxX)
  const minY = Math.min(EDGE_PAD, maxY)

  for (let i = 0; i < 40; i++) {
    const x = minX + Math.random() * Math.max(0, maxX - minX)
    const y = minY + Math.random() * Math.max(0, maxY - minY)
    const rect = { x, y, w, h }
    if (!rectsOverlap(rect, avoid)) return rect
  }

  return { x: minX, y: Math.min(maxY, avoid.y + avoid.h + EDGE_PAD), w, h }
}

export function clampRect(item: Rect, vw: number, vh: number): Rect {
  const x = Math.min(Math.max(EDGE_PAD, item.x), Math.max(EDGE_PAD, vw - item.w - EDGE_PAD))
  const y = Math.min(Math.max(EDGE_PAD, item.y), Math.max(EDGE_PAD, vh - item.h - EDGE_PAD))
  return { ...item, x, y }
}
