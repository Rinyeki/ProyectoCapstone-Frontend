import React, { useEffect, useRef, useState } from 'react'

export default function MapPicker({ onPick }) {
  const ref = useRef(null)
  const [latlng, setLatlng] = useState(null)
  useEffect(() => {
    const init = () => {
      if (!window.L || !ref.current) return
      const map = window.L.map(ref.current).setView([-33.45, -70.66], 12)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
      let marker = null
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        setLatlng({ lat, lng })
        if (marker) marker.remove()
        marker = window.L.marker([lat, lng]).addTo(map)
        onPick && onPick({ lat, lng })
      })
    }
    const id = setInterval(() => {
      if (window.L) {
        clearInterval(id)
        init()
      }
    }, 100)
    return () => clearInterval(id)
  }, [onPick])

  return (
    <div>
      <div ref={ref} className="w-full h-[300px] rounded-box overflow-hidden" />
      {latlng ? (
        <div className="mt-2 text-sm">Coordenadas: {latlng.lat.toFixed(6)}, {latlng.lng.toFixed(6)}</div>
      ) : null}
    </div>
  )
}