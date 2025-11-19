import React, { useState } from 'react'
import * as palette from '../utils/palette.js'

function InstagramIcon() { return (<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 4a5 5 0 1 0 0 10a5 5 0 0 0 0-10zm6.5-.75a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5z"/></svg>); }
function TiktokIcon()    { return (<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3v7.5c0 2.485-2.015 4.5-4.5 4.5A4.5 4.5 0 1 1 14 10.5V3h3a5 5 0 0 0 5 5v3a8 8 0 0 1-8-8z"/></svg>); }
function FacebookIcon()  { return (<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M13 3h4v4h-4v3h4l-1 4h-3v7h-4v-7H7v-4h4V7a4 4 0 0 1 4-4z"/></svg>); }
function TwitterIcon()   { return (<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M22 5.8c-.7.3-1.5.6-2.3.7c.8-.5 1.4-1.2 1.7-2.1c-.8.5-1.7.9-2.6 1.1C17.8 4.8 16.7 4 15.4 4c-2.5 0-4.4 2.3-3.8 4.7C8.6 8.6 6.3 7.4 4.7 5.5c-.9 1.6-.5 3.7 1 4.8c-.6 0-1.2-.2-1.7-.5c0 2 1.4 3.7 3.4 4.1c-.6.2-1.2.2-1.8.1c.5 1.6 2 2.7 3.8 2.7c-1.7 1.3-3.8 2-6 2c-.4 0-.7 0-1-.1c2.2 1.4 4.8 2.2 7.6 2.2c9.1 0 14.2-7.5 13.9-14.3z"/></svg>); }

function SocialModal({ redes, onClose }) {
  const links = [
    { key: 'instagram', label: 'Instagram', Icon: InstagramIcon, prefix: 'https://instagram.com/' },
    { key: 'tiktok', label: 'TikTok', Icon: TiktokIcon, prefix: 'https://tiktok.com/@' },
    { key: 'facebook', label: 'Facebook', Icon: FacebookIcon, prefix: 'https://facebook.com/' },
    { key: 'twitter', label: 'Twitter', Icon: TwitterIcon, prefix: 'https://twitter.com/' },
  ];
  const visibles = links.filter(l => redes && redes[l.key]);
  const urlFor = (l) => {
    const v = String(redes[l.key] || '').trim();
    if (!v) return '#';
    return /^https?:\/\//i.test(v) ? v : l.prefix + v;
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-base-content/30 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card bg-base-100 shadow p-4 w-[90%] max-w-sm">
        <h3 className="text-lg font-semibold mb-3">Redes</h3>
        <div className="grid grid-cols-2 gap-2">
          {visibles.length ? visibles.map(({ key, label, Icon, prefix }) => (
            <a key={key} href={urlFor({ key, prefix })} target="_blank" rel="noopener noreferrer" className="btn btn-outline flex items-center gap-2">
              <Icon /> <span>{label}</span>
            </a>
          )) : <span className="opacity-70">No hay redes configuradas</span>}
        </div>
        <div className="mt-4 text-right">
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default function PymeCard({ pyme }) {
  const [showRedes, setShowRedes] = useState(false)
  const imgs = Array.isArray(pyme.imagenes_url) ? pyme.imagenes_url : []
  const placeholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="%232a2a2a"/><text x="50%" y="50%" fill="%23cccccc" font-size="32" text-anchor="middle" dominant-baseline="middle">Pyme</text></svg>'
  const first = imgs[0] || placeholder
  return (
    <div className="card bg-base-100 shadow">
      <figure className="px-4 pt-4">
        <img src={first} alt={pyme.nombre || 'Pyme'} className="rounded-box h-40 w-full object-cover" />
      </figure>
      <div className="card-body">
        <div className="flex items-center gap-2">
          <h2 className="card-title flex-1">{pyme.nombre}</h2>
          {(() => {
            const raw = (pyme.publicada ?? pyme.validada ?? pyme.estado)
            if (raw === undefined || raw === null) return null
            const isOk = raw === true || (typeof raw === 'string' && raw.toLowerCase().includes('aprob'))
            const label = raw === true ? 'Publicada' : raw === false ? 'Borrador' : String(raw)
            const cls = isOk ? 'badge badge-success' : 'badge badge-warning'
            return <span className={cls}>{label}</span>
          })()}
        </div>
        {(() => {
          const principal = palette.principalFrom(pyme)
          if (!principal) return null
          const col = palette.colorFor(principal)
          return (<div className="mt-1"><span className="badge" style={{ backgroundColor: col, color: '#111' }}>{principal}</span></div>)
        })()}
        {pyme.descripcion && <p className="text-sm opacity-80">{pyme.descripcion}</p>}
        {pyme.direccion && <p className="text-xs opacity-70">{pyme.direccion}</p>}
        <div className="text-sm">
          <div><span className="font-medium">Tipo atención:</span> {(pyme.tipo_atencion || []).join(', ')}</div>
          <div><span className="font-medium">Etiquetas:</span> {(() => {
            const et = Array.isArray(pyme.etiquetas) ? pyme.etiquetas : []
            return et.slice(1).join(', ')
          })()}</div>
          <div><span className="font-medium">Cobertura:</span> {(pyme.comunas_cobertura || []).join(', ')}</div>
        </div>
        <div className="card-actions justify-end">
          <a href={pyme.sitio_web || '#'} className="btn btn-outline" target="_blank" rel="noreferrer">Ver sitio</a>
          <button className="btn btn-outline" onClick={() => setShowRedes(v => !v)}>Redes</button>
        </div>
        {showRedes && <SocialModal redes={pyme.redes || {}} onClose={() => setShowRedes(false)} />}
      </div>
    </div>
  )
}