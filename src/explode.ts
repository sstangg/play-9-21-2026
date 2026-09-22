export type Shard = {
  canvas: HTMLCanvasElement
  x: number
  y: number
  vx: number
  vy: number
  ax: number
  ay: number
  drag: number
  opacity: number
  fade: number
}

const COLS = 6
const ROWS = 6

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function normalize(x: number, y: number) {
  const len = Math.hypot(x, y) || 1
  return { x: x / len, y: y / len }
}

export function createShards(
  img: HTMLImageElement,
  left: number,
  top: number,
  w: number,
  h: number,
  power = 1,
): Shard[] {
  const source = document.createElement('canvas')
  source.width = Math.max(1, Math.round(w))
  source.height = Math.max(1, Math.round(h))
  const sctx = source.getContext('2d')
  if (!sctx) return []
  sctx.drawImage(img, 0, 0, source.width, source.height)

  const shards: Shard[] = []
  const baseW = Math.floor(source.width / COLS)
  const baseH = Math.floor(source.height / ROWS)

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const sx = col * baseW
      const sy = row * baseH
      const sw = col === COLS - 1 ? source.width - sx : baseW
      const sh = row === ROWS - 1 ? source.height - sy : baseH
      if (sw < 1 || sh < 1) continue

      const piece = document.createElement('canvas')
      piece.width = sw
      piece.height = sh
      const pctx = piece.getContext('2d')
      if (!pctx) continue
      pctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh)

      const useCurve = Math.random() < 0.55
      const centerX = left + sx + sw / 2
      const centerY = top + sy + sh / 2
      const originX = left + w / 2
      const originY = top + h / 2
      const outward = normalize(centerX - originX, centerY - originY)
      const perpendicular = { x: -outward.y, y: outward.x }
      const curveSide = Math.random() < 0.5 ? -1 : 1
      const angle = rand(0, Math.PI * 2)
      const speed = rand(360, 860) * power
      const fadeInView = Math.random() < 0.35

      shards.push({
        canvas: piece,
        x: left + sx,
        y: top + sy,
        vx: useCurve ? outward.x * speed : Math.cos(angle) * speed,
        vy: useCurve ? outward.y * speed - rand(140, 360) : Math.sin(angle) * speed,
        ax: useCurve
          ? -outward.x * rand(120, 260) + perpendicular.x * curveSide * rand(80, 180)
          : rand(-420, 420),
        ay: useCurve
          ? -outward.y * rand(120, 260) + perpendicular.y * curveSide * rand(80, 180) - rand(40, 120)
          : rand(-280, 640),
        drag: useCurve ? rand(120, 220) : rand(30, 90),
        opacity: 1,
        fade: fadeInView ? rand(1.2, 2.8) : rand(0, 0.35),
      })
    }
  }

  return shards
}

export function stepShards(shards: Shard[], dt: number, vw: number, vh: number): Shard[] {
  const next: Shard[] = []
  for (const shard of shards) {
    const speed = Math.hypot(shard.vx, shard.vy) || 1
    const drag = shard.drag / speed
    shard.vx += (shard.ax - shard.vx * drag) * dt
    shard.vy += (shard.ay - shard.vy * drag) * dt
    shard.x += shard.vx * dt
    shard.y += shard.vy * dt
    shard.opacity -= shard.fade * dt

    const gone =
      shard.opacity <= 0 ||
      shard.x + shard.canvas.width < 0 ||
      shard.y + shard.canvas.height < 0 ||
      shard.x > vw ||
      shard.y > vh

    if (!gone) next.push(shard)
  }
  return next
}

export function drawShards(ctx: CanvasRenderingContext2D, shards: Shard[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  for (const shard of shards) {
    ctx.globalAlpha = Math.max(0, shard.opacity)
    ctx.drawImage(shard.canvas, shard.x, shard.y)
  }
  ctx.globalAlpha = 1
}
