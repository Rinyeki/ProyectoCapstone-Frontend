import React, { useEffect, useState, useRef } from 'react'
import { listUsuarios, listPymes, updatePyme } from '../utils/fetch.js'

const ATENCION = ['Presencial','A Domicilio','Online']
const COMUNAS = ['Santiago','Cerrillos','Cerro Navia','Conchalí','El Bosque','Estación Central','Huechuraba','Independencia','La Cisterna','La Florida','La Granja','La Pintana','La Reina','Las Condes','Lo Barnechea','Lo Espejo','Lo Prado','Macul','Maipú','Ñuñoa','Pedro Aguirre Cerda','Peñalolén','Providencia','Pudahuel','Quilicura','Quinta Normal','Recoleta','Renca','San Joaquín','San Miguel','San Ramón','Vitacura','Colina','Lampa','Tiltil','Puente Alto','Pirque','San José de Maipo','San Bernardo','Buin','Paine','Calera de Tango','Melipilla','Curacaví','María Pinto','San Pedro','Alhué','Talagante','El Monte','Isla de Maipo','Padre Hurtado','Peñaflor']
const TAGS_MAIN = ['Cafetería','Peluquería','Panadería','Pastelería','Farmacia','Veterinaria','Ferretería','Otra']

export default function AdminProfile() {
  const [token, setToken] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('pyme')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 10
  const [hasNext, setHasNext] = useState(false)
  const [totalPages, setTotalPages] = useState(null)
  const [pymes, setPymes] = useState([])
  const [activePymeId, setActivePymeId] = useState(null)
  const [activePyme, setActivePyme] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [uPage, setUPage] = useState(0)
  const uPageSize = 10
  const [uSearch, setUSearch] = useState('')
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [searchAddr, setSearchAddr] = useState('')
  const [toast, setToast] = useState({ show: false, type: 'success', msg: '' })

  useEffect(() => {
    const t = localStorage.getItem('token') || ''
    setToken(t)
    let payload = null
    try {
      payload = JSON.parse(decodeURIComponent(escape(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))))
    } catch {}
    const admin = payload && payload.rol === 'administrador'
    setIsAdmin(!!admin)
    if (!admin) { setToast({ show: true, type: 'error', msg: 'No autorizado' }) }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const curr = await listPymes(token, { limit: pageSize, offset: page * pageSize })
        const arr = Array.isArray(curr) ? curr : []
        if (cancelled) return
        setPymes(arr)
        const first = arr.length ? arr[0] : null
        setActivePymeId(first ? first.id : null)
        setActivePyme(first || null)
        try {
          const nxt = await listPymes(token, { limit: pageSize, offset: (page+1) * pageSize })
          const nxtArr = Array.isArray(nxt) ? nxt : []
          if (cancelled) return
          const nextExists = nxtArr.length > 0
          setHasNext(nextExists)
          if (!nextExists) setTotalPages(page + 1)
          else setTotalPages(null)
        } catch {
          setHasNext(false)
          setTotalPages(page + 1)
        }
      } catch {
        if (cancelled) return
        setPymes([])
        setHasNext(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token, page])

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    listUsuarios(token).then((data)=>{
      if (cancelled) return
      setUsuarios(Array.isArray(data) ? data : [])
    }).catch(()=>{ if (!cancelled) setUsuarios([]) })
    return () => { cancelled = true }
  }, [token, isAdmin])

  useEffect(() => {
    const found = pymes.find(p => p.id === activePymeId)
    setActivePyme(found || null)
  }, [activePymeId, pymes])

  useEffect(() => {
    const init = () => {
      if (!window.L || !activePyme) return
      const map = window.L.map('admin-edit-pyme-map').setView([-33.45,-70.66], 12)
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

  function notify(msg, type='success') { setToast({ show: true, type, msg }); setTimeout(()=> setToast(prev=> ({...prev, show: false})), 3000) }
  function updateActive(field, value) { setActivePyme(prev => ({ ...(prev || {}), [field]: value })) }

  function guardarPyme() {
    if (!activePyme) return
    updatePyme(token, activePyme.id, activePyme)
      .then(()=> notify('Cambios guardados'))
      .catch(()=> notify('Error al guardar','error'))
  }

  const filtered = pymes.filter(p => String(p.nombre||'').toLowerCase().includes(String(search||'').toLowerCase()))

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
      <aside className="card bg-base-100 shadow">
        <div className="p-4 border-b">
          <input className="input input-bordered w-full" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar pyme por nombre" />
        </div>
        <div className="p-2">
          <ul className="menu menu-vertical max-h-[720px] overflow-auto">
            {filtered.slice(0, pageSize).map(p => (
              <li key={p.id} className="py-1">
                <button className={`${activePymeId===p.id?'active':''}`} onClick={() => { setActivePymeId(p.id); setActiveTab('pyme') }}>
                  <span className="truncate">{p.nombre}</span>
                </button>
              </li>
            ))}
          </ul>
          {isAdmin ? (
            <div className="mt-3 flex items-center gap-2 justify-between">
              <div className="flex gap-2">
                <button className="btn" disabled={page===0} onClick={()=> setPage(p=> Math.max(0,p-1))}>Anterior</button>
                <button className="btn" disabled={!hasNext} onClick={()=> setPage(p=> p+1)}>Siguiente</button>
              </div>
              <div className="text-sm opacity-70">Página {page+1}{totalPages ? ` / ${totalPages}` : ''}</div>
            </div>
          ) : null}
        </div>
      </aside>
      <main className="space-y-6">
        <div className="tabs tabs-lifted">
          <button className={`tab ${activeTab==='pyme'?'tab-active':''}`} onClick={()=>setActiveTab('pyme')}>Pyme</button>
          <button className={`tab ${activeTab==='usuarios'?'tab-active':''}`} onClick={()=>setActiveTab('usuarios')}>Usuarios</button>
        </div>

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
              <div className="form-control md:col-span-3">
                <label className="label"><span className="label-text">Horario de atención</span></label>
                <ScheduleEditor value={activePyme.horario_atencion || ''} onChange={(v)=> updateActive('horario_atencion', v)} />
                <div className="text-sm opacity-70 mt-1">Se generará un texto estandarizado como "Lunes, Martes, Miércoles, 09:00-18:00".</div>
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
            </div>

            <div className="mt-4">
              <label className="label"><span className="label-text">Imágenes</span></label>
              <div className="flex gap-2">
                <input id="admin-file-input" type="file" multiple accept="image/*" className="hidden" onChange={(e)=>{
                  const files = Array.from(e.target.files || [])
                  const promises = files.slice(0,6).map(file => new Promise((resolve)=>{
                    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(file)
                  }))
                  Promise.all(promises).then(urls => {
                    const current = Array.isArray(activePyme?.imagenes_url) ? activePyme.imagenes_url : []
                    updateActive('imagenes_url', [...current, ...urls])
                  })
                }} />
                <button type="button" className="btn" onClick={()=>{ const el=document.getElementById('admin-file-input'); el && el.click() }}>Subir imágenes</button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(Array.isArray(activePyme.imagenes_url)?activePyme.imagenes_url:[]).map((src,i)=>(
                  <div key={i} className="relative group">
                    <img src={src} alt="preview" className="rounded-box h-24 w-full object-cover" />
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100">
                      <button type="button" className="btn btn-xs" onClick={()=>{
                        const arr = Array.isArray(activePyme?.imagenes_url) ? [...activePyme.imagenes_url] : []
                        const j = i - 1; if (j >= 0) { const tmp = arr[j]; arr[j] = arr[i]; arr[i] = tmp; updateActive('imagenes_url', arr) }
                      }}>↑</button>
                      <button type="button" className="btn btn-xs" onClick={()=>{
                        const arr = Array.isArray(activePyme?.imagenes_url) ? [...activePyme.imagenes_url] : []
                        const j = i + 1; if (j < arr.length) { const tmp = arr[j]; arr[j] = arr[i]; arr[i] = tmp; updateActive('imagenes_url', arr) }
                      }}>↓</button>
                      <button type="button" className="btn btn-xs btn-error" onClick={()=>{
                        const arr = Array.isArray(activePyme?.imagenes_url) ? [...activePyme.imagenes_url] : []
                        arr.splice(i,1); updateActive('imagenes_url', arr)
                      }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="label"><span className="label-text">Ubicación en mapa</span></label>
              <div id="admin-edit-pyme-map" className="w-full h-[300px] rounded-box overflow-hidden" />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label"><span className="label-text">Etiqueta principal</span></label>
                <select className="select select-bordered" value={(Array.isArray(activePyme.etiquetas)&&activePyme.etiquetas[0])||((Array.isArray(activePyme.tipo_servicio)&&activePyme.tipo_servicio[0])||'')} onChange={(e)=>{
                  const val = e.target.value
                  updateActive('tipo_servicio', val ? [val] : [])
                  const current = Array.isArray(activePyme.etiquetas)?activePyme.etiquetas:[]
                  const rest = current.filter(v=>v!==val)
                  updateActive('etiquetas', val ? [val, ...rest] : rest)
                }}>
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
                  const principal = current[0]
                  const rest = current.slice(1)
                  const selected = current.includes(t)
                  let nextPrincipal = principal
                  let nextRest = [...rest]
                  return (
                    <button key={t} type="button" className={`btn ${selected?'btn-primary':'btn-outline'}`} onClick={() => {
                      const cur = Array.isArray(activePyme.etiquetas)?activePyme.etiquetas:[]
                      const principal2 = cur[0]; const rest2 = cur.slice(1)
                      let np = principal2; let nr = [...rest2]
                      if (selected) {
                        if (t === principal2) { np = '' } else { nr = nr.filter(v=>v!==t) }
                      } else {
                        if (!principal2) { np = t } else if (t !== principal2) { nr = [...nr.filter(v=>v!==t), t] }
                      }
                      const next = np ? [np, ...nr] : nr
                      updateActive('etiquetas', next)
                    }}>{t}</button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4">
              <label className="label"><span className="label-text">Etiquetas personalizadas</span></label>
              <input className="input input-bordered" value={(Array.isArray(activePyme.etiquetas)?activePyme.etiquetas:[]).slice(1).filter(t=>!TAGS_MAIN.includes(t)).join(', ')} onChange={e => {
                const current = Array.isArray(activePyme.etiquetas)?activePyme.etiquetas:[]
                const principal = current[0]
                const mainExtras = current.slice(1).filter(t=>TAGS_MAIN.includes(t))
                const custom = e.target.value.split(',').map(s=>s.trim()).filter(Boolean)
                const next = principal ? [principal, ...mainExtras, ...custom] : [...mainExtras, ...custom]
                updateActive('etiquetas', next)
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
                <input className="input input-bordered" placeholder="https://www.instagram.com/Empresa/" value={activePyme.redes?.instagram || ''} onChange={e => updateActive('redes', { ...(activePyme.redes||{}), instagram: e.target.value })} />
                <input className="input input-bordered" placeholder="https://www.facebook.com/Empresa" value={activePyme.redes?.facebook || ''} onChange={e => updateActive('redes', { ...(activePyme.redes||{}), facebook: e.target.value })} />
                <input className="input input-bordered" placeholder="https://twitter.com/Empresa" value={activePyme.redes?.twitter || ''} onChange={e => updateActive('redes', { ...(activePyme.redes||{}), twitter: e.target.value })} />
                <input className="input input-bordered" placeholder="https://www.tiktok.com/@Empresa" value={activePyme.redes?.tiktok || ''} onChange={e => updateActive('redes', { ...(activePyme.redes||{}), tiktok: e.target.value })} />
              </div>
            </div>

            <div className="mt-6">
              <button className="btn btn-primary" onClick={guardarPyme}>Guardar</button>
            </div>
          </div>
        )}

        {activeTab==='usuarios' && (
          <div className="card bg-base-100 shadow p-4">
            <h3 className="text-xl font-semibold mb-4">Usuarios</h3>
            <div className="mb-3">
              <input className="input input-bordered w-full" value={uSearch} onChange={(e)=> setUSearch(e.target.value)} placeholder="Buscar usuario por nombre o correo" />
            </div>
            <div className="max-h-96 overflow-auto">
              <table className="table">
                <thead>
                  <tr><th>Nombre</th><th>Correo</th><th>Rol</th></tr>
                </thead>
                <tbody>
                  {(() => {
                    const list = (Array.isArray(usuarios)?usuarios:[]).filter(u => {
                      const q = uSearch.trim().toLowerCase()
                      if (!q) return true
                      return String(u.nombre||'').toLowerCase().includes(q) || String(u.correo||'').toLowerCase().includes(q)
                    })
                    const pageUsers = list.slice(uPage * uPageSize, (uPage + 1) * uPageSize)
                    return pageUsers.map(u => (
                      <tr key={u.id}><td>{u.nombre}</td><td>{u.correo}</td><td>{u.rol}</td></tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
            {isAdmin ? (
              <div className="mt-3 flex items-center gap-2 justify-between">
                <div className="flex gap-2">
                  <button className="btn" disabled={uPage===0} onClick={()=> setUPage(p=> Math.max(0,p-1))}>Anterior</button>
                  {(() => {
                    const list = (Array.isArray(usuarios)?usuarios:[]).filter(u => {
                      const q = uSearch.trim().toLowerCase()
                      if (!q) return true
                      return String(u.nombre||'').toLowerCase().includes(q) || String(u.correo||'').toLowerCase().includes(q)
                    })
                    const total = Math.max(1, Math.ceil(list.length / uPageSize))
                    const canNext = (uPage + 1) < total
                    return (
                      <button className="btn" disabled={!canNext} onClick={()=> setUPage(p=> p+1)}>Siguiente</button>
                    )
                  })()}
                </div>
                {(() => {
                  const list = (Array.isArray(usuarios)?usuarios:[]).filter(u => {
                    const q = uSearch.trim().toLowerCase()
                    if (!q) return true
                    return String(u.nombre||'').toLowerCase().includes(q) || String(u.correo||'').toLowerCase().includes(q)
                  })
                  const total = Math.max(1, Math.ceil(list.length / uPageSize))
                  return <div className="text-sm opacity-70">Página {uPage+1} / {total}</div>
                })()}
              </div>
            ) : null}
          </div>
        )}

        {toast.show ? (
          <div className={`alert ${toast.type==='error'?'alert-error':'alert-success'}`}>{toast.msg}</div>
        ) : null}
      </main>
    </div>
  )
}

function ScheduleEditor({ value, onChange }) {
  const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
  const [diasSel, setDiasSel] = React.useState([])
  const [horaInicio, setHoraInicio] = React.useState('09:00')
  const [horaFin, setHoraFin] = React.useState('18:00')
  React.useEffect(() => {
    const raw = String(value || '')
    const m = raw.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/)
    if (m) { setHoraInicio(m[1]); setHoraFin(m[2]) }
    const daysPart = raw.replace(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/, '').replace(/[,\s]+$/,'').trim()
    const tokens = daysPart.split(',').map(s=>s.trim()).filter(Boolean)
    const valid = DIAS.filter(d => tokens.some(t => t.toLowerCase().startsWith(d.toLowerCase().slice(0,3))))
    setDiasSel(valid)
  }, [value])
  const actualizar = (sel, hi, hf) => {
    const ordenadas = DIAS.filter(d => sel.includes(d))
    if (ordenadas.length && hi && hf) { onChange(`${ordenadas.join(', ')}, ${hi}-${hf}`) } else { onChange('') }
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
      <div className="md:col-span-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIAS.map((d)=> (
            <label key={d} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="checkbox" checked={diasSel.includes(d)} onChange={(e)=> {
                const next = e.target.checked ? [...diasSel, d] : diasSel.filter(v=>v!==d)
                setDiasSel(next)
                actualizar(next, horaInicio, horaFin)
              }} />
              <span>{d}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="form-control">
          <span className="label-text">Hora inicio</span>
          <input type="time" className="input input-bordered w-full" value={horaInicio} onChange={(e)=> { const v=e.target.value; setHoraInicio(v); actualizar(diasSel, v, horaFin) }} />
        </div>
        <div className="form-control">
          <span className="label-text">Hora cierre</span>
          <input type="time" className="input input-bordered w-full" value={horaFin} onChange={(e)=> { const v=e.target.value; setHoraFin(v); actualizar(diasSel, horaInicio, v) }} />
        </div>
      </div>
    </div>
  )
}
