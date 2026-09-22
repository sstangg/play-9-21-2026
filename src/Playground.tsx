import { useEffect, useRef, type RefObject } from 'react'
import { clampRect, randomInBounds, rectsOverlap, thumbSize, type Rect } from './layout'
import { createShards, drawShards, stepShards, type Shard } from './explode'

export type PlayItem = {
  id: string
  url: string
  x: number
  y: number
  w: number
  h: number
  ready: boolean
}

type Props = {
  items: PlayItem[]
  controlRef: RefObject<HTMLElement | null>
  onPlace: (id: string, rect: Rect) => void
  onExplode: (ids: string[]) => void
}

export function Playground({ items, controlRef, onPlace, onExplode }: Props) {
  const shardsRef = useRef<Shard[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const lastRef = useRef(0)
  const dragRef = useRef<{
    id: string
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
    dragging: boolean
  } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const loop = (t: number) => {
      const last = lastRef.current || t
      const dt = Math.min(0.05, (t - last) / 1000)
      lastRef.current = t
      const vw = window.innerWidth
      const vh = window.innerHeight
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw
        canvas.height = vh
      }
      shardsRef.current = stepShards(shardsRef.current, dt, vw, vh)
      drawShards(ctx, shardsRef.current)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    const onResize = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      for (const item of items) {
        if (!item.ready) continue
        const next = clampRect(item, vw, vh)
        if (next.x !== item.x || next.y !== item.y) onPlace(item.id, next)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [items, onPlace])

  const avoid = (): Rect => {
    const el = controlRef.current
    if (!el) return { x: 0, y: 0, w: 0, h: 0 }
    const r = el.getBoundingClientRect()
    return { x: r.left, y: r.top, w: r.width, h: r.height }
  }

  const handleLoad = (id: string, img: HTMLImageElement) => {
    const { w, h } = thumbSize(img.naturalWidth, img.naturalHeight)
    const pos = randomInBounds(w, h, avoid(), window.innerWidth, window.innerHeight)
    onPlace(id, pos)
  }

  const getButton = (id: string) => document.querySelector<HTMLButtonElement>(`[data-item-id="${id}"]`)

  const explode = (item: PlayItem) => {
   const source = { x: item.x, y: item.y, w: item.w, h: item.h }
   const overlaps = items.filter((other) => {
     if (other.id === item.id) return false
     return rectsOverlap(source, { x: other.x, y: other.y, w: other.w, h: other.h })
   })
   const targets = [item, ...overlaps]
   const power = overlaps.length > 0 ? 1.95 + Math.min(0.6, overlaps.length * 0.1) : 1

   for (const target of targets) {
     const img = getButton(target.id)?.querySelector('img')
     if (!img) continue
     shardsRef.current = shardsRef.current.concat(
       createShards(img, target.x, target.y, target.w, target.h, power),
     )
   }

   onExplode(targets.map((target) => target.id))
  }

  const moveItem = (item: PlayItem, dx: number, dy: number) => {
   const next = clampRect(
     { x: item.x + dx, y: item.y + dy, w: item.w, h: item.h },
     window.innerWidth,
     window.innerHeight,
   )
   onPlace(item.id, next)
  }

  const startDrag = (item: PlayItem, pointerId: number, clientX: number, clientY: number) => {
   dragRef.current = {
     id: item.id,
     pointerId,
     startX: clientX,
     startY: clientY,
     originX: item.x,
     originY: item.y,
     dragging: false,
   }
  }

  const updateDrag = (clientX: number, clientY: number) => {
   const drag = dragRef.current
   if (!drag) return
   const item = items.find((entry) => entry.id === drag.id)
   if (!item) return

   const dx = clientX - drag.startX
   const dy = clientY - drag.startY
   if (!drag.dragging && Math.hypot(dx, dy) < 5) return
   drag.dragging = true

   const next = clampRect(
     { x: drag.originX + dx, y: drag.originY + dy, w: item.w, h: item.h },
     window.innerWidth,
     window.innerHeight,
   )
   onPlace(item.id, next)
  }

  const endDrag = (pointerId: number, currentTarget?: HTMLButtonElement) => {
   const drag = dragRef.current
   if (!drag || drag.pointerId !== pointerId) return
   const item = items.find((entry) => entry.id === drag.id)
   const shouldExplode = !!item && !drag.dragging
   if (currentTarget?.hasPointerCapture(pointerId)) {
     currentTarget.releasePointerCapture(pointerId)
   }
   dragRef.current = null
   if (shouldExplode && item) explode(item)
  }

  return (
   <>
     {items.map((item) => (
       <button
         key={item.id}
         data-item-id={item.id}
         type="button"
         className="item"
         style={{
           left: item.x,
           top: item.y,
           width: item.ready ? item.w : 0,
           height: item.ready ? item.h : 0,
           visibility: item.ready ? 'visible' : 'hidden',
         }}
         aria-label="Drag image or press Enter to explode"
         aria-keyshortcuts="Enter Space ArrowLeft ArrowRight ArrowUp ArrowDown"
         onPointerDown={(e) => {
           if (!item.ready) return
           startDrag(item, e.pointerId, e.clientX, e.clientY)
           e.currentTarget.setPointerCapture(e.pointerId)
         }}
         onPointerMove={(e) => {
           updateDrag(e.clientX, e.clientY)
         }}
         onPointerUp={(e) => {
           endDrag(e.pointerId, e.currentTarget)
         }}
         onPointerCancel={(e) => {
           if (e.currentTarget.hasPointerCapture(e.pointerId)) {
             e.currentTarget.releasePointerCapture(e.pointerId)
           }
           dragRef.current = null
         }}
         onKeyDown={(e) => {
           if (e.key === 'Enter' || e.key === ' ') {
             e.preventDefault()
             explode(item)
             return
           }

           const step = e.shiftKey ? 40 : 12
           if (e.key === 'ArrowLeft') {
             e.preventDefault()
             moveItem(item, -step, 0)
           } else if (e.key === 'ArrowRight') {
             e.preventDefault()
             moveItem(item, step, 0)
           } else if (e.key === 'ArrowUp') {
             e.preventDefault()
             moveItem(item, 0, -step)
           } else if (e.key === 'ArrowDown') {
             e.preventDefault()
             moveItem(item, 0, step)
           }
         }}
        >
          <img
            src={item.url}
            alt=""
            draggable={false}
            onLoad={(e) => {
              if (!item.ready) handleLoad(item.id, e.currentTarget)
            }}
          />
        </button>
      ))}
      <canvas ref={canvasRef} className="shards" aria-hidden="true" />
    </>
  )
}
