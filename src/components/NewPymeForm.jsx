// c:\Users\Rinyeki\Documents\GitHub\ProyectoCapstone-Frontend\src\components\NewPymeForm.jsx
import React, { useState, useEffect, useRef } from 'react'
import { createPyme } from '../utils/fetch.js'

const ATENCION = ['Presencial','A Domicilio','Online']
const COMUNAS = ['Santiago','Providencia','Ñuñoa','Las Condes','Maipú','Puente Alto','La Florida','La Reina','Vitacura','Peñalolén']
export default function NewPymeForm() {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('independiente')
  const [rutEmpresa, setRutEmpresa] = useState('')
  const [comuna, setComuna] = useState('')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [tipoAtencion, setTipoAtencion] = useState([])
  const [tipoServicio, setTipoServicio] = useState('')
  const [comunasCobertura, setComunasCobertura] = useState([])
  const [latlng, setLatlng] = useState(null)
  const mapRef = useRef(null)
  const [userRut, setUserRut] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const load = () => {
      try {
        const token = localStorage.getItem('token') || ''
        const part = token.split('.')[1]
        if (part) {
          const payload = JSON.parse(decodeURIComponent(escape(atob(part.replace(/-/g,'+').replace(/_/g,'/')))))
          setUserRut(payload.rut_chileno || '')
        }
      } catch {}
    }
    load()
    const onStorage = (e) => { if (e && e.key === 'token') load() }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const init = () => {
      if (!window.L) return
      const map = window.L.map('new-pyme-map').setView([-33.45,-70.66], 12)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        setLatlng([lat, lng])
        window.L.marker([lat,lng]).addTo(map)
      })
      mapRef.current = map
    }
    const id = setInterval(() => { if (window.L) { clearInterval(id); init() } }, 100)
    return () => clearInterval(id)
  }, [])

  const submit = async () => {
    try {
      setLoading(true)
      setError('')
      setOk(false)
      const token = localStorage.getItem('token') || ''
      if (!token) throw new Error('Debes iniciar sesión')

      const payload = {
        nombre,
        comuna,
        direccion,
        telefono,
        es_independiente: tipo === 'independiente',
      }
      if (latlng && Array.isArray(latlng)) payload.longitud = `${latlng[0]},${latlng[1]}`
      if (tipoAtencion.length) payload.tipo_atencion = tipoAtencion
      if (tipoServicio) payload.tipo_servicio = tipoServicio.split(',').map((v)=>v.trim()).filter((v)=>v.length>0)
      if (comunasCobertura.length) payload.comunas_cobertura = comunasCobertura
      if (tipo === 'empresa') {
        if (!rutEmpresa) throw new Error('RUT de empresa es requerido')
        payload.rut_empresa = rutEmpresa
      }

      await createPyme(token, payload)
      setOk(true)
      window.location.href = '/'
    } catch (e) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Nombre</label>
        <input className="input input-bordered w-full" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Mi Pyme" />
      </div>

      <div>
        <label className="label">Tipo</label>
        <div className="flex gap-4">
          <label className="cursor-pointer flex items-center gap-2">
            <input type="radio" name="tipo" checked={tipo==='independiente'} onChange={() => setTipo('independiente')} />
            <span>Independiente</span>
          </label>
          <label className="cursor-pointer flex items-center gap-2">
            <input type="radio" name="tipo" checked={tipo==='empresa'} onChange={() => setTipo('empresa')} />
            <span>Empresa</span>
          </label>
        </div>
      </div>

      {tipo === 'empresa' && (
        <div>
          <label className="label">RUT de empresa</label>
          <input className="input input-bordered w-full" value={rutEmpresa} onChange={(e) => setRutEmpresa(e.target.value)} placeholder="76123456-7" />
        </div>
      )}

      <div>
        <label className="label">Comuna</label>
        <select className="select select-bordered w-full" value={comuna} onChange={(e)=>setComuna(e.target.value)}>
          <option value="">Selecciona una comuna</option>
          {COMUNAS.map((c)=>(<option key={c} value={c}>{c}</option>))}
        </select>
      </div>

      <div>
        <label className="label">Dirección</label>
        <input className="input input-bordered w-full" value={direccion} onChange={(e)=>setDireccion(e.target.value)} placeholder="Av. Siempre Viva 123" />
      </div>

      <div>
        <label className="label">Teléfono</label>
        <input className="input input-bordered w-full" value={telefono} onChange={(e)=>setTelefono(e.target.value)} placeholder="+56 9 1234 5678" />
      </div>

      <div>
        <label className="label">Tipo de atención</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {ATENCION.map((opt)=> (
            <button
              key={opt}
              type="button"
              onClick={()=> setTipoAtencion(prev => prev.includes(opt) ? prev.filter(v=>v!==opt) : [...prev,opt])}
              className={`btn ${tipoAtencion.includes(opt) ? 'btn-primary' : 'btn-outline'}`}
            >{opt}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Tipo de servicio (separado por comas)</label>
        <input className="input input-bordered w-full" value={tipoServicio} onChange={(e)=>setTipoServicio(e.target.value)} placeholder="Panadería, Pastelería" />
      </div>

      <div>
        <label className="label">Comunas de cobertura</label>
        <select multiple className="select select-bordered w-full h-32" value={comunasCobertura} onChange={(e)=> setComunasCobertura(Array.from(e.target.selectedOptions).map(o=>o.value))}>
          {COMUNAS.map((c)=>(<option key={c} value={c}>{c}</option>))}
        </select>
      </div>

      <div className="mt-4">
        <label className="label">Ubicación en mapa</label>
        <div id="new-pyme-map" className="w-full h-[300px] rounded-box overflow-hidden" />
        <div className="text-sm opacity-70 mt-2">Haz clic en el mapa para fijar la ubicación. Se guardará como "lat,lng".</div>
      </div>

      {(!userRut) ? (
        <div className="text-error">Debe asignar su RUT antes de crear pymes</div>
      ) : null}
      {error ? <div className="text-error">{error}</div> : null}
      {ok ? <div className="text-success">Creada</div> : null}

      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={submit} disabled={loading || !userRut}>
          {loading ? 'Guardando...' : 'Registrar'}
        </button>
        {!userRut ? (
          <button type="button" className="btn" onClick={()=> { localStorage.setItem('requiresRut','true'); window.location.href = window.location.pathname + '?rut=1' }}>Asignar RUT</button>
        ) : null}
      </div>
    </div>
  )
}