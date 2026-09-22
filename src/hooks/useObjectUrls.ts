import { useCallback, useEffect, useRef } from 'react'

export function useObjectUrls() {
  const urlsRef = useRef<Map<string, string>>(new Map())

  const createUrl = useCallback((id: string, file: File) => {
    const url = URL.createObjectURL(file)
    urlsRef.current.set(id, url)
    return url
  }, [])

  const revokeUrl = useCallback((id: string) => {
    const url = urlsRef.current.get(id)
    if (!url) return
    URL.revokeObjectURL(url)
    urlsRef.current.delete(id)
  }, [])

  useEffect(() => {
    const urls = urlsRef.current
    return () => {
      for (const url of urls.values()) URL.revokeObjectURL(url)
      urls.clear()
    }
  }, [])

  return { createUrl, revokeUrl }
}
