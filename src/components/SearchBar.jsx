import React, { useState } from 'react'
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

export default function SearchBar({ onResults, onCenter, onFilters }) {
  const [tipoAtencion, setTipoAtencion] = useState([])
  const [comuna, setComuna] = useState('')
  const [tagsMain, setTagsMain] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const toggleAtencion = (opt) => {
    setTipoAtencion((prev) => (prev.includes(opt) ? prev.filter((v) => v !== opt) : [...prev, opt]))
  }

  const search = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token') || ''
      let user = null
      try {
        const part = token.split('.')[1]
        if (part) user = JSON.parse(decodeURIComponent(escape(atob(part.replace(/-/g, '+').replace(/_/g, '/')))))
      } catch {}
      const params = {}
      if (tipoAtencion.length) params.tipo_atencion = tipoAtencion
      if (comuna) params.comunas_cobertura = comuna
      if (tagsMain.length) params.etiquetas = tagsMain
      let data = await listPymes(token, params)
      const q = String(query || '').trim().toLowerCase()
      if (q) {
        data = (Array.isArray(data) ? data : []).filter(p => {
          const et = Array.isArray(p.etiquetas) ? p.etiquetas : []
          const ts = Array.isArray(p.tipo_servicio) ? p.tipo_servicio : [p.tipo_servicio].filter(Boolean)
          const tags = [...et, ...ts].map(t => String(t || '').toLowerCase())
          return tags.some(t => t.includes(q))
        })
      }
      onResults && onResults(data)
      onFilters && onFilters({ comuna, query })
    } catch (e) {
      setError(e.message || 'Error')
      onResults && onResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card bg-base-100 shadow p-4">
      <div className="mb-3">
        <span className="font-medium">Tipo de atención</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {ATENCION.map((opt) => (
            <button
              key={opt}
              onClick={() => toggleAtencion(opt)}
              className={`btn ${tipoAtencion.includes(opt) ? 'btn-primary' : 'btn-outline'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <span className="font-medium">Comuna de cobertura</span>
        <select
          className="select select-bordered w-full mt-2"
          value={comuna}
          onChange={(e) => setComuna(e.target.value)}
        >
          <option value="">Todas</option>
          {COMUNAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <span className="font-medium">Etiquetas principales</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {['Cafetería','Peluquería','Panadería','Pastelería','Farmacia','Veterinaria','Ferretería','Otra'].map((t)=>(
            <button key={t} type="button" onClick={()=> setTagsMain(prev => prev.includes(t) ? prev.filter(v=>v!==t) : [...prev, t])} className={`btn ${tagsMain.includes(t) ? 'btn-primary' : 'btn-outline'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <span className="font-medium">Buscar por etiquetas</span>
        <div className="flex gap-2 mt-2">
          <input className="input input-bordered basis-4/5" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Busca por etiqueta (ej. Coreano)" />
          <button className="btn btn-outline basis-1/5" type="button" onClick={()=>{
            if (!navigator.geolocation) return
            navigator.geolocation.getCurrentPosition((pos)=>{
              const lat = pos.coords.latitude
              const lon = pos.coords.longitude
              onCenter && onCenter([lat, lon])
            })
          }}>Mi ubicación</button>
        </div>
      </div>
      {error ? <div className="text-error mb-2">{error}</div> : null}
      <button className="btn btn-primary w-full" onClick={search} disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</button>
    </div>
  )
}