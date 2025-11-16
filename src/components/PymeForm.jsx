import React, { useEffect, useMemo, useState } from 'react'
import MapPicker from './MapPicker.jsx'
import { createPyme } from '../utils/fetch.js'

const ATENCION = ['Presencial', 'A Domicilio', 'Online']
const COMUNAS = [
  'Santiago','Cerrillos','Cerro Navia','Conchalí','El Bosque','Estación Central','Huechuraba','Independencia','La Cisterna','La Florida','La Granja','La Pintana','La Reina','Las Condes','Lo Barnechea','Lo Espejo','Lo Prado','Macul','Maipú','Ñuñoa','Pedro Aguirre Cerda','Peñalolén','Providencia','Pudahuel','Quilicura','Quinta Normal','Recoleta','Renca','San Joaquín','San Miguel','San Ramón','Vitacura','Colina','Lampa','Tiltil','Puente Alto','Pirque','San José de Maipo','San Bernardo','Buin','Paine','Calera de Tango','Melipilla','Curacaví','María Pinto','San Pedro','Alhué','Talagante','El Monte','Isla de Maipo','Padre Hurtado','Peñaflor'
]

export default function PymeForm() {
  const [user, setUser] = useState(null)
  const [data, setData] = useState({ nombre: '', rut_empresa: '', descripcion: '', direccion: '', comuna: '', tipo_servicio: '', tipo_atencion: [], comunas_cobertura: [], etiquetas: '', redes: '{}', sitio_web: '', telefono: '', horario_atencion: '', imagen: '' })
  const [coords, setCoords] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return setUser(null)
      const part = token.split('.')[1]
      if (!part) return setUser(null)
      const payload = JSON.parse(decodeURIComponent(escape(atob(part.replace(/-/g, '+').replace(/_/g, '/')))))
      setUser(payload || null)
    } catch {
      setUser(null)
    }
  }, [])

  const canCreate = useMemo(() => Boolean(user && user.rut_chileno), [user])

  const submit = async (e) => {
    e.preventDefault()
    if (!canCreate) return
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token') || ''
      const payload = {
        nombre: data.nombre,
        rut_empresa: data.rut_empresa,
        descripcion: data.descripcion || undefined,
        direccion: data.direccion || undefined,
        comuna: data.comuna || undefined,
        tipo_servicio: data.tipo_servicio ? data.tipo_servicio.split(',').map((v) => v.trim()).filter(Boolean) : undefined,
        tipo_atencion: data.tipo_atencion,
        comunas_cobertura: data.comunas_cobertura,
        etiquetas: data.etiquetas ? data.etiquetas.split(',').map((v) => v.trim()).filter(Boolean) : undefined,
        redes: (() => { try { const j = JSON.parse(data.redes); return j; } catch { return undefined } })(),
        sitio_web: data.sitio_web || undefined,
        telefono: data.telefono || undefined,
        horario_atencion: data.horario_atencion || undefined,
        imagenes_url: data.imagen ? [data.imagen] : undefined,
        longitud: coords ? `${coords.lat},${coords.lng}` : undefined,
      }
      await createPyme(token, payload)
      window.location.href = '/'
    } catch (e2) {
      setError(e2.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const toggleAtencion = (opt) => {
    setData((prev) => ({ ...prev, tipo_atencion: prev.tipo_atencion.includes(opt) ? prev.tipo_atencion.filter((v) => v !== opt) : [...prev.tipo_atencion, opt] }))
  }

  const toggleCobertura = (opt) => {
    setData((prev) => ({ ...prev, comunas_cobertura: prev.comunas_cobertura.includes(opt) ? prev.comunas_cobertura.filter((v) => v !== opt) : [...prev.comunas_cobertura, opt] }))
  }

  if (!user) return <div className="alert alert-warning max-w-xl mx-auto">Debes iniciar sesión para registrar una Pyme.</div>
  if (!canCreate) return <div className="alert alert-info max-w-xl mx-auto">Debes asignar tu RUT antes de registrar una Pyme.</div>

  return (
    <form className="card bg-base-100 shadow p-6 max-w-2xl mx-auto" onSubmit={submit}>
      <h1 className="text-2xl font-bold mb-4">Registrar Pyme</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="form-control">
          <span className="label-text">Nombre</span>
          <input className="input input-bordered" value={data.nombre} onChange={(e) => setData({ ...data, nombre: e.target.value })} />
        </label>
        <label className="form-control">
          <span className="label-text">RUT Empresa</span>
          <input className="input input-bordered" value={data.rut_empresa} onChange={(e) => setData({ ...data, rut_empresa: e.target.value })} />
        </label>
        <label className="form-control sm:col-span-2">
          <span className="label-text">Descripción</span>
          <textarea className="textarea textarea-bordered" value={data.descripcion} onChange={(e) => setData({ ...data, descripcion: e.target.value })} />
        </label>
        <label className="form-control">
          <span className="label-text">Dirección</span>
          <input className="input input-bordered" value={data.direccion} onChange={(e) => setData({ ...data, direccion: e.target.value })} />
        </label>
        <label className="form-control">
          <span className="label-text">Comuna</span>
          <select className="select select-bordered" value={data.comuna} onChange={(e) => setData({ ...data, comuna: e.target.value })}>
            <option value="">Selecciona comuna</option>
            {COMUNAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="form-control sm:col-span-2">
          <span className="label-text">Tipo de servicio (coma separada)</span>
          <input className="input input-bordered" value={data.tipo_servicio} onChange={(e) => setData({ ...data, tipo_servicio: e.target.value })} />
        </label>
        <div className="sm:col-span-2">
          <span className="label-text">Tipo de atención</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {ATENCION.map((opt) => (
              <button type="button" key={opt} onClick={() => toggleAtencion(opt)} className={`btn ${data.tipo_atencion.includes(opt) ? 'btn-primary' : 'btn-outline'}`}>{opt}</button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <span className="label-text">Comunas de cobertura</span>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-auto p-2 border rounded-box">
            {COMUNAS.map((c) => (
              <label key={c} className="flex items-center gap-2">
                <input type="checkbox" className="checkbox checkbox-sm" checked={data.comunas_cobertura.includes(c)} onChange={() => toggleCobertura(c)} />
                <span className="text-sm">{c}</span>
              </label>
            ))}
          </div>
        </div>
        <label className="form-control sm:col-span-2">
          <span className="label-text">Etiquetas (coma separada)</span>
          <input className="input input-bordered" value={data.etiquetas} onChange={(e) => setData({ ...data, etiquetas: e.target.value })} />
        </label>
        <label className="form-control sm:col-span-2">
          <span className="label-text">Redes (JSON)</span>
          <textarea className="textarea textarea-bordered" value={data.redes} onChange={(e) => setData({ ...data, redes: e.target.value })} />
        </label>
        <label className="form-control">
          <span className="label-text">Sitio web</span>
          <input className="input input-bordered" value={data.sitio_web} onChange={(e) => setData({ ...data, sitio_web: e.target.value })} />
        </label>
        <label className="form-control">
          <span className="label-text">Teléfono</span>
          <input className="input input-bordered" value={data.telefono} onChange={(e) => setData({ ...data, telefono: e.target.value })} />
        </label>
        <label className="form-control sm:col-span-2">
          <span className="label-text">Horario de atención</span>
          <input className="input input-bordered" value={data.horario_atencion} onChange={(e) => setData({ ...data, horario_atencion: e.target.value })} />
        </label>
        <label className="form-control sm:col-span-2">
          <span className="label-text">Imagen (URL)</span>
          <input className="input input-bordered" value={data.imagen} onChange={(e) => setData({ ...data, imagen: e.target.value })} />
        </label>
        <div className="sm:col-span-2">
          <span className="label-text">Ubicación en el mapa</span>
          <div className="mt-2">
            <MapPicker onPick={setCoords} />
          </div>
        </div>
      </div>
      {error ? <div className="text-error mt-3">{error}</div> : null}
      <div className="card-actions mt-4">
        <button className="btn btn-primary" type="submit" disabled={loading || !data.nombre || !data.rut_empresa}>{loading ? 'Guardando...' : 'Guardar pyme'}</button>
      </div>
    </form>
  )
}