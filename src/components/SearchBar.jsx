import React, { useState, useRef } from 'react'
import { listPymes } from '../utils/fetch.js'

const ATENCION = ['Presencial', 'A Domicilio', 'Online']
const COMUNAS = [
  'Santiago',
  'Cerrillos',
  'Cerro Navia',
  'Conchalí',
  'El Bosque',
  'Estación Central',
  'Huechuraba',
  'Independencia',
  'La Cisterna',
  'La Florida',
  'La Granja',
  'La Pintana',
  'La Reina',
  'Las Condes',
  'Lo Barnechea',
  'Lo Espejo',
  'Lo Prado',
  'Macul',
  'Maipú',
  'Ñuñoa',
  'Pedro Aguirre Cerda',
  'Peñalolén',
  'Providencia',
  'Pudahuel',
  'Quilicura',
  'Quinta Normal',
  'Recoleta',
  'Renca',
  'San Joaquín',
  'San Miguel',
  'San Ramón',
  'Vitacura',
  'Colina',
  'Lampa',
  'Tiltil',
  'Puente Alto',
  'Pirque',
  'San José de Maipo',
  'San Bernardo',
  'Buin',
  'Paine',
  'Calera de Tango',
  'Melipilla',
  'Curacaví',
  'María Pinto',
  'San Pedro',
  'Alhué',
  'Talagante',
  'El Monte',
  'Isla de Maipo',
  'Padre Hurtado',
  'Peñaflor',
]
const TAGS_MAIN = ['Cafetería','Peluquería','Panadería','Pastelería','Farmacia','Veterinaria','Ferretería','Otra']

function DropdownMulti({ label, options, selected, onToggle }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)
  React.useEffect(() => {
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        className="btn btn-outline w-full text-left justify-start flex items-center gap-2"
        onClick={()=> setOpen(o=> !o)}
      >
        <span className="truncate">{label}</span>
        <svg className={`ml-auto h-4 w-4 transition-transform ${open?'rotate-180':''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 w-72 max-h-64 overflow-auto p-2 shadow-lg bg-base-100 rounded-box border border-base-300" style={{ zIndex: 20000 }}>
          {options.map(opt => {
            const checked = selected.includes(opt)
            return (
              <label key={opt} className="flex items-center gap-2 px-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked ? [...selected, opt] : selected.filter(v => v !== opt)
                    onToggle(next)
                  }}
                />
                <span className="truncate">{opt}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function SearchBar({ onResults, onCenter, onFilters }) {
  const [tipoAtencion, setTipoAtencion] = useState([])
  const [comuna, setComuna] = useState([])
  const [tagsMain, setTagsMain] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qNombre, setQNombre] = useState('')
  const [qEtiqueta, setQEtiqueta] = useState('')
  const debounceRef = useRef(null)

  const search = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token') || ''
      const params = {}
      if (tipoAtencion.length) params.tipo_atencion = tipoAtencion
      if (Array.isArray(comuna) && comuna.length) params.comunas_cobertura = comuna
      if (tagsMain.length) params.etiquetas = tagsMain
      let data = await listPymes(token, params)
      const qn = String(qNombre || '').trim().toLowerCase()
      const qe = String(qEtiqueta || '').trim().toLowerCase()
      if (qn || qe) {
        data = (Array.isArray(data) ? data : []).filter(p => {
          const nombreOk = qn ? String(p.nombre||'').toLowerCase().includes(qn) : true
          const et = Array.isArray(p.etiquetas) ? p.etiquetas : []
          const ts = Array.isArray(p.tipo_servicio) ? p.tipo_servicio : [p.tipo_servicio].filter(Boolean)
          const tags = [...et, ...ts].map(t => String(t || '').toLowerCase())
          const etiquetaOk = qe ? tags.some(t => t.includes(qe)) : true
          return nombreOk && etiquetaOk
        })
      }
      onResults && onResults(data)
      onFilters && onFilters({ comuna: Array.isArray(comuna) ? (comuna[0] || '') : comuna, qNombre, qEtiqueta })
    } catch (e) {
      setError(e.message || 'Error')
      onResults && onResults([])
    } finally {
      setLoading(false)
    }
  }

  const onInputSearch = (setter) => (e) => {
    setter(e.target.value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { search() }, 300)
  }

  return (
    <div className="card bg-base-100 shadow p-4 relative" style={{ zIndex: 10000 }}>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 mb-3">
        <input className="input input-bordered" value={qNombre} onChange={onInputSearch(setQNombre)} placeholder="Buscar por nombre" />
        <input className="input input-bordered" value={qEtiqueta} onChange={onInputSearch(setQEtiqueta)} placeholder="Buscar por etiquetas" />
        <button className="btn btn-outline" type="button" onClick={() => {
          if (!navigator.geolocation) return
          navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude
            const lon = pos.coords.longitude
            onCenter && onCenter([lat, lon])
          })
        }}>Mi ubicación</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        <DropdownMulti label="Tipo de atención" options={ATENCION} selected={tipoAtencion} onToggle={setTipoAtencion} />
        <DropdownMulti label="Comuna de cobertura" options={COMUNAS} selected={comuna} onToggle={setComuna} />
        <DropdownMulti label="Etiquetas principales" options={TAGS_MAIN} selected={tagsMain} onToggle={setTagsMain} />
      </div>
      {error ? <div className="text-error mb-2">{error}</div> : null}
      <button className="btn btn-primary w-full" onClick={search} disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</button>
    </div>
  )
}
