
import React, { useEffect, useState, useRef } from 'react'
import { getUsuario, getUsuarioPymes, updateName, changePassword, requestEmailChange, confirmEmailChange, updatePyme, deletePyme } from '../utils/fetch.js'
const ATENCION = ['Presencial','A Domicilio','Online']
const COMUNAS = ['Santiago','Cerrillos','Cerro Navia','Conchalí','El Bosque','Estación Central','Huechuraba','Independencia','La Cisterna','La Florida','La Granja','La Pintana','La Reina','Las Condes','Lo Barnechea','Lo Espejo','Lo Prado','Macul','Maipú','Ñuñoa','Pedro Aguirre Cerda','Peñalolén','Providencia','Pudahuel','Quilicura','Quinta Normal','Recoleta','Renca','San Joaquín','San Miguel','San Ramón','Vitacura','Colina','Lampa','Tiltil','Puente Alto','Pirque','San José de Maipo','San Bernardo','Buin','Paine','Calera de Tango','Melipilla','Curacaví','María Pinto','San Pedro','Alhué','Talagante','El Monte','Isla de Maipo','Padre Hurtado','Peñaflor']
const TAGS_MAIN = ['Cafetería','Peluquería','Panadería','Pastelería','Farmacia','Veterinaria','Ferretería','Otra']

