import React, { useState, useEffect, useRef } from 'react'
import { createPyme, getUsuario } from '../utils/fetch.js'

const ATENCION = ['Presencial','A Domicilio','Online']
const COMUNAS = [
  'Santiago','Cerrillos','Cerro Navia','Conchalí','El Bosque','Estación Central','Huechuraba','Independencia','La Cisterna','La Florida','La Granja','La Pintana','La Reina','Las Condes','Lo Barnechea','Lo Espejo','Lo Prado','Macul','Maipú','Ñuñoa','Pedro Aguirre Cerda','Peñalolén','Providencia','Pudahuel','Quilicura','Quinta Normal','Recoleta','Renca','San Joaquín','San Miguel','San Ramón','Vitacura','Colina','Lampa','Tiltil','Puente Alto','Pirque','San José de Maipo','San Bernardo','Buin','Paine','Calera de Tango','Melipilla','Curacaví','María Pinto','San Pedro','Alhué','Talagante','El Monte','Isla de Maipo','Padre Hurtado','Peñaflor'
]
export default function NewPymeForm() {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('independiente')
  const [rutEmpresa, setRutEmpresa] = useState('')
  const [comuna, setComuna] = useState('')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [tipoAtencion, setTipoAtencion] = useState([])

  const [comunasCobertura, setComunasCobertura] = useState([])
  const [imagenes, setImagenes] = useState([])
  const [descripcion, setDescripcion] = useState('')
  const [horario, setHorario] = useState('')
  const [sitioWeb, setSitioWeb] = useState('')
  const [redesMap, setRedesMap] = useState({ instagram:'', facebook:'', twitter:'', tiktok:'' })
  const [etiquetasMain, setEtiquetasMain] = useState([])
  const [etiquetasPersonal, setEtiquetasPersonal] = useState('')
  const [latlng, setLatlng] = useState(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [userRut, setUserRut] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ show:false, type:'success', msg:'' })
  const [dragIdx, setDragIdx] = useState(null)

  useEffect(() => {
    const fetchRut = async () => {
      try {
        const token = localStorage.getItem('token') || ''
        const part = token.split('.')[1]
        if (!part) return
        const payload = JSON.parse(decodeURIComponent(escape(atob(part.replace(/-/g,'+').replace(/_/g,'/')))))
        const rut = payload.rut_chileno || ''
        if (rut) {
          setUserRut(rut)
          localStorage.setItem('requiresRut','false')
          return
        }
        const user = await getUsuario(token, payload.id)
        if (user && user.rut_chileno) {
          setUserRut(user.rut_chileno)
          localStorage.setItem('requiresRut','false')
        }
      } catch {}
    }
    fetchRut()
    const onStorage = (e) => { if (e && e.key === 'token') fetchRut() }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const init = () => {
      if (!window.L) return
      const map = window.L.map('new-pyme-map').setView([-33.45,-70.66], 12)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
      const setMarker = (lat, lng) => {
        if (markerRef.current) markerRef.current.remove()
        markerRef.current = window.L.marker([lat, lng]).addTo(map)
      }
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng
        setLatlng([lat, lng])
        setMarker(lat, lng)
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es&addressdetails=1`
          const res = await fetch(url, { headers: { 'User-Agent': 'CapstoneApp/1.0' } })
          const data = await res.json()
          const addr = data && data.display_name ? data.display_name : ''
          setDireccion(addr)
        } catch {}
      })
      mapRef.current = map
    }
    const id = setInterval(() => { if (window.L) { clearInterval(id); init() } }, 100)
    return () => clearInterval(id)
  }, [])

  const notify = (msg,type='success') => { setToast({ show:true, type, msg }); setTimeout(()=> setToast(prev=>({...prev, show:false})), 3000) }

  const submit = async () => {
    try {
      setLoading(true)
      setError('')
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

      if (comunasCobertura.length) payload.comunas_cobertura = comunasCobertura
      if (imagenes.length) payload.imagenes_url = imagenes
      if (descripcion) payload.descripcion = descripcion
      if (horario) payload.horario_atencion = horario
      if (sitioWeb) payload.sitio_web = sitioWeb
      const redesObj = Object.entries(redesMap).reduce((acc,[k,v])=>{ if (v && v.trim()) acc[k]=v.trim(); return acc },{})
      if (Object.keys(redesObj).length) payload.redes = redesObj
      const etiquetas = [...etiquetasMain, ...etiquetasPersonal.split(',').map(v=>v.trim()).filter(v=>v.length>0)]
      if (etiquetas.length) payload.etiquetas = etiquetas
      if (tipo === 'empresa') {
        if (!rutEmpresa) throw new Error('RUT de empresa es requerido')
        payload.rut_empresa = rutEmpresa
      }

      await createPyme(token, payload)
      notify('Pyme registrada')
      window.location.href = '/'
    } catch (e) {
      setError(e.message || 'Error')
      notify(e.message || 'Error al registrar','error')
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
        <div className="flex gap-2">
          <input className="input input-bordered flex-1" value={direccion} onChange={(e)=>setDireccion(e.target.value)} placeholder="Av. Siempre Viva 123, Santiago" />
          <button type="button" className="btn" onClick={async ()=>{
            try {
              if (!direccion.trim()) return
              const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}&limit=1&accept-language=es&countrycodes=cl`
              const res = await fetch(url, { headers: { 'User-Agent': 'CapstoneApp/1.0' } })
              const data = await res.json()
              if (Array.isArray(data) && data.length) {
                const { lat, lon, display_name } = data[0]
                const latNum = Number(lat), lonNum = Number(lon)
                setLatlng([latNum, lonNum])
                setDireccion(display_name || direccion)
                if (mapRef.current) {
                  mapRef.current.setView([latNum, lonNum], 16)
                  if (markerRef.current) markerRef.current.remove()
                  markerRef.current = window.L.marker([latNum, lonNum]).addTo(mapRef.current)
                }
              }
            } catch {}
          }}>Buscar</button>
        </div>
        <div className="text-sm opacity-70 mt-1">Buscar actualiza el pin del mapa; hacer clic en el mapa también rellena la dirección.</div>
      </div>
      
      <div>
        <label className="label">Imágenes</label>
        <div className="flex gap-2">
          <input id="file-input-hidden" type="file" multiple accept="image/*" className="hidden" onChange={async (e)=>{
            const files = Array.from(e.target.files || [])
            const promises = files.slice(0,6).map(file => new Promise((resolve)=>{
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result)
              reader.readAsDataURL(file)
            }))
            const urls = await Promise.all(promises)
            setImagenes(urls)
          }} />
          <button type="button" className="btn" onClick={()=>{ const el=document.getElementById('file-input-hidden'); el && el.click() }}>Subir imágenes</button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {imagenes.map((src,i)=>(
            <div key={i} className="relative group" draggable onDragStart={()=>setDragIdx(i)} onDragOver={(e)=>e.preventDefault()} onDrop={()=>{
              if (dragIdx===null || dragIdx===i) return; const arr=[...imagenes]; const [m]=arr.splice(dragIdx,1); arr.splice(i,0,m); setImagenes(arr); setDragIdx(null)
            }}>
              <img src={src} alt="preview" className="rounded-box h-24 w-full object-cover" />
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100">
                <button type="button" className="btn btn-xs" onClick={()=>{
                  const j = i-1; if (j<0) return; const arr=[...imagenes]; [arr[i],arr[j]]=[arr[j],arr[i]]; setImagenes(arr)
                }}>↑</button>
                <button type="button" className="btn btn-xs" onClick={()=>{
                  const j = i+1; if (j>=imagenes.length) return; const arr=[...imagenes]; [arr[i],arr[j]]=[arr[j],arr[i]]; setImagenes(arr)
                }}>↓</button>
                <button type="button" className="btn btn-xs btn-error" onClick={()=>{
                  const arr=[...imagenes]; arr.splice(i,1); setImagenes(arr)
                }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Ubicación en mapa</label>
        <div id="new-pyme-map" className="w-full h-[300px] rounded-box overflow-hidden" />
        <div className="text-sm opacity-70 mt-2">Haz clic en el mapa para fijar la ubicación. Se guardará como "lat,lng".</div>
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
        <label className="label">Descripción</label>
        <textarea className="textarea textarea-bordered w-full" rows={3} value={descripcion} onChange={(e)=>setDescripcion(e.target.value)} placeholder="Describe tu pyme" />
      </div>

      <div>
        <label className="label">Horario de atención</label>
        <input className="input input-bordered w-full" value={horario} onChange={(e)=>setHorario(e.target.value)} placeholder="Lunes a Viernes, 9:00 - 18:00" />
      </div>

      <div>
        <label className="label">Sitio web</label>
        <input className="input input-bordered w-full" value={sitioWeb} onChange={(e)=>setSitioWeb(e.target.value)} placeholder="https://www.mi-sitio.cl" />
      </div>

      <div>
        <label className="label">Redes</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="input input-bordered" placeholder="Instagram" value={redesMap.instagram} onChange={(e)=>setRedesMap(v=>({ ...v, instagram: e.target.value }))} />
          <input className="input input-bordered" placeholder="Facebook" value={redesMap.facebook} onChange={(e)=>setRedesMap(v=>({ ...v, facebook: e.target.value }))} />
          <input className="input input-bordered" placeholder="Twitter" value={redesMap.twitter} onChange={(e)=>setRedesMap(v=>({ ...v, twitter: e.target.value }))} />
          <input className="input input-bordered" placeholder="TikTok" value={redesMap.tiktok} onChange={(e)=>setRedesMap(v=>({ ...v, tiktok: e.target.value }))} />
        </div>
      </div>

      <div>
        <label className="label">Etiquetas principales</label>
        <div className="flex flex-wrap gap-2">
          {['Cafetería','Peluquería','Panadería','Pastelería','Farmacia','Veterinaria','Ferretería','Otra'].map((t)=> (
            <button key={t} type="button" onClick={()=> setEtiquetasMain(prev => prev.includes(t) ? prev.filter(v=>v!==t) : [...prev, t])} className={`btn ${etiquetasMain.includes(t) ? 'btn-primary' : 'btn-outline'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Etiquetas personalizadas (separadas por comas)</label>
        <input className="input input-bordered w-full" value={etiquetasPersonal} onChange={(e)=>setEtiquetasPersonal(e.target.value)} placeholder="Estilo coreano, Repostería creativa" />
      </div>

      <div>
        <label className="label">Comunas de cobertura</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-auto p-2 border rounded-box">
          {COMUNAS.map((c)=> (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox"
                checked={comunasCobertura.includes(c)}
                onChange={(e)=> setComunasCobertura(prev => e.target.checked ? [...prev, c] : prev.filter(v=>v!==c))}
              />
              <span>{c}</span>
            </label>
          ))}
        </div>
      </div>

      {(!userRut) ? (
        <div className="text-error">Debe asignar su RUT antes de crear pymes</div>
      ) : null}
      {error ? <div className="text-error">{error}</div> : null}

      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={submit} disabled={loading || !userRut}>
          {loading ? 'Guardando...' : 'Registrar'}
        </button>
        {!userRut ? (
          <button type="button" className="btn" onClick={()=> { localStorage.setItem('requiresRut','true'); window.location.href = window.location.pathname + '?rut=1' }}>Asignar RUT</button>
        ) : null}
      </div>

      {toast.show && (
        <div className="toast toast-top toast-end">
          <div className={`alert ${toast.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  )
}