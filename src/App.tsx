import { useCallback, useRef, useState } from 'react'
import { Playground, type PlayItem } from './Playground'
import type { Rect } from './layout'
import { ControlPanel } from './components/ControlPanel'
import { useObjectUrls } from './hooks/useObjectUrls'
import './App.css'

export default function App() {
  const [items, setItems] = useState<PlayItem[]>([])
  const [explodedCount, setExplodedCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const { createUrl, revokeUrl } = useObjectUrls()

  const onFiles = (list: FileList | null) => {
    if (!list) return
    const next: PlayItem[] = []
    for (const file of list) {
      if (!file.type.startsWith('image/')) continue
      const id = crypto.randomUUID()
      const url = createUrl(id, file)
      next.push({ id, url, x: 0, y: 0, w: 0, h: 0, ready: false })
    }
    if (next.length) setItems((cur) => cur.concat(next))
    if (inputRef.current) inputRef.current.value = ''
  }

  const onPlace = useCallback((id: string, rect: Rect) => {
    setItems((cur) =>
      cur.map((item) => (item.id === id ? { ...item, ...rect, ready: true } : item)),
    )
  }, [])

  const onExplode = useCallback((ids: string[]) => {
    for (const id of ids) revokeUrl(id)
    setExplodedCount((count) => count + ids.length)
    setItems((cur) => cur.filter((item) => !ids.includes(item.id)))
  }, [revokeUrl])

  return (
    <div className="page">
      <input
        ref={inputRef}
        className="file"
        type="file"
        accept="image/*"
        multiple
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => onFiles(e.target.files)}
      />
      <div ref={controlsRef} className="controls">
        <ControlPanel count={explodedCount} onUpload={() => inputRef.current?.click()} />
      </div>
      <div className="ambient-shadow" aria-hidden="true" />
      <Playground items={items} controlRef={controlsRef} onPlace={onPlace} onExplode={onExplode} />
    </div>
  )
}