export default function PerfilClient() {
  const [token, setToken] = useState('')
  const [user, setUser] = useState(null)
  const [pymes, setPymes] = useState([])
  const [activePymeId, setActivePymeId] = useState(null)
  const [activePyme, setActivePyme] = useState(null)
  const [activeTab, setActiveTab] = useState('cuenta')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [nuevoCorreo, setNuevoCorreo] = useState('')
  const [tokenCorreo, setTokenCorreo] = useState('')
  const [searchAddr, setSearchAddr] = useState('')
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    const t = localStorage.getItem('token') || ''
    setToken(t)
    let id = null
    try { id = JSON.parse(atob(t.split('.')[1] || ''))?.id } catch {}
    if (!id) return
    getUsuario(t, id).then(setUser)
    getUsuarioPymes(t, id).then((list) => {
      setPymes(Array.isArray(list) ? list : [])
      const first = Array.isArray(list) && list.length ? list[0] : null
      setActivePymeId(first ? first.id : null)
      setActivePyme(first || null)
    })
  }, [])

  useEffect(() => {
    const found = pymes.find(p => p.id === activePymeId)
    setActivePyme(found || null)
  }, [activePymeId, pymes])

  useEffect(() => {
    const init = () => {
      if (!window.L || !activePyme) return
      const map = window.L.map('edit-pyme-map').setView([-33.45,-70.66], 12)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
      const setMarker = (lat, lng) => {
        if (markerRef.current) markerRef.current.remove()
        markerRef.current = window.L.marker([lat, lng]).addTo(map)
      }
      if (activePyme.longitud) {
        const parts = String(activePyme.longitud).split(',')
        const lat = Number(parts[0]), lng = Number(parts[1])
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) { map.setView([lat, lng], 14); setMarker(lat, lng) }
      }
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng
        updateActive('longitud', `${lat},${lng}`)
        setMarker(lat, lng)
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es&addressdetails=1`
          const res = await fetch(url, { headers: { 'User-Agent': 'CapstoneApp/1.0' } })
          const data = await res.json()
          const addr = data && data.display_name ? data.display_name : ''
          updateActive('direccion', addr)
        } catch {}
      })
      mapRef.current = map
    }
    const id = setInterval(() => { if (window.L) { clearInterval(id); init() } }, 100)
    return () => clearInterval(id)
  }, [activePymeId, activePyme])

  function updateActive(field, value) {
    setActivePyme(prev => ({ ...(prev || {}), [field]: value }))
  }

  function actualizarNombre() {
    updateName(token, { nombre: nuevoNombre }).then(res => {
      if (res && res.token) { localStorage.setItem('token', res.token); setToken(res.token) }
    }).catch(()=>{})
  }

  function cambiarPassword() {
    changePassword(token, { oldPassword: oldPass, newPassword: newPass }).catch(()=>{})
  }

  function solicitarCambioCorreo() {
    requestEmailChange(token, { nuevo_correo: nuevoCorreo }).catch(()=>{})
  }

  function confirmarCambioCorreo() {
    confirmEmailChange(token, { emailToken: tokenCorreo }).then(res => {
      if (res && res.token) { localStorage.setItem('token', res.token); setToken(res.token) }
    }).catch(()=>{})
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    const promises = files.slice(0,6).map(file => new Promise((resolve)=>{
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(file)
    }))
    Promise.all(promises).then(urls => {
      const current = Array.isArray(activePyme?.imagenes_url) ? activePyme.imagenes_url : []
      updateActive('imagenes_url', [...current, ...urls])
    })
  }

  function guardarPyme() {
    if (!activePyme) return
    updatePyme(token, activePyme.id, activePyme).catch(()=>{})
  }

  function borrarPyme() {
    if (!activePyme) return
    deletePyme(token, activePyme.id).then(() => { setPymes(prev => prev.filter(x => x.id !== activePyme.id)); setActivePymeId(null); setActivePyme(null) }).catch(()=>{})
  }

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
      <aside className="card bg-base-100 shadow">
        <div className="p-4 border-b">
          <h4 className="text-lg font-semibold">Mis Pymes</h4>
        </div>
        <ul className="menu menu-vertical p-2">
          {pymes.map(p => (
            <li key={p.id}>
              <button className={`${activePymeId===p.id?'active':''}`}
                onClick={() => { setActivePymeId(p.id); setActiveTab('pyme') }}>
                <span className="truncate">{p.nombre}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main className="space-y-6">
        <div className="tabs tabs-lifted">
          <button className={`tab ${activeTab==='cuenta'?'tab-active':''}`} onClick={()=>setActiveTab('cuenta')}>Cuenta</button>
          <button className={`tab ${activeTab==='pyme'?'tab-active':''}`} onClick={()=>setActiveTab('pyme')}>Pyme</button>
        </div>

        {activeTab==='cuenta' && (
          <>
            <div className="card bg-base-100 shadow p-4">
              <h3 className="text-lg font-semibold mb-2">Cambiar nombre</h3>
              <div className="join">
                <input className="input input-bordered join-item" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder={user?.nombre || ''} />
                <button className="btn btn-primary join-item" onClick={actualizarNombre}>Guardar</button>
              </div>
            </div>
            <div className="card bg-base-100 shadow p-4">
              <h3 className="text-lg font-semibold mb-2">Cambiar contraseña</h3>
              <div className="join">
                <input type="password" className="input input-bordered join-item" value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="Actual" />
                <input type="password" className="input input-bordered join-item" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Nueva" />
                <button className="btn join-item" onClick={cambiarPassword}>Guardar</button>
              </div>
            </div>
            <div className="card bg-base-100 shadow p-4">
              <h3 className="text-lg font-semibold mb-2">Cambiar correo</h3>
              <div className="join join-vertical md:join-horizontal gap-2">
                <input type="email" className="input input-bordered join-item" value={nuevoCorreo} onChange={e => setNuevoCorreo(e.target.value)} placeholder={user?.correo || ''} />
                <button className="btn join-item" onClick={solicitarCambioCorreo}>Enviar token</button>
                <input className="input input-bordered join-item" value={tokenCorreo} onChange={e => setTokenCorreo(e.target.value)} placeholder="Token recibido" />
                <button className="btn join-item" onClick={confirmarCambioCorreo}>Confirmar</button>
              </div>
            </div>
          </>
        )}

        {activeTab==='pyme' && activePyme && (
          <div className="card bg-base-100 shadow p-4">
            <h3 className="text-xl font-semibold mb-4">Editar Pyme</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="form-control">
                <label className="label"><span className="label-text">Nombre</span></label>
                <input className="input input-bordered" value={activePyme.nombre || ''} onChange={e => updateActive('nombre', e.target.value)} />
              </div>
              <div className="form-control md:col-span-2">
                <label className="label"><span className="label-text">Dirección</span></label>
                <input className="input input-bordered" value={activePyme.direccion || ''} onChange={e => updateActive('direccion', e.target.value)} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Teléfono</span></label>
                <input className="input input-bordered" value={activePyme.telefono || ''} onChange={e => updateActive('telefono', e.target.value)} />
              </div>
              <div className="form-control md:col-span-2">
                <label className="label"><span className="label-text">Descripción</span></label>
                <textarea className="textarea textarea-bordered" rows={3} value={activePyme.descripcion || ''} onChange={e => updateActive('descripcion', e.target.value)} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Horario de atención</span></label>
                <input className="input input-bordered" value={activePyme.horario_atencion || ''} onChange={e => updateActive('horario_atencion', e.target.value)} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Sitio web</span></label>
                <input className="input input-bordered" value={activePyme.sitio_web || ''} onChange={e => updateActive('sitio_web', e.target.value)} />
              </div>
            </div>

            <div className="mt-4">
              <label className="label"><span className="label-text">Buscar dirección</span></label>
              <div className="join">
                <input className="input input-bordered join-item" value={searchAddr} onChange={(e)=>setSearchAddr(e.target.value)} placeholder="Busca una dirección" />
                <button className="btn join-item" type="button" onClick={async ()=>{
                  try {
                    if (!searchAddr.trim()) return
                    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddr)}&limit=1&accept-language=es&countrycodes=cl`
                    const res = await fetch(url, { headers: { 'User-Agent': 'CapstoneApp/1.0' } })
                    const data = await res.json()
                    if (Array.isArray(data) && data.length) {
                      const { lat, lon, display_name } = data[0]
                      const latNum = Number(lat), lonNum = Number(lon)
                      updateActive('longitud', `${latNum},${lonNum}`)
                      updateActive('direccion', display_name || searchAddr)
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

            <div className="mt-4">
              <label className="label"><span className="label-text">Imágenes</span></label>
              <div className="flex gap-2">
                <input id="edit-file-input" type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} />
                <button type="button" className="btn" onClick={()=>{ const el=document.getElementById('edit-file-input'); el && el.click() }}>Subir imágenes</button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(Array.isArray(activePyme.imagenes_url)?activePyme.imagenes_url:[]).map((src,i)=>(<img key={i} src={src} alt="preview" className="rounded-box h-24 w-full object-cover" />))}
              </div>
            </div>

            <div className="mt-4">
              <label className="label"><span className="label-text">Ubicación en mapa</span></label>
              <div id="edit-pyme-map" className="w-full h-[300px] rounded-box overflow-hidden" />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label"><span className="label-text">Etiqueta principal</span></label>
                <select className="select select-bordered" value={(Array.isArray(activePyme.tipo_servicio)&&activePyme.tipo_servicio[0])||''} onChange={(e)=>updateActive('tipo_servicio', e.target.value ? [e.target.value] : [])}>
                  <option value="">Sin etiqueta</option>
                  {TAGS_MAIN.map(t => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Tipo de atención</span></label>
                <div className="flex flex-wrap gap-2">
                  {ATENCION.map(opt => (
                    <button key={opt} type="button" className={`btn ${Array.isArray(activePyme.tipo_atencion)&&activePyme.tipo_atencion.includes(opt)?'btn-primary':'btn-outline'}`} onClick={() => {
                      const current = Array.isArray(activePyme.tipo_atencion)?activePyme.tipo_atencion:[]
                      const next = current.includes(opt) ? current.filter(v=>v!==opt) : [...current, opt]
                      updateActive('tipo_atencion', next)
                    }}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="label"><span className="label-text">Etiquetas principales</span></label>
              <div className="flex flex-wrap gap-2">
                {TAGS_MAIN.map(t => {
                  const current = Array.isArray(activePyme.etiquetas)?activePyme.etiquetas:[]
                  const selected = current.includes(t)
                  return (
                    <button key={t} type="button" className={`btn ${selected?'btn-primary':'btn-outline'}`} onClick={() => {
                      const next = selected ? current.filter(v=>v!==t) : [...current, t]
                      updateActive('etiquetas', next)
                    }}>{t}</button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4">
              <label className="label"><span className="label-text">Etiquetas personalizadas</span></label>
              <input className="input input-bordered" value={(Array.isArray(activePyme.etiquetas)?activePyme.etiquetas:[]).filter(t=>!TAGS_MAIN.includes(t)).join(', ')} onChange={e => {
                const main = (Array.isArray(activePyme.etiquetas)?activePyme.etiquetas:[]).filter(t=>TAGS_MAIN.includes(t))
                const custom = e.target.value.split(',').map(s=>s.trim()).filter(Boolean)
                updateActive('etiquetas', [...main, ...custom])
              }} placeholder="Estilo coreano, Repostería creativa" />
            </div>

            <div className="mt-4">
              <label className="label"><span className="label-text">Comunas de cobertura</span></label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-auto p-2 border rounded-box">
                {COMUNAS.map(c => {
                  const current = Array.isArray(activePyme.comunas_cobertura)?activePyme.comunas_cobertura:[]
                  const checked = current.includes(c)
                  return (
                    <label key={c} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="checkbox" checked={checked} onChange={(e)=>{
                        const next = e.target.checked ? [...current, c] : current.filter(v=>v!==c)
                        updateActive('comunas_cobertura', next)
                      }} />
                      <span>{c}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="mt-4">
              <label className="label"><span className="label-text">Redes</span></label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input className="input input-bordered" placeholder="Instagram" value={activePyme.redes?.instagram || ''} onChange={e => updateActive('redes', { ...(activePyme.redes||{}), instagram: e.target.value })} />
                <input className="input input-bordered" placeholder="Facebook" value={activePyme.redes?.facebook || ''} onChange={e => updateActive('redes', { ...(activePyme.redes||{}), facebook: e.target.value })} />
                <input className="input input-bordered" placeholder="Twitter" value={activePyme.redes?.twitter || ''} onChange={e => updateActive('redes', { ...(activePyme.redes||{}), twitter: e.target.value })} />
                <input className="input input-bordered" placeholder="TikTok" value={activePyme.redes?.tiktok || ''} onChange={e => updateActive('redes', { ...(activePyme.redes||{}), tiktok: e.target.value })} />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button className="btn btn-primary" onClick={guardarPyme}>Guardar cambios</button>
              <button className="btn btn-outline" onClick={borrarPyme}>Borrar pyme</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}