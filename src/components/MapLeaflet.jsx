import React, { useEffect, useRef } from 'react'

export default function MapLeaflet({ points = [] }) {
  const ref = useRef(null)
  const mapRef = useRef(null)
  useEffect(() => {
    const init = () => {
      if (!window.L || !ref.current) return
      const map = window.L.map(ref.current).setView([-33.45, -70.66], 12)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
      mapRef.current = map
    }
    const id = setInterval(() => {
      if (window.L) {
        clearInterval(id)
        init()
      }
    }, 100)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.L) return
    points.forEach((p) => {
      const s = String(p.longitud || '')
      const parts = s.split(',').map((v) => Number(v.trim()))
      if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
        const [lat, lng] = parts
        window.L.marker([lat, lng]).addTo(map)
      }
    })
  }, [points])

  return <div ref={ref} className="w-full h-[400px] rounded-box overflow-hidden" />
}