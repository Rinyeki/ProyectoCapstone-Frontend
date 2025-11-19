import React, { useEffect, useRef } from 'react'

export default function MapLeaflet({ points = [], center, onSelect }) {
  const ref = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  useEffect(() => {
    const init = () => {
      if (!window.L || !ref.current) return
      const map = window.L.map(ref.current).setView([-33.45, -70.66], 12)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
      layerRef.current = window.L.layerGroup().addTo(map)
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
    const layer = layerRef.current
    if (!map || !window.L || !layer) return
    layer.clearLayers()
    points.forEach((p) => {
      const s = String(p.longitud || '')
      const parts = s.split(',').map((v) => Number(v.trim()))
      if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
        const [lat, lng] = parts
        const m = window.L.marker([lat, lng]).addTo(layer)
        const html = `
<div class="card bg-base-100 shadow p-2 w-64">
  <div class="font-semibold">${(p.nombre||'Pyme')}</div>
  <div class="text-sm opacity-80">${(p.direccion||p.comuna||'')}</div>
  <div class="mt-2 flex gap-1 flex-wrap text-xs">${(p.tipo_servicio||[]).join(', ')}</div>
</div>`
        m.on('click', () => {
          try { m.bindPopup(html).openPopup() } catch {}
          onSelect && onSelect(p)
        })
      }
    })
  }, [points, onSelect])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.L || !center) return
    const [lat, lng] = center
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.setView([lat, lng], 14)
      window.L.marker([lat, lng]).addTo(map)
    }
  }, [center])

  return <div ref={ref} className="w-full h-[400px] rounded-box overflow-hidden" />
}